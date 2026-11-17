import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { Botao } from '@/components/Botao';
import { useTema } from '@/ui/tema';

export type TipoFeedback = 'certo' | 'quase' | 'errado';

const TITULO: Record<TipoFeedback, string> = { certo: 'Mandou bem!', quase: 'Quase!', errado: 'Não foi dessa vez' };
const ICONE = { certo: 'checkmark', quase: 'alert', errado: 'close' } as const;
const COR = { certo: 'certo', quase: 'ambar', errado: 'erro' } as const;

type Props = {
  tipo: TipoFeedback;
  /** Linhas de detalhe: resposta certa, explicação... */
  detalhes?: (string | undefined | false)[];
  aoContinuar: () => void;
};

/** Painel colorido exibido depois de responder um exercício. */
export function Feedback({ tipo, detalhes = [], aoContinuar }: Props) {
  const tema = useTema();
  const cor = COR[tipo];
  return (
    <View style={{ backgroundColor: tema[`${cor}Clara`] }} className="gap-3 rounded-3xl p-4">
      <View className="flex-row items-center gap-3">
        <View style={{ backgroundColor: tema[cor] }} className="h-11 w-11 items-center justify-center rounded-full">
          <Ionicons name={ICONE[tipo]} size={26} color="#FFFFFF" />
        </View>
        <Text style={{ color: tema[`${cor}Texto`] }} className="font-titulo text-2xl">
          {TITULO[tipo]}
        </Text>
      </View>
      {detalhes.filter(Boolean).map((linha, i) => (
        <Text key={i} style={{ color: tema[`${cor}Texto`] }} className="font-corpo text-base leading-6">
          {linha}
        </Text>
      ))}
      <Botao titulo="Continuar" cor={cor} onPress={aoContinuar} />
    </View>
  );
}
