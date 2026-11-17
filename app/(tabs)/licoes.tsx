import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Botao } from '@/components/Botao';
import { Cartao } from '@/components/Cartao';
import { Tela } from '@/components/Tela';
import { Apoio } from '@/components/Texto';
import { IDIOMAS_COM_LICOES, lerCurriculo, nomeDoNivel, proximaLicao, unidadeEscrita } from '@/conteudo/unidades';
import { lerProgresso } from '@/db/licoes';
import type { Lesson } from '@/db/schema';
import { IDIOMAS, type Idioma } from '@/voz/idiomas';

export default function Licoes() {
  const router = useRouter();
  const [idioma, setIdioma] = useState<Idioma>('es');
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

  const curriculo = lerCurriculo(idioma);
  const proxima = proximaLicao(idioma, progresso);

  return (
    <Tela>
      <View className="flex-row gap-3">
        {IDIOMAS_COM_LICOES.map((codigo) => (
          <View key={codigo} className="flex-1">
            <Botao
              titulo={IDIOMAS[codigo].nome}
              variante={codigo === idioma ? 'primario' : 'secundario'}
              onPress={() => setIdioma(codigo)}
            />
          </View>
        ))}
      </View>

      {proxima ? (
        <Cartao titulo="Próxima lição" subtitulo={proxima.titulo}>
          <Botao
            titulo="Continuar"
            onPress={() => router.push({ pathname: '/licao/[id]', params: { id: proxima.id } })}
          />
        </Cartao>
      ) : null}

      {curriculo?.niveis.map((nivel) => (
        <View key={nivel.id} className="gap-2">
          <Text className="pt-2 text-lg font-bold text-slate-900 dark:text-slate-50">{nomeDoNivel(nivel.id)}</Text>
          {nivel.unidades.map((u) => {
            const escrita = unidadeEscrita(u.id);
            const feitas = u.licoes.filter((l) => progresso[l.id]?.status === 'concluida').length;
            const numero = Number(u.id.split('-u')[1]);
            return (
              <Pressable
                key={u.id}
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/unidade/[id]', params: { id: u.id } })}
                className="flex-row items-center gap-3 rounded-2xl bg-white p-4 active:opacity-70 dark:bg-slate-900">
                <View
                  className={`h-10 w-10 items-center justify-center rounded-full ${
                    feitas === u.licoes.length ? 'bg-green-600' : escrita ? 'bg-primaria' : 'bg-slate-300 dark:bg-slate-700'
                  }`}>
                  <Text className="text-base font-bold text-white">{numero}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-slate-900 dark:text-slate-50">{u.titulo}</Text>
                  <Apoio>{escrita ? `${feitas} de ${u.licoes.length} lições` : 'Em breve'}</Apoio>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
              </Pressable>
            );
          })}
        </View>
      ))}
    </Tela>
  );
}
