import { Routes } from '@angular/router';
import { logadoGuard, perfilGuard, visitanteGuard } from './core/guards';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', canActivate: [visitanteGuard], loadComponent: () => import('./pages/login.page').then((m) => m.LoginPage) },
  { path: 'cadastro', canActivate: [visitanteGuard], loadComponent: () => import('./pages/cadastro.page').then((m) => m.CadastroPage) },
  { path: 'perfil', canActivate: [logadoGuard], loadComponent: () => import('./pages/perfil.page').then((m) => m.PerfilPage) },

  { path: 'aluno', canActivate: [perfilGuard('aluno')], loadComponent: () => import('./pages/aluno-painel.page').then((m) => m.AlunoPainelPage) },
  { path: 'aluno/simulado/:id', canActivate: [perfilGuard('aluno')], loadComponent: () => import('./pages/aluno-simulado.page').then((m) => m.AlunoSimuladoPage) },
  { path: 'aluno/revisao/:id', canActivate: [perfilGuard('aluno')], loadComponent: () => import('./pages/aluno-revisao.page').then((m) => m.AlunoRevisaoPage) },

  { path: 'professor', canActivate: [perfilGuard('professor')], loadComponent: () => import('./pages/professor-painel.page').then((m) => m.ProfessorPainelPage) },
  { path: 'professor/simulado/novo', canActivate: [perfilGuard('professor')], loadComponent: () => import('./pages/professor-simulado.page').then((m) => m.ProfessorSimuladoPage) },
  { path: 'professor/simulado/:id/resultados', canActivate: [perfilGuard('professor')], loadComponent: () => import('./pages/professor-resultados.page').then((m) => m.ProfessorResultadosPage) },

  { path: 'instituicao', canActivate: [perfilGuard('instituicao')], loadComponent: () => import('./pages/instituicao-painel.page').then((m) => m.InstituicaoPainelPage) },

  { path: '**', redirectTo: 'login' }
];
