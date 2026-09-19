import { describe, it, expect } from 'vitest';
import { calculateProportionalPay, daysInCalendarMonth } from '../index';

describe('calculateProportionalPay', () => {
  it('meio do mês de 30 dias', () => {
    const r = calculateProportionalPay({ monthlySalary: 3000, daysInMonth: 30, daysWorked: 15 });
    expect(r.dailyRate).toBeCloseTo(100, 2);
    expect(r.proportionalPay).toBeCloseTo(1500, 2);
  });

  it('mês de fevereiro com 28 dias — divisor correto é 28, não 30', () => {
    const r = calculateProportionalPay({ monthlySalary: 2800, daysInMonth: 28, daysWorked: 14 });
    expect(r.dailyRate).toBeCloseTo(100, 2);
    expect(r.proportionalPay).toBeCloseTo(1400, 2);
  });

  it('mês de 31 dias', () => {
    const r = calculateProportionalPay({ monthlySalary: 3100, daysInMonth: 31, daysWorked: 31 });
    expect(r.proportionalPay).toBeCloseTo(3100, 2);
  });

  it('zero dias trabalhados resulta em zero', () => {
    const r = calculateProportionalPay({ monthlySalary: 3000, daysInMonth: 30, daysWorked: 0 });
    expect(r.proportionalPay).toBe(0);
  });

  it('todos os dias do mês trabalhados equivale ao salário integral', () => {
    const r = calculateProportionalPay({ monthlySalary: 5000, daysInMonth: 30, daysWorked: 30 });
    expect(r.proportionalPay).toBeCloseTo(5000, 2);
  });

  it('rejeita dias trabalhados maior que dias do mês', () => {
    expect(() =>
      calculateProportionalPay({ monthlySalary: 3000, daysInMonth: 30, daysWorked: 31 })
    ).toThrow();
  });

  it('rejeita dias do mês fora de 28-31', () => {
    expect(() => calculateProportionalPay({ monthlySalary: 3000, daysInMonth: 27, daysWorked: 10 })).toThrow();
    expect(() => calculateProportionalPay({ monthlySalary: 3000, daysInMonth: 32, daysWorked: 10 })).toThrow();
  });

  it('rejeita salário negativo', () => {
    expect(() => calculateProportionalPay({ monthlySalary: -100, daysInMonth: 30, daysWorked: 10 })).toThrow();
  });

  it('rejeita dias trabalhados negativos', () => {
    expect(() => calculateProportionalPay({ monthlySalary: 3000, daysInMonth: 30, daysWorked: -1 })).toThrow();
  });

  it('valores decimais de salário são tratados corretamente', () => {
    const r = calculateProportionalPay({ monthlySalary: 2750.55, daysInMonth: 30, daysWorked: 10 });
    expect(Number.isFinite(r.proportionalPay)).toBe(true);
  });
});

describe('daysInCalendarMonth', () => {
  it('fevereiro de ano não bissexto tem 28 dias', () => {
    expect(daysInCalendarMonth(2026, 2)).toBe(28);
  });

  it('fevereiro de ano bissexto tem 29 dias', () => {
    expect(daysInCalendarMonth(2028, 2)).toBe(29);
  });

  it('abril tem 30 dias', () => {
    expect(daysInCalendarMonth(2026, 4)).toBe(30);
  });

  it('janeiro tem 31 dias', () => {
    expect(daysInCalendarMonth(2026, 1)).toBe(31);
  });
});
