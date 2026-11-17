import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import type { Lesson } from '../../db/schema';
import { buscarLicao, lerCurriculo, nomeDoNivel, proximaLicao, unidadeDoCurriculo, unidadeEscrita } from '../unidades';

const PASTA = join(__dirname, '..', '..', '..', 'data', 'licoes');

describe('currículo e unidades escritas', () => {
  it('cada arquivo em /data/licoes está registrado no app', () => {
    for (const arquivo of readdirSync(PASTA).filter((nome) => nome.endsWith('.json'))) {
      expect(unidadeEscrita(arquivo.replace('.json', ''))).toBeDefined();
    }
  });

  it('as lições escritas seguem os ids e títulos do currículo', () => {
    for (const idioma of ['es', 'zh'] as const) {
      for (const nivel of lerCurriculo(idioma)!.niveis) {
        for (const unidadeC of nivel.unidades) {
          const escrita = unidadeEscrita(unidadeC.id);
          if (!escrita) continue;
          expect(escrita.idioma).toBe(idioma);
          expect(escrita.licoes.map((l) => [l.id, l.titulo])).toEqual(unidadeC.licoes.map((l) => [l.id, l.titulo]));
        }
      }
    }
  });

  it('os currículos têm 30 unidades por idioma, com ids únicos', () => {
    for (const idioma of ['es', 'zh'] as const) {
      const ids = lerCurriculo(idioma)!.niveis.flatMap((n) => n.unidades.map((u) => u.id));
      expect(ids).toHaveLength(30);
      expect(new Set(ids).size).toBe(30);
    }
  });

  it('acha unidades e lições pelo id', () => {
    expect(unidadeDoCurriculo('zh-u17')?.titulo).toBe('Comparisons');
    expect(buscarLicao('es-u01-l02')).toMatchObject({ indice: 1, licao: { titulo: "What's your name?" } });
    expect(buscarLicao('es-u30-l01')).toBeUndefined();
    expect(buscarLicao('es-u01-l09')).toBeUndefined();
  });

  it('formata o nome do nível', () => {
    expect(nomeDoNivel('HSK1')).toBe('HSK 1');
    expect(nomeDoNivel('A2')).toBe('A2');
  });
});

describe('proximaLicao', () => {
  const concluida = (id: string) => ({ [id]: { id, status: 'concluida' } as Lesson });

  it('sugere a primeira lição não concluída', () => {
    expect(proximaLicao('es', {})?.id).toBe('es-u01-l01');
    expect(proximaLicao('es', { ...concluida('es-u01-l01') })?.id).toBe('es-u01-l02');
  });

  it('pula lições concluídas fora de ordem', () => {
    expect(proximaLicao('zh', { ...concluida('zh-u01-l01'), ...concluida('zh-u01-l03') })?.id).toBe('zh-u01-l02');
  });
});
