import { useState } from 'react';
import { Text, View } from 'react-native';

import { Botao } from '@/components/Botao';
import { Rotulo } from '@/components/Texto';
import type { Card } from '@/db/schema';
import { coresDoDestaque, useTema } from '@/ui/tema';

import { BotaoAudio } from './BotaoAudio';
import { PalavraChinesa } from './PalavraChinesa';
import { TracosHanzi } from './TracosHanzi';

type Props = {
  card: Card;
  /** `false` mostra só a pergunta; `true` mostra também a resposta. */
  revelado: boolean;
};

function Significados({ card, destaque }: { card: Card; destaque: boolean }) {
  const tema = useTema();
  const cor = coresDoDestaque(tema, card.idioma);
  return (
    <View className="items-center gap-1">
      {card.versoEn ? (
        <Text className={`text-center font-titulo text-texto ${destaque ? 'text-[28px] leading-8' : 'text-2xl'}`}>{card.versoEn}</Text>
      ) : null}
      {card.versoPt ? <Text className="text-center font-forte text-xl text-texto-2">{card.versoPt}</Text> : null}
      {card.classe ? (
        <View style={{ backgroundColor: cor.clara }} className="mt-1.5 rounded-full px-3 py-0.5">
          <Text style={{ color: cor.cor }} className="font-titulo text-sm">
            {card.classe}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/** A palavra no idioma estudado, com botão de áudio. */
function Palavra({ card, mostrarPinyin }: { card: Card; mostrarPinyin: boolean }) {
  return (
    <View className="items-center gap-4">
      {card.idioma === 'zh' ? (
        <PalavraChinesa palavra={card.frente} pinyin={card.pinyin} mostrarPinyin={mostrarPinyin} />
      ) : (
        <Text className="text-center font-titulo text-[40px] leading-[48px] text-texto">{card.frente}</Text>
      )}
      <BotaoAudio texto={card.frente} idioma={card.idioma} descricao="Ouvir a palavra" />
    </View>
  );
}

function Exemplo({ card, comTraducao }: { card: Card; comTraducao: boolean }) {
  if (!card.exemplo) return null;
  return (
    <View className="w-full gap-2 rounded-2xl bg-superficie-2 p-3.5">
      <View className="flex-row items-center gap-3">
        <Text className="flex-1 font-forte text-lg text-texto">{card.exemplo}</Text>
        <BotaoAudio texto={card.exemplo} idioma={card.idioma} descricao="Ouvir a frase" tamanho={18} cor="en" />
      </View>
      {comTraducao && card.exemploEn ? <Text className="font-corpo text-base text-texto">{card.exemploEn}</Text> : null}
      {comTraducao && card.exemploPt ? <Text className="font-semi text-base text-texto-2">{card.exemploPt}</Text> : null}
    </View>
  );
}

function Detalhes({ card }: { card: Card }) {
  const [tracos, setTracos] = useState(false);
  return (
    <>
      {card.nota ? (
        <View className="w-full rounded-2xl bg-ambar-clara p-3.5">
          <Text className="font-corpo text-base leading-6 text-ambar-texto">{card.nota}</Text>
        </View>
      ) : null}
      {card.idioma === 'zh' ? (
        tracos ? (
          <TracosHanzi palavra={card.frente} />
        ) : (
          <Botao titulo="Ordem dos traços" icone="brush" variante="secundario" compacto onPress={() => setTracos(true)} />
        )
      ) : null}
    </>
  );
}

/**
 * Conteúdo de um flashcard.
 * - Reconhecimento: mostra a palavra (sem pinyin no chinês) e pede o significado.
 * - Produção: mostra o significado e pede a palavra.
 */
export function FaceCartao({ card, revelado }: Props) {
  const tema = useTema();
  const cor = coresDoDestaque(tema, card.idioma);
  const producao = card.direcao === 'producao';
  const divisor = <View className="h-0.5 w-full" style={{ backgroundColor: cor.clara }} />;

  return (
    <View
      style={{ borderColor: cor.clara, borderBottomColor: tema.borda }}
      className="items-center gap-5 rounded-[28px] border-2 border-b-[6px] bg-superficie px-5 py-6">
      <Rotulo cor="text-texto-2">{producao ? 'COMO SE DIZ?' : 'O QUE SIGNIFICA?'}</Rotulo>

      {producao ? (
        <>
          <Significados card={card} destaque />
          {revelado ? (
            <>
              {divisor}
              <Palavra card={card} mostrarPinyin />
              <Exemplo card={card} comTraducao />
              <Detalhes card={card} />
            </>
          ) : null}
        </>
      ) : (
        <>
          <Palavra card={card} mostrarPinyin={revelado} />
          <Exemplo card={card} comTraducao={revelado} />
          {revelado ? (
            <>
              {divisor}
              <Significados card={card} destaque={false} />
              <Detalhes card={card} />
            </>
          ) : null}
        </>
      )}
    </View>
  );
}
