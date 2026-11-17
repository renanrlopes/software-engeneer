// eslint-disable-next-line no-unused-vars
function tratarErros(err, req, res, next) {
  if (err.name === 'ValidationError') {
    const msg = Object.values(err.errors).map((e) => e.message).join(' ');
    return res.status(400).json({ erro: msg });
  }
  if (err.name === 'CastError') return res.status(400).json({ erro: 'Identificador inválido.' });
  if (err.code === 11000) return res.status(409).json({ erro: 'Registro duplicado.' });

  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ erro: status === 500 ? 'Erro interno no servidor.' : err.message });
}

module.exports = tratarErros;
