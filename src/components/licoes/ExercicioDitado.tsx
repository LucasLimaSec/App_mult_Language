import { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { Botao } from '@/components/Botao';
import type { Exercicio } from '@/conteudo/licoes';
import { conferirDitadoEs, conferirDitadoZh, type ResultadoDitado } from '@/licoes/conferir';
import { falar } from '@/voz/fala';
import type { Idioma } from '@/voz/idiomas';

import { BotaoOuvirGrande } from './ExercicioEscolha';
import { Feedback } from './Feedback';
import type { ResultadoExercicio } from './tipos';

type Props = {
  exercicio: Extract<Exercicio, { tipo: 'ditado' }>;
  idioma: Idioma;
  aoTerminar: (resultado: ResultadoExercicio) => void;
};

/** Ditado: o app fala e você digita. No chinês, você digita o pinyin. */
export function ExercicioDitado({ exercicio, idioma, aoTerminar }: Props) {
  const [texto, setTexto] = useState('');
  const [resultado, setResultado] = useState<ResultadoDitado | null>(null);
  const chines = idioma === 'zh';

  useEffect(() => {
    void falar(exercicio.frase, idioma);
  }, [exercicio.frase, idioma]);

  function verificar() {
    setResultado(
      chines
        ? conferirDitadoZh(texto, exercicio.resposta ?? '', exercicio.aceitas)
        : conferirDitadoEs(texto, exercicio.frase, exercicio.aceitas),
    );
  }

  const resposta = chines ? `${exercicio.resposta} (${exercicio.frase})` : exercicio.frase;
  const acertou = resultado === 'certo' || resultado === 'acento';

  return (
    <View className="gap-4">
      <Text className="text-sm font-semibold uppercase tracking-widest text-slate-400">Ditado</Text>
      <Text className="text-xl font-semibold text-slate-900 dark:text-slate-50">
        {chines ? 'Ouça e digite o pinyin' : 'Ouça e escreva o que ouviu'}
      </Text>
      <BotaoOuvirGrande texto={exercicio.frase} idioma={idioma} />

      <TextInput
        value={texto}
        onChangeText={setTexto}
        editable={resultado === null}
        placeholder={chines ? 'ex.: ma3 ou mǎ' : 'Escreva aqui'}
        placeholderTextColor="#94a3b8"
        autoCapitalize="none"
        autoCorrect={false}
        onSubmitEditing={() => texto.trim() && resultado === null && verificar()}
        className="rounded-xl border-2 border-slate-300 px-4 py-3 text-lg text-slate-900 dark:border-slate-600 dark:text-slate-50"
      />

      {resultado === null ? (
        <Botao titulo="Verificar" onPress={verificar} desabilitado={texto.trim().length === 0} />
      ) : (
        <Feedback
          tipo={resultado === 'certo' ? 'certo' : resultado === 'errado' ? 'errado' : 'quase'}
          detalhes={[
            resultado === 'acento' && `Confira os acentos: ${resposta}`,
            resultado === 'tom' && `As letras estão certas, mas o tom não: ${resposta}`,
            resultado === 'errado' && `Resposta certa: ${resposta}`,
            `Tradução: ${exercicio.traducao}`,
            exercicio.explicacao,
          ]}
          aoContinuar={() => aoTerminar(acertou ? 'certo' : 'errado')}
        />
      )}
    </View>
  );
}
