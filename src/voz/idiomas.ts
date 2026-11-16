/** Códigos das línguas estudadas. Também usados como enum nas tabelas do banco. */
export const CODIGOS_IDIOMA = ['en', 'es', 'zh'] as const;

export type Idioma = (typeof CODIGOS_IDIOMA)[number];

export type InfoIdioma = {
  codigo: Idioma;
  nome: string;
  /** Locale usado na voz do sistema e no reconhecimento de fala. */
  locale: string;
  /** Frase curta usada nas telas de teste de áudio e de voz. */
  fraseTeste: string;
  traducaoTeste: string;
};

export const IDIOMAS: Record<Idioma, InfoIdioma> = {
  en: {
    codigo: 'en',
    nome: 'Inglês',
    locale: 'en-US',
    fraseTeste: 'The weather is nice today, so let us go for a walk.',
    traducaoTeste: 'O tempo está bom hoje, então vamos dar uma caminhada.',
  },
  es: {
    codigo: 'es',
    nome: 'Espanhol',
    locale: 'es-MX',
    fraseTeste: 'Hoy hace buen tiempo, vamos a caminar un rato.',
    traducaoTeste: 'Hoje o tempo está bom, vamos caminhar um pouco.',
  },
  zh: {
    codigo: 'zh',
    nome: 'Chinês (mandarim)',
    locale: 'zh-CN',
    fraseTeste: '今天天气很好，我们去散步吧。',
    traducaoTeste: 'Hoje o tempo está ótimo, vamos dar uma caminhada.',
  },
};

export const LISTA_IDIOMAS: InfoIdioma[] = CODIGOS_IDIOMA.map((codigo) => IDIOMAS[codigo]);
