const { Schema, model } = require('mongoose');

const tentativaSchema = new Schema(
  {
    simulado: { type: Schema.Types.ObjectId, ref: 'Simulado', required: true },
    aluno: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    respostas: [{ type: Number, default: null }], // índice da alternativa escolhida por questão (null = em branco)
    acertos: { type: Number, default: 0 },
    nota: { type: Number, default: 0 },
    notaMaxima: { type: Number, default: 0 },
    enviadaEm: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// RN02: uma única tentativa por aluno em cada simulado
tentativaSchema.index({ simulado: 1, aluno: 1 }, { unique: true });

module.exports = model('Tentativa', tentativaSchema);
