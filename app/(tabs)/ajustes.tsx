import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { BotaoIcone } from '@/components/Botao';
import { Cartao } from '@/components/Cartao';
import { Tela } from '@/components/Tela';
import { Apoio, Titulo } from '@/components/Texto';
import { INFO_DICIONARIO } from '@/chines/dicionario';
import { gravarNovosPorDia, lerNovosPorDia, NOVOS_POR_DIA_MAXIMO } from '@/db/cartoes';
import { coresDoDestaque, useTema } from '@/ui/tema';
import type { Idioma } from '@/voz/idiomas';

const IDIOMAS_COM_CARTOES: Idioma[] = ['es', 'zh'];
const NOMES: Record<Idioma, string> = { en: 'Inglês', es: 'Espanhol', zh: 'Chinês' };

type Teste = { rota: Href; titulo: string; descricao: string; icone: 'server' | 'volume-high' | 'mic' };

const TESTES: Teste[] = [
  { rota: '/testes/banco', titulo: 'Banco de dados', descricao: 'Grava e lê um dado no aparelho, para conferir em modo avião.', icone: 'server' },
  { rota: '/testes/audio', titulo: 'Áudio', descricao: 'A voz do sistema lê uma frase em cada língua.', icone: 'volume-high' },
  { rota: '/testes/voz', titulo: 'Reconhecimento de voz', descricao: 'Verifica os modelos offline e transcreve o que você fala.', icone: 'mic' },
];

export default function Ajustes() {
  const router = useRouter();
  const tema = useTema();
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
    <Tela semCabecalho>
      <Titulo>Ajustes</Titulo>

      <Cartao titulo="Cartões novos por dia" subtitulo="Vale a partir da próxima sessão. Com 0, você só faz revisões.">
        {IDIOMAS_COM_CARTOES.map((idioma) => {
          const valor = novos[idioma] ?? 0;
          const cor = coresDoDestaque(tema, idioma);
          return (
            <View key={idioma} className="flex-row items-center justify-between rounded-2xl bg-superficie-2 px-3.5 py-3">
              <Text className="font-titulo text-[17px] text-texto">{NOMES[idioma]}</Text>
              <View className="flex-row items-center gap-3">
                <BotaoIcone
                  icone="remove"
                  descricao={`Menos cartões novos de ${NOMES[idioma]}`}
                  cor={idioma}
                  variante="claro"
                  tamanho={44}
                  onPress={() => mudar(idioma, valor - 1)}
                />
                <Text style={{ color: cor.cor }} className="w-9 text-center font-titulo text-2xl">
                  {novos[idioma] ?? '–'}
                </Text>
                <BotaoIcone icone="add" descricao={`Mais cartões novos de ${NOMES[idioma]}`} cor={idioma} tamanho={44} onPress={() => mudar(idioma, valor + 1)} />
              </View>
            </View>
          );
        })}
      </Cartao>

      <Cartao titulo="Testes do aparelho" subtitulo="Faça os três em modo avião.">
        {TESTES.map((teste) => (
          <Pressable
            key={teste.titulo}
            accessibilityRole="button"
            onPress={() => router.push(teste.rota)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              borderRadius: 18,
              borderWidth: 2,
              borderColor: tema.borda,
              backgroundColor: tema.superficie,
              borderBottomWidth: pressed ? 2 : 5,
              marginTop: pressed ? 3 : 0,
            })}>
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-marca-clara">
              <Ionicons name={teste.icone} size={22} color={tema.marca} />
            </View>
            <View className="flex-1 gap-0.5">
              <Text className="font-titulo text-base text-texto">{teste.titulo}</Text>
              <Apoio>{teste.descricao}</Apoio>
            </View>
            <Ionicons name="chevron-forward" size={22} color={tema.texto2} />
          </Pressable>
        ))}
      </Cartao>

      <Cartao titulo="Créditos">
        <Apoio>
          Dicionário de chinês: CC-CEDICT, publicado pela MDBG sob a licença CC BY-SA 4.0 ({INFO_DICIONARIO.palavras.toLocaleString('pt-BR')}{' '}
          entradas).
        </Apoio>
        <Apoio>
          Ordem dos traços: Make Me a Hanzi / hanzi-writer-data, sob a Arphic Public License (
          {INFO_DICIONARIO.caracteres.toLocaleString('pt-BR')} caracteres).
        </Apoio>
        <Apoio>Fonte Nunito, sob a SIL Open Font License.</Apoio>
      </Cartao>

      <Apoio>Versão {Constants.expoConfig?.version ?? '?'}</Apoio>
    </Tela>
  );
}
