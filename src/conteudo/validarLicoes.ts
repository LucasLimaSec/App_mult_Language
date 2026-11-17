import { caracteresHan, separarSilabas } from '../chines/pinyin';
import type { Exercicio, Unidade } from './licoes';

const MIN_EXERCICIOS = 6;
const MAX_EXERCICIOS = 8;

function problemasDoExercicio(ex: Exercicio, idioma: Unidade['idioma'], onde: string): string[] {
  const p: string[] = [];
  if (ex.tipo === 'escolha' || ex.tipo === 'ouvir') {
    if (ex.opcoes.length < 2) p.push(`${onde}: precisa de pelo menos 2 opções`);
    if (!Number.isInteger(ex.correta) || ex.correta < 0 || ex.correta >= ex.opcoes.length) {
      p.push(`${onde}: índice da resposta correta fora das opções`);
    }
    if (new Set(ex.opcoes).size !== ex.opcoes.length) p.push(`${onde}: opções repetidas`);
  }
  if (ex.tipo === 'montar') {
    if (ex.blocos.length < 2) p.push(`${onde}: montar precisa de pelo menos 2 blocos`);
    const repetidos = (ex.extras ?? []).filter((e) => ex.blocos.includes(e));
    if (repetidos.length) p.push(`${onde}: distrator igual a um bloco da resposta (${repetidos.join(', ')})`);
  }
  if (ex.tipo === 'ditado' && idioma === 'zh' && !ex.resposta) {
    p.push(`${onde}: ditado em chinês precisa da resposta em pinyin`);
  }
  if ((ex.tipo === 'falar' || ex.tipo === 'montar') && idioma === 'zh' && ex.pinyin) {
    const texto = ex.tipo === 'falar' ? ex.frase : ex.blocos.join('');
    if (separarSilabas(ex.pinyin.replace(/[，。？！,.?!]/g, ' ')).length !== caracteresHan(texto).length) {
      p.push(`${onde}: o pinyin não tem uma sílaba por caractere`);
    }
  }
  return p;
}

/** Confere uma unidade de lições e devolve a lista de problemas (vazia se estiver tudo certo). */
export function validarUnidade(unidade: Unidade): string[] {
  const p: string[] = [];
  const ids = new Set<string>();
  unidade.licoes.forEach((licao, i) => {
    const esperado = `${unidade.id}-l${String(i + 1).padStart(2, '0')}`;
    if (licao.id !== esperado) p.push(`${licao.id}: id deveria ser ${esperado}`);
    if (ids.has(licao.id)) p.push(`${licao.id}: id repetido`);
    ids.add(licao.id);
    if (licao.explicacao.length === 0) p.push(`${licao.id}: sem explicação`);
    if (licao.exemplos.length === 0) p.push(`${licao.id}: sem exemplos`);
    const n = licao.exercicios.length;
    if (n < MIN_EXERCICIOS || n > MAX_EXERCICIOS) p.push(`${licao.id}: ${n} exercícios (esperado de 6 a 8)`);
    licao.explicacao.forEach((b, j) => {
      if (b.tipo === 'tabela' && b.linhas.some((l) => l.length !== b.cabecalho.length)) {
        p.push(`${licao.id} explicação ${j + 1}: linha da tabela com número errado de colunas`);
      }
    });
    if (unidade.idioma === 'zh') {
      for (const ex of licao.exemplos) {
        if (!ex.pinyin) p.push(`${licao.id}: exemplo "${ex.frase}" sem pinyin`);
      }
      for (const pal of licao.palavras) {
        if (!pal.pinyin) p.push(`${licao.id}: palavra "${pal.palavra}" sem pinyin`);
        else if (separarSilabas(pal.pinyin).length !== caracteresHan(pal.palavra).length) {
          p.push(`${licao.id}: pinyin de "${pal.palavra}" não tem uma sílaba por caractere`);
        }
      }
    }
    licao.exercicios.forEach((ex, j) => p.push(...problemasDoExercicio(ex, unidade.idioma, `${licao.id} exercício ${j + 1}`)));
  });
  if (unidade.idioma === 'es' && !unidade.falsosAmigos?.length) p.push(`${unidade.id}: unidade de espanhol sem falsos amigos`);
  return p;
}
