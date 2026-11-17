import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { caracteresHan } from '@/chines/pinyin';
import { PinyinColorido } from '@/components/cartoes/PalavraChinesa';
import type { Exercicio } from '@/conteudo/licoes';
import { falar } from '@/voz/fala';
import type { Idioma } from '@/voz/idiomas';

import { Feedback } from './Feedback';
import type { ResultadoExercicio } from './tipos';

type Props = {
  exercicio: Extract<Exercicio, { tipo: 'escolha' | 'ouvir' }>;
  idioma: Idioma;
  aoTerminar: (resultado: ResultadoExercicio) => void;
};

/** Texto só de pinyin (sem caracteres chineses) aparece colorido por tom. */
function ehPinyin(texto: string, idioma: Idioma) {
  return idioma === 'zh' && caracteresHan(texto).length === 0 && /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(texto);
}

export function BotaoOuvirGrande({ texto, idioma }: { texto: string; idioma: Idioma }) {
  return (
    <View className="flex-row justify-center gap-3">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ouvir de novo"
        onPress={() => void falar(texto, idioma)}
        className="h-16 w-16 items-center justify-center rounded-full bg-primaria active:opacity-80">
        <Ionicons name="volume-high" size={30} color="white" />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ouvir devagar"
        onPress={() => void falar(texto, idioma, { velocidade: 0.6 })}
        className="h-16 w-16 items-center justify-center rounded-full bg-slate-200 active:opacity-80 dark:bg-slate-700">
        <Text className="text-2xl">🐢</Text>
      </Pressable>
    </View>
  );
}

/** Múltipla escolha. No tipo "ouvir", o app fala a frase e você escolhe o que ouviu. */
export function ExercicioEscolha({ exercicio, idioma, aoTerminar }: Props) {
  const [escolhida, setEscolhida] = useState<number | null>(null);
  const audio = exercicio.audio;

  useEffect(() => {
    if (exercicio.tipo === 'ouvir' && audio) void falar(audio, idioma);
  }, [exercicio.tipo, audio, idioma]);

  const respondeu = escolhida !== null;
  const acertou = escolhida === exercicio.correta;
  const pergunta = exercicio.pergunta ?? (exercicio.tipo === 'ouvir' ? 'O que você ouviu?' : '');

  return (
    <View className="gap-4">
      {pergunta ? (
        <Text className="text-xl font-semibold text-slate-900 dark:text-slate-50">{pergunta}</Text>
      ) : null}
      {audio ? <BotaoOuvirGrande texto={audio} idioma={idioma} /> : null}

      <View className="gap-3">
        {exercicio.opcoes.map((opcao, i) => {
          let estilo = 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900';
          if (respondeu && i === exercicio.correta) estilo = 'border-green-600 bg-green-50 dark:bg-green-950';
          else if (respondeu && i === escolhida) estilo = 'border-red-600 bg-red-50 dark:bg-red-950';
          return (
            <Pressable
              key={i}
              accessibilityRole="button"
              disabled={respondeu}
              onPress={() => setEscolhida(i)}
              className={`min-h-14 justify-center rounded-xl border-2 px-4 py-3 active:opacity-70 ${estilo}`}>
              {ehPinyin(opcao, idioma) ? (
                <PinyinColorido pinyin={opcao} tamanho={22} />
              ) : (
                <Text className="text-lg text-slate-900 dark:text-slate-50">{opcao}</Text>
              )}
            </Pressable>
          );
        })}
      </View>

      {respondeu ? (
        <Feedback
          tipo={acertou ? 'certo' : 'errado'}
          detalhes={[!acertou && `Resposta certa: ${exercicio.opcoes[exercicio.correta]}`, exercicio.explicacao]}
          aoContinuar={() => aoTerminar(acertou ? 'certo' : 'errado')}
        />
      ) : null}
    </View>
  );
}
