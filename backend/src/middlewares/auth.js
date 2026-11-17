const jwt = require('jsonwebtoken');
const { HttpError } = require('../utils/http');

/** RNF03: rotas protegidas exigem um token JWT válido (401 caso contrário). */
function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new HttpError(401, 'Faça login para continuar.'));

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, perfil: payload.perfil, instituicao: payload.instituicao };
    next();
  } catch {
    next(new HttpError(401, 'Sessão expirada. Entre novamente.'));
  }
}

/** RF02: libera a rota apenas para os perfis informados (403 caso contrário). */
const permitir = (...perfis) => (req, res, next) =>
  perfis.includes(req.user?.perfil) ? next() : next(new HttpError(403, 'Seu perfil não tem acesso a esta área.'));

function gerarToken(usuario) {
  return jwt.sign(
    { sub: String(usuario._id), perfil: usuario.perfil, instituicao: String(usuario.instituicao) },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

module.exports = { auth, permitir, gerarToken };
