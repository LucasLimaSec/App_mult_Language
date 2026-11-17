import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BarraProgresso } from '@/components/BarraProgresso';
import { useTema, type CorDeDestaque } from '@/ui/tema';

type Props = {
  fracao: number;
  texto: string;
  cor: CorDeDestaque;
  aoFechar: () => void;
};

/** Topo das sessões de estudo: fechar, barra de progresso e contador. */
export function BarraDaSessao({ fracao, texto, cor, aoFechar }: Props) {
  const tema = useTema();
  const margens = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: margens.top + 12 }} className="flex-row items-center gap-3.5 bg-fundo px-5 pb-2">
      <Pressable accessibilityRole="button" accessibilityLabel="Sair" hitSlop={12} onPress={aoFechar}>
        <Ionicons name="close" size={30} color={tema.texto2} />
      </Pressable>
      <View className="flex-1">
        <BarraProgresso fracao={fracao} cor={cor} altura={18} />
      </View>
      <Text className="font-titulo text-base text-texto-2">{texto}</Text>
    </View>
  );
}
