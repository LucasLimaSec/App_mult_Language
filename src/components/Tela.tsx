import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';

/** Fundo e rolagem padrão das telas. */
export function Tela({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      className="flex-1 bg-slate-100 dark:bg-slate-950"
      contentContainerClassName="gap-4 p-4 pb-10"
      keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}
