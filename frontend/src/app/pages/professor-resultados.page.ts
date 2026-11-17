import { Component, OnInit, inject, input, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { API_URL } from '../core/config';
import { mensagemErro } from '../core/auth.interceptor';

interface Resultados {
  simulado: { id: string; titulo: string; questoes: number; turma: string };
  alunos: { aluno: string; email: string; entregue: boolean; acertos: number | null; nota: number | null; notaMaxima: number | null; enviadaEm: string | null }[];
}

@Component({
  selector: 'app-professor-resultados',
  imports: [RouterLink, DatePipe],
  template: `
    <div class="container">
      <a class="btn btn-sm" routerLink="/professor">← Voltar</a>
      @if (erro()) { <div class="alert alert-erro mt">{{ erro() }}</div> }
      @if (dados(); as d) {
        <div class="page-head mt">
          <div><h1>{{ d.simulado.titulo }}</h1><p>{{ d.simulado.turma }} · {{ d.simulado.questoes }} questões · {{ entregues() }} de {{ d.alunos.length }} entregaram</p></div>
        </div>
        <div class="card">
          <table>
            <thead><tr><th>Aluno</th><th>E-mail</th><th>Situação</th><th>Acertos</th><th>Nota</th><th>Enviado em</th></tr></thead>
            <tbody>
              @for (a of d.alunos; track a.email) {
                <tr>
                  <td><strong>{{ a.aluno }}</strong></td>
                  <td class="muted">{{ a.email }}</td>
                  <td><span class="badge" [class.badge-ok]="a.entregue" [class.badge-warn]="!a.entregue">{{ a.entregue ? 'Entregue' : 'Pendente' }}</span></td>
                  <td>{{ a.acertos ?? '—' }}</td>
                  <td>@if (a.entregue) { <strong>{{ a.nota }}</strong> / {{ a.notaMaxima }} } @else { — }</td>
                  <td>{{ a.enviadaEm ? (a.enviadaEm | date: 'dd/MM/yyyy HH:mm') : '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `
})
export class ProfessorResultadosPage implements OnInit {
  private http = inject(HttpClient);
  id = input.required<string>();
  dados = signal<Resultados | null>(null);
  erro = signal('');
  entregues = () => this.dados()?.alunos.filter((a) => a.entregue).length ?? 0;

  ngOnInit() {
    this.http.get<Resultados>(`${API_URL}/professor/simulados/${this.id()}/resultados`).subscribe({
      next: (d) => this.dados.set(d),
      error: (e) => this.erro.set(mensagemErro(e))
    });
  }
}
