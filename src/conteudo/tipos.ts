import type { Idioma } from '../voz/idiomas';

/** Uma palavra de um deck em /data. Vira dois cartões: reconhecimento e produção. */
export type CartaoDeck = {
  /** Id estável da palavra, por exemplo "es-freq-0001". Nunca reutilize um id. */
  id: string;
  palavra: string;
  /** Classe gramatical em inglês: noun, verb, adjective... */
  classe?: string;
  /** Significado em inglês e em português. */
  en: string;
  pt: string;
  /** Só no chinês: sílabas com acento de tom separadas por espaço, uma por caractere. */
  pinyin?: string;
  exemplo?: string;
  exemploEn?: string;
  exemploPt?: string;
  /** Observação curta em inglês (falso amigo, uso). */
  nota?: string;
};

export type Deck = {
  id: string;
  idioma: Idioma;
  titulo: string;
  cartoes: CartaoDeck[];
};
