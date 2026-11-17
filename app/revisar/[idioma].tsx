import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Botao } from '@/components/Botao';
import { Cartao } from '@/components/Cartao';
import { FaceCartao } from '@/components/cartoes/FaceCartao';
import { BarraDaSessao } from '@/components/sessao/BarraDaSessao';
import { Tela } from '@/components/Tela';
import { Paragrafo } from '@/components/Texto';
import { carregarFila, registrarResposta, registrarSessao } from '@/db/cartoes';
import type { Card } from '@/db/schema';
import { agendador, formatarIntervalo, RESPOSTAS, type Resposta } from '@/srs/agendador';
import { voltaNaMesmaSessao } from '@/srs/fila';
import { pararFala } from '@/voz/fala';
import { useTema } from '@/ui/tema';
import { CODIGOS_IDIOMA, type Idioma } from '@/voz/idiomas';
import { Pressionavel } from '@/ui/Pressionavel';

/** Errei, Difícil, Bom e Fácil: vermelho, âmbar, verde e azul. */
const COR_DA_RESPOSTA: Record<Resposta, 'erro' | 'ambar' | 'certo' | 'en'> = {
  1: 'erro',
  2: 'ambar',
  3: 'certo',
  4: 'en',
};

function ehIdioma(valor: unknown): valor is Idioma {
  return typeof valor === 'string' && (CODIGOS_IDIOMA as readonly string[]).includes(valor);
}

export default function Revisar() {
  const router = useRouter();
  const tema = useTema();
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


  const sair = () => router.back();
  const total = respondidos + (fila?.length ?? 0);
  const barra = idioma ? (
    <BarraDaSessao
      cor={idioma}
      fracao={total ? respondidos / total : 0}
      texto={`${fila?.length ?? 0} restantes`}
      aoFechar={sair}
    />
  ) : null;

  if (!idioma) {
    return (
      <Tela>
        <Paragrafo>Idioma desconhecido.</Paragrafo>
      </Tela>
    );
  }

  if (erro) {
    return (
      <View className="flex-1 bg-fundo">
        {barra}
        <Tela>
          <Cartao titulo="Erro">
            <Text className="font-corpo text-base text-erro">{erro}</Text>
          </Cartao>
        </Tela>
      </View>
    );
  }

  if (!fila) {
    return (
      <View className="flex-1 items-center justify-center bg-fundo">
        <ActivityIndicator size="large" color={tema.marca} />
      </View>
    );
  }

  if (!atual) {
    return (
      <View className="flex-1 bg-fundo">
        {barra}
        <Tela>
          <View className="items-center gap-4 pt-10">
            <View style={{ backgroundColor: tema.certo, borderBottomColor: tema.certoSombra }} className="h-24 w-24 items-center justify-center rounded-full border-b-[6px]">
              <Ionicons name={respondidos > 0 ? 'checkmark' : 'cafe'} size={52} color="#FFFFFF" />
            </View>
            <Text className="text-center font-titulo text-[28px] text-texto">
              {respondidos > 0 ? 'Sessão concluída!' : 'Nada para revisar agora'}
            </Text>
            <Text className="text-center font-corpo text-base leading-6 text-texto-2">
              {respondidos > 0
                ? `Você respondeu ${respondidos} ${respondidos === 1 ? 'cartão' : 'cartões'}. Os próximos aparecem quando vencerem.`
                : 'Não há revisões vencidas nem cartões novos para hoje nesta língua.'}
            </Text>
          </View>
          <Botao titulo="Voltar" onPress={sair} />
        </Tela>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-fundo">
      {barra}
      <Tela>
        <FaceCartao key={`${atual.id}-${respondidos}`} card={atual} revelado={revelado} />

        {revelado && previsao ? (
          <View className="flex-row flex-wrap gap-3">
            {RESPOSTAS.map(({ nota, rotulo }) => (
              <View key={nota} style={{ width: '47.5%' }}>
                <Pressionavel
                  accessibilityRole="button"
                  accessibilityLabel={`${rotulo}, volta em ${formatarIntervalo(previsao[nota])}`}
                  onPress={() => responder(nota)}
                  style={(pressed) => ({
                    minHeight: 64,
                    borderRadius: 16,
                    backgroundColor: tema[COR_DA_RESPOSTA[nota]],
                    borderBottomWidth: pressed ? 0 : 5,
                    borderBottomColor: tema[`${COR_DA_RESPOSTA[nota]}Sombra`],
                    marginTop: pressed ? 5 : 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                  })}>
                  <Text className="font-titulo text-lg text-white">{rotulo}</Text>
                  <Text className="font-forte text-sm text-white">{formatarIntervalo(previsao[nota])}</Text>
                </Pressionavel>
              </View>
            ))}
          </View>
        ) : (
          <Botao titulo="Mostrar resposta" cor={idioma} onPress={() => setRevelado(true)} />
        )}
      </Tela>
    </View>
  );
}
