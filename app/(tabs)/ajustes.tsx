import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Link, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { INFO_DICIONARIO } from '@/chines/dicionario';
import { Cartao } from '@/components/Cartao';
import { Tela } from '@/components/Tela';
import { Apoio } from '@/components/Texto';
import { gravarNovosPorDia, lerNovosPorDia, NOVOS_POR_DIA_MAXIMO } from '@/db/cartoes';
import { IDIOMAS, type Idioma } from '@/voz/idiomas';

const IDIOMAS_COM_CARTOES: Idioma[] = ['es', 'zh'];

type Teste = { rota: Href; titulo: string; descricao: string };

const TESTES: Teste[] = [
  {
    rota: '/testes/banco',
    titulo: 'Banco de dados',
    descricao: 'Grava e lê um dado no aparelho, para conferir em modo avião.',
  },
  {
    rota: '/testes/audio',
    titulo: 'Áudio',
    descricao: 'A voz do sistema lê uma frase em cada língua.',
  },
  {
    rota: '/testes/voz',
    titulo: 'Reconhecimento de voz',
    descricao: 'Verifica os modelos offline e transcreve o que você fala.',
  },
];

function BotaoPasso({ icone, descricao, onPress, desabilitado }: {
  icone: 'remove' | 'add';
  descricao: string;
  onPress: () => void;
  desabilitado: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={descricao}
      disabled={desabilitado}
      onPress={onPress}
      className={`h-11 w-11 items-center justify-center rounded-full bg-slate-200 active:opacity-70 dark:bg-slate-700 ${
        desabilitado ? 'opacity-40' : ''
      }`}>
      <Ionicons name={icone} size={22} color="#208AEF" />
    </Pressable>
  );
}

export default function Ajustes() {
  const [novos, setNovos] = useState<Partial<Record<Idioma, number>>>({});

  useEffect(() => {
    Promise.all(IDIOMAS_COM_CARTOES.map(async (idioma) => [idioma, await lerNovosPorDia(idioma)] as const))
      .then((pares) => setNovos(Object.fromEntries(pares)))
      .catch(() => setNovos({}));
  }, []);

  function mudar(idioma: Idioma, valor: number) {
    const limitado = Math.min(NOVOS_POR_DIA_MAXIMO, Math.max(0, valor));
    setNovos((atual) => ({ ...atual, [idioma]: limitado }));
    void gravarNovosPorDia(idioma, limitado);
  }

  return (
    <Tela>
      <Cartao
        titulo="Cartões novos por dia"
        subtitulo="Vale a partir da próxima sessão. Com 0, você só faz revisões.">
        {IDIOMAS_COM_CARTOES.map((idioma) => {
          const valor = novos[idioma];
          return (
            <View key={idioma} className="flex-row items-center justify-between">
              <Text className="text-base text-slate-900 dark:text-slate-50">{IDIOMAS[idioma].nome}</Text>
              <View className="flex-row items-center gap-3">
                <BotaoPasso
                  icone="remove"
                  descricao={`Menos cartões novos de ${IDIOMAS[idioma].nome}`}
                  desabilitado={valor === undefined || valor <= 0}
                  onPress={() => mudar(idioma, (valor ?? 0) - 1)}
                />
                <Text className="w-8 text-center text-xl font-semibold text-slate-900 dark:text-slate-50">
                  {valor ?? '–'}
                </Text>
                <BotaoPasso
                  icone="add"
                  descricao={`Mais cartões novos de ${IDIOMAS[idioma].nome}`}
                  desabilitado={valor === undefined || valor >= NOVOS_POR_DIA_MAXIMO}
                  onPress={() => mudar(idioma, (valor ?? 0) + 1)}
                />
              </View>
            </View>
          );
        })}
      </Cartao>

      <Cartao titulo="Testes do aparelho" subtitulo="Faça os três em modo avião.">
        {TESTES.map((teste) => (
          <Link key={teste.titulo} href={teste.rota} asChild>
            <Pressable className="flex-row items-center gap-3 rounded-xl bg-slate-100 p-3 active:opacity-70 dark:bg-slate-800">
              <View className="flex-1 gap-1">
                <Text className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  {teste.titulo}
                </Text>
                <Apoio>{teste.descricao}</Apoio>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            </Pressable>
          </Link>
        ))}
      </Cartao>

      <Cartao titulo="Créditos">
        <Apoio>
          Dicionário de chinês: CC-CEDICT, publicado pela MDBG sob a licença CC BY-SA 4.0 (
          {INFO_DICIONARIO.palavras.toLocaleString('pt-BR')} entradas).
        </Apoio>
        <Apoio>
          Ordem dos traços: Make Me a Hanzi / hanzi-writer-data, sob a Arphic Public License (
          {INFO_DICIONARIO.caracteres.toLocaleString('pt-BR')} caracteres).
        </Apoio>
      </Cartao>

      <Apoio>Versão {Constants.expoConfig?.version ?? '?'}</Apoio>
    </Tela>
  );
}
