import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  children: ReactNode;
  /** Telas sem cabeçalho (as abas) reservam o espaço da barra de status. */
  semCabecalho?: boolean;
};

/** Fundo e rolagem padrão das telas. */
export function Tela({ children, semCabecalho = false }: Props) {
  const margens = useSafeAreaInsets();
  return (
    <ScrollView
      className="flex-1 bg-fundo"
      contentContainerStyle={{ gap: 16, padding: 20, paddingTop: semCabecalho ? margens.top + 16 : 16, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}
