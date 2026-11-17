class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Envolve um handler async e encaminha erros ao middleware de erro. */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Código curto e legível para a turma, ex.: "K7M2QX". */
function gerarCodigo(tamanho = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c = '';
  for (let i = 0; i < tamanho; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}

module.exports = { HttpError, asyncHandler, gerarCodigo };
