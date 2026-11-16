import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

type Props = {
  titulo?: string;
  subtitulo?: string;
  children?: ReactNode;
};

export function Cartao({ titulo, subtitulo, children }: Props) {
  return (
    <View className="gap-3 rounded-2xl bg-white p-4 dark:bg-slate-900">
      {titulo ? (
        <View className="gap-1">
          <Text className="text-lg font-semibold text-slate-900 dark:text-slate-50">{titulo}</Text>
          {subtitulo ? (
            <Text className="text-sm text-slate-500 dark:text-slate-400">{subtitulo}</Text>
          ) : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}
