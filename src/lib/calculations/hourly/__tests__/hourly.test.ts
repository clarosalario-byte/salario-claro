import { describe, it, expect } from 'vitest';
import { calculateHourlyRate, calculateMonthlyFromHourly } from '../index';

describe('calculateHourlyRate', () => {
  it('44 horas semanais, 6 dias úteis -> divisor 220', () => {
    const r = calculateHourlyRate({ monthlySalary: 2200, weeklyHours: 44, workDaysPerWeek: 6 });
    expect(r.divisor).toBe(220);
    expect(r.divisorSource).toBe('art-64-clt');
    expect(r.hourlyRate).toBeCloseTo(10, 2);
  });

  it('40 horas semanais -> divisor fixo 200 pela Súmula 431/TST, independente dos dias úteis', () => {
    const r = calculateHourlyRate({ monthlySalary: 2000, weeklyHours: 40, workDaysPerWeek: 5 });
    expect(r.divisor).toBe(200);
    expect(r.divisorSource).toBe('sumula-431');
    expect(r.hourlyRate).toBeCloseTo(10, 2);
  });

  it('40 horas mesmo com 6 dias úteis ainda usa divisor 200 (exceção vinculante)', () => {
    const r = calculateHourlyRate({ monthlySalary: 2000, weeklyHours: 40, workDaysPerWeek: 6 });
    expect(r.divisor).toBe(200);
  });

  it('36 horas semanais, 6 dias úteis -> fórmula geral (36/6*30=180)', () => {
    const r = calculateHourlyRate({ monthlySalary: 1800, weeklyHours: 36, workDaysPerWeek: 6 });
    expect(r.divisor).toBe(180);
    expect(r.divisorSource).toBe('art-64-clt');
  });

  it('rejeita jornada semanal acima de 44 horas (limite constitucional)', () => {
    expect(() => calculateHourlyRate({ monthlySalary: 3000, weeklyHours: 45 })).toThrow();
  });

  it('rejeita jornada semanal zero ou negativa', () => {
    expect(() => calculateHourlyRate({ monthlySalary: 3000, weeklyHours: 0 })).toThrow();
    expect(() => calculateHourlyRate({ monthlySalary: 3000, weeklyHours: -10 })).toThrow();
  });

  it('rejeita salário negativo', () => {
    expect(() => calculateHourlyRate({ monthlySalary: -100, weeklyHours: 44 })).toThrow();
  });

  it('rejeita dias úteis por semana fora de 1-7', () => {
    expect(() => calculateHourlyRate({ monthlySalary: 3000, weeklyHours: 30, workDaysPerWeek: 0 })).toThrow();
    expect(() => calculateHourlyRate({ monthlySalary: 3000, weeklyHours: 30, workDaysPerWeek: 8 })).toThrow();
  });
});

describe('calculateMonthlyFromHourly', () => {
  it('inverte corretamente o cálculo de 44h/220', () => {
    const r = calculateMonthlyFromHourly({ hourlyRate: 10, weeklyHours: 44, workDaysPerWeek: 6 });
    expect(r.monthlySalary).toBeCloseTo(2200, 2);
    expect(r.divisor).toBe(220);
  });

  it('inverte corretamente o cálculo de 40h/200', () => {
    const r = calculateMonthlyFromHourly({ hourlyRate: 15, weeklyHours: 40 });
    expect(r.monthlySalary).toBeCloseTo(3000, 2);
    expect(r.divisor).toBe(200);
  });

  it('rejeita valor de hora negativo', () => {
    expect(() => calculateMonthlyFromHourly({ hourlyRate: -5, weeklyHours: 44 })).toThrow();
  });
});
