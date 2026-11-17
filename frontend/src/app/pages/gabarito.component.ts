import { Component, input } from '@angular/core';
import { ItemGabarito } from '../core/models';

/** Gabarito comentado: mostra a alternativa marcada e a correta em cada questão. */
@Component({
  selector: 'app-gabarito',
  template: `
    @for (q of itens(); track $index; let i = $index) {
      <div class="card q" [class.certa]="q.acertou">
        <div class="q-top">
          <strong>Questão {{ i + 1 }}</strong>
          <span class="badge" [class.badge-ok]="q.acertou" [class.badge-warn]="!q.acertou">{{ q.acertou ? 'Acertou' : (q.marcada === null ? 'Em branco' : 'Errou') }}</span>
        </div>
        <p>{{ q.enunciado }}</p>
        <ul>
          @for (alt of q.alternativas; track $index; let j = $index) {
            <li [class.correta]="j === q.correta" [class.errada]="j === q.marcada && j !== q.correta">
              <span class="letra">{{ letras[j] }}</span> {{ alt }}
              @if (j === q.correta) { <em>resposta correta</em> } @else if (j === q.marcada) { <em>sua resposta</em> }
            </li>
          }
        </ul>
      </div>
    }
  `,
  styles: `
    .q { margin-top: 12px; border-left: 4px solid var(--warn); }
    .q.certa { border-left-color: var(--ok); }
    .q-top { display: flex; justify-content: space-between; margin-bottom: 6px; }
    ul { list-style: none; padding: 0; margin: 0; }
    li { padding: 7px 10px; border-radius: 6px; margin-bottom: 4px; }
    li.correta { background: var(--ok-soft); color: var(--ok); font-weight: 600; }
    li.errada { background: var(--danger-soft); color: var(--danger); }
    .letra { font-weight: 700; margin-right: 6px; }
    em { font-size: 12px; margin-left: 6px; }
  `
})
export class GabaritoComponent {
  itens = input.required<ItemGabarito[]>();
  letras = ['A', 'B', 'C', 'D', 'E'];
}
