import { criarAgendador, ESTADO, formatarIntervalo } from '../agendador';

const agendador = criarAgendador({ variacao: false });
const AGORA = new Date('2026-11-16T12:00:00Z');
const MINUTO = 60_000;
const DIA = 24 * 60 * MINUTO;

describe('agendador FSRS', () => {
  it('cria o cartão novo vencendo agora', () => {
    const estado = agendador.estadoInicial(AGORA);
    expect(estado).toMatchObject({ state: ESTADO.novo, reps: 0, lapses: 0, lastReview: null });
    expect(estado.due.getTime()).toBe(AGORA.getTime());
  });

  it('"Errei" num cartão novo traz o cartão de volta em 1 minuto', () => {
    const { estado } = agendador.responder(agendador.estadoInicial(AGORA), 1, AGORA);
    expect(estado.state).toBe(ESTADO.aprendendo);
    expect(estado.due.getTime() - AGORA.getTime()).toBe(1 * MINUTO);
  });

  it('"Bom" duas vezes forma o cartão e agenda para dias depois', () => {
    const primeira = agendador.responder(agendador.estadoInicial(AGORA), 3, AGORA);
    expect(primeira.estado.state).toBe(ESTADO.aprendendo);
    expect(primeira.estado.due.getTime() - AGORA.getTime()).toBe(10 * MINUTO);

    const segunda = agendador.responder(primeira.estado, 3, primeira.estado.due);
    expect(segunda.estado.state).toBe(ESTADO.revisao);
    expect(segunda.estado.scheduledDays).toBeGreaterThanOrEqual(1);
    expect(segunda.estado.due.getTime()).toBeGreaterThanOrEqual(primeira.estado.due.getTime() + DIA);
  });

  it('"Fácil" num cartão novo pula o aprendizado', () => {
    const { estado } = agendador.responder(agendador.estadoInicial(AGORA), 4, AGORA);
    expect(estado.state).toBe(ESTADO.revisao);
    expect(estado.scheduledDays).toBeGreaterThan(1);
  });

  it('errar um cartão em revisão conta um lapso e manda reaprender', () => {
    const formado = agendador.responder(agendador.estadoInicial(AGORA), 4, AGORA).estado;
    const { estado } = agendador.responder(formado, 1, formado.due);
    expect(estado.state).toBe(ESTADO.reaprendendo);
    expect(estado.lapses).toBe(1);
    expect(estado.due.getTime() - formado.due.getTime()).toBeLessThan(DIA);
  });

  it('acertar aumenta o intervalo da revisão seguinte', () => {
    const formado = agendador.responder(agendador.estadoInicial(AGORA), 4, AGORA).estado;
    const depois = agendador.responder(formado, 3, formado.due).estado;
    expect(depois.scheduledDays).toBeGreaterThan(formado.scheduledDays);
  });

  it('registra o estado anterior à resposta no histórico', () => {
    const novo = agendador.estadoInicial(AGORA);
    const { registro } = agendador.responder(novo, 3, AGORA);
    expect(registro).toMatchObject({ rating: 3, state: ESTADO.novo, stability: 0, revisadoEm: AGORA });
  });

  it('prevê intervalos crescentes de Errei até Fácil e iguais ao que é aplicado', () => {
    const novo = agendador.estadoInicial(AGORA);
    const previsao = agendador.preverIntervalos(novo, AGORA);
    expect(previsao[1]).toBeLessThan(previsao[2]);
    expect(previsao[2]).toBeLessThan(previsao[3]);
    expect(previsao[3]).toBeLessThan(previsao[4]);
    for (const nota of [1, 2, 3, 4] as const) {
      const aplicado = agendador.responder(novo, nota, AGORA).estado;
      expect(aplicado.due.getTime() - AGORA.getTime()).toBe(previsao[nota]);
    }
  });
});

describe('formatarIntervalo', () => {
  it('escolhe a unidade pelo tamanho', () => {
    expect(formatarIntervalo(20_000)).toBe('1 min');
    expect(formatarIntervalo(10 * MINUTO)).toBe('10 min');
    expect(formatarIntervalo(3 * 60 * MINUTO)).toBe('3 h');
    expect(formatarIntervalo(8 * DIA)).toBe('8 d');
    expect(formatarIntervalo(30 * DIA)).toBe('30 d');
    expect(formatarIntervalo(31 * DIA)).toBe('1 mês');
    expect(formatarIntervalo(95 * DIA)).toBe('3 meses');
    expect(formatarIntervalo(365 * DIA)).toBe('1 ano');
    expect(formatarIntervalo(550 * DIA)).toBe('1,5 ano');
    expect(formatarIntervalo(1100 * DIA)).toBe('3 anos');
  });
});
