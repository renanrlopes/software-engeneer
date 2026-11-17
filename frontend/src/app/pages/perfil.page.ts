import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/auth.service';
import { mensagemErro } from '../core/auth.interceptor';
import { NOME_PERFIL } from '../core/models';

@Component({
  selector: 'app-perfil',
  imports: [FormsModule],
  template: `
    <div class="container" style="max-width: 640px">
      <div class="page-head"><div><h1>Meu perfil</h1><p>Atualize seu nome ou troque a senha.</p></div></div>
      @if (msg()) { <div class="alert alert-ok">{{ msg() }}</div> }
      @if (erro()) { <div class="alert alert-erro">{{ erro() }}</div> }
      <div class="card">
        <div class="row">
          <div class="field"><label>E-mail</label><input class="input" [value]="auth.usuario()?.email" disabled /></div>
          <div class="field"><label>Perfil</label><input class="input" [value]="nomePerfil[auth.usuario()!.perfil]" disabled /></div>
        </div>
        <div class="field"><label>Nome</label><input class="input" name="nome" [(ngModel)]="nome" /></div>
        <h3 class="mt">Trocar senha</h3>
        <div class="row">
          <div class="field"><label>Senha atual</label><input class="input" type="password" name="sa" [(ngModel)]="senhaAtual" /></div>
          <div class="field"><label>Nova senha</label><input class="input" type="password" name="ns" [(ngModel)]="novaSenha" /></div>
        </div>
        <button class="btn btn-primary" (click)="salvar()">Salvar alterações</button>
      </div>
    </div>
  `
})
export class PerfilPage {
  auth = inject(AuthService);
  nomePerfil = NOME_PERFIL;
  nome = this.auth.usuario()?.nome ?? '';
  senhaAtual = '';
  novaSenha = '';
  msg = signal('');
  erro = signal('');

  salvar() {
    this.msg.set('');
    this.erro.set('');
    const dados = { nome: this.nome, ...(this.novaSenha ? { senhaAtual: this.senhaAtual, novaSenha: this.novaSenha } : {}) };
    this.auth.atualizarPerfil(dados).subscribe({
      next: () => {
        this.msg.set('Perfil atualizado.');
        this.senhaAtual = this.novaSenha = '';
      },
      error: (e) => this.erro.set(mensagemErro(e))
    });
  }
}
