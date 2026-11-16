import { caracteresHan, numeradoParaAcentuado, separarSilabas, tomDaSilaba } from '../pinyin';

describe('tomDaSilaba', () => {
  it('lê o tom pelo acento', () => {
    expect(tomDaSilaba('mā')).toBe(1);
    expect(tomDaSilaba('má')).toBe(2);
    expect(tomDaSilaba('mǎ')).toBe(3);
    expect(tomDaSilaba('mà')).toBe(4);
    expect(tomDaSilaba('ma')).toBe(5);
    expect(tomDaSilaba('nǚ')).toBe(3);
    expect(tomDaSilaba('Zhōng')).toBe(1);
    expect(tomDaSilaba('lǜ')).toBe(4);
  });
});

describe('separarSilabas', () => {
  it('separa por espaços e ignora sobras', () => {
    expect(separarSilabas('xué xí')).toEqual(['xué', 'xí']);
    expect(separarSilabas('  nǐ   hǎo ')).toEqual(['nǐ', 'hǎo']);
    expect(separarSilabas('')).toEqual([]);
  });
});

describe('numeradoParaAcentuado', () => {
  it('põe o acento na vogal certa', () => {
    expect(numeradoParaAcentuado('xue2 xi2')).toBe('xué xí');
    expect(numeradoParaAcentuado('ni3 hao3')).toBe('nǐ hǎo');
    expect(numeradoParaAcentuado('gou3')).toBe('gǒu');
    expect(numeradoParaAcentuado('liu4')).toBe('liù');
    expect(numeradoParaAcentuado('gui4')).toBe('guì');
    expect(numeradoParaAcentuado('xiong2')).toBe('xióng');
    expect(numeradoParaAcentuado('jia1')).toBe('jiā');
    expect(numeradoParaAcentuado('yue4')).toBe('yuè');
  });

  it('trata o ü do CC-CEDICT e o tom neutro', () => {
    expect(numeradoParaAcentuado('nu:3 ren2')).toBe('nǚ rén');
    expect(numeradoParaAcentuado('lu:4')).toBe('lǜ');
    expect(numeradoParaAcentuado('peng2 you5')).toBe('péng you');
    expect(numeradoParaAcentuado('wan2 r5')).toBe('wán r');
  });

  it('mantém maiúsculas e pedaços que não são sílabas', () => {
    expect(numeradoParaAcentuado('Zhong1 guo2')).toBe('Zhōng guó');
    expect(numeradoParaAcentuado('E2 luo2 si1')).toBe('É luó sī');
    expect(numeradoParaAcentuado('A1 Q5 , xx5')).toBe('Ā Q , xx');
  });
});

describe('caracteresHan', () => {
  it('fica só com os ideogramas', () => {
    expect(caracteresHan('你好！')).toEqual(['你', '好']);
    expect(caracteresHan('abc 123')).toEqual([]);
  });
});
