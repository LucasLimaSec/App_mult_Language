import type { DatabaseSync } from 'node:sqlite';

import { limparBanco } from '../../testes/bancoEmMemoria';
import { calcularSequencia, resumoDoDia } from '../progresso';

jest.mock('../client', () => require('../../testes/bancoEmMemoria').criarBancoEmMemoria());
const { sqlite } = jest.requireMock('../client') as { sqlite: DatabaseSync };

describe('calcularSequencia', () => {
  it('conta os dias seguidos até hoje', () => {
    expect(calcularSequencia(['2026-11-15', '2026-11-16', '2026-11-17'], '2026-11-17')).toBe(3);
  });
  it('mantém a sequência de ontem enquanto hoje não teve estudo', () => {
    expect(calcularSequencia(['2026-11-15', '2026-11-16'], '2026-11-17')).toBe(2);
  });
  it('zera quando um dia ficou sem estudo', () => {
    expect(calcularSequencia(['2026-11-14', '2026-11-15'], '2026-11-17')).toBe(0);
    expect(calcularSequencia(['2026-11-13', '2026-11-15', '2026-11-16', '2026-11-17'], '2026-11-17')).toBe(3);
  });
  it('atravessa a virada de mês e de ano', () => {
    expect(calcularSequencia(['2026-12-31', '2027-01-01'], '2027-01-01')).toBe(2);
    expect(calcularSequencia(['2026-10-31', '2026-11-01'], '2026-11-01')).toBe(2);
  });
  it('sem nenhum estudo, sequência zero', () => {
    expect(calcularSequencia([], '2026-11-17')).toBe(0);
  });
});

describe('resumoDoDia', () => {
  const AGORA = new Date(2026, 10, 17, 20, 0, 0);
  const seg = (d: Date) => Math.floor(d.getTime() / 1000);

  function sessao(dia: string, duracaoSeg: number) {
    sqlite
      .prepare("INSERT INTO sessions (dia, tipo, idioma, duracao_seg, itens, iniciada_em) VALUES (?, 'flashcards', 'es', ?, 5, 0)")
      .run(dia, duracaoSeg);
  }

  beforeEach(() => limparBanco(sqlite));

  it('soma os minutos de hoje e conta a sequência', async () => {
    sessao('2026-11-16', 600);
    sessao('2026-11-17', 300);
    sessao('2026-11-17', 330);
    expect(await resumoDoDia(AGORA)).toEqual({ sequencia: 2, minutosHoje: 11, estudouHoje: true, licoesHoje: 0 });
  });

  it('conta só as lições concluídas hoje', async () => {
    const inserir = sqlite.prepare("INSERT INTO lessons (id, idioma, status, concluida_em) VALUES (?, 'es', ?, ?)");
    inserir.run('es-u01-l01', 'concluida', seg(new Date(2026, 10, 17, 9, 0, 0)));
    inserir.run('es-u01-l02', 'concluida', seg(new Date(2026, 10, 16, 9, 0, 0)));
    inserir.run('es-u01-l03', 'em_andamento', null);
    expect((await resumoDoDia(AGORA)).licoesHoje).toBe(1);
  });

  it('banco vazio', async () => {
    expect(await resumoDoDia(AGORA)).toEqual({ sequencia: 0, minutosHoje: 0, estudouHoje: false, licoesHoje: 0 });
  });
});
