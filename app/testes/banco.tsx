import { useCallback, useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { Botao } from '@/components/Botao';
import { Cartao } from '@/components/Cartao';
import { Tela } from '@/components/Tela';
import { Apoio, Paragrafo } from '@/components/Texto';
import { db } from '@/db/client';
import { cards, lessons, reviews, sessions, settings } from '@/db/schema';
import { apagarSetting, gravarSetting, lerSetting } from '@/db/settings';

const CHAVE = 'teste.nota';

type NotaSalva = { texto: string; salvoEm: number };

type Contagens = { nome: string; linhas: number }[];

async function contarLinhas(): Promise<Contagens> {
  return [
    { nome: 'cards', linhas: await db.$count(cards) },
    { nome: 'reviews', linhas: await db.$count(reviews) },
    { nome: 'lessons', linhas: await db.$count(lessons) },
    { nome: 'sessions', linhas: await db.$count(sessions) },
    { nome: 'settings', linhas: await db.$count(settings) },
  ];
}

export default function TesteBanco() {
  const [texto, setTexto] = useState('');
  const [salva, setSalva] = useState<NotaSalva | null>(null);
  const [contagens, setContagens] = useState<Contagens>([]);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    try {
      setSalva(await lerSetting<NotaSalva | null>(CHAVE, null));
      setContagens(await contarLinhas());
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  async function salvar() {
    try {
      await gravarSetting<NotaSalva>(CHAVE, { texto: texto.trim(), salvoEm: Date.now() });
      setTexto('');
      await recarregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  }

  async function apagar() {
    try {
      await apagarSetting(CHAVE);
      await recarregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <Tela>
      <Cartao titulo="Como testar">
        <Paragrafo>
          Ative o modo avião, escreva algo e toque em Salvar. Depois feche o app por completo, abra
          de novo e volte aqui: o texto precisa continuar aparecendo abaixo.
        </Paragrafo>
      </Cartao>

      <Cartao titulo="Gravar">
        <TextInput
          value={texto}
          onChangeText={setTexto}
          placeholder="Escreva qualquer coisa"
          placeholderTextColor="#94a3b8"
          className="rounded-xl border border-slate-300 px-3 py-3 text-base text-slate-900 dark:border-slate-600 dark:text-slate-50"
        />
        <Botao titulo="Salvar" onPress={salvar} desabilitado={texto.trim().length === 0} />
      </Cartao>

      <Cartao titulo="Valor salvo no aparelho">
        {salva ? (
          <View className="gap-1">
            <Text className="text-xl font-semibold text-slate-900 dark:text-slate-50">
              {salva.texto}
            </Text>
            <Apoio>Salvo em {new Date(salva.salvoEm).toLocaleString('pt-BR')}</Apoio>
          </View>
        ) : (
          <Apoio>Nada salvo ainda.</Apoio>
        )}
        <Botao titulo="Apagar" variante="secundario" onPress={apagar} desabilitado={!salva} />
      </Cartao>

      <Cartao titulo="Tabelas" subtitulo="Linhas em cada tabela do banco.">
        {contagens.map((tabela) => (
          <View key={tabela.nome} className="flex-row justify-between">
            <Text className="text-base text-slate-700 dark:text-slate-300">{tabela.nome}</Text>
            <Text className="text-base font-semibold text-slate-900 dark:text-slate-50">
              {tabela.linhas}
            </Text>
          </View>
        ))}
      </Cartao>

      {erro ? (
        <Cartao titulo="Erro">
          <Text className="text-base text-red-700 dark:text-red-400">{erro}</Text>
        </Cartao>
      ) : null}
    </Tela>
  );
}
