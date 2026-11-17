import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { mensagemErro } from '../core/auth.interceptor';

@Component({
  selector: 'app-cadastro',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="container" style="max-width: 520px">
      <div class="card">
        <h1>Criar conta</h1>
        <p class="muted">Alunos entram com o código da turma. Instituições criam o próprio espaço e depois cadastram os professores.</p>

        <div class="tipos">
          <button type="button" class="tipo" [class.ativo]="perfil === 'aluno'" (click)="perfil = 'aluno'">Sou aluno</button>
          <button type="button" class="tipo" [class.ativo]="perfil === 'instituicao'" (click)="perfil = 'instituicao'">Sou instituição</button>
        </div>

        @if (erro()) { <div class="alert alert-erro">{{ erro() }}</div> }
        <form (ngSubmit)="cadastrar()">
          @if (perfil === 'instituicao') {
            <div class="field"><label>Nome da instituição</label><input class="input" name="inst" [(ngModel)]="nomeInstituicao" required /></div>
          }
          <div class="field"><label>{{ perfil === 'aluno' ? 'Seu nome' : 'Nome do responsável' }}</label><input class="input" name="nome" [(ngModel)]="nome" required /></div>
          <div class="field"><label>E-mail</label><input class="input" type="email" name="email" [(ngModel)]="email" required /></div>
          <div class="field"><label>Senha (mín. 6 caracteres)</label><input class="input" type="password" name="senha" [(ngModel)]="senha" required minlength="6" /></div>
          @if (perfil === 'aluno') {
            <div class="field">
              <label>Código da turma</label>
              <input class="input" name="codigo" [(ngModel)]="codigoTurma" placeholder="ex.: TURMA3A" required />
            </div>
          }
          <button class="btn btn-primary" style="width: 100%" [disabled]="carregando()">Criar conta</button>
        </form>
        <p class="mt muted">Já tem conta? <a routerLink="/login">Entrar</a></p>
      </div>
    </div>
  `,
  styles: `
    .tipos { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 16px 0; }
    .tipo { border: 1px solid var(--line); background: #fff; border-radius: 8px; padding: 10px; font: inherit; font-weight: 600; cursor: pointer; color: var(--navy); }
    .tipo.ativo { border-color: var(--orange); background: var(--orange-soft); color: #9a4708; }
  `
})
export class CadastroPage {
  private auth = inject(AuthService);
  private router = inject(Router);

  perfil: 'aluno' | 'instituicao' = 'aluno';
  nome = '';
  email = '';
  senha = '';
  codigoTurma = '';
  nomeInstituicao = '';
  erro = signal('');
  carregando = signal(false);

  cadastrar() {
    this.erro.set('');
    this.carregando.set(true);
    const dados = { perfil: this.perfil, nome: this.nome, email: this.email, senha: this.senha, codigoTurma: this.codigoTurma, nomeInstituicao: this.nomeInstituicao };
    this.auth.cadastrar(dados).subscribe({
      next: (s) => this.router.navigateByUrl(this.auth.rotaInicial(s.usuario.perfil)),
      error: (e) => {
        this.erro.set(mensagemErro(e));
        this.carregando.set(false);
      }
    });
  }
}
