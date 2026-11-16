import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Botao } from '@/components/Botao';
import { Cartao } from '@/components/Cartao';
import { FaceCartao } from '@/components/cartoes/FaceCartao';
import { Tela } from '@/components/Tela';
import { Paragrafo } from '@/components/Texto';
import { carregarFila, registrarResposta, registrarSessao } from '@/db/cartoes';
import type { Card } from '@/db/schema';
import { agendador, formatarIntervalo, RESPOSTAS, type Resposta } from '@/srs/agendador';
import { voltaNaMesmaSessao } from '@/srs/fila';
import { pararFala } from '@/voz/fala';
import { CODIGOS_IDIOMA, IDIOMAS, type Idioma } from '@/voz/idiomas';

const COR_DA_RESPOSTA: Record<Resposta, string> = {
  1: 'bg-red-600',
  2: 'bg-amber-600',
  3: 'bg-green-600',
  4: 'bg-blue-600',
};

function ehIdioma(valor: unknown): valor is Idioma {
  return typeof valor === 'string' && (CODIGOS_IDIOMA as readonly string[]).includes(valor);
}

export default function Revisar() {
  const router = useRouter();
  const parametros = useLocalSearchParams<{ idioma: string }>();
  const idioma = ehIdioma(parametros.idioma) ? parametros.idioma : null;

  const [fila, setFila] = useState<Card[] | null>(null);
  const [revelado, setRevelado] = useState(false);
  const [respondidos, setRespondidos] = useState(0);
  const [erro, setErro] = useState<string | null>(null);

  const iniciadaEm = useRef(new Date());
  const inicioDoCartao = useRef(Date.now());
  const totalRespondido = useRef(0);
  const sessaoGravada = useRef(false);

  useEffect(() => {
    if (!idioma) return;
    carregarFila(idioma)
      .then((cartoes) => {
        setFila(cartoes);
        inicioDoCartao.current = Date.now();
      })
      .catch((e) => setErro(e instanceof Error ? e.message : String(e)));
  }, [idioma]);

  const gravarSessao = useCallback(() => {
    if (!idioma || sessaoGravada.current) return;
    sessaoGravada.current = true;
    void registrarSessao(idioma, iniciadaEm.current, new Date(), totalRespondido.current);
  }, [idioma]);

  // Sair no meio da sessão também conta o que já foi estudado.
  useEffect(
    () => () => {
      gravarSessao();
      void pararFala();
    },
    [gravarSessao],
  );

  const atual = fila?.[0];
  const previsao = useMemo(
    () => (atual && revelado ? agendador.preverIntervalos(atual, new Date()) : null),
    [atual, revelado],
  );

  function responder(nota: Resposta) {
    if (!fila || !atual) return;
    try {
      const agora = new Date();
      const atualizado = registrarResposta(atual, nota, agora, Date.now() - inicioDoCartao.current);
      const resto = fila.slice(1);
      // Cartões em aprendizado vencem em minutos e voltam no fim desta sessão.
      const novaFila = voltaNaMesmaSessao(atualizado.due, agora) ? [...resto, atualizado] : resto;
      totalRespondido.current += 1;
      setRespondidos(totalRespondido.current);
      setFila(novaFila);
      setRevelado(false);
      inicioDoCartao.current = Date.now();
      if (novaFila.length === 0) gravarSessao();
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  }

  const titulo = idioma ? `Revisão · ${IDIOMAS[idioma].nome}` : 'Revisão';

  if (!idioma) {
    return (
      <Tela>
        <Stack.Screen options={{ title: titulo }} />
        <Paragrafo>Idioma desconhecido.</Paragrafo>
      </Tela>
    );
  }

  if (erro) {
    return (
      <Tela>
        <Stack.Screen options={{ title: titulo }} />
        <Cartao titulo="Erro">
          <Text className="text-base text-red-700 dark:text-red-400">{erro}</Text>
        </Cartao>
      </Tela>
    );
  }

  if (!fila) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-100 dark:bg-slate-950">
        <Stack.Screen options={{ title: titulo }} />
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!atual) {
    return (
      <Tela>
        <Stack.Screen options={{ title: titulo }} />
        <Cartao titulo={respondidos > 0 ? 'Sessão concluída' : 'Nada para revisar agora'}>
          <Paragrafo>
            {respondidos > 0
              ? `Você respondeu ${respondidos} ${respondidos === 1 ? 'cartão' : 'cartões'}. Os próximos aparecem quando vencerem.`
              : 'Não há revisões vencidas nem cartões novos para hoje neste idioma.'}
          </Paragrafo>
          <Botao titulo="Voltar" onPress={() => router.back()} />
        </Cartao>
      </Tela>
    );
  }

  return (
    <Tela>
      <Stack.Screen options={{ title: titulo }} />
      <Text className="text-center text-sm text-slate-500 dark:text-slate-400">
        {fila.length} {fila.length === 1 ? 'cartão restante' : 'cartões restantes'}
      </Text>

      <FaceCartao key={`${atual.id}-${respondidos}`} card={atual} revelado={revelado} />

      {revelado && previsao ? (
        <View className="flex-row gap-2">
          {RESPOSTAS.map(({ nota, rotulo }) => (
            <Pressable
              key={nota}
              accessibilityRole="button"
              accessibilityLabel={`${rotulo}, volta em ${formatarIntervalo(previsao[nota])}`}
              onPress={() => responder(nota)}
              className={`min-h-16 flex-1 items-center justify-center rounded-xl px-1 py-2 active:opacity-80 ${COR_DA_RESPOSTA[nota]}`}>
              <Text className="text-base font-semibold text-white">{rotulo}</Text>
              <Text className="text-xs text-white">{formatarIntervalo(previsao[nota])}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <Botao titulo="Mostrar resposta" onPress={() => setRevelado(true)} />
      )}
    </Tela>
  );
}
