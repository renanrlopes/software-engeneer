/**
 * Dados de demonstração: uma instituição com professor, alunos e turma já conectados,
 * e um simulado publicado. Senha de todas as contas: 123456.
 *
 * Uso: `npm run seed` (com MONGODB_URI no .env) — apaga e recria os dados.
 * Sem MONGODB_URI, o servidor chama popular() sozinho ao subir em memória.
 */
const Instituicao = require('./models/Instituicao');
const Usuario = require('./models/Usuario');
const Turma = require('./models/Turma');
const Simulado = require('./models/Simulado');
const Tentativa = require('./models/Tentativa');

const SENHA = '123456';

async function criarUsuario(dados) {
  const u = new Usuario(dados);
  await u.definirSenha(SENHA);
  return u.save();
}

async function popular() {
  await Promise.all([Instituicao, Usuario, Turma, Simulado, Tentativa].map((M) => M.deleteMany({})));

  const inst = await Instituicao.create({ nome: 'Colégio Exemplo', cidade: 'Itajubá - MG' });
  const base = { instituicao: inst._id };

  await criarUsuario({ ...base, nome: 'Secretaria Colégio Exemplo', email: 'instituicao@educa.dev', perfil: 'instituicao' });
  const prof = await criarUsuario({ ...base, nome: 'Prof. Carla Mendes', email: 'professor@educa.dev', perfil: 'professor' });
  const ana = await criarUsuario({ ...base, nome: 'Ana Souza', email: 'aluno@educa.dev', perfil: 'aluno' });
  const bruno = await criarUsuario({ ...base, nome: 'Bruno Lima', email: 'bruno@educa.dev', perfil: 'aluno' });

  const turma = await Turma.create({ ...base, nome: '3º ano A', codigo: 'TURMA3A', professor: prof._id, alunos: [ana._id, bruno._id] });

  const simulado = await Simulado.create({
    titulo: 'Matemática — Funções e porcentagem',
    descricao: 'Revisão para o ENEM. 5 questões objetivas.',
    turma: turma._id,
    professor: prof._id,
    tempoLimiteMin: 20,
    questoes: [
      { enunciado: 'Se f(x) = 2x + 3, quanto vale f(4)?', alternativas: ['8', '11', '14', '7'], indiceCorreto: 1 },
      { enunciado: 'Um produto de R$ 200,00 recebe desconto de 15%. Qual o novo preço?', alternativas: ['R$ 185,00', 'R$ 170,00', 'R$ 175,00', 'R$ 30,00'], indiceCorreto: 1 },
      { enunciado: 'Qual é a raiz da função f(x) = 3x − 12?', alternativas: ['x = 3', 'x = −4', 'x = 4', 'x = 12'], indiceCorreto: 2 },
      { enunciado: 'Quanto é 25% de 480?', alternativas: ['96', '120', '125', '100'], indiceCorreto: 1 },
      { enunciado: 'A função f(x) = −x² + 4 tem concavidade voltada para:', alternativas: ['Cima', 'Baixo', 'A direita', 'Não tem concavidade'], indiceCorreto: 1 }
    ]
  });

  // Bruno já entregou: alimenta os painéis do professor e da instituição
  await Tentativa.create({ simulado: simulado._id, aluno: bruno._id, respostas: [1, 1, 2, 0, 1], acertos: 4, nota: 4, notaMaxima: 5 });

  console.log('[seed] dados de demonstração criados — senha das contas: ' + SENHA);
}

module.exports = { popular };

if (require.main === module) {
  require('dotenv').config();
  const { connectDB, disconnectDB } = require('./config/db');
  connectDB()
    .then(popular)
    .then(disconnectDB)
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
