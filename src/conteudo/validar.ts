import { caracteresHan, separarSilabas } from '../chines/pinyin';
import type { Deck } from './tipos';

/**
 * Confere a consistência de um deck e devolve a lista de problemas (vazia se
 * estiver tudo certo). Roda nos testes, para um erro de digitação no conteúdo
 * não chegar ao app.
 */
export function validarDeck(deck: Deck): string[] {
  const problemas: string[] = [];
  const ids = new Set<string>();
  const palavras = new Set<string>();

  for (const cartao of deck.cartoes) {
    const onde = `${deck.id} ${cartao.id} (${cartao.palavra})`;

    if (ids.has(cartao.id)) problemas.push(`${onde}: id repetido`);
    ids.add(cartao.id);

    // A mesma grafia pode aparecer duas vezes só se o pinyin for diferente.
    const chave = `${cartao.palavra}|${cartao.pinyin ?? ''}`;
    if (palavras.has(chave)) problemas.push(`${onde}: palavra repetida`);
    palavras.add(chave);

    for (const campo of ['palavra', 'en', 'pt'] as const) {
      if (!cartao[campo]?.trim()) problemas.push(`${onde}: campo "${campo}" vazio`);
    }

    const temExemplo = Boolean(cartao.exemplo?.trim());
    if (temExemplo && (!cartao.exemploEn?.trim() || !cartao.exemploPt?.trim())) {
      problemas.push(`${onde}: exemplo sem as duas traduções`);
    }

    if (deck.idioma === 'es' && !temExemplo) {
      problemas.push(`${onde}: cartão de espanhol sem frase de exemplo`);
    }

    if (deck.idioma === 'zh') {
      if (!cartao.pinyin?.trim()) {
        problemas.push(`${onde}: cartão de chinês sem pinyin`);
      } else if (separarSilabas(cartao.pinyin).length !== caracteresHan(cartao.palavra).length) {
        problemas.push(`${onde}: o pinyin "${cartao.pinyin}" não tem uma sílaba por caractere`);
      }
    }
  }
  return problemas;
}
