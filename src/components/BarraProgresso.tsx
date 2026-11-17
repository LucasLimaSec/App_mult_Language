import { View } from 'react-native';

import { coresDoDestaque, useTema, type CorDeDestaque } from '@/ui/tema';

/** Barra grossa e arredondada; `fracao` vai de 0 a 1. */
export function BarraProgresso({ fracao, cor = 'marca', altura = 16 }: { fracao: number; cor?: CorDeDestaque; altura?: number }) {
  const tema = useTema();
  const { cor: preenchimento, sombra } = coresDoDestaque(tema, cor);
  const largura = `${Math.round(Math.min(1, Math.max(0, fracao)) * 100)}%` as const;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(fracao * 100) }}
      style={{ height: altura, borderRadius: altura, backgroundColor: tema.superficie2, overflow: 'hidden' }}>
      {fracao > 0 ? (
        <View
          style={{
            width: largura,
            height: altura,
            borderRadius: altura,
            backgroundColor: preenchimento,
            borderBottomWidth: Math.round(altura / 3),
            borderBottomColor: sombra,
          }}
        />
      ) : null}
    </View>
  );
}
