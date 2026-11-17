import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { Botao } from '@/components/Botao';
import { PinyinColorido } from '@/components/cartoes/PalavraChinesa';
import { Rotulo } from '@/components/Texto';
import type { Exercicio } from '@/conteudo/licoes';
import { conferirMontar, embaralhar } from '@/licoes/conferir';
import { useTema } from '@/ui/tema';
import type { Idioma } from '@/voz/idiomas';
import { Pressionavel } from '@/ui/Pressionavel';

import { Feedback } from './Feedback';
import type { ResultadoExercicio } from './tipos';

type Props = {
  exercicio: Extract<Exercicio, { tipo: 'montar' }>;
  idioma: Idioma;
  aoTerminar: (resultado: ResultadoExercicio) => void;
};

type Bloco = { id: number; texto: string };

function Peca({ texto, onPress, escolhida }: { texto: string; onPress?: () => void; escolhida?: boolean }) {
  const tema = useTema();
  return (
    <Pressionavel
      accessibilityRole="button"
      accessibilityLabel={texto}
      disabled={!onPress}
      onPress={onPress}
      style={(pressed) => ({
        borderRadius: 14,
        borderWidth: 2,
        borderColor: escolhida ? tema.marca : tema.borda,
        backgroundColor: escolhida ? tema.marcaClara : tema.superficie,
        borderBottomWidth: pressed ? 2 : 5,
        marginTop: pressed ? 3 : 0,
        paddingHorizontal: 14,
        paddingVertical: 8,
      })}>
      <Text style={{ color: tema.texto }} className="font-forte text-lg">
        {texto}
      </Text>
    </Pressionavel>
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
    <View className="gap-5">
      <Rotulo>MONTE A FRASE</Rotulo>
      <Text className="font-titulo text-[22px] leading-7 text-texto">{exercicio.traducao}</Text>

      <View className="min-h-[70px] flex-row flex-wrap gap-2 border-b-[3px] border-borda pb-3">
        {escolhidos.map((id) => (
          <Peca
            key={id}
            texto={textoDe(id)}
            escolhida
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
