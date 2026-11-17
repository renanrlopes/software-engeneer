import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { mensagemErro } from '../core/auth.interceptor';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-wrap">
      <section class="auth-lado">
        <div class="marca"><span class="logo">E</span> Educa</div>
        <h1>Simulados que conectam instituição, professor e aluno.</h1>
        <p>A instituição organiza as turmas, o professor cria o simulado e o aluno resolve e recebe a nota na hora.</p>
      </section>

      <section class="card auth-card">
        <h2>Entrar</h2>
        @if (erro()) { <div class="alert alert-erro">{{ erro() }}</div> }
        <form (ngSubmit)="entrar()">
          <div class="field">
            <label for="email">E-mail</label>
            <input id="email" class="input" type="email" name="email" [(ngModel)]="email" required autocomplete="username" />
          </div>
          <div class="field">
            <label for="senha">Senha</label>
            <input id="senha" class="input" type="password" name="senha" [(ngModel)]="senha" required autocomplete="current-password" />
          </div>
          <button class="btn btn-primary" style="width: 100%" [disabled]="carregando()">{{ carregando() ? 'Entrando…' : 'Entrar' }}</button>
        </form>
        <p class="mt muted">Não tem conta? <a routerLink="/cadastro">Cadastre-se</a></p>

        <div class="demo">
          <strong>Contas de demonstração</strong> <span class="muted">(senha 123456)</span>
          <div class="demo-btns">
            <button class="btn btn-sm" type="button" (click)="usar('instituicao@educa.dev')">Instituição</button>
            <button class="btn btn-sm" type="button" (click)="usar('professor@educa.dev')">Professor</button>
            <button class="btn btn-sm" type="button" (click)="usar('aluno@educa.dev')">Aluno</button>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: `
    .auth-wrap { min-height: 100vh; display: grid; grid-template-columns: 1.1fr 1fr; }
    .auth-lado { background: var(--navy); color: #dfe5f2; padding: 64px 56px; display: flex; flex-direction: column; justify-content: center; }
    .auth-lado h1 { color: #fff; font-size: 30px; margin: 24px 0 12px; max-width: 460px; }
    .auth-lado p { max-width: 440px; font-size: 16px; }
    .marca { display: flex; align-items: center; gap: 10px; color: #fff; font-weight: 800; font-size: 22px; }
    .logo { width: 36px; height: 36px; border-radius: 9px; background: var(--orange); display: grid; place-items: center; }
    .auth-card { align-self: center; justify-self: center; width: min(420px, 92%); margin: 32px 0; }
    .demo { margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--line); font-size: 14px; }
    .demo-btns { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
    @media (max-width: 800px) { .auth-wrap { grid-template-columns: 1fr; } .auth-lado { padding: 32px 24px; } }
  `
})
export class LoginPage {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  senha = '';
  erro = signal('');
  carregando = signal(false);

  usar(email: string) {
    this.email = email;
    this.senha = '123456';
  }

  entrar() {
    this.erro.set('');
    this.carregando.set(true);
    this.auth.login(this.email, this.senha).subscribe({
      next: (s) => this.router.navigateByUrl(this.auth.rotaInicial(s.usuario.perfil)),
      error: (e) => {
        this.erro.set(mensagemErro(e));
        this.carregando.set(false);
      }
    });
  }
}
