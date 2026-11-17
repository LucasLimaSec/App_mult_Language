import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Text, View, type ViewStyle } from 'react-native';

import { coresDoDestaque, FONTES, useTema, type CorDeDestaque } from '@/ui/tema';
import { Pressionavel } from '@/ui/Pressionavel';

export type NomeIcone = ComponentProps<typeof Ionicons>['name'];

type Props = {
  titulo: string;
  onPress: () => void;
  /**
   * primario: cheio na cor de destaque · secundario: superfície com borda ·
   * claro: branco com texto colorido, para usar sobre um painel colorido ·
   * perigo: atalho para a cor de erro.
   */
  variante?: 'primario' | 'secundario' | 'claro' | 'perigo';
  /** Cor de destaque do botão primário ou claro (padrão: a da marca). */
  cor?: CorDeDestaque;
  icone?: NomeIcone;
  desabilitado?: boolean;
  /** Texto menor, para botões lado a lado. */
  compacto?: boolean;
  estilo?: ViewStyle;
};

const PROFUNDIDADE = 5;

/** Botão "gordinho": sombra sólida embaixo que some quando ele é pressionado. */
export function Botao({ titulo, onPress, variante = 'primario', cor, icone, desabilitado = false, compacto = false, estilo }: Props) {
  const tema = useTema();
  const destaque = coresDoDestaque(tema, variante === 'perigo' ? 'erro' : (cor ?? 'marca'));

  let fundo = destaque.cor;
  let sombra = destaque.sombra;
  let corTexto = tema.sobreCor;
  let borda: string | undefined;
  if (variante === 'secundario') {
    fundo = tema.superficie;
    sombra = tema.borda;
    corTexto = tema.texto;
    borda = tema.borda;
  } else if (variante === 'claro') {
    fundo = '#FFFFFF';
    corTexto = destaque.cor;
  }
  if (desabilitado) {
    fundo = tema.superficie2;
    sombra = tema.superficie2;
    corTexto = tema.texto2;
    borda = undefined;
  }

  return (
    <Pressionavel
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityState={{ disabled: desabilitado }}
      disabled={desabilitado}
      onPress={onPress}
      style={(pressed) => {
        const afundado = pressed && !desabilitado;
        return [
          {
            minHeight: compacto ? 48 : 56,
            borderRadius: 16,
            backgroundColor: fundo,
            borderBottomWidth: afundado ? (borda ? 2 : 0) : PROFUNDIDADE,
            borderBottomColor: sombra,
            marginTop: afundado ? PROFUNDIDADE - (borda ? 2 : 0) : 0,
            paddingHorizontal: 16,
            paddingVertical: compacto ? 8 : 12,
            alignItems: 'center',
            justifyContent: 'center',
            ...(borda ? { borderWidth: 2, borderColor: borda } : {}),
          },
          estilo,
        ];
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {icone ? <Ionicons name={icone} size={compacto ? 18 : 22} color={corTexto} /> : null}
        <Text style={{ fontFamily: FONTES.titulo, fontSize: compacto ? 16 : 18, color: corTexto, textAlign: 'center' }}>
          {titulo}
        </Text>
      </View>
    </Pressionavel>
  );
}

/** Botão quadrado só com ícone (áudio, voltar...). */
export function BotaoIcone({
  icone,
  descricao,
  onPress,
  cor = 'marca',
  tamanho = 56,
  variante = 'primario',
}: {
  icone: NomeIcone;
  descricao: string;
  onPress: () => void;
  cor?: CorDeDestaque;
  tamanho?: number;
  variante?: 'primario' | 'claro';
}) {
  const tema = useTema();
  const destaque = coresDoDestaque(tema, cor);
  const fundo = variante === 'claro' ? destaque.clara : destaque.cor;
  const sombra = variante === 'claro' ? tema.borda : destaque.sombra;
  return (
    <Pressionavel
      accessibilityRole="button"
      accessibilityLabel={descricao}
      hitSlop={6}
      onPress={onPress}
      style={(pressed) => ({
        width: tamanho,
        height: tamanho,
        borderRadius: tamanho * 0.3,
        backgroundColor: fundo,
        borderBottomWidth: pressed ? 0 : 4,
        borderBottomColor: sombra,
        marginTop: pressed ? 4 : 0,
        alignItems: 'center',
        justifyContent: 'center',
      })}>
      <Ionicons name={icone} size={tamanho * 0.5} color={variante === 'claro' ? destaque.sombra : tema.sobreCor} />
    </Pressionavel>
  );
}
