import { useColorScheme } from 'react-native';
import { vars } from 'nativewind';

/**
 * Paleta do app, em modo claro e escuro. As mesmas chaves viram variáveis CSS
 * (`--fundo`, `--marca`...) lidas pelas classes do Tailwind (`bg-fundo`,
 * `text-marca`...), e também ficam disponíveis em JS por `useTema()` para o
 * que não aceita classe (ícones, SVG, barra de abas).
 */
export type Paleta = {
  fundo: string;
  superficie: string;
  superficie2: string;
  borda: string;
  texto: string;
  texto2: string;
  sobreCor: string;
  marca: string;
  marcaSombra: string;
  marcaClara: string;
  es: string;
  esSombra: string;
  esClara: string;
  zh: string;
  zhSombra: string;
  zhClara: string;
  en: string;
  enSombra: string;
  enClara: string;
  certo: string;
  certoSombra: string;
  certoClara: string;
  certoTexto: string;
  erro: string;
  erroSombra: string;
  erroClara: string;
  erroTexto: string;
  ambar: string;
  ambarSombra: string;
  ambarClara: string;
  ambarTexto: string;
  amarelo: string;
  tom1: string;
  tom2: string;
  tom3: string;
  tom4: string;
  tom5: string;
};

const CORES_FIXAS = {
  sobreCor: '#FFFFFF',
  marca: '#7C3AED',
  marcaSombra: '#5B21B6',
  es: '#EA580C',
  esSombra: '#C2410C',
  zh: '#DB2777',
  zhSombra: '#9D174D',
  en: '#0284C7',
  enSombra: '#075985',
  certo: '#16A34A',
  certoSombra: '#15803D',
  erro: '#DC2626',
  erroSombra: '#991B1B',
  ambar: '#D97706',
  ambarSombra: '#92400E',
  amarelo: '#FDE047',
};

export const PALETAS: Record<'claro' | 'escuro', Paleta> = {
  claro: {
    ...CORES_FIXAS,
    fundo: '#F7F5FF',
    superficie: '#FFFFFF',
    superficie2: '#F1EEFA',
    borda: '#E4DFF2',
    texto: '#1E1B2E',
    texto2: '#5B5675',
    marcaClara: '#EDE9FE',
    esClara: '#FFEDD5',
    zhClara: '#FCE7F3',
    enClara: '#E0F2FE',
    certoClara: '#DCFCE7',
    certoTexto: '#14532D',
    erroClara: '#FEE2E2',
    erroTexto: '#7F1D1D',
    ambarClara: '#FEF3C7',
    ambarTexto: '#78350F',
    tom1: '#DC2626',
    tom2: '#EA580C',
    tom3: '#16A34A',
    tom4: '#2563EB',
    tom5: '#6B7280',
  },
  escuro: {
    ...CORES_FIXAS,
    fundo: '#13111C',
    superficie: '#1E1A2B',
    superficie2: '#272236',
    borda: '#342D48',
    texto: '#F4F2FF',
    texto2: '#B5AFCB',
    marcaClara: '#2E2453',
    esClara: '#3D2213',
    zhClara: '#3D1630',
    enClara: '#0E2D42',
    certoClara: '#0F3020',
    certoTexto: '#BBF7D0',
    erroClara: '#3D1515',
    erroTexto: '#FECACA',
    ambarClara: '#3A2A0A',
    ambarTexto: '#FDE68A',
    tom1: '#F87171',
    tom2: '#FB923C',
    tom3: '#4ADE80',
    tom4: '#60A5FA',
    tom5: '#A1A1AA',
  },
};

/** "#7C3AED" → "124 58 237", o formato que o Tailwind usa com `<alpha-value>`. */
export function hexParaRgb(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/** Nome da variável CSS de uma cor: marcaSombra → --marca-sombra. */
export function nomeDaVariavel(chave: string): string {
  return `--${chave.replace(/[A-Z0-9]/g, (letra) => `-${letra.toLowerCase()}`)}`;
}

export function variaveisDaPaleta(paleta: Paleta): Record<string, string> {
  return Object.fromEntries(Object.entries(paleta).map(([chave, cor]) => [nomeDaVariavel(chave), hexParaRgb(cor)]));
}

const VARS = {
  claro: vars(variaveisDaPaleta(PALETAS.claro)),
  escuro: vars(variaveisDaPaleta(PALETAS.escuro)),
};

export function useModo(): 'claro' | 'escuro' {
  return useColorScheme() === 'dark' ? 'escuro' : 'claro';
}

/** Cores do tema atual, para ícones, SVG e estilos que não aceitam classe. */
export function useTema(): Paleta {
  return PALETAS[useModo()];
}

/** Estilo com as variáveis CSS do tema atual; vai na View raiz do app. */
export function useVariaveisDoTema() {
  return VARS[useModo()];
}

/** Famílias da Nunito carregadas pelo app (uma por peso). */
export const FONTES = {
  semi: 'Nunito_600SemiBold',
  corpo: 'Nunito_700Bold',
  forte: 'Nunito_800ExtraBold',
  titulo: 'Nunito_900Black',
} as const;

export type CorDeDestaque = 'marca' | 'es' | 'zh' | 'en' | 'certo' | 'erro' | 'ambar';

/** Cor, sombra e tom claro de um destaque (marca, língua ou estado). */
export function coresDoDestaque(paleta: Paleta, cor: CorDeDestaque) {
  return {
    cor: paleta[cor],
    sombra: paleta[`${cor}Sombra` as keyof Paleta],
    clara: paleta[`${cor}Clara` as keyof Paleta],
  };
}
