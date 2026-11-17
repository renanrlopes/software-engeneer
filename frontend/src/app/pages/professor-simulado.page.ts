import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { API_URL } from '../core/config';
import { mensagemErro } from '../core/auth.interceptor';

interface QuestaoForm { enunciado: string; alternativas: string[]; indiceCorreto: number; peso: number; }

const novaQuestao = (): QuestaoForm => ({ enunciado: '', alternativas: ['', '', '', ''], indiceCorreto: 0, peso: 1 });

@Component({
  selector: 'app-professor-simulado',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="container" style="max-width: 860px">
      <div class="page-head"><div><h1>Novo simulado</h1><p>Monte as questões e libere para uma turma.</p></div></div>
      @if (erro()) { <div class="alert alert-erro">{{ erro() }}</div> }

      <div class="card">
        <div class="field"><label>Título</label><input class="input" name="titulo" [(ngModel)]="titulo" placeholder="ex.: Física — Cinemática" /></div>
        <div class="field"><label>Descrição</label><input class="input" name="descricao" [(ngModel)]="descricao" placeholder="Orientações para os alunos" /></div>
        <div class="row">
          <div class="field">
            <label>Turma</label>
            <select name="turma" [(ngModel)]="turmaId">
              @for (t of turmas(); track t.id) { <option [value]="t.id">{{ t.nome }}</option> }
            </select>
          </div>
          <div class="field"><label>Abre em</label><input class="input" type="datetime-local" name="abre" [(ngModel)]="abreEm" /></div>
          <div class="field"><label>Tempo limite (min)</label><input class="input" type="number" min="1" name="tempo" [(ngModel)]="tempoLimiteMin" /></div>
        </div>
      </div>

      @for (q of questoes; track $index; let i = $index) {
        <div class="card q">
          <div class="q-top">
            <h3>Questão {{ i + 1 }}</h3>
            <div class="q-acoes">
              <label class="peso">Peso <input class="input" type="number" min="0" step="0.5" [name]="'peso' + i" [(ngModel)]="q.peso" /></label>
              @if (questoes.length > 1) { <button class="btn-link" (click)="questoes.splice(i, 1)">Remover</button> }
            </div>
          </div>
          <div class="field"><textarea rows="2" [name]="'enun' + i" [(ngModel)]="q.enunciado" placeholder="Enunciado da questão"></textarea></div>
          <p class="muted small">Marque a alternativa correta:</p>
          @for (alt of q.alternativas; track $index; let j = $index) {
            <div class="alt">
              <input type="radio" [name]="'correta' + i" [checked]="q.indiceCorreto === j" (change)="q.indiceCorreto = j" />
              <span class="letra">{{ letras[j] }}</span>
              <input class="input" [name]="'alt' + i + '-' + j" [(ngModel)]="q.alternativas[j]" placeholder="Alternativa {{ letras[j] }}" />
            </div>
          }
        </div>
      }

      <div class="acoes">
        <button class="btn" (click)="questoes.push(nova())">+ Adicionar questão</button>
        <span style="flex: 1"></span>
        <a class="btn" routerLink="/professor">Cancelar</a>
        <button class="btn btn-primary" [disabled]="salvando()" (click)="salvar()">Publicar simulado</button>
      </div>
    </div>
  `,
  styles: `
    .q { margin-top: 12px; }
    .q-top { display: flex; justify-content: space-between; align-items: center; }
    .q-acoes { display: flex; align-items: center; gap: 14px; }
    .peso { display: flex; align-items: center; gap: 6px; margin: 0; }
    .peso .input { width: 74px; }
    .alt { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .alt input[type='radio'] { accent-color: var(--orange); width: 18px; height: 18px; }
    .letra { font-weight: 700; color: var(--navy); width: 14px; }
    .small { font-size: 13px; margin-bottom: 6px; }
    .acoes { display: flex; gap: 10px; margin-top: 16px; flex-wrap: wrap; }
  `
})
export class ProfessorSimuladoPage implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);

  letras = ['A', 'B', 'C', 'D', 'E'];
  turmas = signal<{ id: string; nome: string }[]>([]);
  titulo = '';
  descricao = '';
  turmaId = '';
  abreEm = this.agoraLocal();
  tempoLimiteMin = 30;
  questoes: QuestaoForm[] = [novaQuestao()];
  erro = signal('');
  salvando = signal(false);
  nova = novaQuestao;

  ngOnInit() {
    this.http.get<{ turmas: { id: string; nome: string }[] }>(`${API_URL}/professor/painel`).subscribe((p) => {
      this.turmas.set(p.turmas);
      this.turmaId = p.turmas[0]?.id ?? '';
    });
  }

  salvar() {
    this.erro.set('');
    if (!this.titulo.trim()) return this.erro.set('Dê um título ao simulado.');
    if (!this.turmaId) return this.erro.set('Escolha a turma.');
    this.salvando.set(true);
    const corpo = {
      titulo: this.titulo,
      descricao: this.descricao,
      turmaId: this.turmaId,
      abreEm: new Date(this.abreEm).toISOString(),
      tempoLimiteMin: Number(this.tempoLimiteMin),
      questoes: this.questoes.map((q) => ({ ...q, peso: Number(q.peso) }))
    };
    this.http.post(`${API_URL}/professor/simulados`, corpo).subscribe({
      next: () => this.router.navigate(['/professor']),
      error: (e) => {
        this.erro.set(mensagemErro(e));
        this.salvando.set(false);
        window.scrollTo({ top: 0 });
      }
    });
  }

  private agoraLocal() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }
}
