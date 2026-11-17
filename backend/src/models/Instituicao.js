const { Schema, model } = require('mongoose');

const instituicaoSchema = new Schema(
  {
    nome: { type: String, required: true, trim: true },
    cidade: { type: String, trim: true }
  },
  { timestamps: true }
);

module.exports = model('Instituicao', instituicaoSchema);
