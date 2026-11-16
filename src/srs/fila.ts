/** O mínimo que a fila precisa saber de um cartão. */
export type ItemFila = {
  id: number;
  /** Id da palavra; os dois cartões (reconhecimento e produção) têm o mesmo. */
  conteudoId: string;
  due: Date;
};

/**
 * Monta a fila de uma sessão: primeiro as revisões vencidas, da mais atrasada
 * para a mais recente, depois os cartões novos na ordem do deck.
 *
 * Os dois cartões da mesma palavra nunca entram na mesma sessão: fica o
 * primeiro e o outro espera a próxima (ele continua vencido no banco).
 */
export function montarFila<T extends ItemFila>(vencidos: readonly T[], novos: readonly T[]): T[] {
  const ordenados = [...vencidos].sort((a, b) => a.due.getTime() - b.due.getTime());
  const palavras = new Set<string>();
  const fila: T[] = [];
  for (const item of [...ordenados, ...novos]) {
    if (palavras.has(item.conteudoId)) continue;
    palavras.add(item.conteudoId);
    fila.push(item);
  }
  return fila;
}

/** Cartões em aprendizado vencem em minutos; estes voltam na mesma sessão. */
export const JANELA_MESMA_SESSAO_MS = 20 * 60_000;

export function voltaNaMesmaSessao(proximoDue: Date, agora: Date): boolean {
  return proximoDue.getTime() - agora.getTime() <= JANELA_MESMA_SESSAO_MS;
}

/** Quantos cartões novos ainda cabem hoje, dado o limite diário e os já introduzidos. */
export function novosRestantes(limiteDiario: number, introduzidosHoje: number): number {
  return Math.max(0, Math.floor(limiteDiario) - introduzidosHoje);
}

/** Meia-noite local do dia de `agora`. */
export function inicioDoDia(agora: Date): Date {
  return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
}

/** Dia local no formato "2026-11-16", usado na tabela sessions. */
export function chaveDoDia(agora: Date): string {
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${agora.getFullYear()}-${mes}-${dia}`;
}
