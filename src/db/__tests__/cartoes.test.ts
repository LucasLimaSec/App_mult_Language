import type { DatabaseSync } from 'node:sqlite';

import { limparBanco } from '../../testes/bancoEmMemoria';
import { carregarFila, gravarNovosPorDia, problemaDaPalavraManual, resumoDoIdioma } from '../cartoes';

// Banco em memória com as migrations reais, para as consultas da fila rodarem de verdade.
jest.mock('../client', () => require('../../testes/bancoEmMemoria').criarBancoEmMemoria());

const { sqlite } = jest.requireMock('../client') as { sqlite: DatabaseSync };

const AGORA = new Date(2026, 10, 16, 15, 0, 0);
const HOJE_CEDO = new Date(2026, 10, 16, 8, 0, 0);
const ONTEM = new Date(2026, 10, 15, 15, 0, 0);
const AMANHA = new Date(2026, 10, 17, 15, 0, 0);
const seg = (data: Date) => Math.floor(data.getTime() / 1000);

type Opcoes = {
  idioma?: string;
  direcao?: 'reconhecimento' | 'producao';
  state?: number;
  due?: Date;
  lastReview?: Date | null;
  suspenso?: boolean;
};

function inserir(conteudoId: string, opcoes: Opcoes = {}): number {
  const resultado = sqlite
    .prepare(
      `INSERT INTO cards (idioma, frente, direcao, verso_en, origem, conteudo_id, due, state, last_review, suspenso, criado_em)
       VALUES (?, ?, ?, 'x', 'deck', ?, ?, ?, ?, ?, 0)`,
    )
    .run(
      opcoes.idioma ?? 'es',
      conteudoId,
      opcoes.direcao ?? 'reconhecimento',
      conteudoId,
      seg(opcoes.due ?? ONTEM),
      opcoes.state ?? 0,
      opcoes.lastReview ? seg(opcoes.lastReview) : null,
      opcoes.suspenso ? 1 : 0,
    );
  return Number(resultado.lastInsertRowid);
}

/** Uma palavra completa: cartão de reconhecimento e cartão de produção. */
function inserirPalavra(conteudoId: string, reconhecimento: Opcoes = {}, producao: Opcoes = {}) {
  return {
    reconhecimento: inserir(conteudoId, { ...reconhecimento, direcao: 'reconhecimento' }),
    producao: inserir(conteudoId, { ...producao, direcao: 'producao' }),
  };
}

function registrarPrimeiraRevisao(cardId: number, quando: Date) {
  sqlite
    .prepare(
      `INSERT INTO reviews (card_id, rating, state, due, stability, difficulty, scheduled_days, revisado_em)
       VALUES (?, 3, 0, 0, 0, 0, 0, ?)`,
    )
    .run(cardId, seg(quando));
}

beforeEach(() => limparBanco(sqlite));

const idsDaFila = async () => (await carregarFila('es', AGORA)).map((card) => card.id);

describe('carregarFila', () => {
  it('apresenta só o cartão de reconhecimento de uma palavra nova', async () => {
    const casa = inserirPalavra('casa');
    expect(await idsDaFila()).toEqual([casa.reconhecimento]);
  });

  it('respeita o limite diário de cartões novos, na ordem do deck', async () => {
    const ids = ['a', 'b', 'c', 'd'].map((p) => inserirPalavra(p).reconhecimento);
    await gravarNovosPorDia('es', 3);
    expect(await idsDaFila()).toEqual(ids.slice(0, 3));
  });

  it('usa 6 novos por dia quando nada foi configurado', async () => {
    for (let i = 0; i < 9; i++) inserirPalavra(`p${i}`);
    expect(await idsDaFila()).toHaveLength(6);
  });

  it('desconta do limite os cartões novos já vistos hoje', async () => {
    const visto = inserirPalavra('a', { state: 1, due: AMANHA, lastReview: HOJE_CEDO });
    registrarPrimeiraRevisao(visto.reconhecimento, HOJE_CEDO);
    const b = inserirPalavra('b');
    inserirPalavra('c');
    await gravarNovosPorDia('es', 2);
    expect(await idsDaFila()).toEqual([b.reconhecimento]);
  });

  it('não desconta do limite os cartões novos vistos em outro dia', async () => {
    const visto = inserirPalavra('a', { state: 2, due: AMANHA, lastReview: ONTEM }, { state: 2, due: AMANHA });
    registrarPrimeiraRevisao(visto.reconhecimento, ONTEM);
    const b = inserirPalavra('b');
    const c = inserirPalavra('c');
    await gravarNovosPorDia('es', 2);
    expect(await idsDaFila()).toEqual([b.reconhecimento, c.reconhecimento]);
  });

  it('libera o cartão de produção depois que o de reconhecimento foi aprendido num dia anterior', async () => {
    const casa = inserirPalavra('casa', { state: 2, due: AMANHA, lastReview: ONTEM });
    expect(await idsDaFila()).toEqual([casa.producao]);
  });

  it('segura o cartão de produção se o de reconhecimento foi aprendido hoje', async () => {
    inserirPalavra('casa', { state: 2, due: AMANHA, lastReview: HOJE_CEDO });
    expect(await idsDaFila()).toEqual([]);
  });

  it('segura o cartão de produção enquanto o de reconhecimento ainda está em aprendizado', async () => {
    inserirPalavra('casa', { state: 1, due: AMANHA, lastReview: ONTEM });
    expect(await idsDaFila()).toEqual([]);
  });

  it('traz as revisões vencidas antes dos novos e ignora as que vencem depois', async () => {
    const novo = inserirPalavra('novo');
    const vencido = inserirPalavra('vencido', { state: 2, due: ONTEM, lastReview: HOJE_CEDO }, { state: 2, due: AMANHA });
    inserirPalavra('futuro', { state: 2, due: AMANHA, lastReview: HOJE_CEDO }, { state: 2, due: AMANHA });
    expect(await idsDaFila()).toEqual([vencido.reconhecimento, novo.reconhecimento]);
  });

  it('não põe as duas direções da mesma palavra na mesma sessão', async () => {
    const casa = inserirPalavra(
      'casa',
      { state: 2, due: ONTEM, lastReview: ONTEM },
      { state: 2, due: HOJE_CEDO, lastReview: ONTEM },
    );
    expect(await idsDaFila()).toEqual([casa.reconhecimento]);
  });

  it('deixa de fora cartões suspensos e de outros idiomas', async () => {
    inserirPalavra('suspenso', { suspenso: true }, { suspenso: true });
    inserirPalavra('chines', { idioma: 'zh' }, { idioma: 'zh' });
    inserirPalavra('vencido-zh', { idioma: 'zh', state: 2, due: ONTEM }, { idioma: 'zh', state: 2, due: AMANHA });
    expect(await idsDaFila()).toEqual([]);
  });
});

describe('resumoDoIdioma', () => {
  it('conta vencidos, novos de hoje, palavras e aprendidas', async () => {
    inserirPalavra('aprendida', { state: 2, due: ONTEM, lastReview: ONTEM }, { state: 2, due: AMANHA });
    inserirPalavra('aprendendo', { state: 1, due: ONTEM, lastReview: ONTEM });
    for (let i = 0; i < 4; i++) inserirPalavra(`nova${i}`);
    inserirPalavra('zh', { idioma: 'zh' }, { idioma: 'zh' });
    await gravarNovosPorDia('es', 3);

    expect(await resumoDoIdioma('es', AGORA)).toEqual({
      vencidos: 2,
      novosHoje: 3,
      palavras: 6,
      aprendidas: 1,
    });
    expect(await resumoDoIdioma('zh', AGORA)).toEqual({
      vencidos: 0,
      novosHoje: 1,
      palavras: 1,
      aprendidas: 0,
    });
  });

  it('mostra só os novos que existem quando o limite é maior que o deck', async () => {
    inserirPalavra('unica');
    expect((await resumoDoIdioma('es', AGORA)).novosHoje).toBe(1);
  });
});

describe('gravarNovosPorDia', () => {
  it('limita o valor entre 0 e 50', async () => {
    for (let i = 0; i < 3; i++) inserirPalavra(`p${i}`);
    await gravarNovosPorDia('es', -4);
    expect(await idsDaFila()).toEqual([]);
    await gravarNovosPorDia('es', 999);
    expect(await idsDaFila()).toHaveLength(3);
  });
});

describe('problemaDaPalavraManual', () => {
  const base = { idioma: 'es' as const, palavra: 'perro', en: 'dog', pt: 'cachorro' };
  it('aceita a palavra com pelo menos uma tradução', () => {
    expect(problemaDaPalavraManual(base)).toBeNull();
    expect(problemaDaPalavraManual({ ...base, en: '' })).toBeNull();
    expect(problemaDaPalavraManual({ ...base, pt: ' ' })).toBeNull();
  });
  it('recusa palavra vazia ou sem nenhuma tradução', () => {
    expect(problemaDaPalavraManual({ ...base, palavra: '  ' })).toMatch(/palavra/);
    expect(problemaDaPalavraManual({ ...base, en: '', pt: '' })).toMatch(/tradução/);
  });
});
