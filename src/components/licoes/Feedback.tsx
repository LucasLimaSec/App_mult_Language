import { Text, View } from 'react-native';

import { Botao } from '@/components/Botao';

export type TipoFeedback = 'certo' | 'quase' | 'errado';

const ESTILO: Record<TipoFeedback, { fundo: string; texto: string; titulo: string }> = {
  certo: { fundo: 'bg-green-100 dark:bg-green-900', texto: 'text-green-900 dark:text-green-100', titulo: 'Certo!' },
  quase: { fundo: 'bg-amber-100 dark:bg-amber-900', texto: 'text-amber-900 dark:text-amber-100', titulo: 'Quase!' },
  errado: { fundo: 'bg-red-100 dark:bg-red-900', texto: 'text-red-900 dark:text-red-100', titulo: 'Não foi dessa vez' },
};

type Props = {
  tipo: TipoFeedback;
  /** Linhas de detalhe: resposta certa, explicação... */
  detalhes?: (string | undefined | false)[];
  aoContinuar: () => void;
};

/** Painel exibido depois de responder um exercício. */
export function Feedback({ tipo, detalhes = [], aoContinuar }: Props) {
  const estilo = ESTILO[tipo];
  return (
    <View className={`gap-3 rounded-2xl p-4 ${estilo.fundo}`}>
      <Text className={`text-lg font-bold ${estilo.texto}`}>{estilo.titulo}</Text>
      {detalhes.filter(Boolean).map((linha, i) => (
        <Text key={i} className={`text-base leading-6 ${estilo.texto}`}>
          {linha}
        </Text>
      ))}
      <Botao titulo="Continuar" onPress={aoContinuar} />
    </View>
  );
}
