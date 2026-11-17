const { Schema, model } = require('mongoose');

const turmaSchema = new Schema(
  {
    nome: { type: String, required: true, trim: true },
    codigo: { type: String, required: true, unique: true, uppercase: true, trim: true },
    instituicao: { type: Schema.Types.ObjectId, ref: 'Instituicao', required: true },
    professor: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    alunos: [{ type: Schema.Types.ObjectId, ref: 'Usuario' }]
  },
  { timestamps: true }
);

module.exports = model('Turma', turmaSchema);
