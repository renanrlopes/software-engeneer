import { Component, OnInit, inject, input, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { API_URL } from '../core/config';
import { mensagemErro } from '../core/auth.interceptor';
import { ResultadoTentativa } from '../core/models';
import { GabaritoComponent } from './gabarito.component';

@Component({
  selector: 'app-aluno-revisao',
  imports: [RouterLink, GabaritoComponent],
  template: `
    <div class="container" style="max-width: 820px">
      <a class="btn btn-sm" routerLink="/aluno">← Voltar</a>
      @if (erro()) { <div class="alert alert-erro mt">{{ erro() }}</div> }
      @if (dados(); as d) {
        <div class="page-head mt"><div><h1>{{ d.titulo }}</h1><p>Nota {{ d.nota }} de {{ d.notaMaxima }} · {{ d.acertos }} acertos</p></div></div>
        <app-gabarito [itens]="d.gabarito" />
      }
    </div>
  `
})
export class AlunoRevisaoPage implements OnInit {
  private http = inject(HttpClient);
  id = input.required<string>();
  dados = signal<(ResultadoTentativa & { titulo: string }) | null>(null);
  erro = signal('');

  ngOnInit() {
    this.http.get<ResultadoTentativa & { titulo: string }>(`${API_URL}/aluno/tentativas/${this.id()}`).subscribe({
      next: (d) => this.dados.set(d),
      error: (e) => this.erro.set(mensagemErro(e))
    });
  }
}
