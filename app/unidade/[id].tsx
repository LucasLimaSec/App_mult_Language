import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { BotaoAudio } from '@/components/cartoes/BotaoAudio';
import { Cartao } from '@/components/Cartao';
import { Tela } from '@/components/Tela';
import { Apoio, Paragrafo } from '@/components/Texto';
import { unidadeDoCurriculo, unidadeEscrita } from '@/conteudo/unidades';
import { lerProgresso } from '@/db/licoes';
import type { Lesson } from '@/db/schema';

function IconeStatus({ linha }: { linha?: Lesson }) {
  if (linha?.status === 'concluida') return <Ionicons name="checkmark-circle" size={26} color="#16a34a" />;
  if (linha?.status === 'em_andamento') return <Ionicons name="ellipse-outline" size={26} color="#208AEF" />;
  return <Ionicons name="ellipse-outline" size={26} color="#94a3b8" />;
}

export default function TelaUnidade() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const unidadeC = id ? unidadeDoCurriculo(id) : undefined;
  const escrita = id ? unidadeEscrita(id) : undefined;
  const [progresso, setProgresso] = useState<Record<string, Lesson>>({});

  useFocusEffect(
    useCallback(() => {
      if (!escrita) return;
      let ativo = true;
      lerProgresso(escrita.idioma)
        .then((p) => ativo && setProgresso(p))
        .catch(() => undefined);
      return () => {
        ativo = false;
      };
    }, [escrita]),
  );

  if (!unidadeC) {
    return (
      <Tela>
        <Paragrafo>Unidade não encontrada.</Paragrafo>
      </Tela>
    );
  }

  const numero = Number(unidadeC.id.split('-u')[1]);

  return (
    <Tela>
      <Stack.Screen options={{ title: `Unidade ${numero}` }} />
      <View className="gap-1">
        <Text className="text-2xl font-bold text-slate-900 dark:text-slate-50">{unidadeC.titulo}</Text>
        <Paragrafo>{unidadeC.objetivo}</Paragrafo>
      </View>

      <Cartao titulo="Lessons">
        {unidadeC.licoes.map((l, i) => {
          const disponivel = escrita?.licoes.some((x) => x.id === l.id);
          const linha = progresso[l.id];
          return (
            <Pressable
              key={l.id}
              accessibilityRole="button"
              disabled={!disponivel}
              onPress={() => router.push({ pathname: '/licao/[id]', params: { id: l.id } })}
              className={`flex-row items-center gap-3 rounded-xl bg-slate-100 p-3 active:opacity-70 dark:bg-slate-800 ${
                disponivel ? '' : 'opacity-50'
              }`}>
              <IconeStatus linha={linha} />
              <View className="flex-1">
                <Text className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  {i + 1}. {l.titulo}
                </Text>
                <Apoio>
                  {!disponivel
                    ? 'Em breve'
                    : linha?.status === 'concluida'
                      ? `Concluída · ${linha.acertos} de ${linha.totalExercicios} acertos`
                      : linha?.status === 'em_andamento'
                        ? 'Em andamento'
                        : 'Não iniciada'}
                  {linha?.duvida ? ' · ❓ dúvida' : ''}
                </Apoio>
              </View>
              {disponivel ? <Ionicons name="chevron-forward" size={20} color="#94a3b8" /> : null}
            </Pressable>
          );
        })}
      </Cartao>

      <Cartao titulo="Grammar">
        {unidadeC.gramatica.map((g, i) => (
          <Text key={i} className="text-base text-slate-700 dark:text-slate-300">
            • {g}
          </Text>
        ))}
      </Cartao>

      {escrita?.falsosAmigos?.length ? (
        <Cartao titulo="False friends" subtitulo="Falsos amigos do português">
          {escrita.falsosAmigos.map((f) => (
            <View key={f.palavra} className="gap-1 rounded-xl bg-amber-50 p-3 dark:bg-slate-800">
              <View className="flex-row items-center gap-2">
                <Text className="flex-1 text-lg font-bold text-slate-900 dark:text-slate-50">
                  {f.palavra} <Text className="text-base font-normal text-slate-600 dark:text-slate-300">= {f.significado}</Text>
                </Text>
                <BotaoAudio texto={f.exemplo} idioma="es" descricao={`Ouvir o exemplo de ${f.palavra}`} tamanho={18} />
              </View>
              <Text className="text-sm text-amber-800 dark:text-amber-200">⚠️ {f.portugues}</Text>
              <Text className="text-base italic text-slate-800 dark:text-slate-200">{f.exemplo}</Text>
              <Apoio>{f.exemploEn}</Apoio>
            </View>
          ))}
        </Cartao>
      ) : null}
    </Tela>
  );
}
