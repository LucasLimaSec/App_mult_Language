import { and, eq, gte, sql } from 'drizzle-orm';

import { chaveDoDia, inicioDoDia } from '../srs/fila';
import { db } from './client';
import { lessons, sessions } from './schema';

/** Dia anterior no formato "2026-11-16". */
function diaAnterior(dia: string): string {
  const [ano, mes, d] = dia.split('-').map(Number);
  return chaveDoDia(new Date(ano, mes - 1, d - 1));
}

/**
 * Quantos dias seguidos têm estudo, contando até hoje. Se hoje ainda não teve
 * estudo, a sequência de ontem continua valendo até o dia acabar.
 */
export function calcularSequencia(diasComEstudo: readonly string[], hoje: string): number {
  const dias = new Set(diasComEstudo);
  let dia = dias.has(hoje) ? hoje : diaAnterior(hoje);
  let total = 0;
  while (dias.has(dia)) {
    total++;
    dia = diaAnterior(dia);
  }
  return total;
}

export type ResumoDoDia = {
  /** Dias seguidos com estudo. */
  sequencia: number;
  /** Minutos estudados hoje, somando todas as línguas. */
  minutosHoje: number;
  /** Se hoje já teve estudo (para acender o ícone da sequência). */
  estudouHoje: boolean;
  /** Lições concluídas hoje. */
  licoesHoje: number;
};

export async function resumoDoDia(agora: Date = new Date()): Promise<ResumoDoDia> {
  const hoje = chaveDoDia(agora);
  const dias = await db.selectDistinct({ dia: sessions.dia }).from(sessions);
  const [tempo] = await db
    .select({ segundos: sql<number>`coalesce(sum(${sessions.duracaoSeg}), 0)` })
    .from(sessions)
    .where(eq(sessions.dia, hoje));
  const licoesHoje = await db.$count(
    lessons,
    and(eq(lessons.status, 'concluida'), gte(lessons.concluidaEm, inicioDoDia(agora))),
  );
  const lista = dias.map((d) => d.dia);
  return {
    sequencia: calcularSequencia(lista, hoje),
    minutosHoje: Math.round((tempo?.segundos ?? 0) / 60),
    estudouHoje: lista.includes(hoje),
    licoesHoje,
  };
}
