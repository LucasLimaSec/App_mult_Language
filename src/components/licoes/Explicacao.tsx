import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import type { BlocoExplicacao } from '@/conteudo/licoes';
import { useTema } from '@/ui/tema';

/** Uma tabela vira uma lista de linhas: a primeira coluna em destaque e as outras com o rótulo do cabeçalho. */
function Tabela({ cabecalho, linhas }: { cabecalho: string[]; linhas: string[][] }) {
  return (
    <View className="overflow-hidden rounded-2xl border-2 border-borda">
      {linhas.map((linha, i) => (
        <View key={i} className={`gap-1 px-3.5 py-2.5 ${i % 2 === 0 ? 'bg-superficie-2' : 'bg-superficie'}`}>
          <Text className="font-titulo text-base text-texto">{linha[0]}</Text>
          {linha.slice(1).map((celula, j) => (
            <Text key={j} className="font-corpo text-sm text-texto">
              {cabecalho[j + 1] ? <Text className="font-forte text-texto-2">{cabecalho[j + 1]}: </Text> : null}
              {celula}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

export function Explicacao({ blocos }: { blocos: BlocoExplicacao[] }) {
  const tema = useTema();
  return (
    <View className="gap-3.5">
      {blocos.map((bloco, i) => {
        if (bloco.tipo === 'tabela') return <Tabela key={i} cabecalho={bloco.cabecalho} linhas={bloco.linhas} />;
        if (bloco.tipo === 'dica') {
          return (
            <View key={i} className="flex-row gap-3 rounded-2xl bg-ambar-clara p-3.5">
              <Ionicons name="bulb" size={22} color={tema.ambar} style={{ marginTop: 1 }} />
              <Text className="flex-1 font-corpo text-base leading-6 text-ambar-texto">{bloco.texto}</Text>
            </View>
          );
        }
        return (
          <Text key={i} className="font-corpo text-base leading-6 text-texto">
            {bloco.texto}
          </Text>
        );
      })}
    </View>
  );
}
