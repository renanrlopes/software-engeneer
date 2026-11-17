const Usuario = require('../models/Usuario');
const Instituicao = require('../models/Instituicao');
const Turma = require('../models/Turma');
const { gerarToken } = require('../middlewares/auth');
const { HttpError } = require('../utils/http');

const resposta = (u) => ({ token: gerarToken(u), usuario: u.toPublico() });

/** POST /api/auth/login — RF01 */
exports.login = async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) throw new HttpError(400, 'Informe e-mail e senha.');

  const usuario = await Usuario.findOne({ email: String(email).toLowerCase() }).select('+senhaHash');
  // mensagem genérica: não revela se o e-mail existe (CT02)
  if (!usuario || !usuario.ativo || !(await usuario.conferirSenha(senha))) {
    throw new HttpError(401, 'E-mail ou senha incorretos.');
  }
  res.json(resposta(usuario));
};

/**
 * POST /api/auth/cadastro — RF01
 * Dois caminhos públicos:
 *  - instituição: cria a instituição e o usuário gestor;
 *  - aluno: entra com o código da turma e já fica vinculado (RF06).
 * Professores são cadastrados pela instituição (RF05).
 */
exports.cadastro = async (req, res) => {
  const { nome, email, senha, perfil, nomeInstituicao, codigoTurma } = req.body;
  if (!nome || !email || !senha) throw new HttpError(400, 'Preencha nome, e-mail e senha.');
  if (String(senha).length < 6) throw new HttpError(400, 'A senha precisa de ao menos 6 caracteres.');
  if (await Usuario.exists({ email: String(email).toLowerCase() })) throw new HttpError(409, 'E-mail já cadastrado.');

  let usuario;
  if (perfil === 'instituicao') {
    if (!nomeInstituicao) throw new HttpError(400, 'Informe o nome da instituição.');
    const inst = await Instituicao.create({ nome: nomeInstituicao });
    usuario = new Usuario({ nome, email, perfil: 'instituicao', instituicao: inst._id });
    await usuario.definirSenha(senha);
    await usuario.save();
  } else if (perfil === 'aluno') {
    const turma = await Turma.findOne({ codigo: String(codigoTurma || '').toUpperCase().trim() });
    if (!turma) throw new HttpError(404, 'Código de turma não encontrado.');
    usuario = new Usuario({ nome, email, perfil: 'aluno', instituicao: turma.instituicao });
    await usuario.definirSenha(senha);
    await usuario.save();
    turma.alunos.addToSet(usuario._id);
    await turma.save();
  } else {
    throw new HttpError(400, 'Cadastro público disponível para aluno ou instituição.');
  }

  res.status(201).json(resposta(usuario));
};

/** GET /api/auth/me */
exports.me = async (req, res) => {
  const usuario = await Usuario.findById(req.user.id).populate('instituicao', 'nome');
  if (!usuario) throw new HttpError(404, 'Usuário não encontrado.');
  res.json({ ...usuario.toPublico(), instituicao: usuario.instituicao });
};

/** PUT /api/auth/me — RF03: edição de perfil (nome e senha) */
exports.atualizarPerfil = async (req, res) => {
  const { nome, senhaAtual, novaSenha } = req.body;
  const usuario = await Usuario.findById(req.user.id).select('+senhaHash');
  if (!usuario) throw new HttpError(404, 'Usuário não encontrado.');

  if (nome) usuario.nome = nome;
  if (novaSenha) {
    if (String(novaSenha).length < 6) throw new HttpError(400, 'A nova senha precisa de ao menos 6 caracteres.');
    if (!(await usuario.conferirSenha(senhaAtual || ''))) throw new HttpError(400, 'Senha atual incorreta.');
    await usuario.definirSenha(novaSenha);
  }
  await usuario.save();
  res.json(usuario.toPublico());
};
