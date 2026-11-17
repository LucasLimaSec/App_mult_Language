import curriculoEs from '../../data/curriculo-es.json';
import curriculoZh from '../../data/curriculo-zh.json';
import esU01 from '../../data/licoes/es-u01.json';
import esU02 from '../../data/licoes/es-u02.json';
import esU03 from '../../data/licoes/es-u03.json';
import zhU01 from '../../data/licoes/zh-u01.json';
import zhU02 from '../../data/licoes/zh-u02.json';
import zhU03 from '../../data/licoes/zh-u03.json';
import type { Lesson } from '../db/schema';
import type { Idioma } from '../voz/idiomas';
import type { Licao, Unidade } from './licoes';

export type UnidadeCurriculo = {
  id: string;
  titulo: string;
  objetivo: string;
  gramatica: string[];
  vocabulario: string[];
  falsosAmigos?: string[];
  caracteres?: string[];
  licoes: { id: string; titulo: string }[];
};

export type Curriculo = {
  id: string;
  idioma: Idioma;
  titulo: string;
  meta: string;
  niveis: { id: string; unidades: UnidadeCurriculo[] }[];
};

/** Idiomas que têm trilha de lições no MVP. */
export const IDIOMAS_COM_LICOES: Idioma[] = ['es', 'zh'];

const CURRICULOS: Partial<Record<Idioma, Curriculo>> = {
  es: curriculoEs as Curriculo,
  zh: curriculoZh as Curriculo,
};

/**
 * Unidades já escritas. Cada nova unidade em /data/licoes entra aqui, porque o
 * Metro só empacota arquivos importados de forma estática.
 */
const UNIDADES: Record<string, Unidade> = Object.fromEntries(
  ([esU01, esU02, esU03, zhU01, zhU02, zhU03] as Unidade[]).map((unidade) => [unidade.id, unidade]),
);

export function lerCurriculo(idioma: Idioma): Curriculo | undefined {
  return CURRICULOS[idioma];
}

export function unidadeDoCurriculo(id: string): UnidadeCurriculo | undefined {
  for (const curriculo of Object.values(CURRICULOS)) {
    for (const nivel of curriculo?.niveis ?? []) {
      const unidade = nivel.unidades.find((u) => u.id === id);
      if (unidade) return unidade;
    }
  }
  return undefined;
}

export function unidadeEscrita(id: string): Unidade | undefined {
  return UNIDADES[id];
}

export function buscarLicao(id: string): { unidade: Unidade; licao: Licao; indice: number } | undefined {
  const unidade = UNIDADES[id.split('-l')[0]];
  const indice = unidade?.licoes.findIndex((licao) => licao.id === id) ?? -1;
  return unidade && indice >= 0 ? { unidade, licao: unidade.licoes[indice], indice } : undefined;
}

/** Nome do nível para exibir: "HSK1" vira "HSK 1". */
export function nomeDoNivel(id: string): string {
  return id.replace(/^HSK(\d)$/, 'HSK $1');
}

/** Próxima lição sugerida: a primeira lição escrita, na ordem da trilha, que ainda não foi concluída. */
export function proximaLicao(idioma: Idioma, progresso: Record<string, Lesson>): Licao | undefined {
  for (const nivel of CURRICULOS[idioma]?.niveis ?? []) {
    for (const unidadeC of nivel.unidades) {
      const unidade = UNIDADES[unidadeC.id];
      const pendente = unidade?.licoes.find((licao) => progresso[licao.id]?.status !== 'concluida');
      if (pendente) return pendente;
    }
  }
  return undefined;
}

/** Nível e número da unidade, por exemplo { nivel: "A1", numero: 2 }. */
export function localizarUnidade(id: string): { nivel: string; numero: number } | undefined {
  for (const curriculo of Object.values(CURRICULOS)) {
    for (const nivel of curriculo?.niveis ?? []) {
      if (nivel.unidades.some((u) => u.id === id)) return { nivel: nomeDoNivel(nivel.id), numero: Number(id.split('-u')[1]) };
    }
  }
  return undefined;
}

/** Total de lições previstas no currículo do idioma (escritas ou não). */
export function totalDeLicoes(idioma: Idioma): number {
  return (CURRICULOS[idioma]?.niveis ?? []).reduce((soma, n) => soma + n.unidades.reduce((s, u) => s + u.licoes.length, 0), 0);
}

/** Id da unidade de uma lição: "es-u02-l03" → "es-u02". */
export function unidadeDaLicao(licaoId: string): string {
  return licaoId.split('-l')[0];
}
