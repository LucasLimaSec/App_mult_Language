import { Text, View } from 'react-native';

import { BotaoAudio } from '@/components/cartoes/BotaoAudio';
import { PinyinColorido } from '@/components/cartoes/PalavraChinesa';
import type { Idioma } from '@/voz/idiomas';

type Props = {
  frase: string;
  idioma: Idioma;
  pinyin?: string;
  en: string;
  pt: string;
};

/** Frase no idioma estudado, com áudio, pinyin colorido (chinês) e as duas traduções. */
export function LinhaExemplo({ frase, idioma, pinyin, en, pt }: Props) {
  return (
    <View className="flex-row items-center gap-3 rounded-2xl bg-superficie-2 p-3.5">
      <View className="flex-1 gap-1">
        <Text className={`text-texto ${idioma === 'zh' ? 'text-[26px]' : 'font-forte text-lg'}`}>{frase}</Text>
        {pinyin ? <PinyinColorido pinyin={pinyin} tamanho={16} /> : null}
        <Text className="font-corpo text-sm text-texto">{en}</Text>
        <Text className="font-semi text-sm text-texto-2">{pt}</Text>
      </View>
      <BotaoAudio texto={frase} idioma={idioma} descricao={`Ouvir: ${frase}`} tamanho={20} cor="en" />
    </View>
  );
}
