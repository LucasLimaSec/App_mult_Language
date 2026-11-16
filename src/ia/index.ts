/**
 * Fronteira da IA (etapa 2).
 *
 * No MVP este módulo só declara as interfaces: não há implementação, chamada
 * de rede nem tela. O resto do app pede os serviços por `obterServicosIA()` e
 * precisa funcionar quando ela devolve `null`.
 */
import { features } from '../config/features';
import type { Idioma } from '../voz/idiomas';

export type MensagemConversa = {
  autor: 'usuario' | 'parceiro';
  texto: string;
};

export type RelatorioConversa = {
  errosDeGramatica: { original: string; corrigido: string; explicacao: string }[];
  frasesMaisNaturais: { original: string; sugestao: string }[];
  palavrasNovas: { palavra: string; significado: string }[];
};

/** Parceiro de conversa livre (Fase 6). */
export interface ParceiroDeConversa {
  responder(cenario: string, historico: MensagemConversa[]): Promise<string>;
  gerarRelatorio(historico: MensagemConversa[]): Promise<RelatorioConversa>;
}

export type CartaoGerado = {
  frente: string;
  verso: string;
  pinyin?: string;
  exemplo?: string;
  exemploTraducao?: string;
};

/** "Adicionar palavra com IA" (Fase 6). */
export interface GeradorDeCartoes {
  gerarCartao(palavra: string, idioma: Idioma): Promise<CartaoGerado>;
}

export type NotaPronuncia = {
  /** 0 a 100. */
  geral: number;
  porPalavra: { palavra: string; nota: number }[];
};

/** Nota detalhada de pronúncia (Fase 7). */
export interface AvaliadorDePronuncia {
  avaliar(uriDoAudio: string, fraseEsperada: string, idioma: Idioma): Promise<NotaPronuncia>;
}

export type ServicosIA = {
  parceiro: ParceiroDeConversa;
  cartoes: GeradorDeCartoes;
  pronuncia: AvaliadorDePronuncia;
};

/** Devolve os serviços de IA, ou `null` enquanto `iaAtiva` estiver desligado. */
export function obterServicosIA(): ServicosIA | null {
  if (!features.iaAtiva) return null;
  // A implementação entra na etapa 2 (fases 6 e 7).
  return null;
}
