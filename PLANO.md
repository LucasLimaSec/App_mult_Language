# Plano de desenvolvimento — App pessoal de idiomas

Nov 15, 2026 · @lucas

## Visão geral

Um app nativo para Android, feito com React Native + Expo, que funciona offline e pode ser publicado na Play Store. A versão 1 (MVP) funciona inteira sem nenhuma API de IA: lições, flashcards e prática de fala com diálogos prontos. A conversa por voz com IA entra depois, numa segunda etapa, sem precisar refazer o app.

**Objetivos por língua**

- **Inglês (intermediário → fala fluente):** conversar por voz com uma IA, receber correções de gramática e de naturalidade, treinar pronúncia.
- **Espanhol (do zero → B1):** lições curtas com explicação em inglês, atenção aos falsos amigos, flashcards com áudio.
- **Chinês mandarim (do zero → HSK 2):** pinyin e tons, caracteres com ordem dos traços, flashcards, frases faladas.

**Princípios**

- MVP sem IA: a versão 1 não chama nenhuma API externa. A IA entra na etapa 2 como recurso extra, atrás de um interruptor, e o app continua funcionando sem ela.
- Offline primeiro: no MVP, o app inteiro funciona sem internet. Na etapa 2, só a conversa com IA e a nota detalhada de pronúncia vão precisar de conexão.
- O conteúdo vai dentro do app: lições, decks e diálogos são escritos pelo Claude Code durante o desenvolvimento e empacotados.
- Fala primeiro: toda frase tem botão de ouvir e de repetir em voz alta.
- Uma sessão diária de 15 a 20 minutos que mistura as três línguas.
- Seus dados ficam no aparelho, com backup exportável.

## Stack técnica e arquitetura

O app é nativo para Android e guarda tudo no aparelho. No MVP não existe back-end; ele só aparece na etapa 2, para esconder as chaves das APIs de IA. Você pode desenvolver em Windows, Linux ou Mac, e o Expo compila o app na nuvem.

| Camada | Escolha | Etapa | Motivo |
| --- | --- | --- | --- |
| App | React Native + Expo (TypeScript), Expo Router | MVP | Android agora; o mesmo código serve para iPhone no futuro |
| Estilo | NativeWind (Tailwind para React Native) | MVP | Rápido de ajustar com o Claude Code |
| Dados locais | expo-sqlite + Drizzle ORM | MVP | Banco no aparelho, 100% offline |
| Conteúdo | Lições, decks e diálogos em JSON, escritos pelo Claude Code e empacotados | MVP | Nenhuma API em tempo de uso |
| Áudio das frases | Voz do sistema (expo-speech) | MVP | Grátis e offline com as vozes instaladas |
| Fala → texto | expo-speech-recognition no aparelho | MVP | Sem internet e sem custo |
| Pronúncia simples | Comparação da transcrição com a frase-alvo | MVP | Nota por palavra sem API |
| Repetição espaçada | ts-fsrs (algoritmo FSRS) | MVP | Agenda cada revisão na hora certa |
| Chinês | pinyin-pro, hanzi-writer-data + react-native-svg, CC-CEDICT em SQLite | MVP | Pinyin, ordem dos traços e dicionário offline |
| Build e publicação | EAS Build + EAS Submit, Google Play Console | MVP | Gera o APK/AAB na nuvem e envia para a Play Store |
| Back-end | 2 funções serverless na Vercel | Etapa 2 | Guarda as chaves de API fora do app |
| Conversa e correções | Claude API: claude-haiku-5-5 na conversa, claude-sonnet-5-5 nos relatórios | Etapa 2 | Só online |
| Pronúncia detalhada e vozes neurais | Azure Speech (Pronunciation Assessment e TTS) | Etapa 2 | Nota por fonema e áudio mais natural |

&#91;embedded content: arquitetura · celular, Vercel e serviços de IA\]

No MVP, só existe a coluna da esquerda: tudo roda no celular. As colunas da Vercel e dos serviços de IA entram na etapa 2.

## Funcionamento offline

No MVP, o app inteiro funciona sem internet. Na etapa 2, ele perde apenas a conversa com IA e a nota detalhada de pronúncia quando estiver offline.

| Recurso | Etapa | Sem internet? | Como |
| --- | --- | --- | --- |
| Flashcards e revisões | MVP | Sim | Banco SQLite no aparelho |
| Lições e exercícios | MVP | Sim | Conteúdo empacotado no app |
| Ouvir frases | MVP | Sim, com as vozes instaladas | Voz do sistema |
| Falar e ser transcrito | MVP | Sim, com o idioma baixado | Reconhecimento no aparelho |
| Diálogos prontos em inglês | MVP | Sim | Roteiros empacotados + reconhecimento no aparelho |
| Nota simples de pronúncia | MVP | Sim | Compara a transcrição com a frase esperada |
| Conversa livre com IA | Etapa 2 | Não | Claude API; offline o app volta para os diálogos prontos |
| Nota detalhada de pronúncia | Etapa 2 | Não | Azure, quando houver conexão |
| Adicionar palavra com IA | Etapa 2 | Fica na fila | Gera o cartão quando a internet voltar |

No Android, o reconhecimento no aparelho existe a partir do Android 12, e cada idioma precisa ter o modelo baixado antes do uso ([fonte](https://developer.android.com/reference/android/speech/RecognitionSupport.html)). O app deve verificar se inglês, espanhol e chinês estão instalados e pedir o download quando faltar. Teste isso no seu celular na Fase 0.

## Fases de desenvolvimento

O plano tem duas etapas. O MVP (fases 0 a 5) funciona inteiro sem nenhuma API de IA e já pode ir para a Play Store; a etapa 2 (fases 6 e 7) adiciona a IA depois, sem refazer o app. Faça uma fase por vez no Claude Code e só avance quando o critério de pronto for cumprido no seu celular.

| Fase | Etapa | Entrega | Usa API de IA? |
| --- | --- | --- | --- |
| 0 — Fundação | MVP | App abre no Android e guarda dados offline | Não |
| 1 — Flashcards | MVP | Revisão diária de espanhol e chinês | Não |
| 2 — Lições | MVP | Trilha de espanhol A1→B1 e chinês HSK 1→HSK 2 | Não |
| 3 — Prática de fala offline | MVP | Diálogos prontos em inglês e shadowing | Não |
| 4 — Sessão diária | MVP | Botão "Estudar hoje" e progresso | Não |
| 5 — Publicação | MVP | APK no celular e app na Play Store | Não |
| 6 — Conversa com IA | Etapa 2 | Conversa livre por voz em inglês | Sim (Claude) |
| 7 — Pronúncia detalhada | Etapa 2 | Nota por fonema e vozes neurais | Sim (Azure) |

### Etapa 1 — MVP sem IA

Nenhuma fase desta etapa chama API externa. O conteúdo é escrito pelo próprio Claude Code durante o desenvolvimento, usando a sua assinatura, e vai empacotado no app.

#### Fase 0 — Fundação

Objetivo: um esqueleto de app nativo que abre no Android e guarda dados sem internet, sem back-end.

- [x] Criar o projeto Expo (TypeScript, Expo Router, NativeWind) e o repositório no GitHub
- [x] Criar o banco local com expo-sqlite + Drizzle (tabelas: cards, reviews, lessons, sessions, settings)
- [x] Criar o arquivo de interruptores `src/config/features.ts` com `iaAtiva: false`; telas de IA ficam escondidas
- [ ] Criar um development build (APK) com EAS e instalar direto no celular: a biblioteca de voz usa código nativo e não roda no Expo Go
- [ ] Tela de teste de voz: verificar se os modelos offline de inglês, espanhol e chinês estão instalados, pedir o download e testar em modo avião
- [ ] Tela de teste de áudio: a voz do sistema lê uma frase em cada língua

Pronto quando: o app abre no seu Android, salva dados em modo avião e você sabe se ouvir e falar funcionam offline nas 3 línguas.

```text
Leia CLAUDE.md e PLANO.md. Implemente a Fase 0. Antes de codar, me mostre a estrutura de pastas e o schema do banco (Drizzle) para eu aprovar.
```

#### Fase 1 — Flashcards (espanhol e chinês)

Objetivo: revisar vocabulário todo dia, offline.

- [ ] Integrar ts-fsrs com 4 botões: Errei, Difícil, Bom, Fácil
- [ ] Deck inicial de espanhol: palavras mais frequentes com frase de exemplo e tradução, escrito em /data
- [ ] Deck inicial de chinês: lista HSK 1 com caractere, pinyin e significado
- [ ] Pinyin colorido por tom e ordem dos traços (hanzi-writer-data desenhado com react-native-svg)
- [ ] Botão de áudio em todo cartão com a voz do sistema (expo-speech)
- [ ] "Adicionar palavra" manual: você digita a palavra e a tradução; no chinês, o app completa pinyin e significado pelo dicionário CC-CEDICT offline
- [ ] Limite diário de cartões novos configurável

Pronto quando: você revisa 20 cartões sem internet e eles voltam nos dias certos.

```text
Leia CLAUDE.md e PLANO.md. Implemente a Fase 1. Escreva você mesmo os decks iniciais como JSON em /data, sem chamar nenhuma API, e me mostre 10 cartões de cada língua antes de escrever o resto.
```

#### Fase 2 — Lições estruturadas

Objetivo: uma trilha que ensina gramática e frases em ordem.

- [ ] Currículo em JSON: espanhol A1 → B1 e chinês HSK 1 → HSK 2, em unidades por tema
- [ ] Claude Code escreve cada lição em /data: explicação em inglês, exemplos e 6 a 8 exercícios
- [ ] Tipos de exercício: múltipla escolha, montar a frase, ditado, falar a frase (conferida pelo reconhecimento no aparelho)
- [ ] No espanhol, um quadro de falsos amigos do português em cada unidade
- [ ] Palavras da lição entram automaticamente nos flashcards
- [ ] Botão "marcar dúvida" para conferir depois com um nativo (por exemplo no HelloTalk)

Pronto quando: as 3 primeiras unidades de cada língua estão prontas e você revisou o conteúdo.

```text
Leia CLAUDE.md e PLANO.md. Implemente a Fase 2. Primeiro proponha o currículo completo em /data/curriculo-es.json e /data/curriculo-zh.json para eu aprovar; depois escreva as lições unidade por unidade.
```

#### Fase 3 — Prática de fala offline

Objetivo: treinar a fala em inglês sem IA, até a conversa livre chegar na etapa 2.

- [ ] Diálogos prontos em inglês por cenário (entrevista de emprego, reunião, viagem, atendimento, papo informal), escritos em /data
- [ ] Modo roleplay: o app fala a parte do outro personagem e você responde a sua; o app confere a transcrição
- [ ] Cada fala sua aceita variações, para não exigir a frase exata
- [ ] Shadowing nas 3 línguas: ouvir, repetir e ver uma nota simples por palavra
- [ ] Frases com nota baixa voltam para repetir depois

Pronto quando: você completa um diálogo de 5 minutos em modo avião.

```text
Leia CLAUDE.md e PLANO.md. Implemente a Fase 3. Comece escrevendo 2 diálogos de exemplo em /data/dialogos-en.json, com variações aceitas para cada fala minha, para eu revisar o formato.
```

#### Fase 4 — Sessão diária e progresso

Objetivo: abrir o app e saber exatamente o que fazer hoje.

- [ ] Botão "Estudar hoje": revisões vencidas + 1 lição + 5 minutos de prática de fala
- [ ] Painel: sequência de dias, minutos por língua, palavras aprendidas
- [ ] Exportar e importar backup em JSON

Pronto quando: você usa só o "Estudar hoje" por uma semana sem sentir falta de nada.

```text
Leia CLAUDE.md e PLANO.md. Implemente a Fase 4.
```

#### Fase 5 — Instalação e publicação na Play Store

Objetivo: ter o app instalado como um app de verdade e, se quiser, publicá-lo. Para uso só seu, a Play Store é opcional: o Android permite instalar o APK direto.

- [ ] Uso pessoal: gerar um APK com EAS (perfil preview) e instalar no celular
- [ ] Ícone, tela de abertura, nome do app e identificador (package name)
- [ ] Texto de permissão do microfone e página simples de política de privacidade
- [ ] Criar a conta no Google Play Console (taxa única de US$25)
- [ ] Preencher a ficha da loja e o formulário de segurança dos dados (no MVP, nenhum dado sai do aparelho)
- [ ] Gerar o AAB (perfil production) e enviar com EAS Submit para o teste interno
- [ ] Para publicar: rodar o teste fechado (regra abaixo) e depois pedir acesso à produção

Pronto quando: o app está instalado (pelo APK ou pela Play Store) e abre normalmente em modo avião.

Contas pessoais criadas depois de 13 de novembro de 2023 precisam fazer um teste fechado com pelo menos 12 testadores inscritos por 14 dias seguidos antes de publicar ([fonte](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en-EN)). O teste interno não tem mínimo de testadores nem revisão, mas não conta para liberar a produção ([fonte](https://www.testerscommunity.com/de/guides/how-many-testers-do-you-need-google-play)). Comece a juntar os 12 testadores (amigos e família) já na Fase 3.

```text
Leia CLAUDE.md e PLANO.md. Implemente a Fase 5. Configure eas.json com perfis development (APK), preview (APK) e production (AAB) e me passe a lista de passos que eu preciso fazer manualmente no Google Play Console.
```

### Etapa 2 — IA (depois do MVP)

Estas fases só ligam o interruptor `iaAtiva` e acrescentam telas; sem internet, ou com a IA desligada, o app continua funcionando como no MVP. Se o app já estiver público, a atualização precisa proteger a API, porque cada usuário passa a gerar custo.

#### Fase 6 — Conversa por voz com IA em inglês

Objetivo: treinar fala livre com um parceiro de conversa paciente.

- [ ] Criar a função `/api/chat` na Vercel, que repassa mensagens para a Claude API
- [ ] Ligar `iaAtiva` e mostrar a tela de conversa só quando houver internet
- [ ] Cenários: papo livre, entrevista de emprego, reunião, viagem, atendimento, debate de opinião
- [ ] Ciclo: segurar para falar → transcrição no aparelho → resposta do Claude → resposta falada
- [ ] Prompt do parceiro: nível B1–B2, respostas curtas, sempre termina com uma pergunta, não corrige no meio da conversa
- [ ] Relatório no fim: erros de gramática, frases mais naturais e palavras novas, com um toque para virar flashcard
- [ ] "Adicionar palavra com IA": o Claude gera o cartão completo; sem internet, o pedido vai para uma fila
- [ ] Se o app for público: limite de uso por pessoa

Pronto quando: você conversa 5 minutos sem travar e recebe um relatório útil.

```text
Leia CLAUDE.md e PLANO.md. Implemente a Fase 6. Escreva primeiro os prompts de sistema do parceiro de conversa e do relatório em /prompts para eu revisar.
```

#### Fase 7 — Pronúncia detalhada e vozes neurais

Objetivo: nota objetiva de pronúncia e áudio mais natural.

- [ ] Criar o recurso Speech na Azure e a função `/api/pronuncia`
- [ ] Quando online, trocar a nota simples pela nota da Azure por palavra e por fonema; no chinês, mostrar o tom esperado
- [ ] Script que gera um MP3 por frase com Azure TTS e salva em /assets/audio, substituindo a voz do sistema
- [ ] Controlar o tamanho do app: se os áudios ficarem grandes, baixar unidades sob demanda

Pronto quando: cada frase repetida mostra uma nota por palavra nas 3 línguas quando há internet.

```text
Leia CLAUDE.md e PLANO.md. Implemente a Fase 7 usando Azure Speech. Comece por um teste isolado que avalia um áudio de exemplo e imprime o JSON da resposta.
```

## Custos e contas

O MVP custa zero para uso pessoal; só há a taxa única de US$25 se você publicar na Play Store. Os custos de uso (APIs de IA) só começam na etapa 2.

| Conta | Etapa | Para quê | Custo |
| --- | --- | --- | --- |
| GitHub | MVP | Repositório do código | Grátis |
| Claude Code | MVP | Desenvolver o app e escrever o conteúdo | Incluído na sua assinatura do Claude |
| Expo (EAS Build e Submit) | MVP | Compilar o app na nuvem e enviar à Play Store | Grátis: até 15 builds de Android por mês, numa fila de baixa prioridade ([fonte](https://newly.app/guides/eas-build)) |
| Google Play Console (opcional) | MVP | Publicar na Play Store | Taxa única de US$25 ([fonte](https://www.fabricadeaplicativos.com.br/guides/publish-app-to-google-play)) |
| Vercel | Etapa 2 | Funções que guardam as chaves | Plano gratuito atende uso pessoal |
| Anthropic Console (Claude API) | Etapa 2 | Conversa, relatórios e cartões com IA | Pago por uso; configure um limite mensal no Console |
| Azure (recurso Speech) | Etapa 2 | Nota detalhada de pronúncia e vozes neurais | Pago por uso; a avaliação de pronúncia custa o mesmo que a transcrição de voz ([fonte](https://learn.microsoft.com/en-ca/azure/ai-services/speech-service/how-to-pronunciation-assessment)); confira a camada gratuita no portal |

Para economizar na etapa 2: use o Haiku na conversa, defina um limite mensal de gasto no Console antes de ligar a IA e gere os áudios uma vez só.

## CLAUDE.md sugerido

Salve este plano como `PLANO.md` e o bloco abaixo como `CLAUDE.md` na raiz do repositório; o Claude Code lê o CLAUDE.md automaticamente em toda sessão.

```markdown
# App pessoal de idiomas

## Contexto
- App Android nativo de um único usuário (eu), falante nativo de português do Brasil.
- Inglês intermediário (foco em fala), espanhol e chinês mandarim do zero.
- O plano completo está em PLANO.md. Trabalhe uma fase por vez.
- Etapa atual: MVP sem IA (fases 0 a 5).

## Stack
- React Native + Expo (TypeScript), Expo Router, NativeWind. Alvo: Android 12 ou mais novo.
- Dados locais em expo-sqlite com Drizzle ORM.
- Áudio com expo-speech; reconhecimento de voz no aparelho com expo-speech-recognition.
- Build e publicação com EAS Build e EAS Submit (Google Play).
- Etapa 2 (ainda não): funções em /api na Vercel, Claude API e Azure Speech.

## Regras do MVP
- O app não pode chamar nenhuma API externa nem depender de back-end.
- Tudo precisa funcionar em modo avião.
- Recursos de IA ficam atrás de `iaAtiva` em src/config/features.ts, que fica `false`. Não crie telas de IA visíveis.
- Deixe o código de IA futuro isolado em src/ia/, com interfaces que o resto do app usa sem depender da implementação.
- Conteúdo (lições, decks, diálogos) é escrito por você diretamente em /data como JSON, sem chamar API, e empacotado no app.

## Regras gerais
- Reconhecimento de voz sempre no aparelho; verificar se o modelo do idioma está instalado e pedir o download quando faltar.
- Interface em português do Brasil.
- Antes de uma mudança grande, mostre o plano e espere minha aprovação.
- Ao fim de cada fase, marque as tarefas concluídas em PLANO.md.

## Comandos
- npx expo start — desenvolvimento
- eas build --profile development --platform android — development build (APK)
- eas build --profile preview --platform android — APK para instalar no celular
- eas build --profile production --platform android — AAB para a Play Store
- eas submit --platform android — enviar ao Google Play Console
- npm test — testes
```

## Decisões em aberto

Estas escolhas têm um padrão definido, mas você pode trocar antes de começar a fase correspondente.

| Decisão | Padrão neste plano | Alternativa | Afeta a fase |
| --- | --- | --- | --- |
| Quando ligar a IA | Depois de usar o MVP por algumas semanas | Logo após a Fase 5 | 6, 7 |
| Forma de distribuição | APK instalado direto, só para você | Play Store pública (teste fechado de 12 pessoas por 14 dias) | 5 |
| IA num app público | Limite de uso por pessoa, pago por você | Cada usuário informa a própria chave, ou IA só na sua cópia | 6 |
| Tipo de conta no Google Play | Pessoal | Organização, que não precisa do teste fechado, mas exige empresa registrada | 5 |
| Versão mínima do Android | Android 12, para ter voz offline | Versões mais antigas, sem voz offline | 0 |
| Variante do espanhol | América Latina (es-MX) | Espanha (es-ES) | 1, 2, 3 |
| Escrita do chinês | Simplificado | Tradicional (Taiwan) | 1, 2 |
| Idioma das explicações | Inglês, para praticar inglês junto (confirmado em 16/11/2026) | Portugues | 1, 2 |
| Variante do inglês | Estados Unidos (en-US) (confirmado em 16/11/2026) | Reino Unido (en-GB) | 0, 3 |
| Nome e identificador do app | Multi-Lingua, `com.lucaslimasec.multilingua` (confirmado em 16/11/2026) | — | 0, 5 |
| Onde ficam os dados | Só no celular, com backup em JSON | Sincronizar com Google Drive ou Supabase | 0, 4 |
| Tempo de estudo diário | 15 a 20 minutos | O que couber na sua rotina | 4 |

## Fontes

- [Azure Speech – suporte de idiomas](https://learn.microsoft.com/azure/ai-services/speech-service/language-support)
- [Azure Speech – como usar Pronunciation Assessment](https://learn.microsoft.com/en-ca/azure/ai-services/speech-service/how-to-pronunciation-assessment)
- [Google Play – requisitos de teste para contas pessoais novas](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en-EN)
- [Guia de publicação no Google Play](https://www.fabricadeaplicativos.com.br/guides/publish-app-to-google-play)
- [Quantos testadores o Google Play exige](https://www.testerscommunity.com/de/guides/how-many-testers-do-you-need-google-play)
- [Android – RecognitionSupport (voz no aparelho)](https://developer.android.com/reference/android/speech/RecognitionSupport.html)
- [expo-speech-recognition](https://github.com/jamsch/expo-speech-recognition)
- [EAS Build – planos e limites](https://newly.app/guides/eas-build)
