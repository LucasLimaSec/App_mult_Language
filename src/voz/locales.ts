import { IDIOMAS, type Idioma } from './idiomas';

/** "en_us" e "EN-us" viram "en-us", para comparar tags vindas do Android. */
export function normalizarLocale(tag: string): string {
  return tag.trim().replace(/_/g, '-').toLowerCase();
}

/**
 * Diz se uma tag de locale devolvida pelo aparelho corresponde à variante que
 * o app usa para o idioma (en-US, es-MX, zh-CN).
 *
 * O mandarim simplificado aparece como "zh-CN", "cmn-Hans-CN" ou "zh-Hans-CN",
 * dependendo do serviço de voz, então é tratado à parte.
 */
export function localeCorresponde(tag: string, idioma: Idioma): boolean {
  const normal = normalizarLocale(tag);
  if (idioma === 'zh') {
    const partes = normal.split('-');
    const mandarim = partes[0] === 'zh' || partes[0] === 'cmn';
    const tradicional = partes.includes('hant') || partes.includes('tw') || partes.includes('hk');
    return mandarim && !tradicional && (partes.includes('cn') || partes.includes('hans'));
  }
  return normal === normalizarLocale(IDIOMAS[idioma].locale);
}

/** Procura na lista do aparelho a tag que corresponde ao idioma, na grafia original. */
export function encontrarLocale(tags: readonly string[], idioma: Idioma): string | undefined {
  return tags.find((tag) => localeCorresponde(tag, idioma));
}
