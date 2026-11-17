import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';

import { BotaoIcone } from '@/components/Botao';
import { Cartao } from '@/components/Cartao';
import { Tela } from '@/components/Tela';
import { Apoio, Paragrafo } from '@/components/Texto';
import { localizarUnidade, unidadeDoCurriculo, unidadeEscrita } from '@/conteudo/unidades';
import { lerProgresso } from '@/db/licoes';
import type { Lesson } from '@/db/schema';
import { coresDoDestaque, useModo, useTema } from '@/ui/tema';
import { falar } from '@/voz/fala';
import type { Idioma } from '@/voz/idiomas';
import { Pressionavel } from '@/ui/Pressionavel';

export default function TelaUnidade() {
  const router = useRouter();
  const tema = useTema();
  const modo = useModo();
  const { id } = useLocalSearchParams<{ id: string }>();
  const unidadeC = id ? unidadeDoCurriculo(id) : undefined;
  const escrita = id ? unidadeEscrita(id) : undefined;
  const local = id ? localizarUnidade(id) : undefined;
  const idioma = (id?.split('-')[0] ?? 'es') as Idioma;
  const destaque = coresDoDestaque(tema, idioma);
  const [progresso, setProgresso] = useState<Record<string, Lesson>>({});

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      lerProgresso(idioma)
        .then((p) => ativo && setProgresso(p))
        .catch(() => undefined);
      return () => {
        ativo = false;
      };
    }, [idioma]),
  );

  if (!unidadeC || !local) {
    return (
      <Tela>
        <Paragrafo>Unidade não encontrada.</Paragrafo>
      </Tela>
    );
  }

  return (
    <Tela>
      <Stack.Screen options={{ title: `${local.nivel} · Unidade ${local.numero}` }} />

      <View style={{ backgroundColor: destaque.cor, borderBottomColor: destaque.sombra }} className="gap-1.5 rounded-3xl border-b-[6px] p-5">
        <Text className="font-titulo text-2xl leading-7 text-white">{unidadeC.titulo}</Text>
        <Text className="font-corpo text-base leading-6 text-white">{unidadeC.objetivo}</Text>
      </View>

      <Cartao titulo="Lessons">
        {unidadeC.licoes.map((l, i) => {
          const disponivel = escrita?.licoes.some((x) => x.id === l.id) ?? false;
          const linha = progresso[l.id];
          const concluida = linha?.status === 'concluida';
          return (
            <Pressionavel
              key={l.id}
              accessibilityRole="button"
              disabled={!disponivel}
              onPress={() => router.push({ pathname: '/licao/[id]', params: { id: l.id } })}
              style={(pressed) => ({
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
                opacity: disponivel ? 1 : 0.55,
              })}>
              <View
                style={{
                  backgroundColor: concluida ? destaque.cor : destaque.clara,
                  borderBottomColor: destaque.sombra,
                }}
                className="h-11 w-11 items-center justify-center rounded-full border-b-4">
                {concluida ? (
                  <Ionicons name="checkmark" size={24} color="#FFFFFF" />
                ) : (
                  <Text style={{ color: modo === 'escuro' ? destaque.cor : destaque.sombra }} className="font-titulo text-lg">
                    {i + 1}
                  </Text>
                )}
              </View>
              <View className="flex-1">
                <Text className="font-titulo text-base text-texto">{l.titulo}</Text>
                <Apoio>
                  {!disponivel
                    ? 'Em breve'
                    : concluida
                      ? `Concluída · ${linha.acertos} de ${linha.totalExercicios} acertos`
                      : linha?.status === 'em_andamento'
                        ? 'Em andamento'
                        : 'Não iniciada'}
                  {linha?.duvida ? ' · dúvida marcada' : ''}
                </Apoio>
              </View>
              {disponivel ? <Ionicons name="chevron-forward" size={22} color={tema.texto2} /> : null}
            </Pressionavel>
          );
        })}
      </Cartao>

      <Cartao titulo="Grammar">
        {unidadeC.gramatica.map((g, i) => (
          <View key={i} className="flex-row gap-2.5">
            <View style={{ backgroundColor: destaque.cor }} className="mt-2 h-2 w-2 rounded-full" />
            <Text className="flex-1 font-corpo text-base leading-6 text-texto">{g}</Text>
          </View>
        ))}
      </Cartao>

      {escrita?.falsosAmigos?.length ? (
        <Cartao titulo="False friends" subtitulo="Falsos amigos do português">
          {escrita.falsosAmigos.map((f) => (
            <View key={f.palavra} className="gap-1.5 rounded-2xl bg-ambar-clara p-3.5">
              <View className="flex-row items-center gap-3">
                <View className="flex-1">
                  <Text className="font-titulo text-lg text-texto">{f.palavra}</Text>
                  <Text className="font-forte text-base text-texto-2">= {f.significado}</Text>
                </View>
                <BotaoIcone icone="volume-high" descricao={`Ouvir o exemplo de ${f.palavra}`} cor="en" tamanho={44} onPress={() => void falar(f.exemplo, 'es')} />
              </View>
              <View className="flex-row gap-2">
                <Ionicons name="warning" size={18} color={tema.ambar} style={{ marginTop: 2 }} />
                <Text className="flex-1 font-corpo text-sm leading-5 text-ambar-texto">{f.portugues}</Text>
              </View>
              <Text className="font-forte text-base italic text-texto">{f.exemplo}</Text>
              <Apoio>{f.exemploEn}</Apoio>
            </View>
          ))}
        </Cartao>
      ) : null}
    </Tela>
  );
}
