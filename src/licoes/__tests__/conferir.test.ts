import {
  alinhar,
  chaveDoPinyin,
  conferirDitadoEs,
  conferirDitadoZh,
  conferirFala,
  conferirMontar,
  embaralhar,
  normalizarTexto,
  numeroParaChines,
  semAcentos,
} from '../conferir';

describe('normalizarTexto e semAcentos', () => {
  it('ignora maiúsculas, pontuação e espaços extras', () => {
    expect(normalizarTexto('  ¿Cómo  estás? ')).toBe('cómo estás');
    expect(normalizarTexto('Muy bien, gracias.')).toBe('muy bien gracias');
  });
  it('tira acentos e til', () => {
    expect(semAcentos('mañana está')).toBe('manana esta');
  });
});

describe('conferirMontar', () => {
  it('aceita a ordem certa, sem ligar para maiúsculas', () => {
    expect(conferirMontar(['bien', 'Gracias', 'y', 'tú'], ['Bien', 'gracias', 'y', 'tú'])).toBe(true);
  });
  it('recusa ordem errada, bloco faltando ou distrator', () => {
    expect(conferirMontar(['gracias', 'bien', 'y', 'tú'], ['Bien', 'gracias', 'y', 'tú'])).toBe(false);
    expect(conferirMontar(['Bien', 'gracias', 'y'], ['Bien', 'gracias', 'y', 'tú'])).toBe(false);
    expect(conferirMontar(['Bien', 'gracias', 'y', 'tu'], ['Bien', 'gracias', 'y', 'tú'])).toBe(false);
  });
});

describe('conferirDitadoEs', () => {
  it('certo ignorando pontuação e maiúsculas', () => {
    expect(conferirDitadoEs('muy bien gracias', 'Muy bien, gracias.')).toBe('certo');
  });
  it('avisa quando só o acento está errado', () => {
    expect(conferirDitadoEs('El es Carlos', 'Él es Carlos.')).toBe('acento');
  });
  it('aceita respostas alternativas', () => {
    expect(conferirDitadoEs('buenas tardes', 'Buenas tardes.', ['buenas tardes señor'])).toBe('certo');
  });
  it('marca erro quando falta palavra', () => {
    expect(conferirDitadoEs('muy bien', 'Muy bien, gracias.')).toBe('errado');
  });
});

describe('chaveDoPinyin', () => {
  it('trata acentos e números do mesmo jeito', () => {
    expect(chaveDoPinyin('mǎ')).toEqual({ letras: 'ma', tons: [3] });
    expect(chaveDoPinyin('ma3')).toEqual({ letras: 'ma', tons: [3] });
    expect(chaveDoPinyin('Nǐ hǎo')).toEqual(chaveDoPinyin('ni3hao3'));
  });
  it('trata ü escrito como v, u: ou com acento', () => {
    expect(chaveDoPinyin('nǚ')).toEqual({ letras: 'nü', tons: [3] });
    expect(chaveDoPinyin('nv3')).toEqual({ letras: 'nü', tons: [3] });
    expect(chaveDoPinyin('nu:3')).toEqual({ letras: 'nü', tons: [3] });
  });
  it('ignora o tom neutro', () => {
    expect(chaveDoPinyin('péng you')).toEqual(chaveDoPinyin('peng2 you5'));
    expect(chaveDoPinyin('peng2you0')).toEqual({ letras: 'pengyou', tons: [2] });
  });
});

describe('conferirDitadoZh', () => {
  it('aceita número ou acento', () => {
    expect(conferirDitadoZh('ma3', 'mǎ')).toBe('certo');
    expect(conferirDitadoZh('mǎ', 'mǎ')).toBe('certo');
    expect(conferirDitadoZh('ren2', 'rén')).toBe('certo');
  });
  it('aponta tom errado ou faltando', () => {
    expect(conferirDitadoZh('ma', 'mǎ')).toBe('tom');
    expect(conferirDitadoZh('ma4', 'mǎ')).toBe('tom');
  });
  it('aceita a forma de dicionário quando listada', () => {
    expect(conferirDitadoZh('bu2 dui4', 'bú duì', ['bù duì'])).toBe('certo');
    expect(conferirDitadoZh('bu4 dui4', 'bú duì', ['bù duì'])).toBe('certo');
    expect(conferirDitadoZh('bu3 dui4', 'bú duì', ['bù duì'])).toBe('tom');
  });
  it('marca erro quando as letras não batem', () => {
    expect(conferirDitadoZh('mo3', 'mǎ')).toBe('errado');
  });
});

describe('alinhar', () => {
  it('marca as palavras encontradas na ordem', () => {
    expect(alinhar(['a', 'b', 'c', 'd'], ['a', 'x', 'c', 'd'])).toEqual([true, false, true, true]);
    expect(alinhar(['a', 'b'], [])).toEqual([false, false]);
    // Fora de ordem, só uma das duas pode ser aproveitada.
    expect(alinhar(['a', 'b'], ['b', 'a']).filter(Boolean)).toHaveLength(1);
  });
});

describe('conferirFala', () => {
  it('espanhol: acerto mesmo sem acentos e pontuação', () => {
    const r = conferirFala('buenas tardes como esta', 'Buenas tardes, ¿cómo está?', 'es');
    expect(r.certo).toBe(true);
    expect(r.nota).toBe(1);
    expect(r.partes.map((p) => p.texto)).toEqual(['buenas', 'tardes', 'cómo', 'está']);
  });

  it('espanhol: marca a palavra que faltou', () => {
    const r = conferirFala('soy brasileño y vivo en', 'Soy brasileño y vivo en São Paulo.', 'es');
    expect(r.partes.filter((p) => !p.ok).map((p) => p.texto)).toEqual(['são', 'paulo']);
    expect(r.certo).toBe(false);
  });

  it('espanhol: usa as variações aceitas', () => {
    const r = conferirFala('buenas tardes como estas', 'Buenas tardes, ¿cómo está?', 'es', ['Buenas tardes, cómo estás']);
    expect(r.certo).toBe(true);
  });

  it('chinês: compara pelo som, não pelo caractere', () => {
    // 他 e 她 têm o mesmo som (tā): o reconhecimento pode escrever qualquer um.
    const r = conferirFala('她是谁', '他是谁？', 'zh');
    expect(r.certo).toBe(true);
    expect(r.partes.map((p) => p.texto)).toEqual(['他', '是', '谁']);
  });

  it('chinês: tom diferente conta como erro na sílaba', () => {
    const r = conferirFala('妈妈骂妈吗', '妈妈骂马吗？', 'zh');
    expect(r.partes.map((p) => p.ok)).toEqual([true, true, true, false, true]);
    expect(r.nota).toBeCloseTo(0.8);
  });

  it('nada reconhecido dá nota zero', () => {
    expect(conferirFala('', 'Hola', 'es').nota).toBe(0);
    expect(conferirFala('', '你好', 'zh').nota).toBe(0);
  });
});

describe('embaralhar', () => {
  it('mantém os mesmos itens sem alterar a lista original', () => {
    const lista = [1, 2, 3, 4];
    const resultado = embaralhar(lista, () => 0);
    expect([...resultado].sort()).toEqual(lista);
    expect(lista).toEqual([1, 2, 3, 4]);
    expect(resultado).not.toEqual(lista);
  });
});

describe('numeroParaChines', () => {
  it('escreve números como se fala em chinês', () => {
    expect(numeroParaChines(0)).toBe('零');
    expect(numeroParaChines(7)).toBe('七');
    expect(numeroParaChines(10)).toBe('十');
    expect(numeroParaChines(15)).toBe('十五');
    expect(numeroParaChines(20)).toBe('二十');
    expect(numeroParaChines(35)).toBe('三十五');
    expect(numeroParaChines(99)).toBe('九十九');
    expect(numeroParaChines(100)).toBe('一百');
    expect(numeroParaChines(108)).toBe('一百零八');
    expect(numeroParaChines(110)).toBe('一百一十');
    expect(numeroParaChines(2026)).toBe('二千零二十六');
  });

  it('a fala em chinês aceita números em algarismos', () => {
    expect(conferirFala('25，35，45', '二十五，三十五，四十五。', 'zh').certo).toBe(true);
    expect(conferirFala('我今年34岁', '我今年三十四岁。', 'zh').certo).toBe(true);
  });
});
