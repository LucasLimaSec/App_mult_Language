import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

type Props = {
  titulo?: string;
  subtitulo?: string;
  children?: ReactNode;
};

/** Superfície com borda e base mais grossa, no estilo dos botões. */
export function Cartao({ titulo, subtitulo, children }: Props) {
  return (
    <View className="gap-3 rounded-3xl border-2 border-b-[5px] border-borda bg-superficie p-4">
      {titulo ? (
        <View className="gap-0.5">
          <Text className="font-titulo text-xl text-texto">{titulo}</Text>
          {subtitulo ? <Text className="font-semi text-sm text-texto-2">{subtitulo}</Text> : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}
