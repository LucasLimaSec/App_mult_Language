import { eq } from 'drizzle-orm';

import { db } from './client';
import { settings } from './schema';

/** Lê uma preferência. Devolve `padrao` se a chave não existir ou o JSON estiver corrompido. */
export async function lerSetting<T>(chave: string, padrao: T): Promise<T> {
  const linhas = await db.select().from(settings).where(eq(settings.chave, chave)).limit(1);
  if (linhas.length === 0) return padrao;
  try {
    return JSON.parse(linhas[0].valor) as T;
  } catch {
    return padrao;
  }
}

/** Grava uma preferência, criando ou substituindo a chave. */
export async function gravarSetting<T>(chave: string, valor: T): Promise<void> {
  const json = JSON.stringify(valor);
  await db
    .insert(settings)
    .values({ chave, valor: json })
    .onConflictDoUpdate({ target: settings.chave, set: { valor: json } });
}

export async function apagarSetting(chave: string): Promise<void> {
  await db.delete(settings).where(eq(settings.chave, chave));
}
