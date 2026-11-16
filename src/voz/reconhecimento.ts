import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { Platform } from 'react-native';

import { CODIGOS_IDIOMA, IDIOMAS, type Idioma } from './idiomas';
import { encontrarLocale } from './locales';

/**
 * Situação do modelo offline de um idioma:
 * - instalado: pronto para reconhecer sem internet
 * - faltando: o aparelho suporta o idioma, mas o modelo não foi baixado
 * - nao_suportado: o serviço de voz do aparelho não oferece esse idioma
 * - desconhecido: não deu para consultar (Android 12 ou erro do serviço)
 */
export type StatusModelo = 'instalado' | 'faltando' | 'nao_suportado' | 'desconhecido';

export type ModeloIdioma = {
  status: StatusModelo;
  /** Tag do locale como o aparelho a escreve; usada para pedir o download. */
  localeDoAparelho?: string;
};

export type DiagnosticoVoz = {
  versaoAndroid: number;
  /** A lista de modelos instalados só existe a partir do Android 13 (API 33). */
  consegueListarModelos: boolean;
  reconhecimentoDisponivel: boolean;
  suportaNoAparelho: boolean;
  servicoPadrao: string;
  modelos: Record<Idioma, ModeloIdioma>;
  erro?: string;
};

const API_ANDROID_13 = 33;

function versaoAndroid(): number {
  return Platform.OS === 'android' ? Number(Platform.Version) : 0;
}

function modelosDesconhecidos(): Record<Idioma, ModeloIdioma> {
  return { en: { status: 'desconhecido' }, es: { status: 'desconhecido' }, zh: { status: 'desconhecido' } };
}

/** Consulta o aparelho: reconhecimento disponível, suporte offline e modelos instalados. */
export async function diagnosticarVoz(): Promise<DiagnosticoVoz> {
  const versao = versaoAndroid();
  const diagnostico: DiagnosticoVoz = {
    versaoAndroid: versao,
    consegueListarModelos: versao >= API_ANDROID_13,
    reconhecimentoDisponivel: ExpoSpeechRecognitionModule.isRecognitionAvailable(),
    suportaNoAparelho: ExpoSpeechRecognitionModule.supportsOnDeviceRecognition(),
    servicoPadrao: ExpoSpeechRecognitionModule.getDefaultRecognitionService().packageName,
    modelos: modelosDesconhecidos(),
  };

  if (!diagnostico.consegueListarModelos) return diagnostico;

  try {
    const { locales, installedLocales } = await ExpoSpeechRecognitionModule.getSupportedLocales({});
    for (const idioma of CODIGOS_IDIOMA) {
      const instalado = encontrarLocale(installedLocales, idioma);
      const suportado = encontrarLocale(locales, idioma);
      if (instalado) {
        diagnostico.modelos[idioma] = { status: 'instalado', localeDoAparelho: instalado };
      } else if (suportado) {
        diagnostico.modelos[idioma] = { status: 'faltando', localeDoAparelho: suportado };
      } else {
        diagnostico.modelos[idioma] = { status: 'nao_suportado' };
      }
    }
  } catch (erro) {
    diagnostico.erro = erro instanceof Error ? erro.message : String(erro);
  }
  return diagnostico;
}

export type ResultadoDownload = 'dialogo_aberto' | 'baixado' | 'agendado';

/** Pede ao Android o download do modelo offline do idioma (Android 13 ou mais novo). */
export async function baixarModelo(idioma: Idioma, localeDoAparelho?: string): Promise<ResultadoDownload> {
  const { status } = await ExpoSpeechRecognitionModule.androidTriggerOfflineModelDownload({
    locale: localeDoAparelho ?? IDIOMAS[idioma].locale,
  });
  if (status === 'download_success') return 'baixado';
  if (status === 'download_scheduled') return 'agendado';
  return 'dialogo_aberto';
}

/**
 * Pede a permissão do microfone e começa a ouvir, sempre no aparelho.
 * Devolve `false` se a permissão foi negada. A transcrição chega pelos eventos
 * "result" de `useSpeechRecognitionEvent`.
 */
export async function comecarEscuta(idioma: Idioma, localeDoAparelho?: string): Promise<boolean> {
  const permissao = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
  if (!permissao.granted) return false;
  ExpoSpeechRecognitionModule.start({
    lang: localeDoAparelho ?? IDIOMAS[idioma].locale,
    interimResults: true,
    continuous: false,
    maxAlternatives: 1,
    requiresOnDeviceRecognition: true,
  });
  return true;
}

export function pararEscuta(): void {
  ExpoSpeechRecognitionModule.stop();
}

export function cancelarEscuta(): void {
  ExpoSpeechRecognitionModule.abort();
}

/** Mensagens em português para os códigos de erro do reconhecimento. */
export function descreverErroVoz(codigo: string): string {
  switch (codigo) {
    case 'not-allowed':
      return 'Permissão do microfone negada. Libere nas configurações do Android.';
    case 'language-not-supported':
      return 'O modelo offline deste idioma não está instalado no aparelho.';
    case 'network':
      return 'O aparelho tentou usar a internet: o reconhecimento offline deste idioma não está funcionando.';
    case 'no-speech':
    case 'speech-timeout':
      return 'Não ouvi nada. Toque em "Falar" e tente de novo.';
    case 'service-not-allowed':
      return 'O serviço de reconhecimento de voz do Android está indisponível ou desativado.';
    case 'busy':
      return 'O reconhecimento ainda está ocupado. Espere um instante e tente de novo.';
    case 'audio-capture':
      return 'Não foi possível gravar pelo microfone.';
    case 'aborted':
      return 'Escuta cancelada.';
    default:
      return `Erro do reconhecimento de voz (${codigo}).`;
  }
}
