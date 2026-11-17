import { useRouter } from 'expo-router';
import { pinyin as gerarPinyin } from 'pinyin-pro';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { buscarPalavra, type EntradaDicionario } from '@/chines/dicionario';
import { caracteresHan } from '@/chines/pinyin';
import { Botao } from '@/components/Botao';
import { Cartao } from '@/components/Cartao';
import { PinyinColorido } from '@/components/cartoes/PalavraChinesa';
import { Tela } from '@/components/Tela';
import { useTema } from '@/ui/tema';
import { Apoio } from '@/components/Texto';
import { criarPalavraManual, palavraJaExiste, problemaDaPalavraManual } from '@/db/cartoes';
import { IDIOMAS, type Idioma } from '@/voz/idiomas';

const IDIOMAS_COM_CARTOES: Idioma[] = ['es', 'zh'];

const ESTILO_DO_CAMPO =
  'rounded-2xl border-2 border-b-[5px] border-borda bg-superficie px-3.5 py-3 font-forte text-base text-texto';

function Campo(props: {
  rotulo: string;
  valor: string;
  aoMudar: (texto: string) => void;
  dica?: string;
  aoSair?: () => void;
}) {
  const tema = useTema();
  return (
    <View className="gap-1">
      <Text className="font-forte text-sm text-texto-2">{props.rotulo}</Text>
      <TextInput
        value={props.valor}
        onChangeText={props.aoMudar}
        onBlur={props.aoSair}
        placeholder={props.dica}
        placeholderTextColor={tema.texto2}
        autoCapitalize="none"
        autoCorrect={false}
        className={ESTILO_DO_CAMPO}
      />
    </View>
  );
}

export default function AdicionarPalavra() {
  const router = useRouter();
  const [idioma, setIdioma] = useState<Idioma>('es');
  const [palavra, setPalavra] = useState('');
  const [pinyin, setPinyin] = useState('');
  const [en, setEn] = useState('');
  const [pt, setPt] = useState('');
  const [exemplo, setExemplo] = useState('');
  const [entradas, setEntradas] = useState<EntradaDicionario[] | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function trocarIdioma(novo: Idioma) {
    setIdioma(novo);
    setPinyin('');
    setEntradas(null);
    setAviso(null);
  }

  function usarEntrada(entrada: EntradaDicionario) {
    setPinyin(entrada.pinyin);
    setEn(entrada.definicoes);
  }

  /** No chinês, completa o pinyin e o significado em inglês pelo dicionário offline. */
  async function completarPeloDicionario() {
    const texto = palavra.trim();
    if (idioma !== 'zh' || caracteresHan(texto).length === 0) return;
    try {
      const encontradas = await buscarPalavra(texto);
      setEntradas(encontradas);
      if (encontradas.length > 0) {
        usarEntrada(encontradas[0]);
        setAviso(null);
      } else {
        // Fora do dicionário: gera só o pinyin, caractere a caractere.
        setPinyin(gerarPinyin(texto, { type: 'array' }).join(' '));
        setAviso('Palavra fora do dicionário: o pinyin foi gerado automaticamente, confira antes de salvar.');
      }
    } catch (e) {
      setAviso(`Não foi possível consultar o dicionário: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function salvar() {
    const dados = { idioma, palavra, en, pt, pinyin: idioma === 'zh' ? pinyin : undefined, exemplo };
    const problema = problemaDaPalavraManual(dados);
    if (problema) {
      setAviso(problema);
      return;
    }
    setSalvando(true);
    try {
      if (await palavraJaExiste(idioma, palavra)) {
        setAviso('Esta palavra já tem cartão neste idioma.');
        return;
      }
      await criarPalavraManual(dados);
      router.back();
    } catch (e) {
      setAviso(e instanceof Error ? e.message : String(e));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Tela>
      <Cartao titulo="Idioma">
        <View className="flex-row gap-3">
          {IDIOMAS_COM_CARTOES.map((codigo) => (
            <View key={codigo} className="flex-1">
              <Botao
                titulo={IDIOMAS[codigo].nome}
                variante={codigo === idioma ? 'primario' : 'secundario'}
                cor={codigo}
                compacto
                onPress={() => trocarIdioma(codigo)}
              />
            </View>
          ))}
        </View>
      </Cartao>

      <Cartao titulo="Palavra">
        <Campo
          rotulo={idioma === 'zh' ? 'Palavra em chinês (caracteres)' : 'Palavra em espanhol'}
          valor={palavra}
          aoMudar={setPalavra}
          aoSair={completarPeloDicionario}
          dica={idioma === 'zh' ? '例如：咖啡' : 'por ejemplo: perro'}
        />

        {idioma === 'zh' ? (
          <>
            <Botao titulo="Buscar no dicionário" variante="secundario" onPress={completarPeloDicionario} />
            <Campo rotulo="Pinyin (sílabas separadas por espaço)" valor={pinyin} aoMudar={setPinyin} dica="kā fēi" />
            {pinyin ? <PinyinColorido pinyin={pinyin} /> : null}
            {entradas && entradas.length > 1 ? (
              <View className="gap-2">
                <Apoio>O dicionário tem mais de uma leitura. Toque para usar outra:</Apoio>
                {entradas.map((entrada, indice) => (
                  <Pressable
                    key={indice}
                    onPress={() => usarEntrada(entrada)}
                    className="rounded-2xl bg-superficie-2 p-3.5 active:opacity-70">
                    <PinyinColorido pinyin={entrada.pinyin} tamanho={16} />
                    <Text numberOfLines={2} className="font-corpo text-sm text-texto-2">
                      {entrada.definicoes}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </>
        ) : null}

        <Campo rotulo="Tradução em inglês" valor={en} aoMudar={setEn} dica="dog" />
        <Campo rotulo="Tradução em português" valor={pt} aoMudar={setPt} dica="cachorro" />
        <Campo rotulo="Frase de exemplo (opcional)" valor={exemplo} aoMudar={setExemplo} />

        {aviso ? <Text className="font-corpo text-sm text-ambar-texto">{aviso}</Text> : null}
        <Botao titulo={salvando ? 'Salvando…' : 'Salvar'} onPress={salvar} desabilitado={salvando} />
        <Apoio>
          Preencha pelo menos uma das traduções. A palavra vira dois cartões: reconhecer e lembrar
          como se diz.
        </Apoio>
      </Cartao>
    </Tela>
  );
}
