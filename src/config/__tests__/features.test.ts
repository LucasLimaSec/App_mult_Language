import { obterServicosIA } from '../../ia';
import { features } from '../features';

// Regra do MVP: a IA fica desligada e nenhum serviço de IA é entregue ao app.
describe('interruptores do MVP', () => {
  it('mantém a IA desligada', () => {
    expect(features.iaAtiva).toBe(false);
  });

  it('não entrega serviços de IA', () => {
    expect(obterServicosIA()).toBeNull();
  });
});
