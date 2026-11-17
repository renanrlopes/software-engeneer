const express = require('express');
const cors = require('cors');
const rotas = require('./routes');
const tratarErros = require('./middlewares/erros');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:4200' }));
app.use(express.json({ limit: '1mb' }));

app.use('/api', rotas);
app.use((req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));
app.use(tratarErros);

module.exports = app;
