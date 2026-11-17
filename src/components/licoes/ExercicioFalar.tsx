import { useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { Botao } from '@/components/Botao';
import { PinyinColorido } from '@/components/cartoes/PalavraChinesa';
import type { Exercicio } from '@/conteudo/licoes';
import { conferirFala, type ResultadoFala } from '@/licoes/conferir';
import { falar, pararFala } from '@/voz/fala';
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
    <View className="gap-4">
      <Text className="text-sm font-semibold uppercase tracking-widest text-slate-400">Fale a frase</Text>
      <View className="gap-1 rounded-2xl bg-white p-4 dark:bg-slate-900">
        <Text className={`text-slate-900 dark:text-slate-50 ${chines ? 'text-3xl' : 'text-2xl font-semibold'}`}>
          {exercicio.frase}
        </Text>
        {exercicio.pinyin ? <PinyinColorido pinyin={exercicio.pinyin} tamanho={18} /> : null}
        <Text className="text-base text-slate-500 dark:text-slate-400">{exercicio.traducao}</Text>
      </View>
      <BotaoOuvirGrande texto={exercicio.frase} idioma={idioma} />

      {ouvindo || transcricao ? (
        <View className="min-h-14 gap-1 rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
          <Text className="text-sm text-slate-500 dark:text-slate-400">{ouvindo ? 'Ouvindo…' : 'O aparelho entendeu:'}</Text>
          <Text className="text-lg text-slate-900 dark:text-slate-50">{transcricao || '…'}</Text>
        </View>
      ) : null}

      {resultado && !ouvindo ? (
        <View className="flex-row flex-wrap gap-2">
          {resultado.partes.map((parte, i) => (
            <Text
              key={i}
              className={`rounded-lg px-2 py-1 text-lg ${
                parte.ok ? 'bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100' : 'bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100'
              }`}>
              {parte.texto}
            </Text>
          ))}
        </View>
      ) : null}

      {aviso ? <Text className="text-base text-amber-700 dark:text-amber-300">{aviso}</Text> : null}

      {resultado?.certo && !ouvindo ? (
        <Feedback
          tipo="certo"
          detalhes={[`Nota: ${Math.round(resultado.nota * 100)}%`]}
          aoContinuar={() => aoTerminar('certo')}
        />
      ) : (
        <View className="gap-3">
          {ouvindo ? (
            <Botao titulo="Parar" variante="perigo" onPress={pararEscuta} />
          ) : (
            <Botao titulo={resultado ? 'Tentar de novo' : '🎤 Falar'} onPress={comecar} />
          )}
          {resultado && !ouvindo ? (
            <Text className="text-center text-base text-slate-600 dark:text-slate-300">
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
