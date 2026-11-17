import { Ionicons } from '@expo/vector-icons';
import { useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { Botao } from '@/components/Botao';
import { PinyinColorido } from '@/components/cartoes/PalavraChinesa';
import { Rotulo } from '@/components/Texto';
import type { Exercicio } from '@/conteudo/licoes';
import { conferirFala, type ResultadoFala } from '@/licoes/conferir';
import { useTema } from '@/ui/tema';
import { pararFala } from '@/voz/fala';
import type { Idioma } from '@/voz/idiomas';
import {
  cancelarEscuta,
  comecarEscuta,
  descreverErroVoz,
  localeParaReconhecer,
  pararEscuta,
} from '@/voz/reconhecimento';

import { BotaoOuvirGrande } from './ExercicioEscolha';
import { Feedback } from './Feedback';
import type { ResultadoExercicio } from './tipos';

type Props = {
  exercicio: Extract<Exercicio, { tipo: 'falar' }>;
  idioma: Idioma;
  aoTerminar: (resultado: ResultadoExercicio) => void;
};

/** Falar a frase: o reconhecimento do aparelho (offline) confere palavra por palavra. Dá para pular. */
export function ExercicioFalar({ exercicio, idioma, aoTerminar }: Props) {
  const tema = useTema();
  const [ouvindo, setOuvindo] = useState(false);
  const [transcricao, setTranscricao] = useState('');
  const [resultado, setResultado] = useState<ResultadoFala | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [acertouAlguma, setAcertouAlguma] = useState(false);
  const ultimaTranscricao = useRef('');
  const ativo = useRef(false);

  useEffect(
    () => () => {
      if (ativo.current) cancelarEscuta();
      void pararFala();
    },
    [],
  );

  function avaliar(texto: string) {
    const r = conferirFala(texto, exercicio.frase, idioma, exercicio.aceitas);
    setResultado(r);
    if (r.certo) setAcertouAlguma(true);
  }

  useSpeechRecognitionEvent('result', (evento) => {
    if (!ativo.current) return;
    const texto = evento.results[0]?.transcript ?? '';
    ultimaTranscricao.current = texto;
    setTranscricao(texto);
    if (evento.isFinal) avaliar(texto);
  });

  useSpeechRecognitionEvent('error', (evento) => {
    if (!ativo.current || evento.error === 'aborted') return;
    setAviso(descreverErroVoz(evento.error));
  });

  useSpeechRecognitionEvent('end', () => {
    if (!ativo.current) return;
    ativo.current = false;
    setOuvindo(false);
    // Alguns aparelhos encerram sem marcar o último resultado como final.
    setResultado((atual) => atual ?? (ultimaTranscricao.current ? conferirFala(ultimaTranscricao.current, exercicio.frase, idioma, exercicio.aceitas) : null));
  });

  async function comecar() {
    await pararFala();
    setAviso(null);
    setResultado(null);
    setTranscricao('');
    ultimaTranscricao.current = '';
    try {
      const locale = await localeParaReconhecer(idioma);
      ativo.current = true;
      const comecou = await comecarEscuta(idioma, locale);
      if (comecou) setOuvindo(true);
      else {
        ativo.current = false;
        setAviso(descreverErroVoz('not-allowed'));
      }
    } catch (erro) {
      ativo.current = false;
      setAviso(erro instanceof Error ? erro.message : String(erro));
    }
  }

  const chines = idioma === 'zh';

  return (
    <View className="gap-5">
      <Rotulo>FALE A FRASE</Rotulo>
      <View className="gap-1.5 rounded-3xl border-2 border-b-[5px] border-borda bg-superficie p-4">
        <Text className={`text-texto ${chines ? 'text-[30px]' : 'font-titulo text-2xl'}`}>{exercicio.frase}</Text>
        {exercicio.pinyin ? <PinyinColorido pinyin={exercicio.pinyin} tamanho={18} /> : null}
        <Text className="font-semi text-base text-texto-2">{exercicio.traducao}</Text>
      </View>
      <BotaoOuvirGrande texto={exercicio.frase} idioma={idioma} />

      {ouvindo || transcricao ? (
        <View className="min-h-14 gap-1 rounded-2xl bg-superficie-2 p-3.5">
          <Text className="font-forte text-sm text-texto-2">{ouvindo ? 'Ouvindo…' : 'O aparelho entendeu:'}</Text>
          <Text className="font-forte text-lg text-texto">{transcricao || '…'}</Text>
        </View>
      ) : null}

      {resultado && !ouvindo ? (
        <View className="flex-row flex-wrap gap-2">
          {resultado.partes.map((parte, i) => (
            <Text
              key={i}
              style={{
                backgroundColor: parte.ok ? tema.certoClara : tema.erroClara,
                color: parte.ok ? tema.certoTexto : tema.erroTexto,
              }}
              className="overflow-hidden rounded-xl px-2.5 py-1 font-titulo text-lg">
              {parte.texto}
            </Text>
          ))}
        </View>
      ) : null}

      {aviso ? (
        <View className="flex-row gap-2 rounded-2xl bg-ambar-clara p-3.5">
          <Ionicons name="warning" size={20} color={tema.ambar} />
          <Text className="flex-1 font-corpo text-base text-ambar-texto">{aviso}</Text>
        </View>
      ) : null}

      {resultado?.certo && !ouvindo ? (
        <Feedback tipo="certo" detalhes={[`Nota: ${Math.round(resultado.nota * 100)}%`]} aoContinuar={() => aoTerminar('certo')} />
      ) : (
        <View className="gap-3">
          {ouvindo ? (
            <Botao titulo="Parar" icone="stop" variante="perigo" onPress={pararEscuta} />
          ) : (
            <Botao titulo={resultado ? 'Tentar de novo' : 'Falar'} icone="mic" cor="en" onPress={comecar} />
          )}
          {resultado && !ouvindo ? (
            <Text className="text-center font-corpo text-base text-texto-2">
              Nota: {Math.round(resultado.nota * 100)}%. As partes em vermelho não foram reconhecidas.
            </Text>
          ) : null}
          {resultado && !ouvindo ? (
            <Botao titulo="Continuar" variante="secundario" onPress={() => aoTerminar(acertouAlguma ? 'certo' : 'errado')} />
          ) : null}
          <Botao titulo="Pular" variante="secundario" onPress={() => aoTerminar('pulado')} desabilitado={ouvindo} />
        </View>
      )}
    </View>
  );
}
