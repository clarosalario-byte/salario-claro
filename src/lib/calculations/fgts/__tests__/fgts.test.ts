import { describe, it, expect } from 'vitest';
import { calculateFgtsDeposit, calculateFgtsFine } from '../index';

describe('calculateFgtsDeposit', () => {
  it('depósito mensal é 8% do salário', () => {
    const r = calculateFgtsDeposit({ monthlySalary: 3000 });
    expect(r.monthlyDeposit).toBeCloseTo(240, 2);
  });

  it('projeção acumulada para 12 meses', () => {
    const r = calculateFgtsDeposit({ monthlySalary: 3000, months: 12 });
    expect(r.projectedPrincipalBalance).toBeCloseTo(2880, 2);
  });

  it('salário zero resulta em depósito zero', () => {
    const r = calculateFgtsDeposit({ monthlySalary: 0 });
    expect(r.monthlyDeposit).toBe(0);
  });

  it('rejeita salário negativo', () => {
    expect(() => calculateFgtsDeposit({ monthlySalary: -100 })).toThrow();
  });

  it('rejeita meses fora do intervalo permitido', () => {
    expect(() => calculateFgtsDeposit({ monthlySalary: 3000, months: 0 })).toThrow();
    expect(() => calculateFgtsDeposit({ monthlySalary: 3000, months: 601 })).toThrow();
  });

  it('rejeita meses fracionários', () => {
    expect(() => calculateFgtsDeposit({ monthlySalary: 3000, months: 1.5 })).toThrow();
  });
});

describe('calculateFgtsFine', () => {
  it('dispensa sem justa causa: multa de 40%', () => {
    const r = calculateFgtsFine({ fgtsBalance: 10000, terminationType: 'no-cause' });
    expect(r.fineRate).toBe(0.4);
    expect(r.fineAmount).toBeCloseTo(4000, 2);
  });

  it('acordo mútuo: multa de 20%', () => {
    const r = calculateFgtsFine({ fgtsBalance: 10000, terminationType: 'mutual-agreement' });
    expect(r.fineRate).toBe(0.2);
    expect(r.fineAmount).toBeCloseTo(2000, 2);
  });

  it('pedido de demissão ou justa causa: sem multa', () => {
    const r = calculateFgtsFine({ fgtsBalance: 10000, terminationType: 'no-fine' });
    expect(r.fineRate).toBe(0);
    expect(r.fineAmount).toBe(0);
  });

  it('rejeita saldo negativo', () => {
    expect(() => calculateFgtsFine({ fgtsBalance: -100, terminationType: 'no-cause' })).toThrow();
  });

  it('saldo zero resulta em multa zero independentemente do tipo', () => {
    const r = calculateFgtsFine({ fgtsBalance: 0, terminationType: 'no-cause' });
    expect(r.fineAmount).toBe(0);
  });
});
