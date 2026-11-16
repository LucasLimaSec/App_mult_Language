import { useState } from 'react';
import { Text, View } from 'react-native';

import { Botao } from '@/components/Botao';
import type { Card } from '@/db/schema';

import { BotaoAudio } from './BotaoAudio';
import { PalavraChinesa } from './PalavraChinesa';
import { TracosHanzi } from './TracosHanzi';

type Props = {
  card: Card;
  /** `false` mostra só a pergunta; `true` mostra também a resposta. */
  revelado: boolean;
};

function Significados({ card, destaque }: { card: Card; destaque: boolean }) {
  const tamanho = destaque ? 'text-2xl' : 'text-xl';
  return (
    <View className="items-center gap-1">
      {card.versoEn ? (
        <Text className={`text-center font-semibold text-slate-900 dark:text-slate-50 ${tamanho}`}>
          {card.versoEn}
        </Text>
      ) : null}
      {card.versoPt ? (
        <Text className={`text-center text-slate-600 dark:text-slate-300 ${tamanho}`}>{card.versoPt}</Text>
      ) : null}
      {card.classe ? <Text className="text-sm text-slate-400">{card.classe}</Text> : null}
    </View>
  );
}

/** A palavra no idioma estudado, com botão de áudio. */
function Palavra({ card, mostrarPinyin }: { card: Card; mostrarPinyin: boolean }) {
  return (
    <View className="items-center gap-3">
      {card.idioma === 'zh' ? (
        <PalavraChinesa palavra={card.frente} pinyin={card.pinyin} mostrarPinyin={mostrarPinyin} />
      ) : (
        <Text className="text-center text-4xl font-bold text-slate-900 dark:text-slate-50">
          {card.frente}
        </Text>
      )}
      <BotaoAudio texto={card.frente} idioma={card.idioma} descricao="Ouvir a palavra" />
    </View>
  );
}

function Exemplo({ card, comTraducao }: { card: Card; comTraducao: boolean }) {
  if (!card.exemplo) return null;
  return (
    <View className="gap-2 rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
      <View className="flex-row items-center gap-3">
        <Text className="flex-1 text-lg text-slate-900 dark:text-slate-50">{card.exemplo}</Text>
        <BotaoAudio texto={card.exemplo} idioma={card.idioma} descricao="Ouvir a frase" tamanho={20} />
      </View>
      {comTraducao && card.exemploEn ? (
        <Text className="text-base text-slate-700 dark:text-slate-300">{card.exemploEn}</Text>
      ) : null}
      {comTraducao && card.exemploPt ? (
        <Text className="text-base text-slate-500 dark:text-slate-400">{card.exemploPt}</Text>
      ) : null}
    </View>
  );
}

function Detalhes({ card }: { card: Card }) {
  const [tracos, setTracos] = useState(false);
  return (
    <>
      {card.nota ? (
        <View className="rounded-xl bg-amber-100 p-3 dark:bg-amber-900">
          <Text className="text-base text-amber-900 dark:text-amber-100">{card.nota}</Text>
        </View>
      ) : null}
      {card.idioma === 'zh' ? (
        tracos ? (
          <TracosHanzi palavra={card.frente} />
        ) : (
          <Botao titulo="Ver ordem dos traços" variante="secundario" onPress={() => setTracos(true)} />
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
  const producao = card.direcao === 'producao';

  return (
    <View className="gap-5 rounded-2xl bg-white p-5 dark:bg-slate-900">
      <Text className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
        {producao ? 'Como se diz?' : 'O que significa?'}
      </Text>

      {producao ? (
        <>
          <Significados card={card} destaque />
          {revelado ? (
            <>
              <View className="h-px bg-slate-200 dark:bg-slate-700" />
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
              <View className="h-px bg-slate-200 dark:bg-slate-700" />
              <Significados card={card} destaque={false} />
              <Detalhes card={card} />
            </>
          ) : null}
        </>
      )}
    </View>
  );
}
