import { describe, it, expect } from 'vitest';
import { calculateThirteenth } from '../index';

describe('calculateThirteenth', () => {
  it('12 meses trabalhados = 13º integral', () => {
    const r = calculateThirteenth({ monthlySalary: 3000, monthsWorked: 12 });
    expect(r.grossThirteenth).toBeCloseTo(3000, 2);
  });

  it('6 meses trabalhados = metade do 13º', () => {
    const r = calculateThirteenth({ monthlySalary: 3000, monthsWorked: 6 });
    expect(r.grossThirteenth).toBeCloseTo(1500, 2);
  });

  it('primeira parcela é sempre metade do bruto, sem desconto', () => {
    const r = calculateThirteenth({ monthlySalary: 6000, monthsWorked: 12 });
    expect(r.firstInstallment).toBeCloseTo(3000, 2);
    expect(r.firstInstallment).toBeLessThanOrEqual(r.secondInstallmentGross + 0.01);
  });

  it('INSS e IRRF incidem apenas sobre a segunda parcela, calculados sobre o valor integral', () => {
    const r = calculateThirteenth({ monthlySalary: 8000, monthsWorked: 12 });
    expect(r.inssTotal).toBeGreaterThan(0);
    expect(r.secondInstallmentNet).toBeLessThan(r.secondInstallmentGross);
    // Total líquido = bruto - INSS - IRRF (independente da divisão em parcelas)
    expect(r.totalNet).toBeCloseTo(r.grossThirteenth - r.inssTotal - r.irrfTotal, 2);
  });

  it('13º baixo (<=R$5.000) recebe a redução de 2026 e pode zerar o IRRF', () => {
    const r = calculateThirteenth({ monthlySalary: 4000, monthsWorked: 12 });
    expect(r.grossThirteenth).toBeLessThanOrEqual(5000);
    expect(r.irrfTotal).toBe(0);
  });

  it('13º alto (acima de R$7.350) não recebe redução', () => {
    const r = calculateThirteenth({ monthlySalary: 20000, monthsWorked: 12 });
    expect(r.grossThirteenth).toBeGreaterThan(7350);
    expect(r.irrfTotal).toBeGreaterThan(0);
  });

  it('zero meses trabalhados resulta em tudo zerado', () => {
    const r = calculateThirteenth({ monthlySalary: 3000, monthsWorked: 0 });
    expect(r.grossThirteenth).toBe(0);
    expect(r.totalNet).toBe(0);
  });

  it('dependentes reduzem o IRRF quando mais vantajoso', () => {
    const noDeps = calculateThirteenth({ monthlySalary: 7000, monthsWorked: 12, dependents: 0 });
    const withDeps = calculateThirteenth({ monthlySalary: 7000, monthsWorked: 12, dependents: 2 });
    expect(withDeps.irrfTotal).toBeLessThanOrEqual(noDeps.irrfTotal);
  });

  it('rejeita meses trabalhados fora de 0-12', () => {
    expect(() => calculateThirteenth({ monthlySalary: 3000, monthsWorked: 13 })).toThrow();
    expect(() => calculateThirteenth({ monthlySalary: 3000, monthsWorked: -1 })).toThrow();
  });

  it('rejeita salário negativo', () => {
    expect(() => calculateThirteenth({ monthlySalary: -100, monthsWorked: 12 })).toThrow();
  });

  it('rejeita meses fracionários', () => {
    expect(() => calculateThirteenth({ monthlySalary: 3000, monthsWorked: 6.5 })).toThrow();
  });
});
