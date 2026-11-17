import { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { Botao } from '@/components/Botao';
import { Apoio } from '@/components/Texto';
import { lerProgressoDaLicao, marcarDuvida } from '@/db/licoes';
import type { Idioma } from '@/voz/idiomas';

/** "Marcar dúvida": guarda uma nota para conferir depois com um nativo. */
export function BotaoDuvida({ licaoId, idioma }: { licaoId: string; idioma: Idioma }) {
  const [marcada, setMarcada] = useState(false);
  const [nota, setNota] = useState('');
  const [editando, setEditando] = useState(false);

  useEffect(() => {
    lerProgressoDaLicao(licaoId)
      .then((linha) => {
        setMarcada(Boolean(linha?.duvida));
        setNota(linha?.notaDuvida ?? '');
      })
      .catch(() => undefined);
  }, [licaoId]);

  async function salvar() {
    await marcarDuvida(licaoId, idioma, nota);
    setMarcada(true);
    setEditando(false);
  }

  async function remover() {
    await marcarDuvida(licaoId, idioma, null);
    setMarcada(false);
    setNota('');
    setEditando(false);
  }

  if (editando) {
    return (
      <View className="gap-2 rounded-2xl bg-white p-4 dark:bg-slate-900">
        <Text className="text-base font-semibold text-slate-900 dark:text-slate-50">Qual é a dúvida?</Text>
        <TextInput
          value={nota}
          onChangeText={setNota}
          multiline
          placeholder="Ex.: posso usar tú com o meu chefe?"
          placeholderTextColor="#94a3b8"
          className="min-h-20 rounded-xl border border-slate-300 px-3 py-2 text-base text-slate-900 dark:border-slate-600 dark:text-slate-50"
        />
        <Botao titulo="Salvar dúvida" onPress={salvar} />
        <Botao titulo="Cancelar" variante="secundario" onPress={() => setEditando(false)} />
      </View>
    );
  }

  if (marcada) {
    return (
      <View className="gap-2 rounded-2xl bg-amber-100 p-4 dark:bg-amber-900">
        <Text className="text-base font-semibold text-amber-900 dark:text-amber-100">❓ Dúvida marcada</Text>
        {nota ? <Text className="text-base text-amber-900 dark:text-amber-100">{nota}</Text> : null}
        <Apoio>Confira depois com um nativo, por exemplo no HelloTalk.</Apoio>
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Botao titulo="Editar" variante="secundario" onPress={() => setEditando(true)} />
          </View>
          <View className="flex-1">
            <Botao titulo="Resolvida" variante="secundario" onPress={remover} />
          </View>
        </View>
      </View>
    );
  }

  return <Botao titulo="❓ Marcar dúvida" variante="secundario" onPress={() => setEditando(true)} />;
}
