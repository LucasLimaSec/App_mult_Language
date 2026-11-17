import '../global.css';

import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, useColorScheme, View } from 'react-native';

import { sincronizarDecks } from '@/conteudo/decks';
import { db } from '@/db/client';

import migrations from '../drizzle/migrations';

export default function LayoutRaiz() {
  const esquema = useColorScheme();
  // Cria ou atualiza as tabelas antes de qualquer tela usar o banco.
  const { success: bancoPronto, error: erroDaMigration } = useMigrations(db, migrations);
  const [decksProntos, setDecksProntos] = useState(false);
  const [erroDosDecks, setErroDosDecks] = useState<Error | null>(null);

  // Com as tabelas prontas, importa os decks de /data (só faz algo se mudaram).
  useEffect(() => {
    if (!bancoPronto) return;
    sincronizarDecks()
      .then(() => setDecksProntos(true))
      .catch((erro) => setErroDosDecks(erro instanceof Error ? erro : new Error(String(erro))));
  }, [bancoPronto]);

  const erroDoBanco = erroDaMigration ?? erroDosDecks;

  if (erroDoBanco) {
    return (
      <View className="flex-1 items-center justify-center gap-2 bg-white p-6 dark:bg-slate-950">
        <Text className="text-lg font-semibold text-red-700 dark:text-red-400">
          Não foi possível preparar o banco de dados.
        </Text>
        <Text className="text-center text-sm text-slate-600 dark:text-slate-300">
          {erroDoBanco.message}
        </Text>
      </View>
    );
  }

  if (!bancoPronto || !decksProntos) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-slate-950">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider value={esquema === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="revisar/[idioma]" options={{ title: 'Revisão' }} />
        <Stack.Screen name="adicionar" options={{ title: 'Adicionar palavra' }} />
        <Stack.Screen name="unidade/[id]" options={{ title: 'Unidade' }} />
        <Stack.Screen name="licao/[id]" options={{ title: 'Lição' }} />
        <Stack.Screen name="testes/banco" options={{ title: 'Teste do banco' }} />
        <Stack.Screen name="testes/audio" options={{ title: 'Teste de áudio' }} />
        <Stack.Screen name="testes/voz" options={{ title: 'Teste de voz' }} />
      </Stack>
    </ThemeProvider>
  );
}
