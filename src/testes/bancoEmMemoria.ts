/**
 * Banco SQLite em memória com as mesmas migrations do app, para os testes
 * rodarem as consultas do Drizzle de verdade. Uso, no arquivo de teste:
 *
 *   jest.mock('../client', () => require('../../testes/bancoEmMemoria').criarBancoEmMemoria());
 *   const { sqlite } = jest.requireMock('../client');
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { drizzle } from 'drizzle-orm/sqlite-proxy';

const PASTA_MIGRATIONS = join(__dirname, '..', '..', 'drizzle');

export function criarBancoEmMemoria() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON;');
  for (const arquivo of readdirSync(PASTA_MIGRATIONS).filter((nome) => nome.endsWith('.sql')).sort()) {
    for (const comando of readFileSync(join(PASTA_MIGRATIONS, arquivo), 'utf8').split('--> statement-breakpoint')) {
      sqlite.exec(comando);
    }
  }
  const db = drizzle(async (sql: string, params: unknown[], method: string) => {
    const comando = sqlite.prepare(sql);
    const valores = params as (string | number | null)[];
    if (method === 'run') {
      comando.run(...valores);
      return { rows: [] };
    }
    const linhas = comando.all(...valores).map((linha) => Object.values(linha));
    return { rows: method === 'get' ? linhas[0] : linhas };
  });
  return { db, sqlite };
}

/** Apaga os dados de todas as tabelas, mantendo o esquema. */
export function limparBanco(sqlite: DatabaseSync) {
  sqlite.exec('DELETE FROM reviews; DELETE FROM cards; DELETE FROM settings; DELETE FROM lessons; DELETE FROM sessions;');
}
