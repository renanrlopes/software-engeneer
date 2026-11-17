const Usuario = require('../models/Usuario');
const Turma = require('../models/Turma');
const Simulado = require('../models/Simulado');
const Tentativa = require('../models/Tentativa');
const { HttpError, gerarCodigo } = require('../utils/http');

const daInstituicao = (req) => ({ instituicao: req.user.instituicao });

/** GET /api/instituicao/painel — RF15: visão consolidada da instituição */
exports.painel = async (req, res) => {
  const filtro = daInstituicao(req);
  const [alunos, professores, turmas] = await Promise.all([
    Usuario.countDocuments({ ...filtro, perfil: 'aluno' }),
    Usuario.countDocuments({ ...filtro, perfil: 'professor' }),
    Turma.find(filtro).populate('professor', 'nome').lean()
  ]);

  const turmaIds = turmas.map((t) => t._id);
  const simulados = await Simulado.find({ turma: { $in: turmaIds } }).select('_id turma').lean();
  const tentativas = await Tentativa.find({ simulado: { $in: simulados.map((s) => s._id) } }).lean();

  const porTurma = turmas.map((t) => {
    const sims = simulados.filter((s) => String(s.turma) === String(t._id)).map((s) => String(s._id));
    const tts = tentativas.filter((x) => sims.includes(String(x.simulado)));
    const media = tts.length ? tts.reduce((acc, x) => acc + (x.notaMaxima ? (x.nota / x.notaMaxima) * 10 : 0), 0) / tts.length : null;
    return {
      id: t._id,
      nome: t.nome,
      codigo: t.codigo,
      professor: t.professor?.nome ?? '—',
      alunos: t.alunos.length,
      simulados: sims.length,
      entregas: tts.length,
      media: media === null ? null : Math.round(media * 10) / 10
    };
  });

  res.json({
    totais: { alunos, professores, turmas: turmas.length, simulados: simulados.length, entregas: tentativas.length },
    turmas: porTurma
  });
};

/* ---------- Usuários (RF05) ---------- */

exports.listarUsuarios = async (req, res) => {
  const filtro = { ...daInstituicao(req), perfil: { $in: ['aluno', 'professor'] } };
  if (req.query.perfil) filtro.perfil = req.query.perfil;
  const usuarios = await Usuario.find(filtro).sort({ perfil: 1, nome: 1 });
  res.json(usuarios.map((u) => u.toPublico()));
};

exports.criarUsuario = async (req, res) => {
  const { nome, email, senha, perfil, turmaId } = req.body;
  if (!['aluno', 'professor'].includes(perfil)) throw new HttpError(400, 'Perfil deve ser aluno ou professor.');
  if (!nome || !email || !senha) throw new HttpError(400, 'Preencha nome, e-mail e senha.');
  if (String(senha).length < 6) throw new HttpError(400, 'A senha precisa de ao menos 6 caracteres.');

  const usuario = new Usuario({ nome, email, perfil, instituicao: req.user.instituicao });
  await usuario.definirSenha(senha);
  await usuario.save();

  if (perfil === 'aluno' && turmaId) {
    await Turma.updateOne({ _id: turmaId, ...daInstituicao(req) }, { $addToSet: { alunos: usuario._id } });
  }
  res.status(201).json(usuario.toPublico());
};

exports.atualizarUsuario = async (req, res) => {
  const usuario = await Usuario.findOne({ _id: req.params.id, ...daInstituicao(req), perfil: { $ne: 'instituicao' } });
  if (!usuario) throw new HttpError(404, 'Usuário não encontrado.');
  const { nome, email, ativo } = req.body;
  if (nome !== undefined) usuario.nome = nome;
  if (email !== undefined) usuario.email = email;
  if (ativo !== undefined) usuario.ativo = Boolean(ativo);
  await usuario.save();
  res.json(usuario.toPublico());
};

exports.removerUsuario = async (req, res) => {
  const usuario = await Usuario.findOne({ _id: req.params.id, ...daInstituicao(req), perfil: { $ne: 'instituicao' } });
  if (!usuario) throw new HttpError(404, 'Usuário não encontrado.');
  if (usuario.perfil === 'professor' && (await Turma.exists({ professor: usuario._id }))) {
    throw new HttpError(409, 'Troque o professor das turmas dele antes de removê-lo.');
  }
  await Turma.updateMany({ alunos: usuario._id }, { $pull: { alunos: usuario._id } });
  await usuario.deleteOne();
  res.status(204).end();
};

/* ---------- Turmas (RF06) ---------- */

exports.listarTurmas = async (req, res) => {
  const turmas = await Turma.find(daInstituicao(req)).populate('professor', 'nome email').populate('alunos', 'nome email').sort({ nome: 1 });
  res.json(turmas);
};

exports.criarTurma = async (req, res) => {
  const { nome, professorId } = req.body;
  if (!nome || !professorId) throw new HttpError(400, 'Informe o nome da turma e o professor.');
  const professor = await Usuario.findOne({ _id: professorId, perfil: 'professor', ...daInstituicao(req) });
  if (!professor) throw new HttpError(400, 'Professor inválido para esta instituição.');

  let codigo = gerarCodigo();
  while (await Turma.exists({ codigo })) codigo = gerarCodigo();

  const turma = await Turma.create({ nome, codigo, professor: professor._id, instituicao: req.user.instituicao });
  res.status(201).json(turma);
};

exports.vincularAluno = async (req, res) => {
  const turma = await Turma.findOne({ _id: req.params.id, ...daInstituicao(req) });
  if (!turma) throw new HttpError(404, 'Turma não encontrada.');
  const aluno = await Usuario.findOne({ _id: req.body.alunoId, perfil: 'aluno', ...daInstituicao(req) });
  if (!aluno) throw new HttpError(400, 'Aluno inválido para esta instituição.');
  turma.alunos.addToSet(aluno._id);
  await turma.save();
  res.json(turma);
};

exports.removerTurma = async (req, res) => {
  const turma = await Turma.findOne({ _id: req.params.id, ...daInstituicao(req) });
  if (!turma) throw new HttpError(404, 'Turma não encontrada.');
  const sims = await Simulado.find({ turma: turma._id }).select('_id');
  await Tentativa.deleteMany({ simulado: { $in: sims.map((s) => s._id) } });
  await Simulado.deleteMany({ turma: turma._id });
  await turma.deleteOne();
  res.status(204).end();
};
