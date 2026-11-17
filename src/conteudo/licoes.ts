import type { Idioma } from '../voz/idiomas';

/** Bloco da explicação de uma lição. O texto é em inglês. */
export type BlocoExplicacao =
  | { tipo: 'texto'; texto: string }
  | { tipo: 'tabela'; cabecalho: string[]; linhas: string[][] }
  | { tipo: 'dica'; texto: string };

/** Frase de exemplo com áudio. `pinyin` só no chinês. */
export type Exemplo = { frase: string; pinyin?: string; en: string; pt: string };

/** Palavra nova da lição. Vira flashcard se ainda não estiver no deck. */
export type PalavraLicao = {
  palavra: string;
  pinyin?: string;
  classe?: string;
  en: string;
  pt: string;
  exemplo?: string;
  exemploEn?: string;
  exemploPt?: string;
  nota?: string;
};

/**
 * Exercícios:
 * - escolha: pergunta com alternativas; `audio` opcional toca uma frase antes.
 * - ouvir: o app fala `audio` e você escolhe o que ouviu.
 * - montar: você monta a frase com os blocos (`blocos` na ordem certa, `extras` são distratores).
 * - ditado: o app fala `frase` e você digita. No chinês você digita o pinyin, com tom em número ou acento.
 * - falar: você lê `frase` em voz alta e o reconhecimento do aparelho confere; dá para pular.
 */
export type Exercicio =
  | { tipo: 'escolha'; pergunta: string; audio?: string; opcoes: string[]; correta: number; explicacao?: string }
  | { tipo: 'ouvir'; audio: string; pergunta?: string; opcoes: string[]; correta: number; explicacao?: string }
  | { tipo: 'montar'; traducao: string; blocos: string[]; extras?: string[]; pinyin?: string; explicacao?: string }
  | { tipo: 'ditado'; frase: string; resposta?: string; traducao: string; aceitas?: string[]; explicacao?: string }
  | { tipo: 'falar'; frase: string; pinyin?: string; traducao: string; aceitas?: string[] };

export type Licao = {
  id: string;
  titulo: string;
  explicacao: BlocoExplicacao[];
  exemplos: Exemplo[];
  palavras: PalavraLicao[];
  exercicios: Exercicio[];
};

/** Falso amigo do português (só no espanhol). */
export type FalsoAmigo = {
  palavra: string;
  significado: string;
  portugues: string;
  exemplo: string;
  exemploEn: string;
};

export type Unidade = {
  id: string;
  idioma: Idioma;
  titulo: string;
  falsosAmigos?: FalsoAmigo[];
  licoes: Licao[];
};
