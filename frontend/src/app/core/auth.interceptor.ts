import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/** Anexa o JWT a cada requisição e encerra a sessão quando a API responde 401. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token;
  const autenticada = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(autenticada).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && token) auth.sair();
      return throwError(() => err);
    })
  );
};

/** Extrai a mensagem de erro enviada pela API. */
export function mensagemErro(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'Não foi possível falar com o servidor. A API está rodando?';
    return err.error?.erro ?? 'Algo deu errado. Tente novamente.';
  }
  return 'Algo deu errado. Tente novamente.';
}
