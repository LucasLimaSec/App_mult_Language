import { sql } from 'drizzle-orm';

import deckEs from '../../data/deck-es.json';
import deckZh from '../../data/deck-zh.json';
import { db } from '../db/client';
import { cards, DIRECOES, type NovoCard } from '../db/schema';
import { gravarSetting, lerSetting } from '../db/settings';
import type { Deck } from './tipos';

/** Decks empacotados no app. */
export const DECKS: Deck[] = [deckEs as Deck, deckZh as Deck];

/** Hash simples (djb2) do conteúdo, para saber se o deck mudou desde a última importação. */
export function assinaturaDoDeck(deck: Deck): string {
  const texto = JSON.stringify(deck.cartoes);
  let hash = 5381;
  for (let i = 0; i < texto.length; i++) {
    hash = ((hash << 5) + hash + texto.charCodeAt(i)) | 0;
  }
  return `${deck.cartoes.length}-${(hash >>> 0).toString(16)}`;
}

/** Linhas da tabela cards para um deck: dois cartões (um por direção) por palavra. */
export function linhasDoDeck(deck: Deck, agora: Date): NovoCard[] {
  return deck.cartoes.flatMap((cartao) =>
    DIRECOES.map((direcao) => ({
      idioma: deck.idioma,
      direcao,
      frente: cartao.palavra,
      versoEn: cartao.en,
      versoPt: cartao.pt,
      classe: cartao.classe ?? null,
      pinyin: cartao.pinyin ?? null,
      exemplo: cartao.exemplo ?? null,
      exemploEn: cartao.exemploEn ?? null,
      exemploPt: cartao.exemploPt ?? null,
      nota: cartao.nota ?? null,
      origem: 'deck' as const,
      conteudoId: cartao.id,
      due: agora,
      criadoEm: agora,
    })),
  );
}

const TAMANHO_DO_LOTE = 40;

/**
 * Importa os decks de /data para o banco. Palavras novas entram como cartões
 * novos; palavras que já existem têm só o conteúdo atualizado, sem mexer na
 * agenda de revisão. Só faz algo quando o conteúdo do deck mudou.
 */
export async function sincronizarDecks(agora: Date = new Date()): Promise<void> {
  for (const deck of DECKS) {
    const chave = `deck.${deck.id}.assinatura`;
    const assinatura = assinaturaDoDeck(deck);
    if ((await lerSetting<string | null>(chave, null)) === assinatura) continue;

    const linhas = linhasDoDeck(deck, agora);
    db.transaction((tx) => {
      for (let i = 0; i < linhas.length; i += TAMANHO_DO_LOTE) {
        tx.insert(cards)
          .values(linhas.slice(i, i + TAMANHO_DO_LOTE))
          .onConflictDoUpdate({
            target: [cards.conteudoId, cards.direcao],
            set: {
              frente: sql`excluded.frente`,
              versoEn: sql`excluded.verso_en`,
              versoPt: sql`excluded.verso_pt`,
              classe: sql`excluded.classe`,
              pinyin: sql`excluded.pinyin`,
              exemplo: sql`excluded.exemplo`,
              exemploEn: sql`excluded.exemplo_en`,
              exemploPt: sql`excluded.exemplo_pt`,
              nota: sql`excluded.nota`,
            },
          })
          .run();
      }
    });
    await gravarSetting(chave, assinatura);
  }
}
