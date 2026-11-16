import { Text, View } from 'react-native';

import { caracteresHan, COR_DO_TOM, separarSilabas, tomDaSilaba } from '@/chines/pinyin';

type Props = {
  palavra: string;
  pinyin?: string | null;
  /** Esconde o pinyin na frente do cartão de reconhecimento. */
  mostrarPinyin: boolean;
  /** Tamanho do caractere em pontos. */
  tamanho?: number;
};

/** Pinyin colorido por tom, sílaba a sílaba. */
export function PinyinColorido({ pinyin, tamanho = 20 }: { pinyin: string; tamanho?: number }) {
  return (
    <Text style={{ fontSize: tamanho }}>
      {separarSilabas(pinyin).map((silaba, indice) => (
        <Text key={indice} style={{ color: COR_DO_TOM[tomDaSilaba(silaba)] }}>
          {indice > 0 ? ' ' : ''}
          {silaba}
        </Text>
      ))}
    </Text>
  );
}

/**
 * Palavra em chinês com o pinyin em cima de cada caractere, colorido pelo tom.
 * Se o pinyin não tiver uma sílaba por caractere, ele aparece numa linha só.
 */
export function PalavraChinesa({ palavra, pinyin, mostrarPinyin, tamanho = 56 }: Props) {
  const caracteres = caracteresHan(palavra);
  const silabas = pinyin ? separarSilabas(pinyin) : [];
  const alinhado = caracteres.length > 0 && caracteres.length === silabas.length && caracteres.length === [...palavra].length;

  if (!alinhado) {
    return (
      <View className="items-center gap-1">
        {mostrarPinyin && pinyin ? <PinyinColorido pinyin={pinyin} tamanho={tamanho * 0.36} /> : null}
        <Text style={{ fontSize: tamanho }} className="text-slate-900 dark:text-slate-50">
          {palavra}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row flex-wrap justify-center gap-1">
      {caracteres.map((caractere, indice) => {
        const cor = COR_DO_TOM[tomDaSilaba(silabas[indice])];
        return (
          <View key={indice} className="items-center">
            <Text style={{ fontSize: tamanho * 0.36, color: cor, opacity: mostrarPinyin ? 1 : 0 }}>
              {silabas[indice]}
            </Text>
            <Text style={{ fontSize: tamanho }} className="text-slate-900 dark:text-slate-50">
              {caractere}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
