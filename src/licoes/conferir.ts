import { pinyin as gerarPinyin } from 'pinyin-pro';

import { caracteresHan } from '../chines/pinyin';

/** Minúsculas, sem pontuação e com espaços simples. Mantém os acentos. */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFC')
    .toLowerCase()
    .replace(/[¿?¡!.,;:"“”'‘’«»()…\-—–]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Tira acentos e o til (á → a, ñ → n). */
export function semAcentos(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC');
}

/** Montar a frase: os blocos escolhidos precisam formar a resposta, na ordem. */
export function conferirMontar(escolhidos: readonly string[], blocos: readonly string[]): boolean {
  return normalizarTexto(escolhidos.join(' ')) === normalizarTexto(blocos.join(' '));
}

export type ResultadoDitado = 'certo' | 'acento' | 'tom' | 'errado';

/**
 * Ditado no espanhol. "acento" quer dizer que só faltou ou sobrou acento:
 * conta como acerto, mas o app avisa.
 */
export function conferirDitadoEs(digitado: string, frase: string, aceitas: readonly string[] = []): ResultadoDitado {
  const resposta = normalizarTexto(digitado);
  const opcoes = [frase, ...aceitas].map(normalizarTexto);
  if (opcoes.includes(resposta)) return 'certo';
  if (opcoes.some((opcao) => semAcentos(opcao) === semAcentos(resposta))) return 'acento';
  return 'errado';
}

const TOM_DA_MARCA: Record<string, number> = { '\u0304': 1, '\u0301': 2, '\u030c': 3, '\u0300': 4 };

/**
 * Reduz um pinyin escrito de qualquer jeito ("mǎ", "ma3", "Ni3hao3", "nv3", "nu:3")
 * às letras sem tom e à sequência de tons. O tom neutro (5, 0 ou sem marca) não entra.
 */
export function chaveDoPinyin(texto: string): { letras: string; tons: number[] } {
  const decomposto = texto.toLowerCase().replace(/u:/g, 'ü').replace(/v/g, 'ü').normalize('NFD');
  let letras = '';
  const tons: number[] = [];
  for (const caractere of decomposto) {
    if (caractere in TOM_DA_MARCA) {
      tons.push(TOM_DA_MARCA[caractere]);
    } else if (caractere === '\u0308') {
      // trema do ü
      if (letras.endsWith('u')) letras = `${letras.slice(0, -1)}ü`;
    } else if (/[1-4]/.test(caractere)) {
      tons.push(Number(caractere));
    } else if (/[a-zü]/.test(caractere)) {
      letras += caractere;
    }
  }
  return { letras, tons };
}

/**
 * Ditado no chinês: você digita o pinyin. "tom" quer dizer que as letras estão
 * certas, mas algum tom está errado ou faltando.
 */
export function conferirDitadoZh(digitado: string, resposta: string, aceitas: readonly string[] = []): ResultadoDitado {
  const dele = chaveDoPinyin(digitado);
  const opcoes = [resposta, ...aceitas].map(chaveDoPinyin);
  if (opcoes.some((o) => o.letras === dele.letras && o.tons.join() === dele.tons.join())) return 'certo';
  if (opcoes.some((o) => o.letras === dele.letras)) return 'tom';
  return 'errado';
}

/** Quais posições de `esperado` aparecem, na mesma ordem, em `obtido` (maior subsequência comum). */
export function alinhar(esperado: readonly string[], obtido: readonly string[]): boolean[] {
  const n = esperado.length;
  const m = obtido.length;
  const tabela = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      tabela[i][j] =
        esperado[i] === obtido[j] ? tabela[i + 1][j + 1] + 1 : Math.max(tabela[i + 1][j], tabela[i][j + 1]);
    }
  }
  const acertos = new Array<boolean>(n).fill(false);
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (esperado[i] === obtido[j]) {
      acertos[i] = true;
      i++;
      j++;
    } else if (tabela[i + 1][j] >= tabela[i][j + 1]) {
      i++;
    } else {
      j++;
    }
  }
  return acertos;
}

export type ResultadoFala = {
  /** De 0 a 1: a parte da frase que o aparelho reconheceu. */
  nota: number;
  /** Cada palavra (ou caractere, no chinês) da frase, marcada como reconhecida ou não. */
  partes: { texto: string; ok: boolean }[];
  certo: boolean;
};

/** Nota mínima para a fala contar como acerto. */
export const NOTA_MINIMA_FALA = 0.8;

const ALGARISMOS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

/** 35 → 三十五, 108 → 一百零八, 2026 → 二千零二十六 (de 0 a 9999). */
export function numeroParaChines(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 9999) return String(n);
  if (n < 10) return ALGARISMOS[n];
  if (n < 20) return `十${n % 10 ? ALGARISMOS[n % 10] : ''}`;
  const casas: [number, string][] = [
    [1000, '千'],
    [100, '百'],
    [10, '十'],
  ];
  let resto = n;
  let texto = '';
  let zeroPendente = false;
  for (const [valor, nome] of casas) {
    const digito = Math.floor(resto / valor);
    resto %= valor;
    if (digito > 0) {
      if (zeroPendente) texto += '零';
      texto += ALGARISMOS[digito] + nome;
      zeroPendente = false;
    } else if (texto) {
      zeroPendente = true;
    }
  }
  if (resto > 0) texto += (zeroPendente ? '零' : '') + ALGARISMOS[resto];
  return texto;
}

function silabas(texto: string): string[] {
  return gerarPinyin(texto, { type: 'array', toneType: 'num', nonZh: 'removed' }).filter((s) => /[a-zü]/.test(s));
}

/**
 * Compara o que o reconhecimento entendeu com a frase esperada.
 * - Espanhol e inglês: palavra a palavra, sem acentos nem pontuação.
 * - Chinês: sílaba a sílaba em pinyin com tom, para não punir um caractere
 *   de mesmo som escrito diferente pelo reconhecimento.
 */
export function conferirFala(
  reconhecido: string,
  frase: string,
  idioma: 'en' | 'es' | 'zh',
  aceitas: readonly string[] = [],
): ResultadoFala {
  if (idioma === 'zh') {
    const caracteres = caracteresHan(frase);
    const esperado = silabas(frase);
    // O reconhecimento costuma escrever números com algarismos ("35").
    const obtido = silabas(reconhecido.replace(/\d+/g, (m) => numeroParaChines(Number(m))));
    const acertos = alinhar(esperado, obtido);
    const partes = caracteres.map((texto, i) => ({ texto, ok: acertos[i] ?? false }));
    const nota = esperado.length ? acertos.filter(Boolean).length / esperado.length : 0;
    return { nota, partes, certo: nota >= NOTA_MINIMA_FALA };
  }

  const palavras = (texto: string) => semAcentos(normalizarTexto(texto)).split(' ').filter(Boolean);
  const obtido = palavras(reconhecido);
  const exibidas = normalizarTexto(frase)
    .split(' ')
    .filter(Boolean);
  const acertos = alinhar(palavras(frase), obtido);
  const partes = exibidas.map((texto, i) => ({ texto, ok: acertos[i] ?? false }));
  const notaDe = (alvo: string) => {
    const esperado = palavras(alvo);
    return esperado.length ? alinhar(esperado, obtido).filter(Boolean).length / esperado.length : 0;
  };
  const nota = Math.max(notaDe(frase), ...aceitas.map(notaDe));
  return { nota, partes, certo: nota >= NOTA_MINIMA_FALA };
}

/** Embaralha uma cópia da lista (Fisher-Yates). `aleatorio` permite testes previsíveis. */
export function embaralhar<T>(lista: readonly T[], aleatorio: () => number = Math.random): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}
