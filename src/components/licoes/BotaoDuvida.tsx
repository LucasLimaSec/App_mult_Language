import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { Botao } from '@/components/Botao';
import { Apoio } from '@/components/Texto';
import { lerProgressoDaLicao, marcarDuvida } from '@/db/licoes';
import { FONTES, useTema } from '@/ui/tema';
import type { Idioma } from '@/voz/idiomas';

/** "Marcar dúvida": guarda uma nota para conferir depois com um nativo. */
export function BotaoDuvida({ licaoId, idioma }: { licaoId: string; idioma: Idioma }) {
  const tema = useTema();
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
      <View className="gap-3 rounded-3xl border-2 border-b-[5px] border-borda bg-superficie p-4">
        <Text className="font-titulo text-lg text-texto">Qual é a dúvida?</Text>
        <TextInput
          value={nota}
          onChangeText={setNota}
          multiline
          placeholder="Ex.: posso usar tú com o meu chefe?"
          placeholderTextColor={tema.texto2}
          style={{ fontFamily: FONTES.corpo, textAlignVertical: 'top' }}
          className="min-h-24 rounded-2xl border-2 border-borda bg-superficie px-3.5 py-3 text-base text-texto"
        />
        <Botao titulo="Salvar dúvida" onPress={salvar} />
        <Botao titulo="Cancelar" variante="secundario" onPress={() => setEditando(false)} />
      </View>
    );
  }

  if (marcada) {
    return (
      <View className="gap-2.5 rounded-3xl bg-ambar-clara p-4">
        <View className="flex-row items-center gap-2">
          <Ionicons name="help-circle" size={24} color={tema.ambar} />
          <Text className="font-titulo text-lg text-ambar-texto">Dúvida marcada</Text>
        </View>
        {nota ? <Text className="font-corpo text-base text-ambar-texto">{nota}</Text> : null}
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

  return <Botao titulo="Marcar dúvida" icone="help-circle" variante="secundario" onPress={() => setEditando(true)} />;
}
