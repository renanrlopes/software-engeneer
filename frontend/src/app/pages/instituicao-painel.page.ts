import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { API_URL } from '../core/config';
import { mensagemErro } from '../core/auth.interceptor';
import { NOME_PERFIL, Usuario } from '../core/models';

interface Painel {
  totais: { alunos: number; professores: number; turmas: number; simulados: number; entregas: number };
  turmas: { id: string; nome: string; codigo: string; professor: string; alunos: number; simulados: number; entregas: number; media: number | null }[];
}

@Component({
  selector: 'app-instituicao-painel',
  imports: [FormsModule, DecimalPipe],
  template: `
    <div class="container">
      <div class="page-head"><div><h1>Painel da instituição</h1><p>Professores, alunos e turmas em um só lugar.</p></div></div>
      @if (msg()) { <div class="alert alert-ok">{{ msg() }}</div> }
      @if (erro()) { <div class="alert alert-erro">{{ erro() }}</div> }

      @if (painel(); as p) {
        <div class="grid grid-stats">
          <div class="stat"><div class="valor">{{ p.totais.alunos }}</div><div class="rotulo">Alunos</div></div>
          <div class="stat"><div class="valor">{{ p.totais.professores }}</div><div class="rotulo">Professores</div></div>
          <div class="stat"><div class="valor">{{ p.totais.turmas }}</div><div class="rotulo">Turmas</div></div>
          <div class="stat"><div class="valor">{{ p.totais.simulados }}</div><div class="rotulo">Simulados</div></div>
          <div class="stat"><div class="valor">{{ p.totais.entregas }}</div><div class="rotulo">Entregas</div></div>
        </div>

        <div class="card">
          <h2>Turmas</h2>
          <table>
            <thead><tr><th>Turma</th><th>Código</th><th>Professor</th><th>Alunos</th><th>Simulados</th><th>Entregas</th><th>Média</th></tr></thead>
            <tbody>
              @for (t of p.turmas; track t.id) {
                <tr>
                  <td><strong>{{ t.nome }}</strong></td>
                  <td><span class="badge badge-navy">{{ t.codigo }}</span></td>
                  <td>{{ t.professor }}</td>
                  <td>{{ t.alunos }}</td>
                  <td>{{ t.simulados }}</td>
                  <td>{{ t.entregas }}</td>
                  <td>{{ t.media === null ? '—' : (t.media | number: '1.1-1') }}</td>
                </tr>
              } @empty { <tr><td colspan="7" class="empty">Nenhuma turma cadastrada.</td></tr> }
            </tbody>
          </table>
        </div>
      }

      <div class="grid grid-2 mt">
        <div class="card">
          <h2>Cadastrar usuário</h2>
          <div class="row">
            <div class="field"><label>Perfil</label>
              <select name="perfil" [(ngModel)]="novo.perfil"><option value="aluno">Aluno</option><option value="professor">Professor</option></select>
            </div>
            @if (novo.perfil === 'aluno') {
              <div class="field"><label>Turma</label>
                <select name="turmaU" [(ngModel)]="novo.turmaId">
                  <option value="">Sem turma</option>
                  @for (t of painel()?.turmas ?? []; track t.id) { <option [value]="t.id">{{ t.nome }}</option> }
                </select>
              </div>
            }
          </div>
          <div class="field"><label>Nome</label><input class="input" name="nomeU" [(ngModel)]="novo.nome" /></div>
          <div class="row">
            <div class="field"><label>E-mail</label><input class="input" type="email" name="emailU" [(ngModel)]="novo.email" /></div>
            <div class="field"><label>Senha inicial</label><input class="input" name="senhaU" [(ngModel)]="novo.senha" /></div>
          </div>
          <button class="btn btn-primary" (click)="criarUsuario()">Cadastrar</button>
        </div>

        <div class="card">
          <h2>Criar turma</h2>
          <div class="field"><label>Nome da turma</label><input class="input" name="nomeT" [(ngModel)]="novaTurma.nome" placeholder="ex.: 2º ano B" /></div>
          <div class="field"><label>Professor responsável</label>
            <select name="profT" [(ngModel)]="novaTurma.professorId">
              @for (u of professores(); track u.id) { <option [value]="u.id">{{ u.nome }}</option> }
            </select>
          </div>
          <button class="btn btn-navy" (click)="criarTurma()">Criar turma</button>
          <p class="muted mt" style="font-size: 13px">O código da turma é gerado automaticamente; alunos podem usá-lo para se cadastrar.</p>
        </div>
      </div>

      <div class="card mt">
        <h2>Usuários</h2>
        <table>
          <thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Situação</th><th></th></tr></thead>
          <tbody>
            @for (u of usuarios(); track u.id) {
              <tr>
                <td><strong>{{ u.nome }}</strong></td>
                <td class="muted">{{ u.email }}</td>
                <td><span class="badge" [class.badge-orange]="u.perfil === 'professor'" [class.badge-navy]="u.perfil === 'aluno'">{{ nomePerfil[u.perfil] }}</span></td>
                <td><span class="badge" [class.badge-ok]="u.ativo" [class.badge-warn]="!u.ativo">{{ u.ativo ? 'Ativo' : 'Inativo' }}</span></td>
                <td class="right">
                  <button class="btn btn-sm" (click)="alternarAtivo(u)">{{ u.ativo ? 'Desativar' : 'Ativar' }}</button>
                  <button class="btn-link" style="margin-left: 10px" (click)="remover(u)">Excluir</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class InstituicaoPainelPage implements OnInit {
  private http = inject(HttpClient);
  nomePerfil = NOME_PERFIL;

  painel = signal<Painel | null>(null);
  usuarios = signal<Usuario[]>([]);
  professores = () => this.usuarios().filter((u) => u.perfil === 'professor');
  msg = signal('');
  erro = signal('');

  novo = { perfil: 'aluno', nome: '', email: '', senha: '', turmaId: '' };
  novaTurma = { nome: '', professorId: '' };

  ngOnInit() {
    this.carregar();
  }

  carregar() {
    forkJoin({
      painel: this.http.get<Painel>(`${API_URL}/instituicao/painel`),
      usuarios: this.http.get<Usuario[]>(`${API_URL}/instituicao/usuarios`)
    }).subscribe({
      next: ({ painel, usuarios }) => {
        this.painel.set(painel);
        this.usuarios.set(usuarios);
        if (!this.novaTurma.professorId) this.novaTurma.professorId = usuarios.find((u) => u.perfil === 'professor')?.id ?? '';
      },
      error: (e) => this.erro.set(mensagemErro(e))
    });
  }

  criarUsuario() {
    this.limpar();
    this.http.post(`${API_URL}/instituicao/usuarios`, this.novo).subscribe({
      next: () => {
        this.msg.set(`${this.novo.nome} cadastrado(a).`);
        this.novo = { ...this.novo, nome: '', email: '', senha: '' };
        this.carregar();
      },
      error: (e) => this.erro.set(mensagemErro(e))
    });
  }

  criarTurma() {
    this.limpar();
    this.http.post<{ codigo: string }>(`${API_URL}/instituicao/turmas`, this.novaTurma).subscribe({
      next: (t) => {
        this.msg.set(`Turma criada. Código de acesso: ${t.codigo}`);
        this.novaTurma.nome = '';
        this.carregar();
      },
      error: (e) => this.erro.set(mensagemErro(e))
    });
  }

  alternarAtivo(u: Usuario) {
    this.limpar();
    this.http.put(`${API_URL}/instituicao/usuarios/${u.id}`, { ativo: !u.ativo }).subscribe({ next: () => this.carregar(), error: (e) => this.erro.set(mensagemErro(e)) });
  }

  remover(u: Usuario) {
    if (!confirm(`Excluir ${u.nome}?`)) return;
    this.limpar();
    this.http.delete(`${API_URL}/instituicao/usuarios/${u.id}`).subscribe({ next: () => this.carregar(), error: (e) => this.erro.set(mensagemErro(e)) });
  }

  private limpar() {
    this.msg.set('');
    this.erro.set('');
  }
}
