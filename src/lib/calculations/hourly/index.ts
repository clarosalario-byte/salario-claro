import { roundCurrency } from '../salary/money';

/**
 * Salário por hora
 * ================
 *
 * Fonte legal: art. 64 da CLT — fórmula geral do divisor mensal:
 *
 *   divisor = (horas semanais / dias úteis por semana) × 30
 *
 * Fonte: Súmula nº 431 do TST (Res. 185/2012) — EXCEÇÃO VINCULANTE:
 * para jornada de 40 horas semanais, o divisor é fixado em 200
 * (duzentos), independentemente do resultado da fórmula geral do art. 64.
 * Esta calculadora aplica essa exceção sempre que o usuário informar
 * exatamente 40 horas semanais.
 *
 * O divisor 220 (a referência mais comum no Brasil) é o resultado da
 * fórmula geral para uma jornada de 44 horas semanais distribuídas em 6
 * dias úteis (44/6×30 = 220), a jornada máxima ordinária prevista no
 * art. 7º, XIII, da Constituição Federal.
 */

export interface HourlyRateInput {
  monthlySalary: number;
  weeklyHours: number;
  /** Dias úteis por semana usados na fórmula geral do art. 64 da CLT (padrão: 6). */
  workDaysPerWeek?: number;
}

export interface HourlyRateResult {
  monthlySalary: number;
  weeklyHours: number;
  workDaysPerWeek: number;
  divisor: number;
  divisorSource: 'sumula-431' | 'art-64-clt';
  hourlyRate: number;
}

export function calculateHourlyRate(input: HourlyRateInput): HourlyRateResult {
  const { monthlySalary, weeklyHours } = input;
  const workDaysPerWeek = input.workDaysPerWeek ?? 6;

  if (monthlySalary < 0) throw new Error('O salário mensal não pode ser negativo.');
  if (weeklyHours <= 0 || weeklyHours > 44) {
    throw new Error('A jornada semanal deve ser maior que zero e não pode exceder 44 horas.');
  }
  if (workDaysPerWeek <= 0 || workDaysPerWeek > 7) {
    throw new Error('Os dias úteis por semana devem estar entre 1 e 7.');
  }

  let divisor: number;
  let divisorSource: 'sumula-431' | 'art-64-clt';

  if (weeklyHours === 40) {
    // Súmula 431/TST: exceção vinculante para 40h semanais.
    divisor = 200;
    divisorSource = 'sumula-431';
  } else {
    divisor = roundCurrency((weeklyHours / workDaysPerWeek) * 30);
    divisorSource = 'art-64-clt';
  }

  const hourlyRate = roundCurrency(monthlySalary / divisor);

  return { monthlySalary, weeklyHours, workDaysPerWeek, divisor, divisorSource, hourlyRate };
}

/** Inverse: given an hourly rate, what monthly salary does it correspond to? */
export function calculateMonthlyFromHourly(input: {
  hourlyRate: number;
  weeklyHours: number;
  workDaysPerWeek?: number;
}): HourlyRateResult {
  const { hourlyRate } = input;
  if (hourlyRate < 0) throw new Error('O valor da hora não pode ser negativo.');

  // Reuse the same divisor logic by running the forward calculation with a
  // placeholder salary, then solving for the monthly salary from the divisor.
  const probe = calculateHourlyRate({ monthlySalary: 0, weeklyHours: input.weeklyHours, workDaysPerWeek: input.workDaysPerWeek });
  const monthlySalary = roundCurrency(hourlyRate * probe.divisor);

  return { ...probe, monthlySalary, hourlyRate: roundCurrency(hourlyRate) };
}
