import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
import { NOME_PERFIL } from './core/models';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    @if (auth.usuario(); as u) {
      <header class="topo">
        <div class="topo-in">
          <a class="marca" [routerLink]="auth.rotaInicial()"><span class="logo">E</span> Educa</a>
          <nav>
            <a [routerLink]="auth.rotaInicial()" routerLinkActive="ativo" [routerLinkActiveOptions]="{ exact: true }">Painel</a>
            <a routerLink="/perfil" routerLinkActive="ativo">Meu perfil</a>
          </nav>
          <div class="quem">
            <span class="nome">{{ u.nome }}</span>
            <span class="badge badge-orange">{{ nomePerfil[u.perfil] }}</span>
            <button class="btn btn-sm" (click)="auth.sair()">Sair</button>
          </div>
        </div>
      </header>
    }
    <main><router-outlet /></main>
  `,
  styles: `
    .topo { background: var(--navy); color: #fff; }
    .topo-in { max-width: 1080px; margin: 0 auto; padding: 10px 16px; display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
    .marca { display: flex; align-items: center; gap: 8px; color: #fff; font-weight: 800; font-size: 19px; text-decoration: none; }
    .logo { width: 30px; height: 30px; border-radius: 8px; background: var(--orange); display: grid; place-items: center; font-size: 17px; }
    nav { display: flex; gap: 4px; flex: 1; }
    nav a { color: #c9d1e3; text-decoration: none; padding: 6px 12px; border-radius: 6px; font-weight: 600; font-size: 14px; }
    nav a.ativo, nav a:hover { color: #fff; background: rgba(255, 255, 255, 0.1); }
    .quem { display: flex; align-items: center; gap: 10px; font-size: 14px; }
    .quem .btn { background: transparent; color: #fff; border-color: rgba(255, 255, 255, 0.35); }
  `
})
export class AppComponent {
  auth = inject(AuthService);
  nomePerfil = NOME_PERFIL;
}
