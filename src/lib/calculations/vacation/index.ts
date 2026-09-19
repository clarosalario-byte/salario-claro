import { calculateINSS } from '../salary/inss';
import { calculateIRRF } from '../salary/irrf';
import { getRulesForYear } from '../salary/rules/2026';
import { roundCurrency } from '../salary/money';

/**
 * Férias (remuneração de férias + 1/3 constitucional)
 * =====================================================
 *
 * FONTES:
 * - Divisor: art. 64 da CLT — remuneração das férias usa sempre o salário
 *   mensal dividido por 30 (não pelo número real de dias do mês; férias são
 *   sempre "30 dias" de referência, distinto do salário proporcional).
 * - 1/3 constitucional: art. 7º, XVII, da Constituição Federal.
 * - Abono pecuniário (venda de até 1/3 das férias): art. 143 da CLT.
 * - INSS incide sobre a remuneração das férias gozadas + o 1/3
 *   constitucional, calculado pela mesma tabela progressiva do INSS
 *   (fonte: Decreto 3.048/99, art. 214, I).
 * - O abono pecuniário e seu respectivo 1/3 são ISENTOS de INSS (Lei
 *   8.212/91, art. 28, combinado com o Decreto 3.048/99, art. 214, §9º,
 *   V) e de IRRF (entendimento pacificado do STJ; Solução de Consulta
 *   COSIT nº 1/2009; natureza indenizatória).
 * - O IRRF sobre a remuneração das férias gozadas + 1/3 é calculado em
 *   separado dos demais rendimentos do mês, usando a mesma tabela
 *   progressiva mensal (art. 682 do RIR/2018).
 *
 * PREMISSA DOCUMENTADA: a Lei 15.270/2025 menciona expressamente, em seu
 * §3º, que a redução de 2026 também vale para o 13º salário. A lei não
 * cita as férias de forma explícita, mas como a tributação das férias usa
 * a mesma tabela progressiva mensal do art. 3º-A da Lei 9.250/95 (apenas
 * calculada em separado do salário), esta calculadora aplica a mesma
 * redução de 2026 sobre a remuneração de férias, usando o valor de férias
 * + 1/3 como "rendimento tributável sujeito à incidência mensal" para
 * fins do teste de R$ 5.000,00 / R$ 7.350,00. Esta é a interpretação
 * adotada pela maioria das fontes contábeis consultadas, mas — na
 * ausência de um exemplo oficial da Receita Federal especificamente para
 * férias — trate-a como a leitura mais provável, não uma certeza absoluta
 * confirmada por exemplo oficial.
 */

export interface VacationInput {
  /** Salário mensal usado como base para as férias. */
  monthlySalary: number;
  /** Dias de férias efetivamente gozados (padrão: 30). */
  vacationDaysTaken: number;
  /** Dias vendidos como abono pecuniário (0 a 10, opcional). */
  abonoDays?: number;
  dependents?: number;
  alimony?: number;
}

export interface VacationResult {
  dailyRate: number;
  vacationDaysTaken: number;
  vacationPay: number;
  constitutionalThird: number;
  taxableVacationBase: number;
  abonoDays: number;
  abonoValue: number;
  abonoThird: number;
  abonoTotalExempt: number;
  inssTotal: number;
  irrfTotal: number;
  netVacationPay: number;
}

export function calculateVacation(input: VacationInput): VacationResult {
  const { monthlySalary } = input;
  const vacationDaysTaken = input.vacationDaysTaken;
  const abonoDays = input.abonoDays ?? 0;
  const dependents = input.dependents ?? 0;
  const alimony = input.alimony ?? 0;

  if (monthlySalary < 0) throw new Error('O salário mensal não pode ser negativo.');
  if (!Number.isInteger(vacationDaysTaken) || vacationDaysTaken < 0 || vacationDaysTaken > 30) {
    throw new Error('Os dias de férias gozados devem ser um número inteiro entre 0 e 30.');
  }
  if (!Number.isInteger(abonoDays) || abonoDays < 0 || abonoDays > 10) {
    throw new Error('Os dias de abono pecuniário devem ser um número inteiro entre 0 e 10.');
  }
  if (vacationDaysTaken + abonoDays > 30) {
    throw new Error('A soma dos dias gozados e vendidos não pode ultrapassar 30.');
  }

  const rules = getRulesForYear(2026);
  const dailyRate = roundCurrency(monthlySalary / 30);

  const vacationPay = roundCurrency(dailyRate * vacationDaysTaken);
  const constitutionalThird = roundCurrency(vacationPay / 3);
  const taxableVacationBase = roundCurrency(vacationPay + constitutionalThird);

  const abonoValue = roundCurrency(dailyRate * abonoDays);
  const abonoThird = roundCurrency(abonoValue / 3);
  const abonoTotalExempt = roundCurrency(abonoValue + abonoThird);

  const inss = calculateINSS(taxableVacationBase, rules);
  const irrf = calculateIRRF(taxableVacationBase, inss.total, dependents, alimony, rules);

  const netVacationPay = roundCurrency(
    taxableVacationBase - inss.total - irrf.finalTax + abonoTotalExempt
  );

  return {
    dailyRate,
    vacationDaysTaken,
    vacationPay,
    constitutionalThird,
    taxableVacationBase,
    abonoDays,
    abonoValue,
    abonoThird,
    abonoTotalExempt,
    inssTotal: inss.total,
    irrfTotal: irrf.finalTax,
    netVacationPay,
  };
}
