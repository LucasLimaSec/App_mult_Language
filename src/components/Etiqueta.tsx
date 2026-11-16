import { Text, View } from 'react-native';

export type TomEtiqueta = 'ok' | 'aviso' | 'erro' | 'neutro';

const FUNDO: Record<TomEtiqueta, string> = {
  ok: 'bg-green-100 dark:bg-green-900',
  aviso: 'bg-amber-100 dark:bg-amber-900',
  erro: 'bg-red-100 dark:bg-red-900',
  neutro: 'bg-slate-200 dark:bg-slate-700',
};

const TEXTO: Record<TomEtiqueta, string> = {
  ok: 'text-green-800 dark:text-green-100',
  aviso: 'text-amber-800 dark:text-amber-100',
  erro: 'text-red-800 dark:text-red-100',
  neutro: 'text-slate-700 dark:text-slate-200',
};

export function Etiqueta({ texto, tom = 'neutro' }: { texto: string; tom?: TomEtiqueta }) {
  return (
    <View className={`self-start rounded-full px-3 py-1 ${FUNDO[tom]}`}>
      <Text className={`text-xs font-semibold ${TEXTO[tom]}`}>{texto}</Text>
    </View>
  );
}
