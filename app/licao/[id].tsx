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
import { Tela } from '@/components/Tela';
import { Apoio, Paragrafo } from '@/components/Texto';
import type { Exercicio } from '@/conteudo/licoes';
import { buscarLicao } from '@/conteudo/unidades';
import { concluirLicao, iniciarLicao } from '@/db/licoes';
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

function BarraDeProgresso({ feitos, total }: { feitos: number; total: number }) {
  return (
    <View className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
      <View className="h-2 rounded-full bg-primaria" style={{ width: `${(feitos / Math.max(total, 1)) * 100}%` }} />
    </View>
  );
}

export default function TelaLicao() {
  const router = useRouter();
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
        <Stack.Screen options={{ title: 'Lição' }} />
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
      <Tela>
        <Stack.Screen options={{ title: titulo }} />
        <BarraDeProgresso feitos={etapa.indice} total={total} />
        <Apoio>
          Exercício {etapa.indice + 1} de {total}
        </Apoio>
        <ExercicioAtual
          key={`${etapa.indice}-${resultados.length}`}
          exercicio={licao.exercicios[etapa.indice]}
          idioma={idioma}
          aoTerminar={(r) => terminarExercicio(etapa.indice, r)}
        />
      </Tela>
    );
  }

  if (etapa.tipo === 'fim') {
    const pulados = resultados.length - contados;
    return (
      <Tela>
        <Stack.Screen options={{ title: titulo }} />
        <Cartao titulo="Lição concluída 🎉">
          <Text className="text-4xl font-bold text-slate-900 dark:text-slate-50">
            {acertos} de {contados}
          </Text>
          <Apoio>
            acertos{pulados > 0 ? ` · ${pulados} ${pulados === 1 ? 'exercício pulado' : 'exercícios pulados'}` : ''}
          </Apoio>
          {palavrasNovas !== null ? (
            <Paragrafo>
              {palavrasNovas > 0
                ? `${palavrasNovas} ${palavrasNovas === 1 ? 'palavra nova entrou' : 'palavras novas entraram'} nos seus cartões.`
                : 'Nenhuma palavra nova: as desta lição já estavam nos seus cartões.'}
            </Paragrafo>
          ) : null}
          {erro ? <Text className="text-base text-red-700 dark:text-red-400">{erro}</Text> : null}
          <Botao titulo="Voltar à unidade" onPress={() => router.back()} />
          <Botao titulo="Refazer os exercícios" variante="secundario" onPress={refazer} />
        </Cartao>
        <BotaoDuvida licaoId={licao.id} idioma={idioma} />
      </Tela>
    );
  }

  return (
    <Tela>
      <Stack.Screen options={{ title: titulo }} />
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
                <Text className="text-lg font-semibold text-slate-900 dark:text-slate-50">{p.palavra}</Text>
                {p.pinyin ? <PinyinColorido pinyin={p.pinyin} tamanho={15} /> : null}
                <Text className="text-sm text-slate-600 dark:text-slate-300">
                  {p.en} · {p.pt}
                </Text>
              </View>
              <BotaoAudio texto={p.palavra} idioma={idioma} descricao={`Ouvir ${p.palavra}`} tamanho={20} />
            </View>
          ))}
        </Cartao>
      ) : null}

      <Botao titulo={`Começar os exercícios (${total})`} onPress={() => setEtapa({ tipo: 'exercicio', indice: 0 })} />
      <BotaoDuvida licaoId={licao.id} idioma={idioma} />
    </Tela>
  );
}
