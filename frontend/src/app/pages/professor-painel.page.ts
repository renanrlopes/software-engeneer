import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { API_URL } from '../core/config';
import { mensagemErro } from '../core/auth.interceptor';

interface PainelProfessor {
  turmas: { id: string; nome: string; codigo: string; alunos: number }[];
  simulados: { id: string; titulo: string; turma: string; questoes: number; abreEm: string; tempoLimiteMin: number; publicado: boolean; entregas: number; alunosNaTurma: number; media: number | null }[];
}

@Component({
  selector: 'app-professor-painel',
  imports: [RouterLink, DatePipe, DecimalPipe],
  template: `
    <div class="container">
      <div class="page-head">
        <div><h1>Painel do professor</h1><p>Suas turmas, simulados e entregas.</p></div>
        <a class="btn btn-primary" routerLink="/professor/simulado/novo">+ Novo simulado</a>
      </div>
      @if (erro()) { <div class="alert alert-erro">{{ erro() }}</div> }

      @if (painel(); as p) {
        <div class="grid grid-stats">
          @for (t of p.turmas; track t.id) {
            <div class="stat">
              <div class="rotulo">Turma</div>
              <div class="valor" style="font-size: 20px">{{ t.nome }}</div>
              <div class="rotulo">{{ t.alunos }} alunos · código <strong>{{ t.codigo }}</strong></div>
            </div>
          }
        </div>

        <div class="card">
          <h2>Simulados</h2>
          @if (p.simulados.length) {
            <table>
              <thead><tr><th>Título</th><th>Turma</th><th>Questões</th><th>Abre em</th><th>Entregas</th><th>Média</th><th></th></tr></thead>
              <tbody>
                @for (s of p.simulados; track s.id) {
                  <tr>
                    <td><strong>{{ s.titulo }}</strong></td>
                    <td>{{ s.turma }}</td>
                    <td>{{ s.questoes }}</td>
                    <td>{{ s.abreEm | date: 'dd/MM HH:mm' }}</td>
                    <td><span class="badge" [class.badge-ok]="s.entregas === s.alunosNaTurma" [class.badge-warn]="s.entregas < s.alunosNaTurma">{{ s.entregas }}/{{ s.alunosNaTurma }}</span></td>
                    <td>{{ s.media === null ? '—' : (s.media | number: '1.1-1') }}</td>
                    <td class="right">
                      <a class="btn btn-sm" [routerLink]="['/professor/simulado', s.id, 'resultados']">Resultados</a>
                      <button class="btn-link" style="margin-left: 10px" (click)="remover(s.id, s.titulo)">Excluir</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          } @else {
            <p class="empty">Nenhum simulado ainda. Crie o primeiro para uma das suas turmas.</p>
          }
        </div>
      }
    </div>
  `
})
export class ProfessorPainelPage implements OnInit {
  private http = inject(HttpClient);
  painel = signal<PainelProfessor | null>(null);
  erro = signal('');

  ngOnInit() {
    this.carregar();
  }

  carregar() {
    this.http.get<PainelProfessor>(`${API_URL}/professor/painel`).subscribe({
      next: (p) => this.painel.set(p),
      error: (e) => this.erro.set(mensagemErro(e))
    });
  }

  remover(id: string, titulo: string) {
    if (!confirm(`Excluir o simulado "${titulo}" e as entregas dele?`)) return;
    this.http.delete(`${API_URL}/professor/simulados/${id}`).subscribe({ next: () => this.carregar(), error: (e) => this.erro.set(mensagemErro(e)) });
  }
}
