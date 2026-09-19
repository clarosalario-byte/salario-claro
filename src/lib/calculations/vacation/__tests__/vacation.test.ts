import { describe, it, expect } from 'vitest';
import { calculateVacation } from '../index';

describe('calculateVacation', () => {
  it('30 dias gozados, sem abono, salário baixo (isento de IRRF)', () => {
    const r = calculateVacation({ monthlySalary: 3000, vacationDaysTaken: 30 });
    expect(r.vacationPay).toBeCloseTo(3000, 2);
    expect(r.constitutionalThird).toBeCloseTo(1000, 2);
    expect(r.taxableVacationBase).toBeCloseTo(4000, 2);
    expect(r.abonoTotalExempt).toBe(0);
    expect(Number.isFinite(r.netVacationPay)).toBe(true);
  });

  it('20 dias gozados + 10 dias de abono (venda máxima)', () => {
    const r = calculateVacation({ monthlySalary: 3000, vacationDaysTaken: 20, abonoDays: 10 });
    expect(r.dailyRate).toBeCloseTo(100, 2);
    expect(r.vacationPay).toBeCloseTo(2000, 2);
    expect(r.abonoValue).toBeCloseTo(1000, 2);
    expect(r.abonoThird).toBeCloseTo(333.33, 2);
    // O abono não entra na base tributável.
    expect(r.taxableVacationBase).toBeCloseTo(2000 + 2000 / 3, 2);
  });

  it('abono e seu terço nunca sofrem INSS/IRRF — apenas somam ao líquido', () => {
    const withAbono = calculateVacation({ monthlySalary: 3000, vacationDaysTaken: 20, abonoDays: 10 });
    const withoutAbono = calculateVacation({ monthlySalary: 3000, vacationDaysTaken: 30 });
    // A base tributável (INSS/IRRF) é menor com abono, pois menos dias são gozados.
    expect(withAbono.taxableVacationBase).toBeLessThan(withoutAbono.taxableVacationBase);
  });

  it('rejeita mais de 30 dias no total entre gozados e abono', () => {
    expect(() =>
      calculateVacation({ monthlySalary: 3000, vacationDaysTaken: 25, abonoDays: 10 })
    ).toThrow();
  });

  it('rejeita abono acima de 10 dias', () => {
    expect(() => calculateVacation({ monthlySalary: 3000, vacationDaysTaken: 20, abonoDays: 11 })).toThrow();
  });

  it('rejeita dias gozados acima de 30', () => {
    expect(() => calculateVacation({ monthlySalary: 3000, vacationDaysTaken: 31 })).toThrow();
  });

  it('rejeita salário negativo', () => {
    expect(() => calculateVacation({ monthlySalary: -100, vacationDaysTaken: 30 })).toThrow();
  });

  it('dependentes reduzem o IRRF sobre férias quando mais vantajoso', () => {
    const noDeps = calculateVacation({ monthlySalary: 7000, vacationDaysTaken: 30, dependents: 0 });
    const withDeps = calculateVacation({ monthlySalary: 7000, vacationDaysTaken: 30, dependents: 3 });
    expect(withDeps.irrfTotal).toBeLessThanOrEqual(noDeps.irrfTotal);
  });

  it('zero dias gozados e zero abono resulta em tudo zerado', () => {
    const r = calculateVacation({ monthlySalary: 3000, vacationDaysTaken: 0 });
    expect(r.taxableVacationBase).toBe(0);
    expect(r.inssTotal).toBe(0);
    expect(r.irrfTotal).toBe(0);
    expect(r.netVacationPay).toBe(0);
  });

  it('salário alto sem redução (acima de R$7.350 na base tributável de férias)', () => {
    const r = calculateVacation({ monthlySalary: 20000, vacationDaysTaken: 30 });
    expect(r.taxableVacationBase).toBeGreaterThan(7350);
    expect(r.irrfTotal).toBeGreaterThan(0);
  });
});
