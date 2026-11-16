// Gera assets/dicionario.db: o dicionário chinês offline empacotado no app.
//
//   node scripts/gerar-dicionario.mjs            usa o CC-CEDICT em .cache/ (baixa se faltar)
//   node scripts/gerar-dicionario.mjs --baixar   baixa de novo a versão mais recente
//
// Fontes:
// - CC-CEDICT (MDBG), licença CC BY-SA 4.0: palavras, pinyin e definições em inglês.
// - hanzi-writer-data (Make Me a Hanzi), Arphic Public License: traços dos caracteres.
//
// Roda só no desenvolvimento. O app nunca acessa a internet para isso.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

import { numeradoParaAcentuado } from '../src/chines/pinyin.ts';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const URL_CEDICT = 'https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz';
const CACHE = join(RAIZ, '.cache', 'cedict.txt.gz');
const PASTA_TRACOS = join(RAIZ, 'node_modules', 'hanzi-writer-data');
const SAIDA = join(RAIZ, 'assets', 'dicionario.db');
const SAIDA_VERSAO = join(RAIZ, 'src', 'chines', 'dicionario-versao.json');

async function obterCedict() {
  if (process.argv.includes('--baixar') || !existsSync(CACHE)) {
    console.log('Baixando o CC-CEDICT...');
    const resposta = await fetch(URL_CEDICT);
    if (!resposta.ok) throw new Error(`Falha ao baixar o CC-CEDICT: HTTP ${resposta.status}`);
    mkdirSync(dirname(CACHE), { recursive: true });
    writeFileSync(CACHE, Buffer.from(await resposta.arrayBuffer()));
  }
  return gunzipSync(readFileSync(CACHE)).toString('utf8');
}

const texto = await obterCedict();
const linhas = texto.split('\n');
const dataCedict = /^#! date=(\S+)/m.exec(texto)?.[1] ?? 'desconhecida';

rmSync(SAIDA, { force: true });
const banco = new DatabaseSync(SAIDA);
banco.exec(`
  PRAGMA journal_mode = OFF;
  PRAGMA page_size = 8192;
  CREATE TABLE cedict (
    id INTEGER PRIMARY KEY,
    simplificado TEXT NOT NULL,
    pinyin TEXT NOT NULL,
    definicoes TEXT NOT NULL
  );
  CREATE TABLE tracos (
    caractere TEXT PRIMARY KEY,
    tracos TEXT NOT NULL
  );
  CREATE TABLE meta (chave TEXT PRIMARY KEY, valor TEXT NOT NULL) WITHOUT ROWID;
`);

// Formato de cada linha: 傳統 传统 [chuan2 tong3] /tradition/traditional/
const FORMATO = /^(\S+) (\S+) \[([^\]]*)\] \/(.*)\/\s*$/;
const inserirPalavra = banco.prepare(
  'INSERT INTO cedict (simplificado, pinyin, definicoes) VALUES (?, ?, ?)',
);
let palavras = 0;
let ignoradas = 0;
banco.exec('BEGIN');
for (const linha of linhas) {
  if (linha === '' || linha.startsWith('#')) continue;
  const partes = FORMATO.exec(linha);
  if (!partes) {
    ignoradas++;
    continue;
  }
  const [, , simplificado, pinyin, definicoes] = partes;
  inserirPalavra.run(simplificado, numeradoParaAcentuado(pinyin), definicoes.split('/').join('; '));
  palavras++;
}
banco.exec('COMMIT');
banco.exec('CREATE INDEX cedict_simplificado_idx ON cedict (simplificado)');

// Um arquivo por caractere: { strokes: [caminhos SVG], medians: [...] }.
// Só os caminhos são guardados; as medianas não são usadas pelo app.
const inserirTracos = banco.prepare('INSERT INTO tracos (caractere, tracos) VALUES (?, ?)');
let caracteres = 0;
banco.exec('BEGIN');
for (const arquivo of readdirSync(PASTA_TRACOS)) {
  if (!arquivo.endsWith('.json')) continue;
  const caractere = arquivo.slice(0, -'.json'.length);
  if ([...caractere].length !== 1) continue; // package.json, all.json etc.
  const dados = JSON.parse(readFileSync(join(PASTA_TRACOS, arquivo), 'utf8'));
  if (!Array.isArray(dados.strokes)) continue;
  inserirTracos.run(caractere, JSON.stringify(dados.strokes));
  caracteres++;
}
banco.exec('COMMIT');

const versao = `cedict-${dataCedict}`;
const meta = banco.prepare('INSERT INTO meta (chave, valor) VALUES (?, ?)');
meta.run('versao', versao);
meta.run('cedict_data', dataCedict);
meta.run('cedict_licenca', 'CC BY-SA 4.0 - https://cc-cedict.org/');
meta.run('tracos_licenca', 'Arphic Public License - Make Me a Hanzi / hanzi-writer-data');
banco.exec('VACUUM');
banco.close();

writeFileSync(SAIDA_VERSAO, JSON.stringify({ versao, palavras, caracteres }, null, 2) + '\n');

const megas = (statSync(SAIDA).size / 2 ** 20).toFixed(1);
console.log(`CC-CEDICT de ${dataCedict}: ${palavras} entradas (${ignoradas} linhas ignoradas)`);
console.log(`Traços: ${caracteres} caracteres`);
console.log(`Gerado ${SAIDA} (${megas} MB)`);
