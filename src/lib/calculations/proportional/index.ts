import { roundCurrency, formatBRL } from '../salary/money';

/**
 * Salário proporcional / pagamento por dias trabalhados
 * =======================================================
 *
 * Fonte legal: art. 64 da CLT.
 *
 * "Art. 64 — O salário-hora normal, no caso de empregado mensalista, será
 * obtido dividindo-se o salário mensal correspondente à duração do
 * trabalho [...] por 30 (trinta) [dias].
 * Parágrafo único — Sendo o número de dias inferior a 30 (trinta),
 * adotar-se-á para o cálculo, em lugar desse número, o de dias de
 * trabalho por mês."
 *
 * Na prática — e conforme jurisprudência consolidada dos Tribunais
 * Regionais do Trabalho sobre proporcionalidade em admissões, demissões e
 * afastamentos no meio do mês — isso significa dividir o salário mensal
 * pelo número REAL de dias do mês de referência (28, 29, 30 ou 31), e não
 * sempre por 30. Esta calculadora usa o número real de dias do mês
 * informado, seguindo o texto do art. 64 e essa linha de aplicação.
 *
 * IMPORTANTE: existe controvérsia doutrinária/sindical sobre se o divisor
 * deveria ser sempre 30 (mês comercial fixo) independentemente do mês
 * civil. Esta calculadora documenta explicitamente qual divisor foi usado
 * em cada cálculo, para que o resultado nunca seja ambíguo.
 */

export interface ProportionalPayInput {
  /** Salário mensal integral, em reais. */
  monthlySalary: number;
  /** Número de dias do mês de referência (28, 29, 30 ou 31). */
  daysInMonth: number;
  /** Número de dias efetivamente trabalhados/devidos no mês. */
  daysWorked: number;
}

export interface ProportionalPayResult {
  monthlySalary: number;
  daysInMonth: number;
  daysWorked: number;
  dailyRate: number;
  proportionalPay: number;
}

export function calculateProportionalPay(input: ProportionalPayInput): ProportionalPayResult {
  const { monthlySalary, daysInMonth, daysWorked } = input;

  if (monthlySalary < 0) throw new Error('O salário mensal não pode ser negativo.');
  if (!Number.isInteger(daysInMonth) || daysInMonth < 28 || daysInMonth > 31) {
    throw new Error('O número de dias do mês deve ser 28, 29, 30 ou 31.');
  }
  if (!Number.isInteger(daysWorked) || daysWorked < 0) {
    throw new Error('O número de dias trabalhados não pode ser negativo.');
  }
  if (daysWorked > daysInMonth) {
    throw new Error('O número de dias trabalhados não pode ser maior que os dias do mês.');
  }

  const dailyRate = roundCurrency(monthlySalary / daysInMonth);
  const proportionalPay = roundCurrency((monthlySalary / daysInMonth) * daysWorked);

  return { monthlySalary, daysInMonth, daysWorked, dailyRate, proportionalPay };
}

/** Number of calendar days in a given month (1-12) of a given year. */
export function daysInCalendarMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export { formatBRL };
