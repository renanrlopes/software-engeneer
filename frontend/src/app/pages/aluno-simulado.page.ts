import { Component, OnDestroy, OnInit, inject, input, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { API_URL } from '../core/config';
import { mensagemErro } from '../core/auth.interceptor';
import { Questao, ResultadoTentativa } from '../core/models';
import { GabaritoComponent } from './gabarito.component';

interface SimuladoProva { _id: string; titulo: string; descricao: string; tempoLimiteMin: number; questoes: Questao[]; }

@Component({
  selector: 'app-aluno-simulado',
  imports: [RouterLink, GabaritoComponent],
  template: `
    <div class="container" style="max-width: 820px">
      @if (erro()) {
        <div class="alert alert-erro">{{ erro() }}</div>
        <a class="btn" routerLink="/aluno">Voltar ao painel</a>
      }

      @if (resultado(); as r) {
        <div class="card resultado">
          <h1>Simulado enviado!</h1>
          <div class="placar"><span class="grande">{{ r.nota }}</span> de {{ r.notaMaxima }} pontos · {{ r.acertos }} acertos</div>
          <a class="btn btn-navy" routerLink="/aluno">Voltar ao painel</a>
        </div>
        <app-gabarito [itens]="r.gabarito" />
      } @else {
        @if (simulado(); as s) {
        <div class="barra card">
          <div><h1>{{ s.titulo }}</h1><p class="muted">{{ respondidas() }} de {{ s.questoes.length }} respondidas</p></div>
          <div class="tempo" [class.acabando]="restante() < 60">{{ relogio() }}</div>
        </div>

        @for (q of s.questoes; track $index; let i = $index) {
          <div class="card q">
            <p><strong>{{ i + 1 }}.</strong> {{ q.enunciado }}</p>
            @for (alt of q.alternativas; track $index; let j = $index) {
              <label class="alt" [class.marcada]="respostas()[i] === j">
                <input type="radio" [name]="'q' + i" [checked]="respostas()[i] === j" (change)="marcar(i, j)" />
                <span class="letra">{{ letras[j] }}</span> {{ alt }}
              </label>
            }
          </div>
        }

        <div class="acoes">
          <a class="btn" routerLink="/aluno">Cancelar</a>
          <button class="btn btn-primary" [disabled]="enviando()" (click)="enviar()">Enviar respostas</button>
        </div>
        }
      }
    </div>
  `,
  styles: `
    .barra { display: flex; justify-content: space-between; align-items: center; position: sticky; top: 8px; z-index: 2; }
    .barra h1 { margin: 0; font-size: 20px; }
    .barra p { margin: 0; }
    .tempo { font-size: 26px; font-weight: 800; color: var(--navy); font-variant-numeric: tabular-nums; }
    .tempo.acabando { color: var(--danger); }
    .q { margin-top: 12px; }
    .alt { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border: 1px solid var(--line); border-radius: 8px; margin-top: 6px; cursor: pointer; font-weight: 400; color: var(--text); font-size: 15px; }
    .alt.marcada { border-color: var(--orange); background: var(--orange-soft); }
    .alt input { accent-color: var(--orange); }
    .letra { font-weight: 700; color: var(--navy); }
    .acoes { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; }
    .resultado { text-align: center; }
    .placar { font-size: 18px; margin: 8px 0 18px; }
    .grande { font-size: 44px; font-weight: 800; color: var(--orange); }
  `
})
export class AlunoSimuladoPage implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  id = input.required<string>();

  letras = ['A', 'B', 'C', 'D', 'E'];
  simulado = signal<SimuladoProva | null>(null);
  respostas = signal<(number | null)[]>([]);
  resultado = signal<ResultadoTentativa | null>(null);
  restante = signal(0);
  erro = signal('');
  enviando = signal(false);
  private timer?: ReturnType<typeof setInterval>;

  respondidas = () => this.respostas().filter((r) => r !== null).length;
  relogio = () => {
    const s = Math.max(0, this.restante());
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  };

  ngOnInit() {
    this.http.get<SimuladoProva>(`${API_URL}/aluno/simulados/${this.id()}`).subscribe({
      next: (s) => {
        this.simulado.set(s);
        this.respostas.set(s.questoes.map(() => null));
        this.restante.set(s.tempoLimiteMin * 60);
        this.timer = setInterval(() => {
          this.restante.update((t) => t - 1);
          if (this.restante() <= 0) this.enviar(); // tempo esgotado: envio automático (RF10)
        }, 1000);
      },
      error: (e) => this.erro.set(mensagemErro(e))
    });
  }

  marcar(i: number, j: number) {
    this.respostas.update((r) => r.map((v, k) => (k === i ? j : v)));
  }

  enviar() {
    if (this.enviando()) return;
    this.enviando.set(true);
    clearInterval(this.timer);
    this.http.post<ResultadoTentativa>(`${API_URL}/aluno/simulados/${this.id()}/tentativa`, { respostas: this.respostas() }).subscribe({
      next: (r) => {
        this.resultado.set(r);
        window.scrollTo({ top: 0 });
      },
      error: (e) => {
        this.erro.set(mensagemErro(e));
        this.enviando.set(false);
      }
    });
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }
}
