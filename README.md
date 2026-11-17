# Educa — Plataforma de simulados (MVP)

Projeto final de **ECOT11A — Laboratório de Engenharia de Software I** (UNIFEI)  
**Autor:** Renan Rodrigues Lopes 
**Repositório:** https://github.com/renanrlopes/software-engeneer

## Sobre o projeto

O Educa conecta **instituição, professor e aluno** em torno de simulados:

- a **instituição** cadastra professores e alunos, cria turmas e acompanha o desempenho em um painel;
- o **professor** monta simulados de questões objetivas, define abertura e tempo limite e libera para a turma;
- o **aluno** resolve o simulado com cronômetro, recebe a nota na hora com gabarito comentado e acompanha o histórico.

Os três perfis já entram conectados: a instituição vincula professores e alunos às turmas, e o aluno também pode se cadastrar sozinho com o código da turma.

Esta é a Prova de Conceito (MVP). A especificação completa (requisitos, UML, arquitetura e plano de testes) está no Documento de Software entregue no SIGAA.

## Tecnologias

| Camada | Tecnologia |
| --- | --- |
| Frontend | Angular 19 (standalone, signals), TypeScript, CSS |
| Backend | Node.js 20+, Express |
| Banco de dados | MongoDB com Mongoose |
| Segurança | JWT (jsonwebtoken), bcryptjs |
| Testes | `node:test` (regras de negócio) |

## Como executar localmente

**Pré-requisitos:** [Node.js 20 ou superior](https://nodejs.org) e Git. **Não é preciso instalar o MongoDB**: sem configuração, a API sobe um MongoDB em memória e já cria os dados de demonstração.

### 1. Clonar o repositório

```bash
git clone https://github.com/renanrlopes/software-engeneer.git
cd software-engeneer
```

### 2. Backend (API) — terminal 1

```bash
cd backend
npm install
npm run dev
```

A API fica em `http://localhost:3000/api`. Na primeira execução, o `mongodb-memory-server` baixa o binário do MongoDB 

### 3. Frontend — terminal 2

```bash
cd frontend
npm install
npm start
```

Abra **http://localhost:4200**.

### Contas de demonstração (senha `123456`)

| Perfil | E-mail |
| --- | --- |
| Instituição | `instituicao@educa.dev` |
| Professor | `professor@educa.dev` |
| Aluno | `aluno@educa.dev` |

Para se cadastrar como novo aluno, use o código de turma **TURMA3A**.

### Usar um MongoDB próprio (opcional)

Para persistir os dados, crie `backend/.env` a partir de `backend/.env.example` e preencha `MONGODB_URI` (MongoDB local ou Atlas). Depois rode `npm run seed` para criar os dados de demonstração.

### Testes

```bash
cd backend
npm test
```

## Funcionalidades do MVP

| Nível | Implementado |
| --- | --- |
| Básico | Cadastro e login com JWT; painel de cada perfil; fluxo central professor cria → aluno resolve → nota automática |
| Intermediário | Edição de perfil (nome e senha); persistência no MongoDB; CRUD de usuários, turmas e simulados |
| Avançado | Correção automática por gabarito com pesos; simulado visível só para a turma e após a abertura; uma tentativa por aluno; envio automático ao fim do tempo; painéis com entregas e médias |

## Estrutura

```
software-engeneer/
├── backend/
│   ├── src/
│   │   ├── config/        conexão com o MongoDB (ou MongoDB em memória)
│   │   ├── models/        Instituicao, Usuario, Turma, Simulado, Tentativa
│   │   ├── middlewares/   auth (JWT), controle por perfil e tratamento de erros
│   │   ├── controllers/   auth, instituicao, professor, aluno
│   │   ├── services/      regras de negócio (correção e disponibilidade)
│   │   ├── routes/        endpoints REST
│   │   └── seed.js        dados de demonstração
│   └── tests/             testes das regras de negócio
├── frontend/
│   └── src/app/
│       ├── core/          serviço de autenticação, interceptor, guards, modelos
│       └── pages/         telas de login, cadastro, perfil, aluno, professor e instituição
└── docs/prints/           capturas das telas
```

## Principais rotas da API

| Método | Rota | Perfil |
| --- | --- | --- |
| POST | `/api/auth/login`, `/api/auth/cadastro` | público |
| GET/PUT | `/api/auth/me` | todos |
| GET | `/api/instituicao/painel` | instituição |
| CRUD | `/api/instituicao/usuarios`, `/api/instituicao/turmas` | instituição |
| GET | `/api/professor/painel` | professor |
| CRUD | `/api/professor/simulados`, `GET /api/professor/simulados/:id/resultados` | professor |
| GET | `/api/aluno/simulados`, `/api/aluno/historico` | aluno |
| POST | `/api/aluno/simulados/:id/tentativa` | aluno |

## Próximos passos

- Questões dissertativas com correção pelo professor.
- Catálogo de matérias e assuntos para classificar as questões.
- Testes de integração da API e deploy online.
