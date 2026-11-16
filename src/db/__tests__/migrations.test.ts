import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const PASTA = join(__dirname, '..', '..', '..', 'drizzle');

/** Aplica todas as migrations, em ordem, num banco SQLite em memória. */
function criarBanco(): DatabaseSync {
  const banco = new DatabaseSync(':memory:');
  banco.exec('PRAGMA foreign_keys = ON;');
  const arquivos = readdirSync(PASTA)
    .filter((nome) => nome.endsWith('.sql'))
    .sort();
  for (const arquivo of arquivos) {
    const sql = readFileSync(join(PASTA, arquivo), 'utf8');
    for (const comando of sql.split('--> statement-breakpoint')) {
      banco.exec(comando);
    }
  }
  return banco;
}

function inserirCard(banco: DatabaseSync, conteudoId: string, direcao = 'reconhecimento'): number {
  const resultado = banco
    .prepare(
      `INSERT INTO cards (idioma, frente, direcao, verso_en, verso_pt, origem, conteudo_id, due, criado_em)
       VALUES ('es', 'trabajo', ?, 'work, job', 'trabalho', 'deck', ?, 0, 0)`,
    )
    .run(direcao, conteudoId);
  return Number(resultado.lastInsertRowid);
}

describe('migrations', () => {
  it('cria as cinco tabelas do plano', () => {
    const banco = criarBanco();
    const tabelas = banco
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
      .all()
      .map((linha) => linha.name)
      .sort();
    expect(tabelas).toEqual(['cards', 'lessons', 'reviews', 'sessions', 'settings']);
  });

  it('cria o cartão novo com o estado inicial do FSRS', () => {
    const banco = criarBanco();
    const id = inserirCard(banco, 'es-0001');
    const card = banco.prepare('SELECT * FROM cards WHERE id = ?').get(id);
    expect(card).toMatchObject({ state: 0, reps: 0, lapses: 0, stability: 0, suspenso: 0 });
  });

  it('aceita um cartão por direção e recusa repetir a mesma palavra na mesma direção', () => {
    const banco = criarBanco();
    inserirCard(banco, 'es-0001', 'reconhecimento');
    inserirCard(banco, 'es-0001', 'producao');
    expect(() => inserirCard(banco, 'es-0001', 'producao')).toThrow(/UNIQUE/);
  });

  it('apaga as revisões junto com o cartão', () => {
    const banco = criarBanco();
    const id = inserirCard(banco, 'es-0001');
    banco
      .prepare(
        `INSERT INTO reviews (card_id, rating, state, due, stability, difficulty, scheduled_days, learning_steps, revisado_em)
         VALUES (?, 3, 0, 0, 1.5, 5.0, 0, 1, 0)`,
      )
      .run(id);
    banco.prepare('DELETE FROM cards WHERE id = ?').run(id);
    expect(banco.prepare('SELECT count(*) AS total FROM reviews').get()).toEqual({ total: 0 });
  });

  it('recusa revisão de cartão que não existe', () => {
    const banco = criarBanco();
    expect(() =>
      banco
        .prepare(
          `INSERT INTO reviews (card_id, rating, state, due, stability, difficulty, scheduled_days, learning_steps, revisado_em)
           VALUES (999, 3, 0, 0, 1.5, 5.0, 0, 1, 0)`,
        )
        .run(),
    ).toThrow(/FOREIGN KEY/);
  });

  it('substitui o valor de uma preferência existente', () => {
    const banco = criarBanco();
    const gravar = banco.prepare(
      'INSERT INTO settings (chave, valor) VALUES (?, ?) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor',
    );
    gravar.run('novosPorDia', '10');
    gravar.run('novosPorDia', '15');
    expect(banco.prepare('SELECT * FROM settings').all()).toEqual([
      { chave: 'novosPorDia', valor: '15' },
    ]);
  });
});
