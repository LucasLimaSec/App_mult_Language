/**
 * Interruptores de recursos do app.
 *
 * No MVP (fases 0 a 5) `iaAtiva` fica `false`: o app não chama nenhuma API
 * externa e nenhuma tela de IA aparece. A etapa 2 liga este interruptor.
 */
export type Features = {
  iaAtiva: boolean;
};

export const features: Features = {
  iaAtiva: false,
};
