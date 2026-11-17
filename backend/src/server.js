require('dotenv').config();
process.env.JWT_SECRET ||= 'educa-dev-secret-troque-em-producao';

const app = require('./app');
const { connectDB } = require('./config/db');
const { popular } = require('./seed');

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    const emMemoria = await connectDB();
    if (emMemoria) await popular(); // banco em memória começa com os dados de demonstração
    app.listen(PORT, () => console.log(`[api] http://localhost:${PORT}/api`));
  } catch (err) {
    console.error('[api] falha ao iniciar:', err.message);
    process.exit(1);
  }
})();
