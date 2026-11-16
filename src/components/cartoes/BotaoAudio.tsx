import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

import { falar } from '@/voz/fala';
import type { Idioma } from '@/voz/idiomas';

type Props = {
  texto: string;
  idioma: Idioma;
  /** Texto lido pelo leitor de tela, por exemplo "Ouvir a palavra". */
  descricao: string;
  tamanho?: number;
};

/** Botão de ouvir: a voz do sistema lê o texto no idioma do cartão. */
export function BotaoAudio({ texto, idioma, descricao, tamanho = 24 }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={descricao}
      hitSlop={10}
      onPress={() => void falar(texto, idioma)}
      className="h-11 w-11 items-center justify-center rounded-full bg-blue-100 active:opacity-70 dark:bg-slate-700">
      <Ionicons name="volume-high" size={tamanho} color="#208AEF" />
    </Pressable>
  );
}
