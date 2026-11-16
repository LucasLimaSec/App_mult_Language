```markdown
# App pessoal de idiomas

## Contexto
- App Android nativo de um único usuário (eu), falante nativo de português do Brasil.
- Inglês intermediário (foco em fala), espanhol e chinês mandarim do zero.
- O plano completo está em PLANO.md. Trabalhe uma fase por vez.
- Etapa atual: MVP sem IA (fases 0 a 5).
- Nome do app: Multi-Lingua. Package Android: com.lucaslimasec.multilingua.
- Locales: en-US, es-MX, zh-CN (chinês simplificado). Definidos em src/voz/idiomas.ts.
- As explicações das lições são escritas em inglês (para praticar inglês junto); a interface continua em português.

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
- npm run typecheck — checagem de tipos
- npm run db:generate — gera uma migration nova em /drizzle depois de mudar src/db/schema.ts
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
| Idioma das explicações | Inglês, para praticar inglês junto | Portugues | 1, 2 |
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
