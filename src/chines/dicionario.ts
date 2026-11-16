import { importDatabaseFromAssetAsync, openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import { gravarSetting, lerSetting } from '../db/settings';
import info from './dicionario-versao.json';

const NOME = 'dicionario.db';
const CHAVE_VERSAO = 'dicionario.versao';

export type EntradaDicionario = {
  /** Sílabas com acento de tom separadas por espaço. */
  pinyin: string;
  /** Definições em inglês, separadas por "; ". */
  definicoes: string;
};

let aberto: Promise<SQLiteDatabase> | null = null;

/**
 * Abre o dicionário offline (CC-CEDICT + traços). Na primeira vez, ou quando o
 * app traz uma versão mais nova, copia o arquivo empacotado para o aparelho.
 */
function abrir(): Promise<SQLiteDatabase> {
  aberto ??= (async () => {
    const instalada = await lerSetting<string | null>(CHAVE_VERSAO, null);
    await importDatabaseFromAssetAsync(NOME, {
      assetId: require('../../assets/dicionario.db'),
      forceOverwrite: instalada !== info.versao,
    });
    if (instalada !== info.versao) await gravarSetting(CHAVE_VERSAO, info.versao);
    return openDatabaseAsync(NOME);
  })().catch((erro) => {
    aberto = null;
    throw erro;
  });
  return aberto;
}

/**
 * Ordena as entradas de uma palavra: primeiro as de uso comum, depois os nomes
 * próprios (pinyin com maiúscula, como o sobrenome "Bái") e as variantes.
 */
export function ordenarEntradas(entradas: EntradaDicionario[]): EntradaDicionario[] {
  const peso = (entrada: EntradaDicionario) => {
    if (/^(variant of|old variant of|surname )/i.test(entrada.definicoes)) return 2;
    if (/^\p{Lu}/u.test(entrada.pinyin)) return 1;
    return 0;
  };
  return [...entradas].sort((a, b) => peso(a) - peso(b));
}

/** Procura uma palavra em chinês simplificado. Devolve lista vazia se não existir. */
export async function buscarPalavra(simplificado: string): Promise<EntradaDicionario[]> {
  const palavra = simplificado.trim();
  if (!palavra) return [];
  const banco = await abrir();
  const linhas = await banco.getAllAsync<EntradaDicionario>(
    'SELECT pinyin, definicoes FROM cedict WHERE simplificado = ? ORDER BY id',
    palavra,
  );
  return ordenarEntradas(linhas);
}

/** Caminhos SVG dos traços de um caractere, na ordem de escrita, ou `null` se não houver. */
export async function buscarTracos(caractere: string): Promise<string[] | null> {
  const banco = await abrir();
  const linha = await banco.getFirstAsync<{ tracos: string }>(
    'SELECT tracos FROM tracos WHERE caractere = ?',
    caractere,
  );
  return linha ? (JSON.parse(linha.tracos) as string[]) : null;
}

export const INFO_DICIONARIO = info;
