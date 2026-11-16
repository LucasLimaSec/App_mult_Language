import { Pressable, Text } from 'react-native';

type Variante = 'primario' | 'secundario' | 'perigo';

type Props = {
  titulo: string;
  onPress: () => void;
  variante?: Variante;
  desabilitado?: boolean;
};

const FUNDO: Record<Variante, string> = {
  primario: 'bg-primaria active:opacity-80',
  secundario: 'bg-slate-200 active:opacity-80 dark:bg-slate-700',
  perigo: 'bg-red-600 active:opacity-80',
};

const TEXTO: Record<Variante, string> = {
  primario: 'text-white',
  secundario: 'text-slate-900 dark:text-slate-50',
  perigo: 'text-white',
};

export function Botao({ titulo, onPress, variante = 'primario', desabilitado = false }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: desabilitado }}
      disabled={desabilitado}
      onPress={onPress}
      className={`min-h-12 items-center justify-center rounded-xl px-4 py-3 ${FUNDO[variante]} ${
        desabilitado ? 'opacity-40' : ''
      }`}>
      <Text className={`text-base font-semibold ${TEXTO[variante]}`}>{titulo}</Text>
    </Pressable>
  );
}
