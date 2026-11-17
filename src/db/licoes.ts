import { and, eq, inArray, sql } from 'drizzle-orm';

import { chaveDoPinyin } from '../licoes/conferir';
import type { Licao } from '../conteudo/licoes';
import type { Idioma } from '../voz/idiomas';
import { registrarSessao } from './cartoes';
import { db } from './client';
import { cards, DIRECOES, lessons, type Lesson } from './schema';

/** Progresso das lições de um idioma, por id da lição. */
export async function lerProgresso(idioma: Idioma): Promise<Record<string, Lesson>> {
  const linhas = await db.select().from(lessons).where(eq(lessons.idioma, idioma));
  return Object.fromEntries(linhas.map((linha) => [linha.id, linha]));
}

export async function lerProgressoDaLicao(id: string): Promise<Lesson | undefined> {
  const [linha] = await db.select().from(lessons).where(eq(lessons.id, id)).limit(1);
  return linha;
}

/** Marca a lição como em andamento (sem desfazer uma lição já concluída). */
export async function iniciarLicao(id: string, idioma: Idioma, agora: Date = new Date()): Promise<void> {
  await db
    .insert(lessons)
    .values({ id, idioma, status: 'em_andamento', iniciadaEm: agora })
    .onConflictDoUpdate({
      target: lessons.id,
      set: {
        status: sql`case when ${lessons.status} = 'concluida' then 'concluida' else 'em_andamento' end`,
        iniciadaEm: sql`coalesce(${lessons.iniciadaEm}, excluded.iniciada_em)`,
      },
    });
}

/** Grava ou apaga a dúvida da lição. Com `nota` nula, a dúvida é removida. */
export async function marcarDuvida(id: string, idioma: Idioma, nota: string | null): Promise<void> {
  const duvida = nota !== null;
  const texto = nota?.trim() || null;
  await db
    .insert(lessons)
    .values({ id, idioma, duvida, notaDuvida: texto })
    .onConflictDoUpdate({ target: lessons.id, set: { duvida, notaDuvida: texto } });
}

/** Lições marcadas com dúvida, de todos os idiomas. */
export function listarDuvidas(): Promise<Lesson[]> {
  return db.select().from(lessons).where(eq(lessons.duvida, true));
}

function mesmaPalavra(idioma: Idioma, a: { frente: string; pinyin: string | null }, palavra: string, pinyin?: string) {
  if (a.frente.trim().toLowerCase() !== palavra.trim().toLowerCase()) return false;
  if (idioma !== 'zh' || !a.pinyin || !pinyin) return true;
  // No chinês, a mesma grafia com outra leitura (还 hái / huán) é outra palavra.
  return chaveDoPinyin(a.pinyin).letras === chaveDoPinyin(pinyin).letras;
}

/**
 * Cria os flashcards das palavras novas da lição (reconhecimento e produção).
 * Palavras que já têm cartão, do deck ou de outra lição, ficam de fora.
 * Devolve quantas palavras entraram.
 */
export async function adicionarPalavrasDaLicao(licao: Licao, idioma: Idioma, agora: Date = new Date()): Promise<number> {
  if (licao.palavras.length === 0) return 0;
  const existentes = await db
    .select({ frente: cards.frente, pinyin: cards.pinyin, conteudoId: cards.conteudoId })
    .from(cards)
    .where(
      and(
        eq(cards.idioma, idioma),
        inArray(
          sql`lower(${cards.frente})`,
          licao.palavras.map((p) => p.palavra.trim().toLowerCase()),
        ),
      ),
    );

  const novas = licao.palavras
    .map((palavra, indice) => ({ palavra, conteudoId: `${licao.id}-p${String(indice + 1).padStart(2, '0')}` }))
    .filter(
      ({ palavra, conteudoId }) =>
        !existentes.some((e) => e.conteudoId === conteudoId || mesmaPalavra(idioma, e, palavra.palavra, palavra.pinyin)),
    );
  if (novas.length === 0) return 0;

  await db
    .insert(cards)
    .values(
      novas.flatMap(({ palavra, conteudoId }) =>
        DIRECOES.map((direcao) => ({
          idioma,
          direcao,
          frente: palavra.palavra,
          versoEn: palavra.en,
          versoPt: palavra.pt,
          classe: palavra.classe ?? null,
          pinyin: palavra.pinyin ?? null,
          exemplo: palavra.exemplo ?? null,
          exemploEn: palavra.exemploEn ?? null,
          exemploPt: palavra.exemploPt ?? null,
          nota: palavra.nota ?? null,
          origem: 'licao' as const,
          conteudoId,
          licaoId: licao.id,
          due: agora,
          criadoEm: agora,
        })),
      ),
    )
    .onConflictDoNothing();
  return novas.length;
}

export type ResultadoLicao = { palavrasNovas: number };

/**
 * Conclui a lição: guarda o placar (a melhor tentativa fica), cria os
 * flashcards das palavras novas e registra o tempo de estudo.
 */
export async function concluirLicao(
  licao: Licao,
  idioma: Idioma,
  acertos: number,
  total: number,
  iniciadaEm: Date,
  agora: Date = new Date(),
): Promise<ResultadoLicao> {
  const anterior = await lerProgressoDaLicao(licao.id);
  const melhor = !anterior || anterior.status !== 'concluida' || acertos * Math.max(anterior.totalExercicios, 1) >= anterior.acertos * Math.max(total, 1);
  await db
    .insert(lessons)
    .values({ id: licao.id, idioma, status: 'concluida', acertos, totalExercicios: total, iniciadaEm, concluidaEm: agora })
    .onConflictDoUpdate({
      target: lessons.id,
      set: {
        status: 'concluida',
        concluidaEm: agora,
        ...(melhor ? { acertos, totalExercicios: total } : {}),
      },
    });
  const palavrasNovas = await adicionarPalavrasDaLicao(licao, idioma, agora);
  await registrarSessao(idioma, iniciadaEm, agora, licao.exercicios.length, 'licao');
  return { palavrasNovas };
}
