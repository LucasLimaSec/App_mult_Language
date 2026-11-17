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
    <View className="flex-row items-center gap-3 rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
      <View className="flex-1 gap-1">
        <Text className={`text-slate-900 dark:text-slate-50 ${idioma === 'zh' ? 'text-2xl' : 'text-lg'}`}>{frase}</Text>
        {pinyin ? <PinyinColorido pinyin={pinyin} tamanho={16} /> : null}
        <Text className="text-sm text-slate-700 dark:text-slate-300">{en}</Text>
        <Text className="text-sm text-slate-500 dark:text-slate-400">{pt}</Text>
      </View>
      <BotaoAudio texto={frase} idioma={idioma} descricao={`Ouvir: ${frase}`} tamanho={20} />
    </View>
  );
}
