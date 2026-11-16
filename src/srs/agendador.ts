import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  type Card as CardFsrs,
  type FSRS,
  type Grade,
} from 'ts-fsrs';

/** Estado de agendamento de um cartão, como fica guardado na tabela cards. */
export type EstadoSrs = {
  due: Date;
  stability: number;
  difficulty: number;
  scheduledDays: number;
  learningSteps: number;
  reps: number;
  lapses: number;
  /** 0 novo, 1 aprendendo, 2 revisão, 3 reaprendendo. */
  state: number;
  lastReview: Date | null;
};

export const ESTADO = { novo: 0, aprendendo: 1, revisao: 2, reaprendendo: 3 } as const;

/** 1 Errei, 2 Difícil, 3 Bom, 4 Fácil. */
export type Resposta = 1 | 2 | 3 | 4;

export const RESPOSTAS: { nota: Resposta; rotulo: string }[] = [
  { nota: 1, rotulo: 'Errei' },
  { nota: 2, rotulo: 'Difícil' },
  { nota: 3, rotulo: 'Bom' },
  { nota: 4, rotulo: 'Fácil' },
];

/** Linha do histórico: o estado do cartão antes da resposta. */
export type RegistroResposta = {
  rating: Resposta;
  state: number;
  due: Date;
  stability: number;
  difficulty: number;
  scheduledDays: number;
  learningSteps: number;
  revisadoEm: Date;
};

export type Agendador = {
  estadoInicial(agora: Date): EstadoSrs;
  responder(
    estado: EstadoSrs,
    resposta: Resposta,
    agora: Date,
  ): { estado: EstadoSrs; registro: RegistroResposta };
  /** Quanto falta, em milissegundos, até a próxima revisão para cada resposta. */
  preverIntervalos(estado: EstadoSrs, agora: Date): Record<Resposta, number>;
};

function paraFsrs(estado: EstadoSrs): CardFsrs {
  return {
    due: estado.due,
    stability: estado.stability,
    difficulty: estado.difficulty,
    scheduled_days: estado.scheduledDays,
    learning_steps: estado.learningSteps,
    reps: estado.reps,
    lapses: estado.lapses,
    state: estado.state,
    last_review: estado.lastReview ?? undefined,
  } as CardFsrs;
}

function deFsrs(card: CardFsrs): EstadoSrs {
  return {
    due: new Date(card.due),
    stability: card.stability,
    difficulty: card.difficulty,
    scheduledDays: card.scheduled_days,
    learningSteps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    lastReview: card.last_review ? new Date(card.last_review) : null,
  };
}

/**
 * Cria um agendador FSRS com retenção desejada de 90%.
 * `variacao` espalha um pouco os intervalos longos, para os cartões não
 * vencerem todos no mesmo dia; os testes desligam para ter datas exatas.
 */
export function criarAgendador({ variacao = true }: { variacao?: boolean } = {}): Agendador {
  const motor: FSRS = fsrs(generatorParameters({ request_retention: 0.9, enable_fuzz: variacao }));

  return {
    estadoInicial(agora) {
      return deFsrs(createEmptyCard(agora));
    },

    responder(estado, resposta, agora) {
      const { card, log } = motor.next(paraFsrs(estado), agora, resposta as Grade);
      return {
        estado: deFsrs(card),
        registro: {
          rating: resposta,
          state: log.state,
          due: new Date(log.due),
          stability: log.stability,
          difficulty: log.difficulty,
          scheduledDays: log.scheduled_days,
          learningSteps: log.learning_steps,
          revisadoEm: agora,
        },
      };
    },

    preverIntervalos(estado, agora) {
      const previsao = motor.repeat(paraFsrs(estado), agora);
      const falta = (nota: Resposta) => new Date(previsao[nota as Grade].card.due).getTime() - agora.getTime();
      return { 1: falta(1), 2: falta(2), 3: falta(3), 4: falta(4) };
    },
  };
}

/** Agendador usado pelo app. */
export const agendador = criarAgendador();

const MINUTO = 60_000;
const HORA = 60 * MINUTO;
const DIA = 24 * HORA;

/** "1 min", "10 min", "3 h", "8 d", "2 meses", "1,5 ano". */
export function formatarIntervalo(ms: number): string {
  if (ms < HORA) return `${Math.max(1, Math.round(ms / MINUTO))} min`;
  if (ms < DIA) return `${Math.round(ms / HORA)} h`;
  const dias = Math.round(ms / DIA);
  if (dias < 31) return `${dias} d`;
  if (dias < 365) {
    const meses = Math.round(dias / 30);
    return meses === 1 ? '1 mês' : `${meses} meses`;
  }
  const anos = Math.round((dias / 365) * 10) / 10;
  return `${String(anos).replace('.', ',')} ${anos < 2 ? 'ano' : 'anos'}`;
}
