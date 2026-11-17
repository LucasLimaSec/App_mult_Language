import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';

import { BarraProgresso } from '@/components/BarraProgresso';
import { Botao } from '@/components/Botao';
import { Tela } from '@/components/Tela';
import { localizarUnidade, proximaLicao, totalDeLicoes, unidadeDaLicao } from '@/conteudo/unidades';
import { resumoDoIdioma } from '@/db/cartoes';
import { lerProgresso } from '@/db/licoes';
import { resumoDoDia, type ResumoDoDia } from '@/db/progresso';
import type { Licao } from '@/conteudo/licoes';
import { coresDoDestaque, useModo, useTema, type CorDeDestaque } from '@/ui/tema';
import type { Idioma } from '@/voz/idiomas';
import { Pressionavel } from '@/ui/Pressionavel';

type InfoLingua = { idioma: Idioma; licoesFeitas: number; proxima?: Licao; cartoesHoje: number };

type Dados = { dia: ResumoDoDia; linguas: InfoLingua[] };

const LINGUAS_COM_TRILHA: Idioma[] = ['es', 'zh'];

async function carregar(): Promise<Dados> {
  const [dia, ...linguas] = await Promise.all([
    resumoDoDia(),
    ...LINGUAS_COM_TRILHA.map(async (idioma): Promise<InfoLingua> => {
      const [progresso, cartoes] = await Promise.all([lerProgresso(idioma), resumoDoIdioma(idioma)]);
      return {
        idioma,
        licoesFeitas: Object.values(progresso).filter((l) => l.status === 'concluida').length,
        proxima: proximaLicao(idioma, progresso),
        cartoesHoje: cartoes.vencidos + cartoes.novosHoje,
      };
    }),
  ]);
  return { dia: dia as ResumoDoDia, linguas: linguas as InfoLingua[] };
}

function Pilula({ icone, texto, cor }: { icone: 'flame' | 'time'; texto: string; cor: CorDeDestaque }) {
  const tema = useTema();
  const modo = useModo();
  const destaque = coresDoDestaque(tema, cor);
  return (
    <View style={{ backgroundColor: destaque.clara }} className="flex-row items-center gap-1 rounded-full px-3 py-1.5">
      <Ionicons name={icone} size={18} color={destaque.cor} />
      {/* No escuro o tom mais escuro some no fundo; usa a cor viva. */}
      <Text style={{ color: modo === 'escuro' ? destaque.cor : destaque.sombra }} className="font-titulo text-base">
        {texto}
      </Text>
    </View>
  );
}

function Tarefa({ feita, texto, emBreve }: { feita: boolean; texto: string; emBreve?: boolean }) {
  const tema = useTema();
  return (
    <View className="flex-row items-center gap-3" style={{ opacity: emBreve ? 0.7 : 1 }}>
      {feita ? (
        <View style={{ backgroundColor: tema.amarelo }} className="h-8 w-8 items-center justify-center rounded-full">
          <Ionicons name="checkmark" size={20} color="#1E1B2E" />
        </View>
      ) : (
        <View className="h-8 w-8 rounded-full border-[3px] border-white" />
      )}
      <Text className="flex-1 font-forte text-[17px] text-white">{texto}</Text>
    </View>
  );
}

const NOMES: Record<Idioma, string> = { en: 'Inglês', es: 'Espanhol', zh: 'Chinês' };
const SIGLAS: Record<Idioma, string> = { en: 'EN', es: 'ES', zh: '中' };

function CartaoLingua({ idioma, detalhe, fracao, aoTocar }: { idioma: Idioma; detalhe: string; fracao: number; aoTocar?: () => void }) {
  const tema = useTema();
  const destaque = coresDoDestaque(tema, idioma);
  return (
    <Pressionavel
      accessibilityRole="button"
      accessibilityLabel={`${NOMES[idioma]}: ${detalhe}`}
      disabled={!aoTocar}
      onPress={aoTocar}
      style={(pressed) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        padding: 14,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: tema.borda,
        backgroundColor: tema.superficie,
        marginTop: pressed ? 4 : 0,
        borderBottomWidth: pressed ? 2 : 6,
      })}>
      <View
        style={{ backgroundColor: destaque.cor, borderBottomColor: destaque.sombra }}
        className="h-[52px] w-[52px] items-center justify-center rounded-2xl border-b-4">
        <Text className="font-titulo text-xl text-white">{SIGLAS[idioma]}</Text>
      </View>
      <View className="flex-1 gap-1.5">
        <View className="flex-row items-baseline justify-between">
          <Text className="font-titulo text-[17px] text-texto">{NOMES[idioma]}</Text>
          <Text style={{ color: destaque.cor }} className="font-forte text-sm">
            {detalhe}
          </Text>
        </View>
        <BarraProgresso fracao={fracao} cor={idioma} altura={10} />
      </View>
    </Pressionavel>
  );
}

export default function Inicio() {
  const router = useRouter();
  const tema = useTema();
  const [dados, setDados] = useState<Dados | null>(null);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      carregar()
        .then((d) => ativo && setDados(d))
        .catch(() => undefined);
      return () => {
        ativo = false;
      };
    }, []),
  );

  const cartoesHoje = dados?.linguas.reduce((s, l) => s + l.cartoesHoje, 0) ?? 0;
  const linguaDaRevisao = dados?.linguas.find((l) => l.cartoesHoje > 0);
  const licaoSugerida = dados?.linguas.find((l) => l.proxima)?.proxima;
  const licaoFeita = (dados?.dia.licoesHoje ?? 0) > 0;
  const revisaoFeita = Boolean(dados) && cartoesHoje === 0;
  const feitas = Number(revisaoFeita) + Number(licaoFeita);

  let destino: Href | null = null;
  if (linguaDaRevisao) destino = { pathname: '/revisar/[idioma]', params: { idioma: linguaDaRevisao.idioma } };
  else if (!licaoFeita && licaoSugerida) destino = { pathname: '/licao/[id]', params: { id: licaoSugerida.id } };

  return (
    <Tela semCabecalho>
      <View className="flex-row items-center justify-between">
        <Text style={{ color: tema.marca }} className="font-titulo text-[26px]">
          Multi-Lingua
        </Text>
        <View className="flex-row gap-2">
          <Pilula icone="flame" texto={String(dados?.dia.sequencia ?? 0)} cor="ambar" />
          <Pilula icone="time" texto={`${dados?.dia.minutosHoje ?? 0} min`} cor="en" />
        </View>
      </View>

      <View
        style={{ backgroundColor: tema.marca, borderBottomColor: tema.marcaSombra }}
        className="gap-3.5 rounded-3xl border-b-[6px] p-5">
        <View className="flex-row items-baseline justify-between">
          <Text className="font-titulo text-2xl text-white">Plano de hoje</Text>
          <Text className="font-forte text-base text-white">{feitas} de 2</Text>
        </View>
        <View style={{ height: 14, borderRadius: 14, backgroundColor: tema.marcaSombra, overflow: 'hidden' }}>
          <View style={{ width: `${(feitas / 2) * 100}%`, height: 14, borderRadius: 14, backgroundColor: tema.amarelo }} />
        </View>
        <Tarefa feita={revisaoFeita} texto={revisaoFeita ? 'Cartões em dia' : `Revisar ${cartoesHoje} cartões`} />
        <Tarefa
          feita={licaoFeita}
          texto={licaoFeita ? 'Lição do dia feita' : licaoSugerida ? `Lição: ${licaoSugerida.titulo}` : 'Lição do dia'}
        />
        <Tarefa feita={false} texto="Prática de fala · em breve" emBreve />
        <Botao
          titulo={destino ? 'Continuar estudando' : 'Tudo feito por hoje'}
          variante="claro"
          desabilitado={!destino}
          onPress={() => destino && router.push(destino)}
          estilo={{ marginTop: 4 }}
        />
      </View>

      <Text className="font-titulo text-xl text-texto">Suas línguas</Text>
      {dados?.linguas.map((lingua) => {
        const unidade = lingua.proxima ? localizarUnidade(unidadeDaLicao(lingua.proxima.id)) : undefined;
        return (
          <CartaoLingua
            key={lingua.idioma}
            idioma={lingua.idioma}
            detalhe={unidade ? `${unidade.nivel} · Unidade ${unidade.numero}` : 'Trilha em dia'}
            fracao={lingua.licoesFeitas / Math.max(1, totalDeLicoes(lingua.idioma))}
            aoTocar={() => router.navigate({ pathname: '/licoes', params: { idioma: lingua.idioma } })}
          />
        );
      })}
      <CartaoLingua idioma="en" detalhe="Prática de fala · em breve" fracao={0} />
    </Tela>
  );
}
