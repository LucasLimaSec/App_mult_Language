import { coresDoDestaque, hexParaRgb, nomeDaVariavel, PALETAS, variaveisDaPaleta } from '../tema';

jest.mock('nativewind', () => ({ vars: (v: object) => v }));

/** Contraste WCAG entre duas cores hex. */
function contraste(a: string, b: string): number {
  const luminancia = (hex: string) => {
    const canais = hexParaRgb(hex)
      .split(' ')
      .map((c) => {
        const v = Number(c) / 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      });
    return 0.2126 * canais[0] + 0.7152 * canais[1] + 0.0722 * canais[2];
  };
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (escuro + 0.05);
}

describe('tema', () => {
  it('converte hex e nomes de variável', () => {
    expect(hexParaRgb('#7C3AED')).toBe('124 58 237');
    expect(nomeDaVariavel('marcaSombra')).toBe('--marca-sombra');
    expect(nomeDaVariavel('tom1')).toBe('--tom-1');
  });

  it('as duas paletas têm as mesmas cores', () => {
    expect(Object.keys(PALETAS.escuro).sort()).toEqual(Object.keys(PALETAS.claro).sort());
    expect(Object.keys(variaveisDaPaleta(PALETAS.claro))).toContain('--marca-clara');
  });

  it('acha cor, sombra e tom claro de cada destaque', () => {
    expect(coresDoDestaque(PALETAS.claro, 'es')).toEqual({ cor: '#EA580C', sombra: '#C2410C', clara: '#FFEDD5' });
  });

  it.each(['claro', 'escuro'] as const)('texto legível no modo %s', (modo) => {
    const p = PALETAS[modo];
    expect(contraste(p.texto, p.fundo)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(p.texto, p.superficie)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(p.texto2, p.superficie)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(p.certoTexto, p.certoClara)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(p.erroTexto, p.erroClara)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(p.ambarTexto, p.ambarClara)).toBeGreaterThanOrEqual(4.5);
    // Tons do pinyin aparecem grandes (texto grande pede 3:1).
    for (const tom of [p.tom1, p.tom2, p.tom3, p.tom4, p.tom5]) {
      expect(contraste(tom, p.superficie)).toBeGreaterThanOrEqual(3);
    }
  });

  it('texto branco legível nos botões coloridos (rótulos grandes e em negrito, 3:1)', () => {
    const p = PALETAS.claro;
    for (const cor of [p.marca, p.es, p.zh, p.en, p.certo, p.erro, p.ambar]) {
      expect(contraste('#FFFFFF', cor)).toBeGreaterThanOrEqual(3);
    }
  });
});
