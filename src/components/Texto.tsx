import type { ReactNode } from 'react';
import { Text } from 'react-native';

/** Título grande de tela ou seção. */
export function Titulo({ children }: { children: ReactNode }) {
  return <Text className="font-titulo text-2xl text-texto">{children}</Text>;
}

/** Parágrafo padrão. */
export function Paragrafo({ children }: { children: ReactNode }) {
  return <Text className="font-corpo text-base leading-6 text-texto">{children}</Text>;
}

/** Texto de apoio, menor e mais suave. */
export function Apoio({ children }: { children: ReactNode }) {
  return <Text className="font-semi text-sm leading-5 text-texto-2">{children}</Text>;
}

/** Rótulo em caixa alta, como "TOQUE NO QUE VOCÊ OUVIU". */
export function Rotulo({ children, cor = 'text-marca' }: { children: ReactNode; cor?: string }) {
  return <Text className={`font-titulo text-sm tracking-widest ${cor}`}>{children}</Text>;
}
