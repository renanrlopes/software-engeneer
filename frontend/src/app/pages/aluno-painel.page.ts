import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { API_URL } from '../core/config';
import { AuthService } from '../core/auth.service';

interface SimuladoAluno { id: string; titulo: string; descricao: string; turma: string; professor: string; questoes: number; tempoLimiteMin: number; feito: boolean; nota: number | null; notaMaxima: number | null; }
interface ItemHistorico { id: string; simulado: string; acertos: number; nota: number; notaMaxima: number; enviadaEm: string; }

@Component({
  selector: 'app-aluno-painel',
  imports: [RouterLink, DatePipe, DecimalPipe],
  template: `
    <div class="container">
      <div class="page-head">
        <div><h1>Olá, {{ primeiroNome }}!</h1><p>Simulados liberados pelos seus professores.</p></div>
        <div class="turmas">
          @for (t of turmas(); track t.id) { <span class="badge badge-navy">{{ t.nome }} · {{ t.professor }}</span> }
        </div>
      </div>

      <div class="grid grid-stats">
        <div class="stat"><div class="valor">{{ pendentes() }}</div><div class="rotulo">Simulados pendentes</div></div>
        <div class="stat"><div class="valor">{{ historico().length }}</div><div class="rotulo">Simulados feitos</div></div>
        <div class="stat"><div class="valor">{{ media() === null ? '—' : (media()! | number: '1.1-1') }}</div><div class="rotulo">Média geral (0 a 10)</div></div>
      </div>

      <div class="grid grid-2">
        @for (s of simulados(); track s.id) {
          <div class="card sim">
            <div class="sim-top">
              <span class="badge" [class.badge-ok]="s.feito" [class.badge-warn]="!s.feito">{{ s.feito ? 'Entregue' : 'Pendente' }}</span>
              <span class="muted">{{ s.turma }}</span>
            </div>
            <h3>{{ s.titulo }}</h3>
            <p class="muted">{{ s.descricao }}</p>
            <p class="muted small">{{ s.questoes }} questões · {{ s.tempoLimiteMin }} min · {{ s.professor }}</p>
            @if (s.feito) {
              <div class="nota">Nota <strong>{{ s.nota }}</strong> de {{ s.notaMaxima }}</div>
            } @else {
              <a class="btn btn-primary" [routerLink]="['/aluno/simulado', s.id]">Começar simulado</a>
            }
          </div>
        } @empty {
          <div class="card empty">Nenhum simulado liberado para suas turmas ainda.</div>
        }
      </div>

      <div class="card mt">
        <h2>Histórico</h2>
        @if (historico().length) {
          <table>
            <thead><tr><th>Simulado</th><th>Enviado em</th><th>Acertos</th><th>Nota</th><th></th></tr></thead>
            <tbody>
              @for (h of historico(); track h.id) {
                <tr>
                  <td>{{ h.simulado }}</td>
                  <td>{{ h.enviadaEm | date: 'dd/MM/yyyy HH:mm' }}</td>
                  <td>{{ h.acertos }}</td>
                  <td><strong>{{ h.nota }}</strong> / {{ h.notaMaxima }}</td>
                  <td class="right"><a class="btn btn-sm" [routerLink]="['/aluno/revisao', h.id]">Ver gabarito</a></td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <p class="empty">Você ainda não enviou nenhum simulado.</p>
        }
      </div>
    </div>
  `,
  styles: `
    .turmas { display: flex; gap: 6px; flex-wrap: wrap; }
    .sim { display: flex; flex-direction: column; }
    .sim-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 13px; }
    .small { font-size: 13px; }
    .sim .btn, .nota { margin-top: auto; align-self: flex-start; }
    .nota { background: var(--ok-soft); color: var(--ok); padding: 8px 14px; border-radius: 8px; }
  `
})
export class AlunoPainelPage implements OnInit {
  private http = inject(HttpClient);
  primeiroNome = inject(AuthService).usuario()?.nome.split(' ')[0] ?? '';

  turmas = signal<{ id: string; nome: string; professor: string }[]>([]);
  simulados = signal<SimuladoAluno[]>([]);
  historico = signal<ItemHistorico[]>([]);

  pendentes = () => this.simulados().filter((s) => !s.feito).length;
  media = () => {
    const h = this.historico();
    return h.length ? h.reduce((a, x) => a + (x.notaMaxima ? (x.nota / x.notaMaxima) * 10 : 0), 0) / h.length : null;
  };

  ngOnInit() {
    forkJoin({
      lista: this.http.get<{ turmas: { id: string; nome: string; professor: string }[]; simulados: SimuladoAluno[] }>(`${API_URL}/aluno/simulados`),
      historico: this.http.get<ItemHistorico[]>(`${API_URL}/aluno/historico`)
    }).subscribe(({ lista, historico }) => {
      this.turmas.set(lista.turmas);
      this.simulados.set(lista.simulados);
      this.historico.set(historico);
    });
  }
}
