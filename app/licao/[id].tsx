import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { Botao } from '@/components/Botao';
import { BotaoAudio } from '@/components/cartoes/BotaoAudio';
import { PinyinColorido } from '@/components/cartoes/PalavraChinesa';
import { Cartao } from '@/components/Cartao';
import { BotaoDuvida } from '@/components/licoes/BotaoDuvida';
import { ExercicioDitado } from '@/components/licoes/ExercicioDitado';
import { ExercicioEscolha } from '@/components/licoes/ExercicioEscolha';
import { ExercicioFalar } from '@/components/licoes/ExercicioFalar';
import { ExercicioMontar } from '@/components/licoes/ExercicioMontar';
import { Explicacao } from '@/components/licoes/Explicacao';
import { LinhaExemplo } from '@/components/licoes/LinhaExemplo';
import type { ResultadoExercicio } from '@/components/licoes/tipos';
import { BarraDaSessao } from '@/components/sessao/BarraDaSessao';
import { Tela } from '@/components/Tela';
import { Apoio, Paragrafo } from '@/components/Texto';
import type { Exercicio } from '@/conteudo/licoes';
import { buscarLicao } from '@/conteudo/unidades';
import { concluirLicao, iniciarLicao } from '@/db/licoes';
import { useTema } from '@/ui/tema';
import { pararFala } from '@/voz/fala';
import type { Idioma } from '@/voz/idiomas';

type Etapa = { tipo: 'aprender' } | { tipo: 'exercicio'; indice: number } | { tipo: 'fim' };

function ExercicioAtual(props: { exercicio: Exercicio; idioma: Idioma; aoTerminar: (r: ResultadoExercicio) => void }) {
  const { exercicio } = props;
  switch (exercicio.tipo) {
    case 'escolha':
    case 'ouvir':
      return <ExercicioEscolha {...props} exercicio={exercicio} />;
    case 'montar':
      return <ExercicioMontar {...props} exercicio={exercicio} />;
    case 'ditado':
      return <ExercicioDitado {...props} exercicio={exercicio} />;
    case 'falar':
      return <ExercicioFalar {...props} exercicio={exercicio} />;
  }
}

export default function TelaLicao() {
  const router = useRouter();
  const tema = useTema();
  const { id } = useLocalSearchParams<{ id: string }>();
  const encontrada = id ? buscarLicao(id) : undefined;

  const [etapa, setEtapa] = useState<Etapa>({ tipo: 'aprender' });
  const [resultados, setResultados] = useState<ResultadoExercicio[]>([]);
  const [palavrasNovas, setPalavrasNovas] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const iniciadaEm = useRef(new Date());

  const licao = encontrada?.licao;
  const idioma = encontrada?.unidade.idioma;

  useEffect(() => {
    if (licao && idioma) void iniciarLicao(licao.id, idioma).catch(() => undefined);
    return () => void pararFala();
  }, [licao, idioma]);

  const acertos = resultados.filter((r) => r === 'certo').length;
  const contados = resultados.filter((r) => r !== 'pulado').length;

  useEffect(() => {
    if (etapa.tipo !== 'fim' || !licao || !idioma) return;
    concluirLicao(licao, idioma, acertos, contados, iniciadaEm.current)
      .then((r) => setPalavrasNovas(r.palavrasNovas))
      .catch((e) => setErro(e instanceof Error ? e.message : String(e)));
    // Conclui uma vez por chegada ao fim.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapa.tipo]);

  if (!licao || !idioma || !encontrada) {
    return (
      <Tela>
        <Stack.Screen options={{ title: 'Lição', headerShown: true }} />
        <Paragrafo>Esta lição ainda não foi escrita.</Paragrafo>
      </Tela>
    );
  }

  const total = licao.exercicios.length;

  function terminarExercicio(indice: number, resultado: ResultadoExercicio) {
    setResultados((atual) => [...atual, resultado]);
    void pararFala();
    setEtapa(indice + 1 < total ? { tipo: 'exercicio', indice: indice + 1 } : { tipo: 'fim' });
  }

  function refazer() {
    setResultados([]);
    setPalavrasNovas(null);
    iniciadaEm.current = new Date();
    setEtapa({ tipo: 'exercicio', indice: 0 });
  }

  const titulo = `${encontrada.indice + 1}. ${licao.titulo}`;

  if (etapa.tipo === 'exercicio') {
    return (
      <View className="flex-1 bg-fundo">
        <Stack.Screen options={{ headerShown: false }} />
        <BarraDaSessao
          cor="marca"
          fracao={etapa.indice / total}
          texto={`${etapa.indice + 1}/${total}`}
          aoFechar={() => router.back()}
        />
        <Tela>
        <ExercicioAtual
          key={`${etapa.indice}-${resultados.length}`}
          exercicio={licao.exercicios[etapa.indice]}
          idioma={idioma}
          aoTerminar={(r) => terminarExercicio(etapa.indice, r)}
        />
        </Tela>
      </View>
    );
  }

  if (etapa.tipo === 'fim') {
    const pulados = resultados.length - contados;
    return (
      <Tela>
        <Stack.Screen options={{ title: titulo, headerShown: true }} />
        <View className="items-center gap-3 pt-6">
          <View
            style={{ backgroundColor: tema.amarelo, borderBottomColor: '#CA8A04' }}
            className="h-28 w-28 items-center justify-center rounded-full border-b-[6px]">
            <Ionicons name="trophy" size={60} color="#1E1B2E" />
          </View>
          <Text className="font-titulo text-[30px] text-texto">Lição concluída!</Text>
        </View>
        <View className="flex-row gap-3">
          <View className="flex-1 items-center rounded-3xl bg-certo-clara p-4">
            <Text className="font-titulo text-[34px] text-certo-texto">
              {acertos}/{contados}
            </Text>
            <Text className="font-forte text-sm text-certo-texto">acertos</Text>
          </View>
          <View className="flex-1 items-center rounded-3xl bg-marca-clara p-4">
            <Text style={{ color: tema.marca }} className="font-titulo text-[34px]">
              {palavrasNovas ?? '–'}
            </Text>
            <Text style={{ color: tema.marca }} className="font-forte text-sm">
              palavras novas
            </Text>
          </View>
        </View>
        <Cartao>
          {pulados > 0 ? (
            <Apoio>
              {pulados} {pulados === 1 ? 'exercício pulado, que não conta' : 'exercícios pulados, que não contam'} no placar.
            </Apoio>
          ) : null}
          {palavrasNovas !== null ? (
            <Paragrafo>
              {palavrasNovas > 0
                ? `${palavrasNovas} ${palavrasNovas === 1 ? 'palavra nova entrou' : 'palavras novas entraram'} nos seus cartões.`
                : 'Nenhuma palavra nova: as desta lição já estavam nos seus cartões.'}
            </Paragrafo>
          ) : null}
          {erro ? <Text className="font-corpo text-base text-erro">{erro}</Text> : null}
          <Botao titulo="Voltar à unidade" onPress={() => router.back()} />
          <Botao titulo="Refazer os exercícios" variante="secundario" onPress={refazer} />
        </Cartao>
        <BotaoDuvida licaoId={licao.id} idioma={idioma} />
      </Tela>
    );
  }

  return (
    <Tela>
      <Stack.Screen options={{ title: titulo, headerShown: true }} />
      <Cartao>
        <Explicacao blocos={licao.explicacao} />
      </Cartao>

      <Cartao titulo="Examples">
        {licao.exemplos.map((ex, i) => (
          <LinhaExemplo key={i} frase={ex.frase} pinyin={ex.pinyin} en={ex.en} pt={ex.pt} idioma={idioma} />
        ))}
      </Cartao>

      {licao.palavras.length > 0 ? (
        <Cartao titulo="New words" subtitulo="Entram nos seus cartões ao concluir a lição.">
          {licao.palavras.map((p, i) => (
            <View key={i} className="flex-row items-center gap-3">
              <View className="flex-1">
                <Text className="font-titulo text-lg text-texto">{p.palavra}</Text>
                {p.pinyin ? <PinyinColorido pinyin={p.pinyin} tamanho={15} /> : null}
                <Text className="font-corpo text-sm text-texto-2">
                  {p.en} · {p.pt}
                </Text>
              </View>
              <BotaoAudio texto={p.palavra} idioma={idioma} descricao={`Ouvir ${p.palavra}`} tamanho={18} cor="en" />
            </View>
          ))}
        </Cartao>
      ) : null}

      <Botao titulo={`Começar os exercícios (${total})`} icone="play" onPress={() => setEtapa({ tipo: 'exercicio', indice: 0 })} />
      <BotaoDuvida licaoId={licao.id} idioma={idioma} />
    </Tela>
  );
}
