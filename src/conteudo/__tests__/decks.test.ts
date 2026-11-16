import deckEs from '../../../data/deck-es.json';
import deckZh from '../../../data/deck-zh.json';
import type { Deck } from '../tipos';
import { validarDeck } from '../validar';

const es = deckEs as Deck;
const zh = deckZh as Deck;

describe('validarDeck', () => {
  const base: Deck = {
    id: 'teste',
    idioma: 'es',
    titulo: 'Teste',
    cartoes: [
      { id: 't-1', palavra: 'perro', en: 'dog', pt: 'cachorro', exemplo: 'El perro corre.', exemploEn: 'The dog runs.', exemploPt: 'O cachorro corre.' },
    ],
  };
  const comCartao = (extra: Partial<Deck['cartoes'][number]>, idioma: Deck['idioma'] = 'es'): Deck => ({
    ...base,
    idioma,
    cartoes: [{ ...base.cartoes[0], ...extra }],
  });

  it('aprova um deck correto', () => {
    expect(validarDeck(base)).toEqual([]);
  });

  it('aponta id e palavra repetidos', () => {
    const problemas = validarDeck({ ...base, cartoes: [base.cartoes[0], base.cartoes[0]] });
    expect(problemas.join('\n')).toMatch(/id repetido/);
    expect(problemas.join('\n')).toMatch(/palavra repetida/);
  });

  it('aponta tradução vazia e exemplo sem tradução', () => {
    expect(validarDeck(comCartao({ pt: ' ' })).join('\n')).toMatch(/campo "pt" vazio/);
    expect(validarDeck(comCartao({ exemploPt: undefined })).join('\n')).toMatch(/duas traduções/);
    expect(validarDeck(comCartao({ exemplo: undefined })).join('\n')).toMatch(/sem frase de exemplo/);
  });

  it('exige no chinês uma sílaba de pinyin por caractere', () => {
    const chines = { palavra: '学习', exemplo: undefined, exemploEn: undefined, exemploPt: undefined };
    expect(validarDeck(comCartao({ ...chines, pinyin: 'xué xí' }, 'zh'))).toEqual([]);
    expect(validarDeck(comCartao({ ...chines, pinyin: 'xuéxí' }, 'zh')).join('\n')).toMatch(/sílaba por caractere/);
    expect(validarDeck(comCartao({ ...chines, pinyin: undefined }, 'zh')).join('\n')).toMatch(/sem pinyin/);
  });

  it('aceita a mesma grafia chinesa com leituras diferentes', () => {
    const deck: Deck = {
      ...base,
      idioma: 'zh',
      cartoes: [
        { id: 'z-1', palavra: '还', pinyin: 'hái', en: 'still', pt: 'ainda' },
        { id: 'z-2', palavra: '还', pinyin: 'huán', en: 'to return', pt: 'devolver' },
      ],
    };
    expect(validarDeck(deck)).toEqual([]);
  });
});

// O conteúdo real empacotado no app precisa passar na mesma validação.
describe('decks de /data', () => {
  it('deck de espanhol sem problemas', () => {
    expect(es.idioma).toBe('es');
    expect(validarDeck(es)).toEqual([]);
  });

  it('deck de chinês sem problemas', () => {
    expect(zh.idioma).toBe('zh');
    expect(validarDeck(zh)).toEqual([]);
  });
});
