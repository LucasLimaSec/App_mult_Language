import type { DatabaseSync } from 'node:sqlite';

import type { Licao } from '../../conteudo/licoes';
import { limparBanco } from '../../testes/bancoEmMemoria';
import {
  adicionarPalavrasDaLicao,
  concluirLicao,
  iniciarLicao,
  lerProgresso,
  listarDuvidas,
  marcarDuvida,
} from '../licoes';

jest.mock('../client', () => require('../../testes/bancoEmMemoria').criarBancoEmMemoria());
const { sqlite } = jest.requireMock('../client') as { sqlite: DatabaseSync };

const AGORA = new Date(2026, 10, 17, 10, 0, 0);
const DEPOIS = new Date(2026, 10, 17, 10, 15, 0);

function licao(palavras: Licao['palavras'], id = 'es-u01-l01'): Licao {
  return { id, titulo: 'T', explicacao: [], exemplos: [], palavras, exercicios: [] };
}

function inserirDoDeck(frente: string, idioma = 'es', pinyin: string | null = null) {
  for (const direcao of ['reconhecimento', 'producao']) {
    sqlite
      .prepare(
        `INSERT INTO cards (idioma, frente, direcao, verso_en, pinyin, origem, conteudo_id, due, criado_em)
         VALUES (?, ?, ?, 'x', ?, 'deck', ?, 0, 0)`,
      )
      .run(idioma, frente, direcao, pinyin, `deck-${frente}-${pinyin ?? ''}`);
  }
}

const contar = (sqlQuery: string) => (sqlite.prepare(sqlQuery).get() as { n: number }).n;

beforeEach(() => limparBanco(sqlite));

describe('adicionarPalavrasDaLicao', () => {
  it('cria dois cartões por palavra nova, ligados à lição', async () => {
    const n = await adicionarPalavrasDaLicao(
      licao([{ palavra: 'igualmente', en: 'likewise', pt: 'igualmente' }]),
      'es',
      AGORA,
    );
    expect(n).toBe(1);
    const linhas = sqlite.prepare("SELECT direcao, origem, licao_id, conteudo_id FROM cards ORDER BY direcao").all();
    expect(linhas).toEqual([
      { direcao: 'producao', origem: 'licao', licao_id: 'es-u01-l01', conteudo_id: 'es-u01-l01-p01' },
      { direcao: 'reconhecimento', origem: 'licao', licao_id: 'es-u01-l01', conteudo_id: 'es-u01-l01-p01' },
    ]);
  });

  it('pula palavras que já estão no deck, sem ligar para maiúsculas', async () => {
    inserirDoDeck('hola');
    const n = await adicionarPalavrasDaLicao(
      licao([
        { palavra: 'Hola', en: 'hi', pt: 'oi' },
        { palavra: 'nos vemos', en: 'see you', pt: 'a gente se vê' },
      ]),
      'es',
      AGORA,
    );
    expect(n).toBe(1);
    expect(contar("SELECT count(*) AS n FROM cards WHERE frente = 'nos vemos'")).toBe(2);
  });

  it('não duplica ao concluir a mesma lição duas vezes', async () => {
    const l = licao([{ palavra: 'nos vemos', en: 'see you', pt: 'a gente se vê' }]);
    await adicionarPalavrasDaLicao(l, 'es', AGORA);
    expect(await adicionarPalavrasDaLicao(l, 'es', DEPOIS)).toBe(0);
    expect(contar('SELECT count(*) AS n FROM cards')).toBe(2);
  });

  it('no chinês, a mesma grafia com outra leitura é outra palavra', async () => {
    inserirDoDeck('还', 'zh', 'hái');
    const n = await adicionarPalavrasDaLicao(
      licao(
        [
          { palavra: '还', pinyin: 'huán', en: 'to return', pt: 'devolver' },
          { palavra: '还', pinyin: 'hái', en: 'still', pt: 'ainda' },
        ],
        'zh-u23-l01',
      ),
      'zh',
      AGORA,
    );
    expect(n).toBe(1);
  });

  it('não confunde palavras de idiomas diferentes', async () => {
    inserirDoDeck('no', 'zh');
    expect(await adicionarPalavrasDaLicao(licao([{ palavra: 'no', en: 'no', pt: 'não' }]), 'es', AGORA)).toBe(1);
  });
});

describe('progresso da lição', () => {
  const l = licao([{ palavra: 'igualmente', en: 'likewise', pt: 'igualmente' }]);

  it('passa de em andamento para concluída e guarda o placar', async () => {
    await iniciarLicao(l.id, 'es', AGORA);
    expect((await lerProgresso('es'))[l.id].status).toBe('em_andamento');

    const resultado = await concluirLicao(l, 'es', 6, 8, AGORA, DEPOIS);
    expect(resultado.palavrasNovas).toBe(1);
    expect((await lerProgresso('es'))[l.id]).toMatchObject({ status: 'concluida', acertos: 6, totalExercicios: 8 });
  });

  it('refazer a lição não volta o status nem piora o melhor placar', async () => {
    await concluirLicao(l, 'es', 7, 8, AGORA, DEPOIS);
    await iniciarLicao(l.id, 'es', DEPOIS);
    expect((await lerProgresso('es'))[l.id].status).toBe('concluida');

    await concluirLicao(l, 'es', 3, 8, AGORA, DEPOIS);
    expect((await lerProgresso('es'))[l.id]).toMatchObject({ acertos: 7, totalExercicios: 8 });

    await concluirLicao(l, 'es', 8, 8, AGORA, DEPOIS);
    expect((await lerProgresso('es'))[l.id]).toMatchObject({ acertos: 8, totalExercicios: 8 });
  });

  it('registra o tempo de estudo da lição', async () => {
    await concluirLicao({ ...l, exercicios: new Array(8).fill({ tipo: 'escolha', pergunta: '?', opcoes: ['a', 'b'], correta: 0 }) }, 'es', 8, 8, AGORA, DEPOIS);
    expect(sqlite.prepare('SELECT tipo, idioma, duracao_seg, itens FROM sessions').all()).toEqual([
      { tipo: 'licao', idioma: 'es', duracao_seg: 900, itens: 8 },
    ]);
  });
});

describe('dúvidas', () => {
  it('marca, lista e desmarca a dúvida de uma lição', async () => {
    await marcarDuvida('es-u01-l02', 'es', '  usted ou tú com o chefe?  ');
    expect(await listarDuvidas()).toEqual([
      expect.objectContaining({ id: 'es-u01-l02', duvida: true, notaDuvida: 'usted ou tú com o chefe?' }),
    ]);
    await marcarDuvida('es-u01-l02', 'es', null);
    expect(await listarDuvidas()).toEqual([]);
  });

  it('marcar dúvida não mexe no status da lição', async () => {
    await iniciarLicao('es-u01-l02', 'es', AGORA);
    await marcarDuvida('es-u01-l02', 'es', 'nota');
    expect((await lerProgresso('es'))['es-u01-l02'].status).toBe('em_andamento');
  });
});
