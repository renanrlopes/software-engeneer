const { Schema, model } = require('mongoose');

const questaoSchema = new Schema(
  {
    enunciado: { type: String, required: true, trim: true },
    alternativas: {
      type: [String],
      validate: { validator: (v) => v.length >= 2 && v.length <= 5, message: 'A questão precisa de 2 a 5 alternativas.' }
    },
    indiceCorreto: { type: Number, required: true, min: 0 },
    peso: { type: Number, default: 1, min: 0 }
  },
  { _id: true }
);

const simuladoSchema = new Schema(
  {
    titulo: { type: String, required: true, trim: true },
    descricao: { type: String, trim: true, default: '' },
    turma: { type: Schema.Types.ObjectId, ref: 'Turma', required: true },
    professor: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    questoes: {
      type: [questaoSchema],
      validate: { validator: (v) => v.length > 0, message: 'O simulado precisa de ao menos uma questão.' }
    },
    abreEm: { type: Date, default: Date.now },
    tempoLimiteMin: { type: Number, default: 30, min: 1 },
    publicado: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = model('Simulado', simuladoSchema);
