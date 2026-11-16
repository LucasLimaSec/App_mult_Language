import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Botao } from '@/components/Botao';
import { Cartao } from '@/components/Cartao';
import { Etiqueta } from '@/components/Etiqueta';
import { Tela } from '@/components/Tela';
import { Apoio, Paragrafo } from '@/components/Texto';
import { contarVozes, falar, pararFala, type ResumoVozes } from '@/voz/fala';
import { LISTA_IDIOMAS, type Idioma } from '@/voz/idiomas';

export default function TesteAudio() {
  const [vozes, setVozes] = useState<Record<Idioma, ResumoVozes> | null>(null);
  const [falando, setFalando] = useState<Idioma | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    contarVozes()
      .then(setVozes)
      .catch((e) => setErro(e instanceof Error ? e.message : String(e)));
    return () => {
      void pararFala();
    };
  }, []);

  function ouvir(idioma: Idioma, frase: string, velocidade: number) {
    setErro(null);
    void falar(frase, idioma, {
      velocidade,
      aoComecar: () => setFalando(idioma),
      aoTerminar: () => setFalando((atual) => (atual === idioma ? null : atual)),
      aoFalhar: (e) => {
        setFalando(null);
        setErro(e.message);
      },
    });
  }

  return (
    <Tela>
      <Cartao titulo="Como testar">
        <Paragrafo>
          Ative o modo avião e toque em Ouvir em cada língua. Se alguma ficar muda ou sair com
          sotaque errado, instale a voz em Configurações do Android → Sistema → Idiomas → Saída de
          texto para voz.
        </Paragrafo>
      </Cartao>

      {LISTA_IDIOMAS.map((idioma) => {
        const resumo = vozes?.[idioma.codigo];
        return (
          <Cartao key={idioma.codigo} titulo={idioma.nome} subtitulo={idioma.locale}>
            {resumo ? (
              resumo.naVariante > 0 ? (
                <Etiqueta tom="ok" texto={`${resumo.naVariante} voz(es) em ${idioma.locale}`} />
              ) : resumo.noIdioma > 0 ? (
                <Etiqueta
                  tom="aviso"
                  texto={`Sem voz ${idioma.locale}; ${resumo.noIdioma} em outra variante`}
                />
              ) : (
                <Etiqueta tom="erro" texto="Nenhuma voz deste idioma" />
              )
            ) : null}
            <View className="gap-1">
              <Text className="text-xl text-slate-900 dark:text-slate-50">{idioma.fraseTeste}</Text>
              <Apoio>{idioma.traducaoTeste}</Apoio>
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Botao
                  titulo={falando === idioma.codigo ? 'Falando…' : 'Ouvir'}
                  onPress={() => ouvir(idioma.codigo, idioma.fraseTeste, 1.0)}
                />
              </View>
              <View className="flex-1">
                <Botao
                  titulo="Devagar"
                  variante="secundario"
                  onPress={() => ouvir(idioma.codigo, idioma.fraseTeste, 0.6)}
                />
              </View>
            </View>
          </Cartao>
        );
      })}

      {erro ? (
        <Cartao titulo="Erro">
          <Text className="text-base text-red-700 dark:text-red-400">{erro}</Text>
        </Cartao>
      ) : null}
    </Tela>
  );
}
