import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Link, type Href } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Cartao } from '@/components/Cartao';
import { Tela } from '@/components/Tela';
import { Apoio } from '@/components/Texto';

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

export default function Ajustes() {
  return (
    <Tela>
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

      <Apoio>Versão {Constants.expoConfig?.version ?? '?'}</Apoio>
    </Tela>
  );
}
