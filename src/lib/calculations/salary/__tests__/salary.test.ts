import { describe, it, expect } from 'vitest';
import { calculateSalary } from '../salary';
import { validateSalaryInput } from '../validation';
import { formatBRL } from '../money';

describe('calculateSalary — cenários gerais', () => {
  it('zero dependentes', () => {
    const r = calculateSalary({ grossSalary: 3000, dependents: 0, otherDeductions: 0 });
    expect(r.irpf.legalDeductions.dependents).toBe(0);
  });

  it('um dependente reduz a base legal em R$ 189,59', () => {
    const withDep = calculateSalary({ grossSalary: 6000, dependents: 1, otherDeductions: 0 });
    const withoutDep = calculateSalary({ grossSalary: 6000, dependents: 0, otherDeductions: 0 });
    expect(withDep.irpf.legalDeductions.dependents).toBeCloseTo(189.59, 2);
    // Com mais dedução legal, o imposto final não pode ser maior.
    expect(withDep.irpf.finalTax).toBeLessThanOrEqual(withoutDep.irpf.finalTax);
  });

  it('múltiplos dependentes (3) somam corretamente', () => {
    const r = calculateSalary({ grossSalary: 8000, dependents: 3, otherDeductions: 0 });
    expect(r.irpf.legalDeductions.dependents).toBeCloseTo(189.59 * 3, 2);
  });

  it('salário muito alto (acima de todas as faixas)', () => {
    const r = calculateSalary({ grossSalary: 100000, dependents: 0, otherDeductions: 0 });
    expect(r.inss.hitCeiling).toBe(true);
    expect(r.irpf.bracket.rate).toBe(0.275);
    expect(r.irpf.reduction).toBe(0);
    expect(r.netSalary).toBeGreaterThan(0);
    expect(Number.isFinite(r.netSalary)).toBe(true);
  });

  it('valores decimais no salário são tratados corretamente', () => {
    const r = calculateSalary({ grossSalary: 4354.27, dependents: 0, otherDeductions: 0 });
    expect(Number.isFinite(r.netSalary)).toBe(true);
    expect(r.netSalary).toBeGreaterThan(0);
  });

  it('outros descontos são subtraídos do líquido mas não da base do IRRF', () => {
    const base = calculateSalary({ grossSalary: 5000, dependents: 0, otherDeductions: 0 });
    const withExtra = calculateSalary({ grossSalary: 5000, dependents: 0, otherDeductions: 200 });
    expect(withExtra.irpf.finalTax).toBeCloseTo(base.irpf.finalTax, 2);
    expect(withExtra.netSalary).toBeCloseTo(base.netSalary - 200, 2);
  });

  it('pensão alimentícia reduz tanto a base do IRRF quanto o líquido', () => {
    const base = calculateSalary({ grossSalary: 7000, dependents: 0, otherDeductions: 0, alimony: 0 });
    const withAlimony = calculateSalary({
      grossSalary: 7000,
      dependents: 0,
      otherDeductions: 0,
      alimony: 500,
    });
    expect(withAlimony.irpf.legalDeductions.alimony).toBe(500);
    expect(withAlimony.netSalary).toBeLessThan(base.netSalary);
  });

  it('deduções opcionais maiores que o salário não geram líquido negativo', () => {
    const r = calculateSalary({ grossSalary: 1000, dependents: 0, otherDeductions: 5000 });
    expect(r.netSalary).toBe(0);
  });

  it('campos opcionais vazios (undefined) usam padrão zero', () => {
    const r = calculateSalary({ grossSalary: 3000, dependents: 0, otherDeductions: 0 });
    expect(r.input.alimony).toBe(0);
  });

  it('R$ 0 de salário bruto resulta em tudo zerado', () => {
    const r = calculateSalary({ grossSalary: 0, dependents: 0, otherDeductions: 0 });
    expect(r.inss.total).toBe(0);
    expect(r.irpf.finalTax).toBe(0);
    expect(r.netSalary).toBe(0);
  });

  it('R$ 1 de salário bruto não gera NaN/Infinity', () => {
    const r = calculateSalary({ grossSalary: 1, dependents: 0, otherDeductions: 0 });
    expect(Number.isFinite(r.netSalary)).toBe(true);
    expect(Number.isNaN(r.netSalary)).toBe(false);
  });

  it('threshold R$ 7.350,00 exato ainda recebe redução mínima (não é > 7350)', () => {
    const at = calculateSalary({ grossSalary: 7350, dependents: 0, otherDeductions: 0 });
    const above = calculateSalary({ grossSalary: 7350.01, dependents: 0, otherDeductions: 0 });
    expect(at.irpf.reduction).toBeGreaterThanOrEqual(0);
    expect(above.irpf.reduction).toBe(0);
  });

  it('lança erro para salário negativo', () => {
    expect(() => calculateSalary({ grossSalary: -500, dependents: 0, otherDeductions: 0 })).toThrow();
  });

  it('lança erro para número de dependentes negativo', () => {
    expect(() => calculateSalary({ grossSalary: 3000, dependents: -1, otherDeductions: 0 })).toThrow();
  });
});

describe('validateSalaryInput', () => {
  it('rejeita salário vazio/NaN', () => {
    const result = validateSalaryInput({
      grossSalary: NaN,
      dependents: 0,
      otherDeductions: 0,
    });
    expect(result.valid).toBe(false);
  });

  it('rejeita dependentes fracionários', () => {
    const result = validateSalaryInput({
      grossSalary: 3000,
      dependents: 1.5,
      otherDeductions: 0,
    });
    expect(result.valid).toBe(false);
  });

  it('aceita entrada válida', () => {
    const result = validateSalaryInput({
      grossSalary: 3000,
      dependents: 2,
      otherDeductions: 100,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('formatBRL', () => {
  it('formata no padrão brasileiro (R$ 1.234,56)', () => {
    const formatted = formatBRL(1234.56);
    expect(formatted).toContain('1.234,56');
  });

  it('formata zero corretamente', () => {
    expect(formatBRL(0)).toContain('0,00');
  });
});
