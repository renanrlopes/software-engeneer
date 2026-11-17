const { test } = require('node:test');
const assert = require('node:assert/strict');
const { corrigir, estaDisponivel, semGabarito, normalizarRespostas } = require('../src/services/correcao.service');

const simulado = {
  publicado: true,
  abreEm: new Date('2026-01-01'),
  questoes: [
    { enunciado: 'A', alternativas: ['1', '2', '3'], indiceCorreto: 0, peso: 1 },
    { enunciado: 'B', alternativas: ['1', '2'], indiceCorreto: 1, peso: 2 },
    { enunciado: 'C', alternativas: ['1', '2', '3', '4'], indiceCorreto: 3, peso: 1.5 }
  ]
};

test('RN04: nota é a soma dos pesos das questões corretas', () => {
  assert.deepEqual(corrigir(simulado, [0, 1, 3]), { acertos: 3, nota: 4.5, notaMaxima: 4.5 });
  assert.deepEqual(corrigir(simulado, [0, 0, 3]), { acertos: 2, nota: 2.5, notaMaxima: 4.5 });
});

test('questões em branco não pontuam', () => {
  assert.deepEqual(corrigir(simulado, [null, null, null]), { acertos: 0, nota: 0, notaMaxima: 4.5 });
  assert.deepEqual(corrigir(simulado, []), { acertos: 0, nota: 0, notaMaxima: 4.5 });
});

test('RN01: simulado só fica disponível publicado e após a abertura', () => {
  assert.equal(estaDisponivel(simulado, new Date('2026-02-01')), true);
  assert.equal(estaDisponivel(simulado, new Date('2025-12-31')), false);
  assert.equal(estaDisponivel({ ...simulado, publicado: false }, new Date('2026-02-01')), false);
});

test('o aluno nunca recebe o gabarito', () => {
  const s = semGabarito(simulado);
  assert.ok(s.questoes.every((q) => !('indiceCorreto' in q)));
  assert.equal(s.questoes[0].enunciado, 'A');
});

test('respostas inválidas viram em branco', () => {
  assert.deepEqual(normalizarRespostas(simulado, [0, 9, '2']), [0, null, 2]);
  assert.deepEqual(normalizarRespostas(simulado, 'lixo'), [null, null, null]);
});
