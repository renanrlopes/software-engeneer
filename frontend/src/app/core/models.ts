export type Perfil = 'aluno' | 'professor' | 'instituicao';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  instituicao: string | { _id: string; nome: string };
  ativo: boolean;
}

export interface Questao {
  enunciado: string;
  alternativas: string[];
  indiceCorreto?: number;
  peso?: number;
}

export interface ItemGabarito {
  enunciado: string;
  alternativas: string[];
  marcada: number | null;
  correta: number;
  acertou: boolean;
}

export interface ResultadoTentativa {
  acertos: number;
  nota: number;
  notaMaxima: number;
  gabarito: ItemGabarito[];
}

export const NOME_PERFIL: Record<Perfil, string> = {
  aluno: 'Aluno',
  professor: 'Professor',
  instituicao: 'Instituição'
};
