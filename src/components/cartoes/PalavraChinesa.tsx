import { Text, View } from 'react-native';

import { caracteresHan, separarSilabas, tomDaSilaba, type Tom } from '@/chines/pinyin';
import { FONTES, useTema, type Paleta } from '@/ui/tema';

type Props = {
  palavra: string;
  pinyin?: string | null;
  /** Esconde o pinyin na frente do cartão de reconhecimento. */
  mostrarPinyin: boolean;
  /** Tamanho do caractere em pontos. */
  tamanho?: number;
};

function corDoTom(tema: Paleta, tom: Tom): string {
  return tema[`tom${tom}` as keyof Paleta];
}

/** Pinyin colorido por tom, sílaba a sílaba. */
export function PinyinColorido({ pinyin, tamanho = 20 }: { pinyin: string; tamanho?: number }) {
  const tema = useTema();
  return (
    <Text style={{ fontSize: tamanho, fontFamily: FONTES.titulo }}>
      {separarSilabas(pinyin).map((silaba, indice) => (
        <Text key={indice} style={{ color: corDoTom(tema, tomDaSilaba(silaba)) }}>
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
export function PalavraChinesa({ palavra, pinyin, mostrarPinyin, tamanho = 64 }: Props) {
  const tema = useTema();
  const caracteres = caracteresHan(palavra);
  const silabas = pinyin ? separarSilabas(pinyin) : [];
  const alinhado = caracteres.length > 0 && caracteres.length === silabas.length && caracteres.length === [...palavra].length;

  if (!alinhado) {
    return (
      <View className="items-center gap-1">
        {mostrarPinyin && pinyin ? <PinyinColorido pinyin={pinyin} tamanho={tamanho * 0.36} /> : null}
        <Text style={{ fontSize: tamanho, color: tema.texto }}>{palavra}</Text>
      </View>
    );
  }

  return (
    <View className="flex-row flex-wrap justify-center gap-1.5">
      {caracteres.map((caractere, indice) => (
        <View key={indice} className="items-center">
          <Text
            style={{
              fontSize: tamanho * 0.36,
              fontFamily: FONTES.titulo,
              color: corDoTom(tema, tomDaSilaba(silabas[indice])),
              opacity: mostrarPinyin ? 1 : 0,
            }}>
            {silabas[indice]}
          </Text>
          <Text style={{ fontSize: tamanho, lineHeight: tamanho * 1.15, color: tema.texto }}>{caractere}</Text>
        </View>
      ))}
    </View>
  );
}
