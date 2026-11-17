import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FONTES, useTema } from '@/ui/tema';

type NomeDoIcone = ComponentProps<typeof Ionicons>['name'];

/** Ícone da aba; a aba ativa ganha uma "pílula" na cor da marca. */
function icone(nome: NomeDoIcone, nomeAtivo: NomeDoIcone) {
  return function IconeDaAba({ focused }: { focused: boolean }) {
    const tema = useTema();
    return (
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 3,
          borderRadius: 14,
          borderWidth: 2,
          borderColor: focused ? tema.marca : 'transparent',
          backgroundColor: focused ? tema.marcaClara : 'transparent',
        }}>
        <Ionicons name={focused ? nomeAtivo : nome} size={24} color={focused ? tema.marca : tema.texto2} />
      </View>
    );
  };
}

export default function LayoutAbas() {
  const tema = useTema();
  const margens = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tema.marca,
        tabBarInactiveTintColor: tema.texto2,
        // A pílula da aba ativa é mais larga que a caixa padrão do ícone (cerca de 31 px).
        tabBarIconStyle: { width: 64, height: 34 },
        tabBarLabelStyle: { fontFamily: FONTES.forte, fontSize: 12, marginTop: 4 },
        tabBarStyle: {
          backgroundColor: tema.superficie,
          borderTopWidth: 2,
          borderTopColor: tema.borda,
          height: 72 + margens.bottom,
          paddingTop: 8,
        },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Início', tabBarIcon: icone('home-outline', 'home') }} />
      <Tabs.Screen name="licoes" options={{ title: 'Lições', tabBarIcon: icone('book-outline', 'book') }} />
      <Tabs.Screen name="cartoes" options={{ title: 'Cartões', tabBarIcon: icone('albums-outline', 'albums') }} />
      <Tabs.Screen name="ajustes" options={{ title: 'Ajustes', tabBarIcon: icone('options-outline', 'options') }} />
    </Tabs>
  );
}
