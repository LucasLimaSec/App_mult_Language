import * as Speech from 'expo-speech';

import { IDIOMAS, type Idioma } from './idiomas';
import { normalizarLocale } from './locales';

export type OpcoesFala = {
  /** Velocidade; 1.0 é a normal. */
  velocidade?: number;
  aoComecar?: () => void;
  aoTerminar?: () => void;
  aoFalhar?: (erro: Error) => void;
};

/** Lê `texto` com a voz do sistema, interrompendo qualquer fala em andamento. */
export async function falar(texto: string, idioma: Idioma, opcoes: OpcoesFala = {}): Promise<void> {
  await Speech.stop();
  Speech.speak(texto, {
    language: IDIOMAS[idioma].locale,
    rate: opcoes.velocidade ?? 1.0,
    onStart: opcoes.aoComecar,
    onDone: opcoes.aoTerminar,
    onStopped: opcoes.aoTerminar,
    onError: opcoes.aoFalhar,
  });
}

export function pararFala(): Promise<void> {
  return Speech.stop();
}

export type ResumoVozes = {
  /** Vozes na variante exata usada pelo app (por exemplo es-MX). */
  naVariante: number;
  /** Vozes em qualquer variante do idioma (por exemplo es-ES, es-US). */
  noIdioma: number;
};

/** Conta as vozes do sistema disponíveis para cada idioma. */
export async function contarVozes(): Promise<Record<Idioma, ResumoVozes>> {
  const vozes = await Speech.getAvailableVoicesAsync();
  const resumo = {} as Record<Idioma, ResumoVozes>;
  for (const idioma of Object.keys(IDIOMAS) as Idioma[]) {
    const variante = normalizarLocale(IDIOMAS[idioma].locale);
    const tags = vozes.map((voz) => normalizarLocale(voz.language));
    // O Android usa "zh" ou "cmn" para o mandarim, conforme o motor de voz.
    const prefixos = idioma === 'zh' ? ['zh', 'cmn'] : [idioma];
    resumo[idioma] = {
      naVariante: tags.filter((tag) => tag === variante).length,
      noIdioma: tags.filter((tag) => prefixos.includes(tag.split('-')[0])).length,
    };
  }
  return resumo;
}
