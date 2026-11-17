import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Botao } from '@/components/Botao';
import { PinyinColorido } from '@/components/cartoes/PalavraChinesa';
import type { Exercicio } from '@/conteudo/licoes';
import { conferirMontar, embaralhar } from '@/licoes/conferir';
import type { Idioma } from '@/voz/idiomas';

import { Feedback } from './Feedback';
import type { ResultadoExercicio } from './tipos';

type Props = {
  exercicio: Extract<Exercicio, { tipo: 'montar' }>;
  idioma: Idioma;
  aoTerminar: (resultado: ResultadoExercicio) => void;
};

type Bloco = { id: number; texto: string };

function Peca({ texto, onPress, destaque }: { texto: string; onPress?: () => void; destaque?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      className={`rounded-xl border-2 px-4 py-2 active:opacity-70 ${
        destaque ? 'border-primaria bg-blue-50 dark:bg-slate-800' : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900'
      }`}>
      <Text className="text-lg text-slate-900 dark:text-slate-50">{texto}</Text>
    </Pressable>
  );
}

/** Montar a frase tocando nos blocos. Tocar num bloco já usado devolve ele. */
export function ExercicioMontar({ exercicio, idioma, aoTerminar }: Props) {
  const todos = useMemo<Bloco[]>(
    () => embaralhar([...exercicio.blocos, ...(exercicio.extras ?? [])]).map((texto, id) => ({ id, texto })),
    [exercicio],
  );
  const [escolhidos, setEscolhidos] = useState<number[]>([]);
  const [resultado, setResultado] = useState<boolean | null>(null);

  const separador = idioma === 'zh' ? '' : ' ';
  const respostaCerta = exercicio.blocos.join(separador);
  const textoDe = (id: number) => todos.find((b) => b.id === id)?.texto ?? '';

  function verificar() {
    setResultado(conferirMontar(escolhidos.map(textoDe), exercicio.blocos));
  }

  return (
    <View className="gap-4">
      <Text className="text-sm font-semibold uppercase tracking-widest text-slate-400">Monte a frase</Text>
      <Text className="text-xl font-semibold text-slate-900 dark:text-slate-50">{exercicio.traducao}</Text>

      <View className="min-h-16 flex-row flex-wrap gap-2 rounded-xl border-b-2 border-slate-300 pb-3 dark:border-slate-600">
        {escolhidos.map((id) => (
          <Peca
            key={id}
            texto={textoDe(id)}
            destaque
            onPress={resultado === null ? () => setEscolhidos((atual) => atual.filter((x) => x !== id)) : undefined}
          />
        ))}
      </View>

      <View className="flex-row flex-wrap gap-2">
        {todos
          .filter((bloco) => !escolhidos.includes(bloco.id))
          .map((bloco) => (
            <Peca
              key={bloco.id}
              texto={bloco.texto}
              onPress={resultado === null ? () => setEscolhidos((atual) => [...atual, bloco.id]) : undefined}
            />
          ))}
      </View>

      {resultado === null ? (
        <Botao titulo="Verificar" onPress={verificar} desabilitado={escolhidos.length === 0} />
      ) : (
        <>
          {exercicio.pinyin ? <PinyinColorido pinyin={exercicio.pinyin} /> : null}
          <Feedback
            tipo={resultado ? 'certo' : 'errado'}
            detalhes={[!resultado && `Resposta certa: ${respostaCerta}`, exercicio.explicacao]}
            aoContinuar={() => aoTerminar(resultado ? 'certo' : 'errado')}
          />
        </>
      )}
    </View>
  );
}
