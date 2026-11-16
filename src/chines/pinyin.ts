/** 1 a 4 são os tons do mandarim; 5 é o tom neutro. */
export type Tom = 1 | 2 | 3 | 4 | 5;

const VOGAIS_POR_TOM: Record<string, string> = {
  a: 'āáǎà',
  e: 'ēéěè',
  i: 'īíǐì',
  o: 'ōóǒò',
  u: 'ūúǔù',
  ü: 'ǖǘǚǜ',
};

const TOM_DO_ACENTO = new Map<string, Tom>();
for (const acentos of Object.values(VOGAIS_POR_TOM)) {
  [...acentos].forEach((letra, indice) => TOM_DO_ACENTO.set(letra, (indice + 1) as Tom));
}

/** Separa "xué xí" em ["xué", "xí"]. */
export function separarSilabas(pinyin: string): string[] {
  return pinyin.trim().split(/\s+/).filter(Boolean);
}

/** Descobre o tom de uma sílaba pelo acento; sem acento é tom neutro. */
export function tomDaSilaba(silaba: string): Tom {
  for (const letra of silaba.toLowerCase()) {
    const tom = TOM_DO_ACENTO.get(letra);
    if (tom) return tom;
  }
  return 5;
}

/** Cores do pinyin por tom: 1 vermelho, 2 laranja, 3 verde, 4 azul, neutro cinza. */
export const COR_DO_TOM: Record<Tom, string> = {
  1: '#e53935',
  2: '#f59e0b',
  3: '#16a34a',
  4: '#2563eb',
  5: '#94a3b8',
};

function acentuarSilaba(silaba: string, tom: number): string {
  const base = silaba.replace(/u:/g, 'ü').replace(/U:/g, 'Ü').replace(/v/g, 'ü');
  if (tom < 1 || tom > 4) return base;
  const minuscula = base.toLowerCase();
  // Regra do acento: "a" ou "e" se existirem; em "ou" vai no "o"; senão, na última vogal.
  let posicao = minuscula.search(/[ae]/);
  if (posicao < 0) posicao = minuscula.indexOf('ou');
  if (posicao < 0) {
    for (let i = minuscula.length - 1; i >= 0; i--) {
      if ('iouü'.includes(minuscula[i])) {
        posicao = i;
        break;
      }
    }
  }
  if (posicao < 0) return base;
  const original = base[posicao];
  const acentuada = VOGAIS_POR_TOM[minuscula[posicao]][tom - 1];
  const final = original === original.toUpperCase() ? acentuada.toUpperCase() : acentuada;
  return base.slice(0, posicao) + final + base.slice(posicao + 1);
}

/**
 * Converte o pinyin numerado do CC-CEDICT ("xue2 xi2", "nu:3 ren2") para
 * acentos de tom ("xué xí", "nǚ rén"). Pedaços que não são sílabas ficam como estão.
 */
export function numeradoParaAcentuado(numerado: string): string {
  return separarSilabas(numerado)
    .map((pedaco) => {
      const partes = /^([A-Za-zü:]+)([1-5])$/.exec(pedaco);
      return partes ? acentuarSilaba(partes[1], Number(partes[2])) : pedaco;
    })
    .join(' ');
}

/** Caracteres chineses (ideogramas) de um texto, na ordem. */
export function caracteresHan(texto: string): string[] {
  return [...texto].filter((letra) => /\p{Script=Han}/u.test(letra));
}
