import type { ReactNode } from 'react';
import { Text } from 'react-native';

/** Parágrafo padrão. */
export function Paragrafo({ children }: { children: ReactNode }) {
  return <Text className="text-base leading-6 text-slate-700 dark:text-slate-300">{children}</Text>;
}

/** Texto de apoio, menor e mais claro. */
export function Apoio({ children }: { children: ReactNode }) {
  return <Text className="text-sm leading-5 text-slate-500 dark:text-slate-400">{children}</Text>;
}
