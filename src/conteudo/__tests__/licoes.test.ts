import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Unidade } from '../licoes';
import { validarUnidade } from '../validarLicoes';

const PASTA = join(__dirname, '..', '..', '..', 'data', 'licoes');
const arquivos = readdirSync(PASTA).filter((nome) => nome.endsWith('.json'));

describe('lições de /data/licoes', () => {
  it('existe pelo menos uma unidade', () => {
    expect(arquivos.length).toBeGreaterThan(0);
  });

  it.each(arquivos)('%s passa na validação', (arquivo) => {
    const unidade = JSON.parse(readFileSync(join(PASTA, arquivo), 'utf8')) as Unidade;
    expect(`${unidade.id}.json`).toBe(arquivo);
    expect(validarUnidade(unidade)).toEqual([]);
  });
});

describe('validarUnidade', () => {
  const base: Unidade = {
    id: 'es-u99',
    idioma: 'es',
    titulo: 'Teste',
    falsosAmigos: [{ palavra: 'largo', significado: 'long', portugues: 'x', exemplo: 'x', exemploEn: 'x' }],
    licoes: [
      {
        id: 'es-u99-l01',
        titulo: 'T',
        explicacao: [{ tipo: 'texto', texto: 'x' }],
        exemplos: [{ frase: 'Hola', en: 'Hi', pt: 'Oi' }],
        palavras: [],
        exercicios: Array.from({ length: 6 }, () => ({
          tipo: 'escolha' as const,
          pergunta: '?',
          opcoes: ['a', 'b'],
          correta: 0,
        })),
      },
    ],
  };

  it('aprova uma unidade correta', () => {
    expect(validarUnidade(base)).toEqual([]);
  });

  it('aponta resposta fora das opções, poucos exercícios e distrator igual à resposta', () => {
    const licao = base.licoes[0];
    const ruim: Unidade = {
      ...base,
      licoes: [
        {
          ...licao,
          exercicios: [
            { tipo: 'escolha', pergunta: '?', opcoes: ['a', 'b'], correta: 2 },
            { tipo: 'montar', traducao: 'x', blocos: ['Hola', 'Ana'], extras: ['Ana'] },
          ],
        },
      ],
    };
    const texto = validarUnidade(ruim).join('\n');
    expect(texto).toMatch(/fora das opções/);
    expect(texto).toMatch(/2 exercícios/);
    expect(texto).toMatch(/distrator igual/);
  });

  it('exige falsos amigos no espanhol e pinyin no chinês', () => {
    expect(validarUnidade({ ...base, falsosAmigos: [] }).join('\n')).toMatch(/sem falsos amigos/);
    const zh: Unidade = {
      ...base,
      id: 'zh-u99',
      idioma: 'zh',
      licoes: [{ ...base.licoes[0], id: 'zh-u99-l01', exemplos: [{ frase: '你好', en: 'hi', pt: 'oi' }] }],
    };
    expect(validarUnidade(zh).join('\n')).toMatch(/sem pinyin/);
  });
});
