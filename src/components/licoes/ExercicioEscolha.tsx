import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { caracteresHan } from '@/chines/pinyin';
import { BotaoIcone } from '@/components/Botao';
import { PinyinColorido } from '@/components/cartoes/PalavraChinesa';
import { Rotulo } from '@/components/Texto';
import type { Exercicio } from '@/conteudo/licoes';
import { FONTES, useTema } from '@/ui/tema';
import { falar } from '@/voz/fala';
import type { Idioma } from '@/voz/idiomas';
import { Pressionavel } from '@/ui/Pressionavel';

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

/** Botão grande de ouvir e o de ouvir devagar. */
export function BotaoOuvirGrande({ texto, idioma }: { texto: string; idioma: Idioma }) {
  const tema = useTema();
  return (
    <View className="flex-row items-center gap-3.5">
      <BotaoIcone icone="volume-high" descricao="Ouvir de novo" cor="en" tamanho={96} onPress={() => void falar(texto, idioma)} />
      <Pressionavel
        accessibilityRole="button"
        accessibilityLabel="Ouvir devagar"
        onPress={() => void falar(texto, idioma, { velocidade: 0.6 })}
        style={(pressed) => ({
          width: 64,
          height: 64,
          borderRadius: 18,
          backgroundColor: tema.enClara,
          borderBottomWidth: pressed ? 0 : 5,
          borderBottomColor: tema.borda,
          marginTop: pressed ? 5 : 0,
          alignItems: 'center',
          justifyContent: 'center',
        })}>
        <Text style={{ fontFamily: FONTES.titulo, fontSize: 17, color: tema.en }}>0,6×</Text>
      </Pressionavel>
    </View>
  );
}

/** Opção de resposta em cartão; muda de cor depois de respondida. */
export function Opcao({
  estado,
  onPress,
  children,
}: {
  estado: 'normal' | 'certa' | 'errada';
  onPress?: () => void;
  children: React.ReactNode;
}) {
  const tema = useTema();
  const cores =
    estado === 'certa'
      ? { fundo: tema.certoClara, borda: tema.certo }
      : estado === 'errada'
        ? { fundo: tema.erroClara, borda: tema.erro }
        : { fundo: tema.superficie, borda: tema.borda };
  return (
    <Pressionavel
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={(pressed) => ({
        minHeight: 58,
        justifyContent: 'center',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: cores.borda,
        backgroundColor: cores.fundo,
        borderBottomWidth: pressed ? 2 : 5,
        marginTop: pressed ? 3 : 0,
        paddingHorizontal: 16,
        paddingVertical: 12,
      })}>
      {children}
    </Pressionavel>
  );
}

/** Múltipla escolha. No tipo "ouvir", o app fala a frase e você escolhe o que ouviu. */
export function ExercicioEscolha({ exercicio, idioma, aoTerminar }: Props) {
  const tema = useTema();
  const [escolhida, setEscolhida] = useState<number | null>(null);
  const audio = exercicio.audio;

  useEffect(() => {
    if (exercicio.tipo === 'ouvir' && audio) void falar(audio, idioma);
  }, [exercicio.tipo, audio, idioma]);

  const respondeu = escolhida !== null;
  const acertou = escolhida === exercicio.correta;

  return (
    <View className="gap-5">
      <Rotulo>{exercicio.tipo === 'ouvir' ? 'TOQUE NO QUE VOCÊ OUVIU' : 'ESCOLHA A RESPOSTA'}</Rotulo>
      {exercicio.pergunta && !(exercicio.tipo === 'ouvir' && exercicio.pergunta === 'What did you hear?') ? (
        <Text className="font-titulo text-[22px] leading-7 text-texto">{exercicio.pergunta}</Text>
      ) : null}
      {audio ? <BotaoOuvirGrande texto={audio} idioma={idioma} /> : null}

      <View className="gap-3">
        {exercicio.opcoes.map((opcao, i) => (
          <Opcao
            key={i}
            estado={respondeu && i === exercicio.correta ? 'certa' : respondeu && i === escolhida ? 'errada' : 'normal'}
            onPress={respondeu ? undefined : () => setEscolhida(i)}>
            {ehPinyin(opcao, idioma) ? (
              <PinyinColorido pinyin={opcao} tamanho={22} />
            ) : (
              <Text style={{ color: tema.texto }} className="font-forte text-lg">
                {opcao}
              </Text>
            )}
          </Opcao>
        ))}
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
