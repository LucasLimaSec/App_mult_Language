import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { G, Line, Path } from 'react-native-svg';

import { buscarTracos } from '@/chines/dicionario';
import { caracteresHan } from '@/chines/pinyin';
import { useTema } from '@/ui/tema';

const INTERVALO_MS = 550;

/** Um caractere desenhado traço a traço, na ordem de escrita. */
function Caractere({ caractere, tamanho }: { caractere: string; tamanho: number }) {
  const tema = useTema();
  const [tracos, setTracos] = useState<string[] | null | undefined>(undefined);
  const [visiveis, setVisiveis] = useState(0);

  useEffect(() => {
    let ativo = true;
    setTracos(undefined);
    setVisiveis(0);
    buscarTracos(caractere)
      .then((dados) => ativo && setTracos(dados))
      .catch(() => ativo && setTracos(null));
    return () => {
      ativo = false;
    };
  }, [caractere]);

  const total = tracos?.length ?? 0;
  useEffect(() => {
    if (visiveis >= total) return;
    const temporizador = setTimeout(() => setVisiveis((n) => n + 1), INTERVALO_MS);
    return () => clearTimeout(temporizador);
  }, [visiveis, total]);

  if (tracos === undefined) {
    return <View style={{ width: tamanho, height: tamanho }} />;
  }
  if (tracos === null) {
    return (
      <View style={{ width: tamanho, height: tamanho }} className="items-center justify-center">
        <Text className="text-center font-semi text-sm text-texto-2">
          Sem dados de traços para {caractere}
        </Text>
      </View>
    );
  }

  return (
    <View className="items-center gap-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Repetir a ordem dos traços de ${caractere}`}
        onPress={() => setVisiveis(0)}
        className="rounded-2xl border-2 border-b-[5px] border-borda bg-superficie">
        <Svg width={tamanho} height={tamanho} viewBox="0 0 1024 1024">
          <Line x1="512" y1="0" x2="512" y2="1024" stroke={tema.borda} strokeWidth="4" strokeDasharray="16 16" />
          <Line x1="0" y1="512" x2="1024" y2="512" stroke={tema.borda} strokeWidth="4" strokeDasharray="16 16" />
          {/* Os dados do hanzi-writer usam o eixo Y invertido, com a base em 900. */}
          <G transform="scale(1, -1) translate(0, -900)">
            {tracos.map((caminho, indice) => (
              <Path
                key={indice}
                d={caminho}
                fill={indice < visiveis - 1 ? tema.texto : indice === visiveis - 1 ? tema.zh : tema.superficie2}
              />
            ))}
          </G>
        </Svg>
      </Pressable>
      <Text className="font-semi text-xs text-texto-2">
        Traço {Math.min(visiveis, total)} de {total} · toque para repetir
      </Text>
    </View>
  );
}

/** Ordem dos traços de cada caractere da palavra. */
export function TracosHanzi({ palavra, tamanho = 150 }: { palavra: string; tamanho?: number }) {
  const caracteres = caracteresHan(palavra);
  if (caracteres.length === 0) return null;
  return (
    <View className="flex-row flex-wrap justify-center gap-3">
      {caracteres.map((caractere, indice) => (
        <Caractere key={`${caractere}-${indice}`} caractere={caractere} tamanho={tamanho} />
      ))}
    </View>
  );
}
