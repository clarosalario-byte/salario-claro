import { describe, it, expect } from 'vitest';
import { calculateINSS } from '../inss';
import { getRulesForYear } from '../rules/2026';

describe('INSS — 2026', () => {
  const rules = getRulesForYear(2026);

  it('salário abaixo do piso (faixa 1 parcial)', () => {
    const r = calculateINSS(800, rules);
    expect(r.brackets).toHaveLength(1);
    expect(r.total).toBeCloseTo(60.0, 2); // 800 * 7.5%
    expect(r.hitCeiling).toBe(false);
  });

  it('salário exatamente no limite da faixa 1 (R$ 1.621,00)', () => {
    const r = calculateINSS(1621.0, rules);
    expect(r.brackets).toHaveLength(1);
    expect(r.total).toBeCloseTo(121.58, 2);
  });

  it('salário cruzando para a faixa 2 (R$ 3.000,00) — bate com exemplo de referência', () => {
    const r = calculateINSS(3000, rules);
    expect(r.brackets).toHaveLength(3);
    expect(r.total).toBeCloseTo(248.6, 2);
  });

  it('salário cruzando para a faixa 4 (R$ 6.000,00) — bate com exemplo de referência', () => {
    const r = calculateINSS(6000, rules);
    expect(r.brackets).toHaveLength(4);
    expect(r.total).toBeCloseTo(641.51, 2);
  });

  it('salário exatamente no teto (R$ 8.475,55)', () => {
    const r = calculateINSS(8475.55, rules);
    expect(r.hitCeiling).toBe(true);
    expect(r.total).toBeCloseTo(988.09, 1); // ~R$988,09 conforme múltiplas fontes
  });

  it('salário acima do teto não gera contribuição adicional', () => {
    const atCeiling = calculateINSS(8475.55, rules);
    const aboveCeiling = calculateINSS(50000, rules);
    expect(aboveCeiling.total).toBeCloseTo(atCeiling.total, 2);
    expect(aboveCeiling.hitCeiling).toBe(true);
  });

  it('salário zero produz contribuição zero', () => {
    const r = calculateINSS(0, rules);
    expect(r.total).toBe(0);
    expect(r.brackets).toHaveLength(0);
  });

  it('salário negativo lança erro', () => {
    expect(() => calculateINSS(-100, rules)).toThrow();
  });

  it('cada faixa tributa apenas sua fatia, não o salário inteiro', () => {
    const r = calculateINSS(4354.27, rules); // exatamente no topo da faixa 3
    expect(r.brackets).toHaveLength(3);
    const faixa3 = r.brackets[2];
    expect(faixa3.taxableSlice).toBeCloseTo(4354.27 - 2902.84, 2);
  });
});
