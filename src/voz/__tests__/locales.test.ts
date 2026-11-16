import { encontrarLocale, localeCorresponde, normalizarLocale } from '../locales';

describe('normalizarLocale', () => {
  it('troca sublinhado por hífen e ignora maiúsculas', () => {
    expect(normalizarLocale('en_US')).toBe('en-us');
    expect(normalizarLocale(' ES-mx ')).toBe('es-mx');
  });
});

describe('localeCorresponde', () => {
  it('exige a variante exata no inglês e no espanhol', () => {
    expect(localeCorresponde('en-US', 'en')).toBe(true);
    expect(localeCorresponde('en_us', 'en')).toBe(true);
    expect(localeCorresponde('en-GB', 'en')).toBe(false);
    expect(localeCorresponde('es-MX', 'es')).toBe(true);
    expect(localeCorresponde('es-ES', 'es')).toBe(false);
    expect(localeCorresponde('es-US', 'es')).toBe(false);
  });

  it('aceita as grafias do mandarim simplificado', () => {
    expect(localeCorresponde('zh-CN', 'zh')).toBe(true);
    expect(localeCorresponde('cmn-Hans-CN', 'zh')).toBe(true);
    expect(localeCorresponde('zh-Hans-CN', 'zh')).toBe(true);
    expect(localeCorresponde('zh-Hans', 'zh')).toBe(true);
  });

  it('recusa chinês tradicional, cantonês e outros idiomas', () => {
    expect(localeCorresponde('zh-TW', 'zh')).toBe(false);
    expect(localeCorresponde('cmn-Hant-TW', 'zh')).toBe(false);
    expect(localeCorresponde('zh-HK', 'zh')).toBe(false);
    expect(localeCorresponde('yue-Hant-HK', 'zh')).toBe(false);
    expect(localeCorresponde('zh', 'zh')).toBe(false);
    expect(localeCorresponde('ja-JP', 'zh')).toBe(false);
  });
});

describe('encontrarLocale', () => {
  const doAparelho = ['de-DE', 'en-GB', 'en-US', 'es-ES', 'es-MX', 'cmn-Hans-CN', 'cmn-Hant-TW'];

  it('devolve a tag na grafia do aparelho', () => {
    expect(encontrarLocale(doAparelho, 'en')).toBe('en-US');
    expect(encontrarLocale(doAparelho, 'es')).toBe('es-MX');
    expect(encontrarLocale(doAparelho, 'zh')).toBe('cmn-Hans-CN');
  });

  it('devolve undefined quando o idioma não está na lista', () => {
    expect(encontrarLocale(['en-GB', 'es-ES'], 'en')).toBeUndefined();
    expect(encontrarLocale([], 'zh')).toBeUndefined();
  });
});
