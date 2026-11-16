import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';

import { Botao } from '@/components/Botao';
import { Cartao } from '@/components/Cartao';
import { Tela } from '@/components/Tela';
import { Apoio } from '@/components/Texto';
import { resumoDoIdioma, type ResumoIdioma } from '@/db/cartoes';
import { IDIOMAS, type Idioma } from '@/voz/idiomas';

/** Línguas que têm flashcards no MVP. */
const IDIOMAS_COM_CARTOES: Idioma[] = ['es', 'zh'];

function Numero({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <View className="flex-1 items-center rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
      <Text className="text-2xl font-bold text-slate-900 dark:text-slate-50">{valor}</Text>
      <Text className="text-center text-xs text-slate-500 dark:text-slate-400">{rotulo}</Text>
    </View>
  );
}

export default function Cartoes() {
  const router = useRouter();
  const [resumos, setResumos] = useState<Partial<Record<Idioma, ResumoIdioma>>>({});
  const [erro, setErro] = useState<string | null>(null);

  // Recarrega sempre que a aba volta a aparecer, por exemplo depois de uma sessão.
  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      Promise.all(IDIOMAS_COM_CARTOES.map(async (idioma) => [idioma, await resumoDoIdioma(idioma)] as const))
        .then((pares) => ativo && setResumos(Object.fromEntries(pares)))
        .catch((e) => ativo && setErro(e instanceof Error ? e.message : String(e)));
      return () => {
        ativo = false;
      };
    }, []),
  );

  return (
    <Tela>
      {IDIOMAS_COM_CARTOES.map((idioma) => {
        const resumo = resumos[idioma];
        const paraHoje = resumo ? resumo.vencidos + resumo.novosHoje : 0;
        return (
          <Cartao
            key={idioma}
            titulo={IDIOMAS[idioma].nome}
            subtitulo={
              resumo ? `${resumo.aprendidas} de ${resumo.palavras} palavras aprendidas` : 'Carregando…'
            }>
            <View className="flex-row gap-3">
              <Numero valor={resumo?.vencidos ?? 0} rotulo="revisões vencidas" />
              <Numero valor={resumo?.novosHoje ?? 0} rotulo="novos para hoje" />
            </View>
            <Botao
              titulo={paraHoje > 0 ? `Revisar ${paraHoje} cartões` : 'Nada para revisar agora'}
              desabilitado={paraHoje === 0}
              onPress={() => router.push({ pathname: '/revisar/[idioma]', params: { idioma } })}
            />
          </Cartao>
        );
      })}

      <Botao titulo="Adicionar palavra" variante="secundario" onPress={() => router.push('/adicionar')} />

      {erro ? <Text className="text-base text-red-700 dark:text-red-400">{erro}</Text> : null}
      <Apoio>
        Cada palavra tem dois cartões: um para reconhecer e outro para lembrar como se diz. O segundo
        só aparece depois que você aprende o primeiro.
      </Apoio>
    </Tela>
  );
}
