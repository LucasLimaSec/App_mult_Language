import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { CODIGOS_IDIOMA } from '../voz/idiomas';

/** Flashcards. Guarda o conteúdo do cartão e o estado do FSRS (ts-fsrs). */
export const cards = sqliteTable(
  'cards',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    idioma: text('idioma', { enum: CODIGOS_IDIOMA }).notNull(),
    /** Palavra ou caractere. */
    frente: text('frente').notNull(),
    /** Tradução ou significado. */
    verso: text('verso').notNull(),
    /** Só no chinês. */
    pinyin: text('pinyin'),
    exemplo: text('exemplo'),
    exemploTraducao: text('exemplo_traducao'),
    origem: text('origem', { enum: ['deck', 'licao', 'manual'] }).notNull(),
    /** Id do item em /data; evita duplicar o cartão ao reimportar o conteúdo. */
    conteudoId: text('conteudo_id').unique(),
    licaoId: text('licao_id'),

    // Estado do FSRS
    due: integer('due', { mode: 'timestamp' }).notNull(),
    stability: real('stability').notNull().default(0),
    difficulty: real('difficulty').notNull().default(0),
    elapsedDays: integer('elapsed_days').notNull().default(0),
    scheduledDays: integer('scheduled_days').notNull().default(0),
    learningSteps: integer('learning_steps').notNull().default(0),
    reps: integer('reps').notNull().default(0),
    lapses: integer('lapses').notNull().default(0),
    /** 0 novo, 1 aprendendo, 2 revisão, 3 reaprendendo. */
    state: integer('state').notNull().default(0),
    lastReview: integer('last_review', { mode: 'timestamp' }),

    suspenso: integer('suspenso', { mode: 'boolean' }).notNull().default(false),
    criadoEm: integer('criado_em', { mode: 'timestamp' }).notNull(),
  },
  (t) => [index('cards_idioma_due_idx').on(t.idioma, t.due)],
);

/** Histórico de revisões: uma linha por resposta dada a um cartão. */
export const reviews = sqliteTable(
  'reviews',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    cardId: integer('card_id')
      .notNull()
      .references(() => cards.id, { onDelete: 'cascade' }),
    /** 1 Errei, 2 Difícil, 3 Bom, 4 Fácil. */
    rating: integer('rating').notNull(),
    /** Estado do cartão antes da resposta. */
    state: integer('state').notNull(),
    due: integer('due', { mode: 'timestamp' }).notNull(),
    stability: real('stability').notNull(),
    difficulty: real('difficulty').notNull(),
    elapsedDays: integer('elapsed_days').notNull(),
    scheduledDays: integer('scheduled_days').notNull(),
    duracaoMs: integer('duracao_ms'),
    revisadoEm: integer('revisado_em', { mode: 'timestamp' }).notNull(),
  },
  (t) => [index('reviews_card_idx').on(t.cardId)],
);

/** Progresso nas lições. O conteúdo da lição fica em /data, não no banco. */
export const lessons = sqliteTable('lessons', {
  /** Id da lição no JSON, por exemplo "es-u01-l02". */
  id: text('id').primaryKey(),
  idioma: text('idioma', { enum: CODIGOS_IDIOMA }).notNull(),
  status: text('status', { enum: ['nao_iniciada', 'em_andamento', 'concluida'] })
    .notNull()
    .default('nao_iniciada'),
  acertos: integer('acertos').notNull().default(0),
  totalExercicios: integer('total_exercicios').notNull().default(0),
  /** "Marcar dúvida" para conferir depois com um nativo. */
  duvida: integer('duvida', { mode: 'boolean' }).notNull().default(false),
  notaDuvida: text('nota_duvida'),
  iniciadaEm: integer('iniciada_em', { mode: 'timestamp' }),
  concluidaEm: integer('concluida_em', { mode: 'timestamp' }),
});

/** Um bloco de estudo em uma língua. O "Estudar hoje" gera vários blocos no mesmo dia. */
export const sessions = sqliteTable(
  'sessions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    /** Dia local no formato "2026-11-16", usado na sequência de dias. */
    dia: text('dia').notNull(),
    tipo: text('tipo', { enum: ['flashcards', 'licao', 'fala'] }).notNull(),
    idioma: text('idioma', { enum: CODIGOS_IDIOMA }).notNull(),
    duracaoSeg: integer('duracao_seg').notNull().default(0),
    /** Cartões revistos, exercícios feitos ou falas praticadas. */
    itens: integer('itens').notNull().default(0),
    iniciadaEm: integer('iniciada_em', { mode: 'timestamp' }).notNull(),
    terminadaEm: integer('terminada_em', { mode: 'timestamp' }),
  },
  (t) => [index('sessions_dia_idx').on(t.dia)],
);

/** Preferências em pares chave/valor; o valor é JSON. */
export const settings = sqliteTable('settings', {
  chave: text('chave').primaryKey(),
  valor: text('valor').notNull(),
});

export type Card = typeof cards.$inferSelect;
export type NovoCard = typeof cards.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type Session = typeof sessions.$inferSelect;
