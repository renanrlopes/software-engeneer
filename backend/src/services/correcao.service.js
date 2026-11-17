/**
 * Regras de negócio do simulado — funções puras, sem acesso ao banco,
 * para que possam ser testadas isoladamente (tests/correcao.test.js).
 */

/**
 * RN03/RN04: corrige as questões objetivas pelo gabarito.
 * A nota é a soma dos pesos das questões acertadas.
 * @param {{questoes: {indiceCorreto: number, peso?: number}[]}} simulado
 * @param {(number|null)[]} respostas índice escolhido em cada questão (null = em branco)
 */
function corrigir(simulado, respostas = []) {
  let acertos = 0;
  let nota = 0;
  let notaMaxima = 0;

  simulado.questoes.forEach((q, i) => {
    const peso = q.peso ?? 1;
    notaMaxima += peso;
    if (respostas[i] !== null && respostas[i] !== undefined && Number(respostas[i]) === q.indiceCorreto) {
      acertos += 1;
      nota += peso;
    }
  });

  return { acertos, nota: arredondar(nota), notaMaxima: arredondar(notaMaxima) };
}

/**
 * RN01: o simulado só fica visível para o aluno quando está publicado
 * e a data de abertura já passou.
 */
function estaDisponivel(simulado, agora = new Date()) {
  return Boolean(simulado.publicado) && new Date(simulado.abreEm) <= agora;
}

/** Remove o gabarito antes de enviar o simulado ao aluno. */
function semGabarito(simulado) {
  const s = typeof simulado.toObject === 'function' ? simulado.toObject() : { ...simulado };
  s.questoes = s.questoes.map(({ indiceCorreto, ...q }) => q);
  return s;
}

/** Normaliza as respostas recebidas para o tamanho do simulado. */
function normalizarRespostas(simulado, respostas) {
  const lista = Array.isArray(respostas) ? respostas : [];
  return simulado.questoes.map((q, i) => {
    const r = lista[i];
    if (r === null || r === undefined || r === '') return null;
    const n = Number(r);
    return Number.isInteger(n) && n >= 0 && n < q.alternativas.length ? n : null;
  });
}

const arredondar = (n) => Math.round(n * 100) / 100;

module.exports = { corrigir, estaDisponivel, semGabarito, normalizarRespostas };
