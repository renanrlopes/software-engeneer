import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { API_URL } from './config';
import { Perfil, Usuario } from './models';

interface Sessao {
  token: string;
  usuario: Usuario;
}

const CHAVE = 'educa.sessao';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private sessao = signal<Sessao | null>(this.lerSessao());
  readonly usuario = computed(() => this.sessao()?.usuario ?? null);
  readonly logado = computed(() => this.sessao() !== null);

  get token(): string | null {
    return this.sessao()?.token ?? null;
  }

  login(email: string, senha: string) {
    return this.http.post<Sessao>(`${API_URL}/auth/login`, { email, senha }).pipe(tap((s) => this.salvar(s)));
  }

  cadastrar(dados: Record<string, unknown>) {
    return this.http.post<Sessao>(`${API_URL}/auth/cadastro`, dados).pipe(tap((s) => this.salvar(s)));
  }

  atualizarPerfil(dados: { nome?: string; senhaAtual?: string; novaSenha?: string }) {
    return this.http.put<Usuario>(`${API_URL}/auth/me`, dados).pipe(
      tap((usuario) => {
        const s = this.sessao();
        if (s) this.salvar({ ...s, usuario });
      })
    );
  }

  sair() {
    localStorage.removeItem(CHAVE);
    this.sessao.set(null);
    this.router.navigate(['/login']);
  }

  /** Painel inicial de cada perfil. */
  rotaInicial(perfil?: Perfil): string {
    return `/${perfil ?? this.usuario()?.perfil ?? 'login'}`;
  }

  private salvar(s: Sessao) {
    localStorage.setItem(CHAVE, JSON.stringify(s));
    this.sessao.set(s);
  }

  private lerSessao(): Sessao | null {
    try {
      const bruto = localStorage.getItem(CHAVE);
      return bruto ? (JSON.parse(bruto) as Sessao) : null;
    } catch {
      return null;
    }
  }
}
