const { Schema, model } = require('mongoose');
const bcrypt = require('bcryptjs');

const PERFIS = ['aluno', 'professor', 'instituicao'];

const usuarioSchema = new Schema(
  {
    nome: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    senhaHash: { type: String, required: true, select: false },
    perfil: { type: String, enum: PERFIS, required: true },
    instituicao: { type: Schema.Types.ObjectId, ref: 'Instituicao', required: true },
    ativo: { type: Boolean, default: true }
  },
  { timestamps: true }
);

usuarioSchema.methods.definirSenha = async function (senha) {
  this.senhaHash = await bcrypt.hash(senha, 10); // RNF02: bcrypt com custo 10
};

usuarioSchema.methods.conferirSenha = function (senha) {
  return bcrypt.compare(senha, this.senhaHash);
};

usuarioSchema.methods.toPublico = function () {
  return {
    id: this._id,
    nome: this.nome,
    email: this.email,
    perfil: this.perfil,
    instituicao: this.instituicao,
    ativo: this.ativo
  };
};

module.exports = model('Usuario', usuarioSchema);
module.exports.PERFIS = PERFIS;
