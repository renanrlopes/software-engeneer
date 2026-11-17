const router = require('express').Router();
const { auth, permitir } = require('../middlewares/auth');
const { asyncHandler: h } = require('../utils/http');
const authCtrl = require('../controllers/auth.controller');
const inst = require('../controllers/instituicao.controller');
const prof = require('../controllers/professor.controller');
const aluno = require('../controllers/aluno.controller');

router.get('/health', (req, res) => res.json({ ok: true }));

// Autenticação e perfil (RF01–RF03)
router.post('/auth/login', h(authCtrl.login));
router.post('/auth/cadastro', h(authCtrl.cadastro));
router.get('/auth/me', auth, h(authCtrl.me));
router.put('/auth/me', auth, h(authCtrl.atualizarPerfil));

// Instituição (RF05, RF06, RF15)
const i = [auth, permitir('instituicao')];
router.get('/instituicao/painel', i, h(inst.painel));
router.get('/instituicao/usuarios', i, h(inst.listarUsuarios));
router.post('/instituicao/usuarios', i, h(inst.criarUsuario));
router.put('/instituicao/usuarios/:id', i, h(inst.atualizarUsuario));
router.delete('/instituicao/usuarios/:id', i, h(inst.removerUsuario));
router.get('/instituicao/turmas', i, h(inst.listarTurmas));
router.post('/instituicao/turmas', i, h(inst.criarTurma));
router.post('/instituicao/turmas/:id/alunos', i, h(inst.vincularAluno));
router.delete('/instituicao/turmas/:id', i, h(inst.removerTurma));

// Professor (RF09, RF14)
const p = [auth, permitir('professor')];
router.get('/professor/painel', p, h(prof.painel));
router.post('/professor/simulados', p, h(prof.criarSimulado));
router.get('/professor/simulados/:id', p, h(prof.obterSimulado));
router.put('/professor/simulados/:id', p, h(prof.atualizarSimulado));
router.delete('/professor/simulados/:id', p, h(prof.removerSimulado));
router.get('/professor/simulados/:id/resultados', p, h(prof.resultados));

// Aluno (RF10, RF11, RF13)
const a = [auth, permitir('aluno')];
router.get('/aluno/simulados', a, h(aluno.listar));
router.get('/aluno/simulados/:id', a, h(aluno.obter));
router.post('/aluno/simulados/:id/tentativa', a, h(aluno.enviar));
router.get('/aluno/historico', a, h(aluno.historico));
router.get('/aluno/tentativas/:id', a, h(aluno.revisao));

module.exports = router;
