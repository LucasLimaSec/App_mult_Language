import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

export const NOME_BANCO = 'multilingua.db';

const sqlite = openDatabaseSync(NOME_BANCO);

// WAL deixa as gravações mais rápidas; foreign_keys precisa ser ligado a cada
// conexão para o "ON DELETE cascade" de reviews funcionar.
sqlite.execSync('PRAGMA journal_mode = WAL;');
sqlite.execSync('PRAGMA foreign_keys = ON;');

export const db = drizzle(sqlite, { schema });
