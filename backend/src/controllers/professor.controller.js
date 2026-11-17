const Turma = require('../models/Turma');
const Simulado = require('../models/Simulado');
const Tentativa = require('../models/Tentativa');
const { HttpError } = require('../utils/http');

async function turmaDoProfessor(req, turmaId) {
  const turma = await Turma.findOne({ _id: turmaId, professor: req.user.id });
  if (!turma) throw new HttpError(403, 'Esta turma não é sua.');
  return turma;
}

/** GET /api/professor/painel — RF14: turmas, simulados e entregas */
exports.painel = async (req, res) => {
  const turmas = await Turma.find({ professor: req.user.id }).sort({ nome: 1 }).lean();
  const simulados = await Simulado.find({ professor: req.user.id }).sort({ createdAt: -1 }).lean();
  const tentativas = await Tentativa.find({ simulado: { $in: simulados.map((s) => s._id) } }).lean();

  res.json({
    turmas: turmas.map((t) => ({ id: t._id, nome: t.nome, codigo: t.codigo, alunos: t.alunos.length })),
    simulados: simulados.map((s) => {
      const turma = turmas.find((t) => String(t._id) === String(s.turma));
      const tts = tentativas.filter((x) => String(x.simulado) === String(s._id));
      const media = tts.length ? tts.reduce((a, x) => a + (x.notaMaxima ? (x.nota / x.notaMaxima) * 10 : 0), 0) / tts.length : null;
      return {
        id: s._id,
        titulo: s.titulo,
        turma: turma?.nome ?? '—',
        questoes: s.questoes.length,
        abreEm: s.abreEm,
        tempoLimiteMin: s.tempoLimiteMin,
        publicado: s.publicado,
        entregas: tts.length,
        alunosNaTurma: turma?.alunos.length ?? 0,
        media: media === null ? null : Math.round(media * 10) / 10
      };
    })
  });
};

/** GET /api/professor/simulados/:id */
exports.obterSimulado = async (req, res) => {
  const simulado = await Simulado.findOne({ _id: req.params.id, professor: req.user.id });
  if (!simulado) throw new HttpError(404, 'Simulado não encontrado.');
  res.json(simulado);
};

/** POST /api/professor/simulados — RF09 */
exports.criarSimulado = async (req, res) => {
  const { titulo, descricao, turmaId, questoes, abreEm, tempoLimiteMin, publicado } = req.body;
  await turmaDoProfessor(req, turmaId);
  validarQuestoes(questoes);
  const simulado = await Simulado.create({
    titulo, descricao, questoes, tempoLimiteMin,
    abreEm: abreEm || Date.now(),
    publicado: publicado ?? true,
    turma: turmaId,
    professor: req.user.id
  });
  res.status(201).json(simulado);
};

/** PUT /api/professor/simulados/:id */
exports.atualizarSimulado = async (req, res) => {
  const simulado = await Simulado.findOne({ _id: req.params.id, professor: req.user.id });
  if (!simulado) throw new HttpError(404, 'Simulado não encontrado.');
  if (req.body.questoes && (await Tentativa.exists({ simulado: simulado._id }))) {
    throw new HttpError(409, 'O simulado já tem entregas; as questões não podem mais mudar.');
  }
  const campos = ['titulo', 'descricao', 'abreEm', 'tempoLimiteMin', 'publicado', 'questoes'];
  for (const c of campos) if (req.body[c] !== undefined) simulado[c] = req.body[c];
  if (req.body.questoes) validarQuestoes(req.body.questoes);
  await simulado.save();
  res.json(simulado);
};

/** DELETE /api/professor/simulados/:id */
exports.removerSimulado = async (req, res) => {
  const simulado = await Simulado.findOne({ _id: req.params.id, professor: req.user.id });
  if (!simulado) throw new HttpError(404, 'Simulado não encontrado.');
  await Tentativa.deleteMany({ simulado: simulado._id });
  await simulado.deleteOne();
  res.status(204).end();
};

/** GET /api/professor/simulados/:id/resultados — quem entregou e com que nota */
exports.resultados = async (req, res) => {
  const simulado = await Simulado.findOne({ _id: req.params.id, professor: req.user.id }).lean();
  if (!simulado) throw new HttpError(404, 'Simulado não encontrado.');
  const turma = await Turma.findById(simulado.turma).populate('alunos', 'nome email').lean();
  const tentativas = await Tentativa.find({ simulado: simulado._id }).lean();

  const linhas = (turma?.alunos ?? []).map((a) => {
    const t = tentativas.find((x) => String(x.aluno) === String(a._id));
    return { aluno: a.nome, email: a.email, entregue: Boolean(t), acertos: t?.acertos ?? null, nota: t?.nota ?? null, notaMaxima: t?.notaMaxima ?? null, enviadaEm: t?.enviadaEm ?? null };
  });
  res.json({ simulado: { id: simulado._id, titulo: simulado.titulo, questoes: simulado.questoes.length, turma: turma?.nome }, alunos: linhas });
};

function validarQuestoes(questoes) {
  if (!Array.isArray(questoes) || questoes.length === 0) throw new HttpError(400, 'Adicione ao menos uma questão.');
  questoes.forEach((q, i) => {
    const alts = (q.alternativas || []).filter((a) => String(a).trim());
    if (!q.enunciado?.trim()) throw new HttpError(400, `Questão ${i + 1}: escreva o enunciado.`);
    if (alts.length < 2) throw new HttpError(400, `Questão ${i + 1}: informe ao menos 2 alternativas.`);
    if (!(Number.isInteger(q.indiceCorreto) && q.indiceCorreto >= 0 && q.indiceCorreto < alts.length)) {
      throw new HttpError(400, `Questão ${i + 1}: marque a alternativa correta.`);
    }
    q.alternativas = alts;
  });
}
