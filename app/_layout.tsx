import '../global.css';

import { Nunito_600SemiBold } from '@expo-google-fonts/nunito/600SemiBold';
import { Nunito_700Bold } from '@expo-google-fonts/nunito/700Bold';
import { Nunito_800ExtraBold } from '@expo-google-fonts/nunito/800ExtraBold';
import { Nunito_900Black } from '@expo-google-fonts/nunito/900Black';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { sincronizarDecks } from '@/conteudo/decks';
import { db } from '@/db/client';
import { FONTES, useModo, useTema, useVariaveisDoTema } from '@/ui/tema';

import migrations from '../drizzle/migrations';

void SplashScreen.preventAutoHideAsync();

export default function LayoutRaiz() {
  const modo = useModo();
  const tema = useTema();
  const variaveis = useVariaveisDoTema();

  const [fontesProntas, erroDasFontes] = useFonts({ Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black });
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
  // Sem as fontes o app ainda funciona, com a fonte do sistema.
  const pronto = (fontesProntas || Boolean(erroDasFontes)) && ((bancoPronto && decksProntos) || Boolean(erroDoBanco));

  useEffect(() => {
    if (pronto) void SplashScreen.hideAsync();
  }, [pronto]);

  const temaDaNavegacao = useMemo<Theme>(() => {
    const base = modo === 'escuro' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: tema.marca,
        background: tema.fundo,
        card: tema.fundo,
        text: tema.texto,
        border: tema.borda,
        notification: tema.erro,
      },
      fonts: {
        regular: { fontFamily: FONTES.corpo, fontWeight: 'normal' },
        medium: { fontFamily: FONTES.forte, fontWeight: 'normal' },
        bold: { fontFamily: FONTES.titulo, fontWeight: 'normal' },
        heavy: { fontFamily: FONTES.titulo, fontWeight: 'normal' },
      },
    };
  }, [modo, tema]);

  if (!pronto) return null;

  if (erroDoBanco) {
    return (
      <View style={[{ flex: 1 }, variaveis]} className="items-center justify-center gap-2 bg-fundo p-6">
        <Text className="text-center font-titulo text-lg text-erro">Não foi possível preparar o banco de dados.</Text>
        <Text className="text-center font-semi text-sm text-texto-2">{erroDoBanco.message}</Text>
      </View>
    );
  }

  return (
    <View style={[{ flex: 1 }, variaveis]}>
      <ThemeProvider value={temaDaNavegacao}>
        <StatusBar style={modo === 'escuro' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: tema.fundo },
            headerShadowVisible: false,
            headerTintColor: tema.texto,
            headerTitleStyle: { fontFamily: FONTES.titulo, fontSize: 20, color: tema.texto },
            contentStyle: { backgroundColor: tema.fundo },
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="revisar/[idioma]" options={{ headerShown: false }} />
          <Stack.Screen name="adicionar" options={{ title: 'Adicionar palavra' }} />
          <Stack.Screen name="unidade/[id]" options={{ title: 'Unidade' }} />
          <Stack.Screen name="licao/[id]" options={{ title: 'Lição' }} />
          <Stack.Screen name="testes/banco" options={{ title: 'Teste do banco' }} />
          <Stack.Screen name="testes/audio" options={{ title: 'Teste de áudio' }} />
          <Stack.Screen name="testes/voz" options={{ title: 'Teste de voz' }} />
        </Stack>
      </ThemeProvider>
    </View>
  );
}
