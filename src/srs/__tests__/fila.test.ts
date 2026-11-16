import { chaveDoDia, inicioDoDia, montarFila, novosRestantes, voltaNaMesmaSessao } from '../fila';

const em = (iso: string) => new Date(iso);
const item = (id: number, conteudoId: string, due: string) => ({ id, conteudoId, due: em(due) });

describe('montarFila', () => {
  it('põe as revisões vencidas antes dos novos, da mais atrasada para a mais recente', () => {
    const vencidos = [item(1, 'a', '2026-11-16T10:00:00Z'), item(2, 'b', '2026-11-10T10:00:00Z')];
    const novos = [item(3, 'c', '2026-11-16T00:00:00Z'), item(4, 'd', '2026-11-16T00:00:00Z')];
    expect(montarFila(vencidos, novos).map((i) => i.id)).toEqual([2, 1, 3, 4]);
  });

  it('não põe os dois cartões da mesma palavra na mesma sessão', () => {
    const vencidos = [item(1, 'casa', '2026-11-15T10:00:00Z'), item(2, 'casa', '2026-11-16T10:00:00Z')];
    const novos = [item(3, 'casa', '2026-11-16T00:00:00Z'), item(4, 'perro', '2026-11-16T00:00:00Z')];
    expect(montarFila(vencidos, novos).map((i) => i.id)).toEqual([1, 4]);
  });

  it('devolve fila vazia quando não há nada para estudar', () => {
    expect(montarFila([], [])).toEqual([]);
  });

  it('não altera as listas recebidas', () => {
    const vencidos = [item(1, 'a', '2026-11-16T10:00:00Z'), item(2, 'b', '2026-11-10T10:00:00Z')];
    montarFila(vencidos, []);
    expect(vencidos.map((i) => i.id)).toEqual([1, 2]);
  });
});

describe('voltaNaMesmaSessao', () => {
  const agora = em('2026-11-16T12:00:00Z');
  it('traz de volta cartões que vencem em minutos', () => {
    expect(voltaNaMesmaSessao(em('2026-11-16T12:01:00Z'), agora)).toBe(true);
    expect(voltaNaMesmaSessao(em('2026-11-16T12:20:00Z'), agora)).toBe(true);
  });
  it('deixa para outro dia os que vencem mais tarde', () => {
    expect(voltaNaMesmaSessao(em('2026-11-16T12:21:00Z'), agora)).toBe(false);
    expect(voltaNaMesmaSessao(em('2026-11-18T12:00:00Z'), agora)).toBe(false);
  });
});

describe('novosRestantes', () => {
  it('desconta os cartões já introduzidos hoje', () => {
    expect(novosRestantes(6, 0)).toBe(6);
    expect(novosRestantes(6, 4)).toBe(2);
  });
  it('nunca fica negativo, mesmo se o limite for reduzido no meio do dia', () => {
    expect(novosRestantes(6, 6)).toBe(0);
    expect(novosRestantes(3, 5)).toBe(0);
    expect(novosRestantes(0, 0)).toBe(0);
  });
});

describe('datas do dia', () => {
  it('usa o dia local', () => {
    const tarde = new Date(2026, 10, 16, 23, 59, 30);
    expect(chaveDoDia(tarde)).toBe('2026-11-16');
    expect(inicioDoDia(tarde)).toEqual(new Date(2026, 10, 16, 0, 0, 0));
    expect(chaveDoDia(new Date(2026, 0, 5, 0, 0, 1))).toBe('2026-01-05');
  });
});
