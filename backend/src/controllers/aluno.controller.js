const Turma = require('../models/Turma');
const Simulado = require('../models/Simulado');
const Tentativa = require('../models/Tentativa');
const { corrigir, estaDisponivel, semGabarito, normalizarRespostas } = require('../services/correcao.service');
const { HttpError } = require('../utils/http');

async function turmasDoAluno(alunoId) {
  return Turma.find({ alunos: alunoId }).populate('professor', 'nome').lean();
}

/** GET /api/aluno/simulados — RN01: só simulados das turmas do aluno, já abertos */
exports.listar = async (req, res) => {
  const turmas = await turmasDoAluno(req.user.id);
  const simulados = await Simulado.find({ turma: { $in: turmas.map((t) => t._id) } }).sort({ abreEm: -1 }).lean();
  const tentativas = await Tentativa.find({ aluno: req.user.id }).lean();

  const lista = simulados
    .filter((s) => estaDisponivel(s))
    .map((s) => {
      const turma = turmas.find((t) => String(t._id) === String(s.turma));
      const t = tentativas.find((x) => String(x.simulado) === String(s._id));
      return {
        id: s._id,
        titulo: s.titulo,
        descricao: s.descricao,
        turma: turma?.nome,
        professor: turma?.professor?.nome,
        questoes: s.questoes.length,
        tempoLimiteMin: s.tempoLimiteMin,
        abreEm: s.abreEm,
        feito: Boolean(t),
        nota: t?.nota ?? null,
        notaMaxima: t?.notaMaxima ?? null
      };
    });

  res.json({ turmas: turmas.map((t) => ({ id: t._id, nome: t.nome, professor: t.professor?.nome })), simulados: lista });
};

/** GET /api/aluno/simulados/:id — o simulado, sem gabarito */
exports.obter = async (req, res) => {
  const simulado = await simuladoAcessivel(req);
  if (await Tentativa.exists({ simulado: simulado._id, aluno: req.user.id })) {
    throw new HttpError(409, 'Você já enviou este simulado.');
  }
  res.json(semGabarito(simulado));
};

/** POST /api/aluno/simulados/:id/tentativa — RF10/RF11: envia e corrige */
exports.enviar = async (req, res) => {
  const simulado = await simuladoAcessivel(req);
  if (await Tentativa.exists({ simulado: simulado._id, aluno: req.user.id })) {
    throw new HttpError(409, 'Você já enviou este simulado.'); // RN02
  }

  const respostas = normalizarRespostas(simulado, req.body.respostas);
  const resultado = corrigir(simulado, respostas);
  const tentativa = await Tentativa.create({ simulado: simulado._id, aluno: req.user.id, respostas, ...resultado });

  res.status(201).json({ tentativa: tentativa._id, ...resultado, gabarito: gabaritoComentado(simulado, respostas) });
};

/** GET /api/aluno/historico — RF13 */
exports.historico = async (req, res) => {
  const tentativas = await Tentativa.find({ aluno: req.user.id }).populate('simulado', 'titulo').sort({ enviadaEm: -1 }).lean();
  res.json(tentativas.map((t) => ({ id: t._id, simulado: t.simulado?.titulo ?? '(removido)', acertos: t.acertos, nota: t.nota, notaMaxima: t.notaMaxima, enviadaEm: t.enviadaEm })));
};

/** GET /api/aluno/tentativas/:id — revisão com gabarito */
exports.revisao = async (req, res) => {
  const tentativa = await Tentativa.findOne({ _id: req.params.id, aluno: req.user.id }).lean();
  if (!tentativa) throw new HttpError(404, 'Tentativa não encontrada.');
  const simulado = await Simulado.findById(tentativa.simulado).lean();
  if (!simulado) throw new HttpError(404, 'O simulado foi removido.');
  res.json({ titulo: simulado.titulo, acertos: tentativa.acertos, nota: tentativa.nota, notaMaxima: tentativa.notaMaxima, gabarito: gabaritoComentado(simulado, tentativa.respostas) });
};

async function simuladoAcessivel(req) {
  const simulado = await Simulado.findById(req.params.id);
  if (!simulado) throw new HttpError(404, 'Simulado não encontrado.');
  const naTurma = await Turma.exists({ _id: simulado.turma, alunos: req.user.id });
  if (!naTurma || !estaDisponivel(simulado)) throw new HttpError(403, 'Este simulado não está disponível para você.');
  return simulado;
}

const gabaritoComentado = (simulado, respostas) =>
  simulado.questoes.map((q, i) => ({
    enunciado: q.enunciado,
    alternativas: q.alternativas,
    marcada: respostas[i],
    correta: q.indiceCorreto,
    acertou: respostas[i] === q.indiceCorreto
  }));
