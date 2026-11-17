import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';

import { BarraProgresso } from '@/components/BarraProgresso';
import { Botao } from '@/components/Botao';
import { Tela } from '@/components/Tela';
import { Apoio, Titulo } from '@/components/Texto';
import { resumoDoIdioma, type ResumoIdioma } from '@/db/cartoes';
import { coresDoDestaque, useTema } from '@/ui/tema';
import type { Idioma } from '@/voz/idiomas';

/** Línguas que têm flashcards no MVP. */
const IDIOMAS_COM_CARTOES: Idioma[] = ['es', 'zh'];
const NOMES: Record<Idioma, string> = { en: 'Inglês', es: 'Espanhol', zh: 'Chinês' };

function Numero({ valor, rotulo, idioma }: { valor: number; rotulo: string; idioma: Idioma }) {
  const tema = useTema();
  const cor = coresDoDestaque(tema, idioma);
  return (
    <View style={{ backgroundColor: cor.clara }} className="flex-1 items-center rounded-2xl p-3">
      <Text style={{ color: cor.cor }} className="font-titulo text-[30px]">
        {valor}
      </Text>
      <Text className="text-center font-forte text-sm text-texto-2">{rotulo}</Text>
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
    <Tela semCabecalho>
      <Titulo>Cartões</Titulo>
      {IDIOMAS_COM_CARTOES.map((idioma) => {
        const resumo = resumos[idioma];
        const paraHoje = resumo ? resumo.vencidos + resumo.novosHoje : 0;
        return (
          <View key={idioma} className="gap-3.5 rounded-3xl border-2 border-b-[6px] border-borda bg-superficie p-4">
            <View className="flex-row items-baseline justify-between">
              <Text className="font-titulo text-xl text-texto">{NOMES[idioma]}</Text>
              <Apoio>{resumo ? `${resumo.aprendidas} de ${resumo.palavras} palavras` : 'Carregando…'}</Apoio>
            </View>
            <BarraProgresso fracao={resumo ? resumo.aprendidas / Math.max(1, resumo.palavras) : 0} cor={idioma} altura={12} />
            <View className="flex-row gap-3">
              <Numero valor={resumo?.vencidos ?? 0} rotulo="revisões vencidas" idioma={idioma} />
              <Numero valor={resumo?.novosHoje ?? 0} rotulo="novos para hoje" idioma={idioma} />
            </View>
            <Botao
              titulo={paraHoje > 0 ? `Revisar ${paraHoje} cartões` : 'Nada para revisar agora'}
              cor={idioma}
              desabilitado={paraHoje === 0}
              onPress={() => router.push({ pathname: '/revisar/[idioma]', params: { idioma } })}
            />
          </View>
        );
      })}

      <Botao titulo="Adicionar palavra" icone="add-circle" variante="secundario" onPress={() => router.push('/adicionar')} />

      {erro ? <Text className="font-corpo text-base text-erro">{erro}</Text> : null}
      <Apoio>
        Cada palavra tem dois cartões: um para reconhecer e outro para lembrar como se diz. O segundo só aparece
        depois que você aprende o primeiro.
      </Apoio>
    </Tela>
  );
}
