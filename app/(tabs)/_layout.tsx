import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';

type NomeDoIcone = ComponentProps<typeof Ionicons>['name'];

/** A barra de abas entrega a cor como ColorValue; o Ionicons só aceita texto. */
function icone(nome: NomeDoIcone) {
  return function IconeDaAba({ color, size }: { color: unknown; size: number }) {
    return <Ionicons name={nome} size={size} color={typeof color === 'string' ? color : undefined} />;
  };
}

export default function LayoutAbas() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#208AEF' }}>
      <Tabs.Screen name="index" options={{ title: 'Início', tabBarIcon: icone('home') }} />
      <Tabs.Screen name="cartoes" options={{ title: 'Cartões', tabBarIcon: icone('albums') }} />
      <Tabs.Screen name="ajustes" options={{ title: 'Ajustes', tabBarIcon: icone('settings') }} />
    </Tabs>
  );
}
