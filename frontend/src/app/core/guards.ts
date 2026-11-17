import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Perfil } from './models';

/** Exige login. */
export const logadoGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.logado() || inject(Router).parseUrl('/login');
};

/** Exige um perfil específico; outro perfil volta ao seu próprio painel (RF02). */
export const perfilGuard = (perfil: Perfil): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const usuario = auth.usuario();
  if (!usuario) return router.parseUrl('/login');
  return usuario.perfil === perfil || router.parseUrl(auth.rotaInicial(usuario.perfil));
};

/** Telas públicas: quem já está logado vai direto ao painel. */
export const visitanteGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return !auth.logado() || inject(Router).parseUrl(auth.rotaInicial());
};
