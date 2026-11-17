import { BotaoIcone } from '@/components/Botao';
import type { CorDeDestaque } from '@/ui/tema';
import { falar } from '@/voz/fala';
import type { Idioma } from '@/voz/idiomas';

type Props = {
  texto: string;
  idioma: Idioma;
  /** Texto lido pelo leitor de tela, por exemplo "Ouvir a palavra". */
  descricao: string;
  tamanho?: number;
  /** Cor do botão; por padrão, a cor da língua. */
  cor?: CorDeDestaque;
};

/** Botão de ouvir: a voz do sistema lê o texto no idioma do cartão. */
export function BotaoAudio({ texto, idioma, descricao, tamanho = 24, cor }: Props) {
  return (
    <BotaoIcone
      icone="volume-high"
      descricao={descricao}
      cor={cor ?? idioma}
      tamanho={Math.round(tamanho * 2.3)}
      onPress={() => void falar(texto, idioma)}
    />
  );
}
