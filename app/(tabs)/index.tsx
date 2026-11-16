import { Text, View } from 'react-native';

import { Cartao } from '@/components/Cartao';
import { Tela } from '@/components/Tela';
import { Apoio, Paragrafo } from '@/components/Texto';
import { LISTA_IDIOMAS } from '@/voz/idiomas';

const OBJETIVOS: Record<string, string> = {
  en: 'Intermediário → fala fluente',
  es: 'Do zero → B1',
  zh: 'Do zero → HSK 2',
};

export default function Inicio() {
  return (
    <Tela>
      <View className="gap-1 pt-2">
        <Text className="text-3xl font-bold text-slate-900 dark:text-slate-50">Multi-Lingua</Text>
        <Apoio>Inglês, espanhol e chinês, tudo no aparelho.</Apoio>
      </View>

      <Cartao titulo="Suas línguas">
        {LISTA_IDIOMAS.map((idioma) => (
          <View key={idioma.codigo} className="flex-row items-center justify-between">
            <Text className="text-base font-medium text-slate-900 dark:text-slate-50">
              {idioma.nome}
            </Text>
            <Apoio>{OBJETIVOS[idioma.codigo]}</Apoio>
          </View>
        ))}
      </Cartao>

      <Cartao titulo="Fundação pronta">
        <Paragrafo>
          Os flashcards, as lições e a prática de fala chegam nas próximas fases. Por enquanto, use
          a aba Ajustes para testar o banco de dados, o áudio e o reconhecimento de voz no seu
          celular.
        </Paragrafo>
      </Cartao>
    </Tela>
  );
}
