import { Text, View } from 'react-native';

export type TomEtiqueta = 'ok' | 'aviso' | 'erro' | 'neutro';

const FUNDO: Record<TomEtiqueta, string> = {
  ok: 'bg-certo-clara',
  aviso: 'bg-ambar-clara',
  erro: 'bg-erro-clara',
  neutro: 'bg-superficie-2',
};

const TEXTO: Record<TomEtiqueta, string> = {
  ok: 'text-certo-texto',
  aviso: 'text-ambar-texto',
  erro: 'text-erro-texto',
  neutro: 'text-texto-2',
};

export function Etiqueta({ texto, tom = 'neutro' }: { texto: string; tom?: TomEtiqueta }) {
  return (
    <View className={`self-start rounded-full px-3 py-1 ${FUNDO[tom]}`}>
      <Text className={`font-forte text-sm ${TEXTO[tom]}`}>{texto}</Text>
    </View>
  );
}
