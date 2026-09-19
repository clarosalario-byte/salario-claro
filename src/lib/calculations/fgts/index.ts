import { roundCurrency } from '../salary/money';

/**
 * FGTS (Fundo de Garantia do Tempo de Serviço)
 * ==============================================
 *
 * FONTES: Lei nº 8.036, de 11 de maio de 1990.
 *
 * - Art. 15: o empregador deposita, até o dia 7 de cada mês, importância
 *   correspondente a 8% da remuneração paga ou devida, no mês anterior, a
 *   cada trabalhador.
 * - Art. 18, §1º: em despedida SEM justa causa pelo empregador, o
 *   empregador paga ao trabalhador o equivalente a 40% do montante de
 *   todos os depósitos feitos na conta vinculada durante o contrato,
 *   atualizados monetariamente e acrescidos de juros.
 * - Art. 18, §1º-A (redação da Lei 13.467/2017, que incluiu o art. 484-A
 *   na CLT — rescisão por ACORDO entre empregador e empregado): a multa é
 *   de 20% sobre o mesmo montante, e o trabalhador pode sacar até 80% do
 *   saldo do FGTS (nesse caso).
 * - Não há multa em pedido de demissão, dispensa por justa causa, ou
 *   término normal de contrato por prazo determinado sem prorrogação.
 *
 * O FGTS é um depósito feito PELO EMPREGADOR — não é um desconto do
 * salário do empregado, e por isso nunca deve ser subtraído ao calcular o
 * salário líquido.
 *
 * LIMITAÇÃO DOCUMENTADA: o saldo real de uma conta de FGTS recebe também
 * correção monetária (TR) e juros de 3% ao ano, capitalizados mensalmente,
 * cujas taxas são publicadas mensalmente pela Caixa Econômica Federal e
 * não são reproduzidas aqui. A projeção de saldo acumulado desta
 * calculadora soma apenas os depósitos de 8% (valor principal), SEM
 * qualquer correção — por isso ela tende a ficar abaixo do saldo real de
 * uma conta com tempo de existência considerável. Isso é uma limitação
 * deliberada para não simular um rendimento com taxas que mudam mês a
 * mês e que esta calculadora não tem como verificar em tempo real.
 */

export const FGTS_DEPOSIT_RATE = 0.08;
export const FGTS_FINE_RATE_NO_CAUSE = 0.4;
export const FGTS_FINE_RATE_MUTUAL_AGREEMENT = 0.2;

export type TerminationType = 'no-cause' | 'mutual-agreement' | 'no-fine';

export interface FgtsInput {
  monthlySalary: number;
  /** Número de meses para projetar o depósito acumulado (opcional). */
  months?: number;
}

export interface FgtsResult {
  monthlyDeposit: number;
  months: number;
  /** Soma dos depósitos de 8%, SEM correção monetária ou juros — ver nota de limitação no módulo. */
  projectedPrincipalBalance: number;
}

export function calculateFgtsDeposit(input: FgtsInput): FgtsResult {
  const { monthlySalary } = input;
  const months = input.months ?? 1;

  if (monthlySalary < 0) throw new Error('O salário mensal não pode ser negativo.');
  if (!Number.isInteger(months) || months < 1 || months > 600) {
    throw new Error('O número de meses deve ser um número inteiro entre 1 e 600.');
  }

  const monthlyDeposit = roundCurrency(monthlySalary * FGTS_DEPOSIT_RATE);
  const projectedPrincipalBalance = roundCurrency(monthlyDeposit * months);

  return { monthlyDeposit, months, projectedPrincipalBalance };
}

export interface FgtsFineInput {
  /** Saldo acumulado do FGTS (informado pelo usuário — extrato oficial ou a projeção desta calculadora). */
  fgtsBalance: number;
  terminationType: TerminationType;
}

export interface FgtsFineResult {
  fgtsBalance: number;
  terminationType: TerminationType;
  fineRate: number;
  fineAmount: number;
}

export function calculateFgtsFine(input: FgtsFineInput): FgtsFineResult {
  const { fgtsBalance, terminationType } = input;

  if (fgtsBalance < 0) throw new Error('O saldo do FGTS não pode ser negativo.');

  const fineRate =
    terminationType === 'no-cause'
      ? FGTS_FINE_RATE_NO_CAUSE
      : terminationType === 'mutual-agreement'
        ? FGTS_FINE_RATE_MUTUAL_AGREEMENT
        : 0;

  const fineAmount = roundCurrency(fgtsBalance * fineRate);

  return { fgtsBalance, terminationType, fineRate, fineAmount };
}
