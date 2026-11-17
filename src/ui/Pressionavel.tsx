import { useState } from 'react';
import { Pressable, type GestureResponderEvent, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

type Props = Omit<PressableProps, 'style'> & {
  /** Estilo em função de estar pressionado ou não. */
  style: (pressionado: boolean) => StyleProp<ViewStyle>;
};

/**
 * Pressable que guarda o estado "pressionado" e entrega um estilo comum.
 * O NativeWind ignora `style` em forma de função no Pressable, então os botões
 * que "afundam" ao toque usam este componente.
 */
export function Pressionavel({ style, onPressIn, onPressOut, ...resto }: Props) {
  const [pressionado, setPressionado] = useState(false);
  return (
    <Pressable
      {...resto}
      onPressIn={(evento: GestureResponderEvent) => {
        setPressionado(true);
        onPressIn?.(evento);
      }}
      onPressOut={(evento: GestureResponderEvent) => {
        setPressionado(false);
        onPressOut?.(evento);
      }}
      style={style(pressionado)}
    />
  );
}
