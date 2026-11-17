import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Botao } from '@/components/Botao';
import { Tela } from '@/components/Tela';
import { IDIOMAS_COM_LICOES, lerCurriculo, localizarUnidade, nomeDoNivel, proximaLicao, unidadeDaLicao, unidadeDoCurriculo, unidadeEscrita } from '@/conteudo/unidades';
import { lerProgresso } from '@/db/licoes';
import type { Lesson } from '@/db/schema';
import { coresDoDestaque, useTema } from '@/ui/tema';
import { CODIGOS_IDIOMA, IDIOMAS, type Idioma } from '@/voz/idiomas';

/** Deslocamento horizontal de cada lição no caminho em zigue-zague. */
const ZIGUEZAGUE = [-40, 10, 45, 10, -40, -55];

type EstadoNo = 'feita' | 'proxima' | 'livre';

function NoDaTrilha({ estado, idioma, titulo, deslocamento, aoTocar }: { estado: EstadoNo; idioma: Idioma; titulo: string; deslocamento: number; aoTocar: () => void }) {
  const tema = useTema();
  const destaque = coresDoDestaque(tema, idioma);
  const tamanho = estado === 'proxima' ? 84 : 72;
  const cheio = estado !== 'livre';
  return (
    <View style={{ transform: [{ translateX: deslocamento }], alignItems: 'center', gap: 8 }}>
      {estado === 'proxima' ? (
        <View className="rounded-2xl border-2 border-b-4 border-borda bg-superficie px-3.5 py-2">
          <Text style={{ color: destaque.cor }} className="font-titulo text-base">
            Começar: {titulo}
          </Text>
        </View>
      ) : null}
      {/* A próxima lição ganha um anel em volta. */}
      <View style={estado === 'proxima' ? { padding: 8, borderRadius: 999, backgroundColor: destaque.clara } : undefined}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${titulo}${estado === 'feita' ? ', concluída' : estado === 'proxima' ? ', próxima lição' : ''}`}
        onPress={aoTocar}
        style={({ pressed }) => ({
          width: tamanho,
          height: tamanho,
          borderRadius: tamanho,
          backgroundColor: cheio ? destaque.cor : destaque.clara,
          borderBottomWidth: pressed ? 0 : 6,
          borderBottomColor: cheio ? destaque.sombra : tema.borda,
          marginTop: pressed ? 6 : 0,
          alignItems: 'center',
          justifyContent: 'center',
        })}>
        <Ionicons
          name={estado === 'feita' ? 'checkmark' : 'star'}
          size={estado === 'proxima' ? 40 : 32}
          color={cheio ? '#FFFFFF' : destaque.cor}
        />
      </Pressable>
      </View>
    </View>
  );
}

function Divisor({ texto }: { texto: string }) {
  return (
    <View className="w-full flex-row items-center gap-3 py-1">
      <View className="h-[3px] flex-1 rounded bg-borda" />
      <Text className="font-titulo text-[15px] text-texto-2">{texto}</Text>
      <View className="h-[3px] flex-1 rounded bg-borda" />
    </View>
  );
}

export default function Licoes() {
  const router = useRouter();
  const tema = useTema();
  const parametros = useLocalSearchParams<{ idioma?: string }>();
  const [idioma, setIdioma] = useState<Idioma>('es');
  const [progresso, setProgresso] = useState<Record<string, Lesson>>({});

  // Vindo do Início, abre na língua escolhida.
  useEffect(() => {
    const pedido = parametros.idioma;
    if (pedido && (CODIGOS_IDIOMA as readonly string[]).includes(pedido)) setIdioma(pedido as Idioma);
  }, [parametros.idioma]);

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
  const unidadeAtualId = proxima ? unidadeDaLicao(proxima.id) : undefined;
  const unidadeAtual = unidadeAtualId ? unidadeDoCurriculo(unidadeAtualId) : undefined;
  const local = unidadeAtualId ? localizarUnidade(unidadeAtualId) : undefined;
  const destaque = coresDoDestaque(tema, idioma);
  const abrirLicao = (id: string) => router.push({ pathname: '/licao/[id]', params: { id } });

  return (
    <Tela semCabecalho>
      <View className="flex-row gap-3">
        {IDIOMAS_COM_LICOES.map((codigo) => (
          <View key={codigo} className="flex-1">
            <Botao
              titulo={IDIOMAS[codigo].nome.replace(' (mandarim)', '')}
              variante={codigo === idioma ? 'primario' : 'secundario'}
              cor={codigo}
              compacto
              onPress={() => setIdioma(codigo)}
            />
          </View>
        ))}
      </View>

      {unidadeAtual && local ? (
        <View
          style={{ backgroundColor: destaque.cor, borderBottomColor: destaque.sombra }}
          className="flex-row items-center gap-3 rounded-3xl border-b-[6px] px-4 py-4">
          <View className="flex-1 gap-0.5">
            <Text className="font-titulo text-sm tracking-widest text-white">
              {local.nivel.toUpperCase()} · UNIDADE {local.numero}
            </Text>
            <Text className="font-titulo text-xl leading-6 text-white">{unidadeAtual.titulo}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Guia da unidade"
            onPress={() => router.push({ pathname: '/unidade/[id]', params: { id: unidadeAtual.id } })}
            className="h-[52px] w-[52px] items-center justify-center rounded-2xl border-2 border-white active:opacity-70">
            <Ionicons name="book" size={26} color="#FFFFFF" />
          </Pressable>
        </View>
      ) : null}

      <View className="items-center gap-5 pt-2">
        {curriculo?.niveis.map((nivel) =>
          nivel.unidades.map((u, indiceUnidade) => {
            const escrita = unidadeEscrita(u.id);
            const numero = Number(u.id.split('-u')[1]);
            const cabecalho = `${indiceUnidade === 0 ? `${nomeDoNivel(nivel.id)} · ` : ''}Unidade ${numero} · ${u.titulo}`;
            if (!escrita) {
              return (
                <View key={u.id} className="w-full items-center gap-2">
                  <Divisor texto={cabecalho} />
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push({ pathname: '/unidade/[id]', params: { id: u.id } })}
                    className="flex-row items-center gap-2 rounded-full bg-superficie-2 px-4 py-2 active:opacity-70">
                    <Ionicons name="time-outline" size={16} color={tema.texto2} />
                    <Text className="font-forte text-sm text-texto-2">Em breve</Text>
                  </Pressable>
                </View>
              );
            }
            return (
              <View key={u.id} className="w-full items-center gap-5">
                <Pressable
                  className="w-full active:opacity-70"
                  onPress={() => router.push({ pathname: '/unidade/[id]', params: { id: u.id } })}>
                  <Divisor texto={cabecalho} />
                </Pressable>
                {escrita.licoes.map((licao, i) => (
                  <NoDaTrilha
                    key={licao.id}
                    idioma={idioma}
                    titulo={licao.titulo}
                    deslocamento={ZIGUEZAGUE[(i + numero) % ZIGUEZAGUE.length]}
                    estado={progresso[licao.id]?.status === 'concluida' ? 'feita' : licao.id === proxima?.id ? 'proxima' : 'livre'}
                    aoTocar={() => abrirLicao(licao.id)}
                  />
                ))}
              </View>
            );
          }),
        )}
      </View>
    </Tela>
  );
}
