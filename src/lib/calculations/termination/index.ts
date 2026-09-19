import { calculateINSS } from '../salary/inss';
import { calculateIRRF } from '../salary/irrf';
import { getRulesForYear } from '../salary/rules/2026';
import { roundCurrency } from '../salary/money';
import { daysInCalendarMonth } from '../proportional';

/**
 * Rescisão CLT
 * =============
 *
 * Esta é a calculadora mais complexa do site. Cada verba tem sua própria
 * fonte legal, listada abaixo. As regras MUDAM conforme o tipo de
 * desligamento — por isso o tipo é uma entrada obrigatória, não uma
 * suposição.
 *
 * FONTES:
 * - Aviso prévio proporcional: Lei nº 12.506/2011. Fórmula confirmada
 *   contra a prática predominante de plataformas de folha de pagamento
 *   atuais (Convenia, MeuTudo): 30 dias de base, mais 3 dias por ANO
 *   COMPLETO de serviço (a partir do 1º ano completo), até o máximo de 90
 *   dias no total. Exemplos confirmados: 10 meses → 30 dias; 1 ano → 33
 *   dias; 2 anos → 36 dias; 3 anos → 39 dias. NOTA: existe controvérsia
 *   doutrinária sobre a contagem exata em anos fracionários (alguns
 *   autores defendem uma contagem diferente para o período entre
 *   aniversários de contrato); esta calculadora segue a convenção mais
 *   comum no mercado, mas o valor exato pode ser objeto de interpretação
 *   em casos de disputa. Só é devido pelo empregador em dispensa sem
 *   justa causa (integral) ou em rescisão por acordo (metade, art. 484-A,
 *   §1º, CLT). Não é devido em pedido de demissão nem em dispensa por
 *   justa causa.
 * - Aviso prévio indenizado é verba INDENIZATÓRIA: não incide INSS
 *   (jurisprudência consolidada do STJ e do TST; Decreto 3.048/99) nem
 *   IRRF (art. 6º, V, da Lei 7.713/88 — verbas indenizatórias).
 * - Férias proporcionais: Súmula nº 171 do TST — devidas em qualquer
 *   forma de extinção do contrato, EXCETO dispensa por justa causa.
 * - 13º salário proporcional: entendimento consolidado do TST (art. 3º da
 *   Lei 4.090/62 c/c Súmulas de Tribunais Regionais) — devido em qualquer
 *   forma de extinção, EXCETO dispensa por justa causa.
 * - Multa do FGTS: art. 18, §1º, da Lei 8.036/1990 — 40% em dispensa sem
 *   justa causa; 20% em rescisão por acordo (art. 484-A, CLT, incluído
 *   pela Lei 13.467/2017); nenhuma em pedido de demissão ou justa causa.
 * - Saldo de salário: dias efetivamente trabalhados no mês da rescisão,
 *   pelo divisor real do mês (art. 64 da CLT — mesma lógica do salário
 *   proporcional).
 *
 * LIMITAÇÃO DOCUMENTADA — "projeção do aviso prévio": quando o aviso
 * prévio é indenizado, a Súmula nº 371 do TST manda projetar ficticiamente
 * a data de saída para efeitos de contagem de tempo de serviço (o que
 * pode aumentar em até 90 dias os meses contados para férias e 13º
 * proporcionais). ESTA CALCULADORA NÃO APLICA essa projeção — os meses
 * proporcionais são contados até a data de rescisão informada, não até a
 * data projetada. Isso pode SUBESTIMAR levemente o valor devido em
 * dispensas sem justa causa com aviso prévio indenizado. Consulte um
 * profissional de contabilidade ou RH para o valor exato nesse cenário.
 */

export type TerminationScenario = 'no-cause' | 'resignation' | 'just-cause' | 'mutual-agreement';

export interface TerminationInput {
  monthlySalary: number;
  admissionDate: string; // ISO yyyy-mm-dd
  terminationDate: string; // ISO yyyy-mm-dd
  scenario: TerminationScenario;
  /** Dias de férias vencidas (já adquiridas em período anterior, não gozadas). */
  overdueVacationDays?: number;
  /** Saldo acumulado do FGTS, para calcular a multa (opcional). */
  fgtsBalance?: number;
  dependents?: number;
  alimony?: number;
}

export interface TerminationResult {
  scenario: TerminationScenario;
  completedYears: number;
  balanceSalaryDays: number;
  balanceSalary: number;
  noticeDays: number;
  noticeValue: number;
  overdueVacationDays: number;
  overdueVacationValue: number;
  proportionalVacationMonths: number;
  proportionalVacationValue: number;
  vacationThird: number;
  vacationTaxableBase: number;
  vacationInss: number;
  vacationIrrf: number;
  proportionalThirteenthMonths: number;
  proportionalThirteenthGross: number;
  thirteenthInss: number;
  thirteenthIrrf: number;
  balanceSalaryInss: number;
  balanceSalaryIrrf: number;
  fgtsFineRate: number;
  fgtsFineAmount: number | null;
  totalNet: number;
}

function monthsBetweenWithThreshold(start: Date, end: Date): number {
  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (end.getDate() < 15) {
    months -= 1;
  }
  return Math.max(0, months);
}

/** Aviso prévio proporcional — Lei 12.506/2011. */
export function calculateNoticeDays(completedYears: number): number {
  if (completedYears <= 0) return 30;
  const additional = Math.min(60, 3 * completedYears);
  return 30 + additional;
}

export function calculateTermination(input: TerminationInput): TerminationResult {
  const {
    monthlySalary,
    admissionDate,
    terminationDate,
    scenario,
    overdueVacationDays = 0,
    fgtsBalance,
    dependents = 0,
    alimony = 0,
  } = input;

  if (monthlySalary < 0) throw new Error('O salário mensal não pode ser negativo.');

  const admission = new Date(admissionDate);
  const termination = new Date(terminationDate);
  if (Number.isNaN(admission.getTime()) || Number.isNaN(termination.getTime())) {
    throw new Error('Datas inválidas.');
  }
  if (termination <= admission) {
    throw new Error('A data de rescisão deve ser posterior à data de admissão.');
  }
  if (overdueVacationDays < 0 || overdueVacationDays > 30) {
    throw new Error('Os dias de férias vencidas devem estar entre 0 e 30.');
  }

  const rules = getRulesForYear(2026);

  // --- Tempo de serviço ---
  const totalServiceMonths =
    (termination.getFullYear() - admission.getFullYear()) * 12 +
    (termination.getMonth() - admission.getMonth()) +
    (termination.getDate() >= admission.getDate() ? 0 : -1);
  const completedYears = Math.max(0, Math.floor(totalServiceMonths / 12));

  // --- Saldo de salário (dias trabalhados no mês da rescisão) ---
  const daysInTerminationMonth = daysInCalendarMonth(termination.getFullYear(), termination.getMonth() + 1);
  const balanceSalaryDays = termination.getDate();
  const dailyRate = roundCurrency(monthlySalary / daysInTerminationMonth);
  const balanceSalary = roundCurrency(dailyRate * balanceSalaryDays);

  // --- Aviso prévio (só em dispensa sem justa causa ou acordo) ---
  let noticeDays = 0;
  if (scenario === 'no-cause') {
    noticeDays = calculateNoticeDays(completedYears);
  } else if (scenario === 'mutual-agreement') {
    noticeDays = Math.ceil(calculateNoticeDays(completedYears) / 2);
  }
  const dailyRate30 = roundCurrency(monthlySalary / 30);
  const noticeValue = roundCurrency(dailyRate30 * noticeDays);

  // --- Férias vencidas + proporcionais (não devidas em justa causa) ---
  const overdueVacationValue = roundCurrency(dailyRate30 * overdueVacationDays);

  let proportionalVacationMonths = 0;
  if (scenario !== 'just-cause') {
    // Meses do período aquisitivo atual (desde o último aniversário de admissão).
    let lastAnniversary = new Date(admission);
    lastAnniversary.setFullYear(admission.getFullYear() + completedYears);
    if (lastAnniversary > termination) {
      lastAnniversary = new Date(admission);
      lastAnniversary.setFullYear(admission.getFullYear() + completedYears - 1);
    }
    proportionalVacationMonths = monthsBetweenWithThreshold(lastAnniversary, termination);
    proportionalVacationMonths = Math.min(12, proportionalVacationMonths);
  }
  const proportionalVacationValue = roundCurrency((monthlySalary / 12) * proportionalVacationMonths);

  const vacationThird = roundCurrency((overdueVacationValue + proportionalVacationValue) / 3);
  const vacationTaxableBase = roundCurrency(overdueVacationValue + proportionalVacationValue + vacationThird);
  const vacationInss = calculateINSS(vacationTaxableBase, rules);
  const vacationIrrf = calculateIRRF(vacationTaxableBase, vacationInss.total, dependents, alimony, rules);

  // --- 13º proporcional (não devido em justa causa) ---
  let proportionalThirteenthMonths = 0;
  if (scenario !== 'just-cause') {
    const yearStart = new Date(termination.getFullYear(), 0, 1);
    const countFrom = admission > yearStart ? admission : yearStart;
    proportionalThirteenthMonths = Math.min(12, monthsBetweenWithThreshold(countFrom, termination) + 1);
  }
  const proportionalThirteenthGross = roundCurrency((monthlySalary / 12) * proportionalThirteenthMonths);
  const thirteenthInss = calculateINSS(proportionalThirteenthGross, rules);
  const thirteenthIrrf = calculateIRRF(
    proportionalThirteenthGross,
    thirteenthInss.total,
    dependents,
    alimony,
    rules
  );

  // --- INSS/IRRF sobre o saldo de salário (tratado como remuneração do mês) ---
  const balanceSalaryInss = calculateINSS(balanceSalary, rules);
  const balanceSalaryIrrf = calculateIRRF(
    balanceSalary,
    balanceSalaryInss.total,
    dependents,
    alimony,
    rules
  );

  // --- Multa do FGTS ---
  const fgtsFineRate = scenario === 'no-cause' ? 0.4 : scenario === 'mutual-agreement' ? 0.2 : 0;
  const fgtsFineAmount =
    fgtsBalance !== undefined && fgtsBalance !== null ? roundCurrency(fgtsBalance * fgtsFineRate) : null;

  const totalNet = roundCurrency(
    balanceSalary -
      balanceSalaryInss.total -
      balanceSalaryIrrf.finalTax +
      noticeValue +
      overdueVacationValue +
      proportionalVacationValue +
      vacationThird -
      vacationInss.total -
      vacationIrrf.finalTax +
      proportionalThirteenthGross -
      thirteenthInss.total -
      thirteenthIrrf.finalTax +
      (fgtsFineAmount ?? 0)
  );

  return {
    scenario,
    completedYears,
    balanceSalaryDays,
    balanceSalary,
    noticeDays,
    noticeValue,
    overdueVacationDays,
    overdueVacationValue,
    proportionalVacationMonths,
    proportionalVacationValue,
    vacationThird,
    vacationTaxableBase,
    vacationInss: vacationInss.total,
    vacationIrrf: vacationIrrf.finalTax,
    proportionalThirteenthMonths,
    proportionalThirteenthGross,
    thirteenthInss: thirteenthInss.total,
    thirteenthIrrf: thirteenthIrrf.finalTax,
    balanceSalaryInss: balanceSalaryInss.total,
    balanceSalaryIrrf: balanceSalaryIrrf.finalTax,
    fgtsFineRate,
    fgtsFineAmount,
    totalNet,
  };
}
