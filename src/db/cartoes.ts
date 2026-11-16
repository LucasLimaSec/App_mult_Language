import { and, asc, eq, gte, lte, ne, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';

import { agendador, ESTADO, type Resposta } from '../srs/agendador';
import { chaveDoDia, inicioDoDia, montarFila, novosRestantes } from '../srs/fila';
import type { Idioma } from '../voz/idiomas';
import { db } from './client';
import { cards, DIRECOES, reviews, sessions, type Card } from './schema';
import { gravarSetting, lerSetting } from './settings';

export const NOVOS_POR_DIA_PADRAO = 6;
export const NOVOS_POR_DIA_MAXIMO = 50;

export function lerNovosPorDia(idioma: Idioma): Promise<number> {
  return lerSetting(`novosPorDia.${idioma}`, NOVOS_POR_DIA_PADRAO);
}

export function gravarNovosPorDia(idioma: Idioma, valor: number): Promise<void> {
  const limitado = Math.min(NOVOS_POR_DIA_MAXIMO, Math.max(0, Math.round(valor)));
  return gravarSetting(`novosPorDia.${idioma}`, limitado);
}

const irmao = alias(cards, 'irmao');

/**
 * Um cartão novo pode ser apresentado se for de reconhecimento, ou se for de
 * produção e o de reconhecimento da mesma palavra já tiver sido aprendido
 * (estado "revisão") num dia anterior.
 */
function novoLiberado(hoje: Date) {
  return or(
    eq(cards.direcao, 'reconhecimento'),
    sql`exists (
      select 1 from ${cards} as irmao
      where ${irmao.conteudoId} = ${cards.conteudoId}
        and ${irmao.direcao} = 'reconhecimento'
        and ${irmao.state} = ${ESTADO.revisao}
        and ${irmao.lastReview} < ${Math.floor(hoje.getTime() / 1000)}
    )`,
  );
}

function ehNovo(idioma: Idioma, hoje: Date) {
  return and(
    eq(cards.idioma, idioma),
    eq(cards.state, ESTADO.novo),
    eq(cards.suspenso, false),
    novoLiberado(hoje),
  );
}

function estaVencido(idioma: Idioma, agora: Date) {
  return and(
    eq(cards.idioma, idioma),
    ne(cards.state, ESTADO.novo),
    eq(cards.suspenso, false),
    lte(cards.due, agora),
  );
}

/** Quantos cartões novos deste idioma já foram vistos pela primeira vez hoje. */
async function contarIntroduzidosHoje(idioma: Idioma, hoje: Date): Promise<number> {
  const [linha] = await db
    .select({ total: sql<number>`count(*)` })
    .from(reviews)
    .innerJoin(cards, eq(reviews.cardId, cards.id))
    .where(and(eq(cards.idioma, idioma), eq(reviews.state, ESTADO.novo), gte(reviews.revisadoEm, hoje)));
  return linha?.total ?? 0;
}

export type ResumoIdioma = {
  /** Revisões vencidas agora. */
  vencidos: number;
  /** Cartões novos que ainda entram hoje, já descontado o limite diário. */
  novosHoje: number;
  /** Palavras no total e quantas já saíram do aprendizado. */
  palavras: number;
  aprendidas: number;
};

export async function resumoDoIdioma(idioma: Idioma, agora: Date = new Date()): Promise<ResumoIdioma> {
  const hoje = inicioDoDia(agora);
  const limite = await lerNovosPorDia(idioma);
  const restantes = novosRestantes(limite, await contarIntroduzidosHoje(idioma, hoje));
  const reconhecimento = and(eq(cards.idioma, idioma), eq(cards.direcao, 'reconhecimento'));

  const [vencidos, novosLiberados, palavras, aprendidas] = await Promise.all([
    db.$count(cards, estaVencido(idioma, agora)),
    db.$count(cards, ehNovo(idioma, hoje)),
    db.$count(cards, reconhecimento),
    db.$count(cards, and(reconhecimento, eq(cards.state, ESTADO.revisao))),
  ]);

  return { vencidos, novosHoje: Math.min(restantes, novosLiberados), palavras, aprendidas };
}

/** Cartões da sessão: revisões vencidas e os novos que cabem no limite de hoje. */
export async function carregarFila(idioma: Idioma, agora: Date = new Date()): Promise<Card[]> {
  const hoje = inicioDoDia(agora);
  const limite = await lerNovosPorDia(idioma);
  const restantes = novosRestantes(limite, await contarIntroduzidosHoje(idioma, hoje));

  const vencidos = await db.select().from(cards).where(estaVencido(idioma, agora));
  const novos =
    restantes > 0
      ? await db.select().from(cards).where(ehNovo(idioma, hoje)).orderBy(asc(cards.id)).limit(restantes)
      : [];
  return montarFila(vencidos, novos);
}

/** Aplica a resposta: reagenda o cartão e grava a linha do histórico. Devolve o cartão atualizado. */
export function registrarResposta(card: Card, resposta: Resposta, agora: Date, duracaoMs: number): Card {
  const { estado, registro } = agendador.responder(card, resposta, agora);
  db.transaction((tx) => {
    tx.update(cards).set(estado).where(eq(cards.id, card.id)).run();
    tx.insert(reviews)
      .values({ cardId: card.id, ...registro, duracaoMs: Math.round(duracaoMs) })
      .run();
  });
  return { ...card, ...estado };
}

/** Grava um bloco de estudo de flashcards, para o painel de progresso. */
export async function registrarSessao(idioma: Idioma, iniciadaEm: Date, terminadaEm: Date, itens: number) {
  if (itens === 0) return;
  await db.insert(sessions).values({
    dia: chaveDoDia(iniciadaEm),
    tipo: 'flashcards',
    idioma,
    duracaoSeg: Math.round((terminadaEm.getTime() - iniciadaEm.getTime()) / 1000),
    itens,
    iniciadaEm,
    terminadaEm,
  });
}

export type PalavraManual = {
  idioma: Idioma;
  palavra: string;
  en: string;
  pt: string;
  pinyin?: string;
  exemplo?: string;
};

function textoOuNulo(texto: string | undefined): string | null {
  const limpo = texto?.trim();
  return limpo ? limpo : null;
}

/** Diz por que a palavra não pode ser salva, ou `null` se estiver tudo certo. */
export function problemaDaPalavraManual(dados: PalavraManual): string | null {
  if (!dados.palavra.trim()) return 'Digite a palavra.';
  if (!dados.en.trim() && !dados.pt.trim()) return 'Digite a tradução em inglês ou em português.';
  return null;
}

/** Cria os dois cartões (reconhecimento e produção) de uma palavra digitada pelo usuário. */
export async function criarPalavraManual(dados: PalavraManual, agora: Date = new Date()): Promise<void> {
  const problema = problemaDaPalavraManual(dados);
  if (problema) throw new Error(problema);
  const conteudoId = `manual-${agora.getTime()}-${Math.random().toString(36).slice(2, 8)}`;
  await db.insert(cards).values(
    DIRECOES.map((direcao) => ({
      idioma: dados.idioma,
      direcao,
      frente: dados.palavra.trim(),
      versoEn: textoOuNulo(dados.en),
      versoPt: textoOuNulo(dados.pt),
      pinyin: textoOuNulo(dados.pinyin),
      exemplo: textoOuNulo(dados.exemplo),
      origem: 'manual' as const,
      conteudoId,
      due: agora,
      criadoEm: agora,
    })),
  );
}

/** Verdadeiro se a palavra já tem cartão neste idioma. */
export async function palavraJaExiste(idioma: Idioma, palavra: string): Promise<boolean> {
  const total = await db.$count(cards, and(eq(cards.idioma, idioma), eq(cards.frente, palavra.trim())));
  return total > 0;
}

