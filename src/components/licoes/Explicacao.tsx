import { Text, View } from 'react-native';

import type { BlocoExplicacao } from '@/conteudo/licoes';

/** Uma tabela vira uma lista de linhas: a primeira coluna em destaque e as outras com o rótulo do cabeçalho. */
function Tabela({ cabecalho, linhas }: { cabecalho: string[]; linhas: string[][] }) {
  return (
    <View className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
      {linhas.map((linha, i) => (
        <View
          key={i}
          className={`gap-1 px-3 py-2 ${i % 2 === 0 ? 'bg-slate-50 dark:bg-slate-800' : 'bg-white dark:bg-slate-900'}`}>
          <Text className="text-base font-semibold text-slate-900 dark:text-slate-50">{linha[0]}</Text>
          {linha.slice(1).map((celula, j) => (
            <Text key={j} className="text-sm text-slate-600 dark:text-slate-300">
              <Text className="text-slate-400">{cabecalho[j + 1]}: </Text>
              {celula}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

export function Explicacao({ blocos }: { blocos: BlocoExplicacao[] }) {
  return (
    <View className="gap-3">
      {blocos.map((bloco, i) => {
        if (bloco.tipo === 'tabela') return <Tabela key={i} cabecalho={bloco.cabecalho} linhas={bloco.linhas} />;
        if (bloco.tipo === 'dica') {
          return (
            <View key={i} className="rounded-xl bg-amber-100 p-3 dark:bg-amber-900">
              <Text className="text-base leading-6 text-amber-900 dark:text-amber-100">💡 {bloco.texto}</Text>
            </View>
          );
        }
        return (
          <Text key={i} className="text-base leading-6 text-slate-800 dark:text-slate-200">
            {bloco.texto}
          </Text>
        );
      })}
    </View>
  );
}
