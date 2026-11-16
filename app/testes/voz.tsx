import { useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Botao } from '@/components/Botao';
import { Cartao } from '@/components/Cartao';
import { Etiqueta, type TomEtiqueta } from '@/components/Etiqueta';
import { Tela } from '@/components/Tela';
import { Apoio, Paragrafo } from '@/components/Texto';
import { LISTA_IDIOMAS, type Idioma } from '@/voz/idiomas';
import {
  baixarModelo,
  cancelarEscuta,
  comecarEscuta,
  descreverErroVoz,
  diagnosticarVoz,
  pararEscuta,
  type DiagnosticoVoz,
  type StatusModelo,
} from '@/voz/reconhecimento';

const ETIQUETA_MODELO: Record<StatusModelo, { texto: string; tom: TomEtiqueta }> = {
  instalado: { texto: 'Modelo offline instalado', tom: 'ok' },
  faltando: { texto: 'Modelo offline não baixado', tom: 'aviso' },
  nao_suportado: { texto: 'Idioma não oferecido pelo aparelho', tom: 'erro' },
  desconhecido: { texto: 'Não foi possível verificar', tom: 'neutro' },
};

function simOuNao(valor: boolean): string {
  return valor ? 'Sim' : 'Não';
}

export default function TesteVoz() {
  const [diagnostico, setDiagnostico] = useState<DiagnosticoVoz | null>(null);
  /** Idioma que está sendo ouvido agora. */
  const [ouvindo, setOuvindo] = useState<Idioma | null>(null);
  const [transcricoes, setTranscricoes] = useState<Partial<Record<Idioma, string>>>({});
  const [avisos, setAvisos] = useState<Partial<Record<Idioma, string>>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const atualizar = useCallback(async () => {
    try {
      setDiagnostico(await diagnosticarVoz());
      setErroGeral(null);
    } catch (e) {
      setErroGeral(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    void atualizar();
    return () => cancelarEscuta();
  }, [atualizar]);

  useSpeechRecognitionEvent('result', (evento) => {
    if (!ouvindo) return;
    const texto = evento.results[0]?.transcript ?? '';
    setTranscricoes((atual) => ({ ...atual, [ouvindo]: texto }));
  });

  useSpeechRecognitionEvent('error', (evento) => {
    if (!ouvindo || evento.error === 'aborted') return;
    setAvisos((atual) => ({ ...atual, [ouvindo]: descreverErroVoz(evento.error) }));
  });

  useSpeechRecognitionEvent('end', () => setOuvindo(null));

  async function falar(idioma: Idioma) {
    setAvisos((atual) => ({ ...atual, [idioma]: undefined }));
    setTranscricoes((atual) => ({ ...atual, [idioma]: '' }));
    try {
      const comecou = await comecarEscuta(idioma, diagnostico?.modelos[idioma].localeDoAparelho);
      if (comecou) {
        setOuvindo(idioma);
      } else {
        setAvisos((atual) => ({ ...atual, [idioma]: descreverErroVoz('not-allowed') }));
      }
    } catch (e) {
      setAvisos((atual) => ({ ...atual, [idioma]: e instanceof Error ? e.message : String(e) }));
    }
  }

  async function baixar(idioma: Idioma) {
    try {
      const resultado = await baixarModelo(idioma, diagnostico?.modelos[idioma].localeDoAparelho);
      const mensagem =
        resultado === 'baixado'
          ? 'Modelo baixado.'
          : resultado === 'agendado'
            ? 'Download agendado. Conecte ao Wi-Fi e toque em Verificar de novo daqui a pouco.'
            : 'Confirme o download na janela do Android e depois toque em Verificar de novo.';
      setAvisos((atual) => ({ ...atual, [idioma]: mensagem }));
      await atualizar();
    } catch (e) {
      const detalhe = e instanceof Error ? e.message : String(e);
      setAvisos((atual) => ({
        ...atual,
        [idioma]: `Não foi possível pedir o download: ${detalhe}`,
      }));
    }
  }

  return (
    <Tela>
      <Cartao titulo="Como testar">
        <Paragrafo>
          Com internet, baixe os modelos que faltarem. Depois ative o modo avião, toque em Falar e
          leia a frase em voz alta: a transcrição precisa aparecer mesmo sem conexão.
        </Paragrafo>
      </Cartao>

      <Cartao titulo="Aparelho">
        {diagnostico ? (
          <View className="gap-1">
            <Apoio>Android (nível de API): {diagnostico.versaoAndroid}</Apoio>
            <Apoio>
              Reconhecimento de voz disponível: {simOuNao(diagnostico.reconhecimentoDisponivel)}
            </Apoio>
            <Apoio>Reconhecimento no aparelho: {simOuNao(diagnostico.suportaNoAparelho)}</Apoio>
            <Apoio>Serviço padrão: {diagnostico.servicoPadrao || 'nenhum'}</Apoio>
          </View>
        ) : (
          <Apoio>Consultando o aparelho…</Apoio>
        )}
        {diagnostico && !diagnostico.consegueListarModelos ? (
          <Paragrafo>
            No Android 12 o sistema não informa quais modelos offline estão instalados nem permite
            pedir o download pelo app. Teste direto com o botão Falar em modo avião.
          </Paragrafo>
        ) : null}
        {diagnostico?.erro ? (
          <Text className="text-sm text-red-700 dark:text-red-400">
            Erro ao listar os modelos: {diagnostico.erro}
          </Text>
        ) : null}
        <Botao titulo="Verificar de novo" variante="secundario" onPress={atualizar} />
      </Cartao>

      {LISTA_IDIOMAS.map((idioma) => {
        const modelo = diagnostico?.modelos[idioma.codigo];
        const etiqueta = modelo ? ETIQUETA_MODELO[modelo.status] : null;
        const ativo = ouvindo === idioma.codigo;
        const transcricao = transcricoes[idioma.codigo];
        const aviso = avisos[idioma.codigo];
        return (
          <Cartao key={idioma.codigo} titulo={idioma.nome} subtitulo={idioma.locale}>
            {etiqueta ? <Etiqueta texto={etiqueta.texto} tom={etiqueta.tom} /> : null}
            <View className="gap-1">
              <Apoio>Leia em voz alta:</Apoio>
              <Text className="text-xl text-slate-900 dark:text-slate-50">{idioma.fraseTeste}</Text>
            </View>
            <View className="min-h-16 gap-1 rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
              <Apoio>{ativo ? 'Ouvindo…' : 'O aparelho entendeu:'}</Apoio>
              <Text className="text-lg text-slate-900 dark:text-slate-50">{transcricao || '—'}</Text>
            </View>
            {aviso ? <Text className="text-sm text-amber-700 dark:text-amber-300">{aviso}</Text> : null}
            <View className="flex-row gap-3">
              <View className="flex-1">
                {ativo ? (
                  <Botao titulo="Parar" variante="perigo" onPress={pararEscuta} />
                ) : (
                  <Botao
                    titulo="Falar"
                    onPress={() => falar(idioma.codigo)}
                    desabilitado={ouvindo !== null}
                  />
                )}
              </View>
              {modelo?.status === 'faltando' ? (
                <View className="flex-1">
                  <Botao
                    titulo="Baixar modelo"
                    variante="secundario"
                    onPress={() => baixar(idioma.codigo)}
                  />
                </View>
              ) : null}
            </View>
          </Cartao>
        );
      })}

      {erroGeral ? (
        <Cartao titulo="Erro">
          <Text className="text-base text-red-700 dark:text-red-400">{erroGeral}</Text>
        </Cartao>
      ) : null}
    </Tela>
  );
}
