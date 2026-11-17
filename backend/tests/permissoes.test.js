// RF02 / RNF03: rotas protegidas recusam quem não tem token (401) ou tem o perfil errado (403).
// Estes casos são barrados antes de qualquer acesso ao banco, então rodam sem MongoDB.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = 'segredo-de-teste';
const app = require('../src/app');
const { gerarToken } = require('../src/middlewares/auth');

let server;
let base;
const token = (perfil) => gerarToken({ _id: '000000000000000000000001', perfil, instituicao: '000000000000000000000002' });
const get = (rota, t) => fetch(base + rota, { headers: t ? { Authorization: `Bearer ${t}` } : {} });

before(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(() => server.close());

test('health responde 200', async () => {
  assert.equal((await get('/health')).status, 200);
});

test('sem token: 401', async () => {
  assert.equal((await get('/aluno/simulados')).status, 401);
  assert.equal((await get('/professor/painel')).status, 401);
  assert.equal((await get('/instituicao/painel')).status, 401);
});

test('token inválido: 401', async () => {
  assert.equal((await get('/aluno/simulados', 'token-falso')).status, 401);
});

test('perfil errado: 403', async () => {
  assert.equal((await get('/professor/painel', token('aluno'))).status, 403);
  assert.equal((await get('/instituicao/painel', token('professor'))).status, 403);
  assert.equal((await get('/aluno/simulados', token('instituicao'))).status, 403);
});

test('login sem dados: 400', async () => {
  const r = await fetch(base + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(r.status, 400);
});
