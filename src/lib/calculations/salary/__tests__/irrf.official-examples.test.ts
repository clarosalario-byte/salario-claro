import { describe, it, expect } from 'vitest';
import { calculateIRRF } from '../irrf';
import { getRulesForYear } from '../rules/2026';

/**
 * These five cases are transcribed verbatim from the official Receita
 * Federal page "Exemplos de Aplicação da Lei 15.270/2025":
 * https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/exemplos-de-aplicacao-da-lei-15-270-2025
 *
 * If any of these fail, DO NOT adjust the expected value — investigate the
 * calculation engine. These are the ground truth.
 */
describe('IRRF — official Receita Federal examples (Lei 15.270/2025)', () => {
  const rules = getRulesForYear(2026);

  it('Exemplo 1: João, R$ 3.036,00, alíquota zero', () => {
    // Único dedução permitida: INSS de R$ 257,73. Desconto simplificado (607,20) é mais vantajoso.
    // NOTA: a página oficial da Receita Federal exibe "R$ 3.036,00 – R$ 607,20 = R$ 2.428,00",
    // o que é uma inconsistência aritmética na própria página (3036,00 - 607,20 = 2.428,80,
    // não 2.428,00). Usamos aqui o valor aritmeticamente correto (2.428,80), que ainda cai
    // exatamente no limite superior da 1ª faixa ("até R$ 2.428,80"), portanto o resultado
    // final do imposto (zero) é idêntico de qualquer forma.
    const result = calculateIRRF(3036.0, 257.73, 0, 0, rules);
    expect(result.deductionMethodUsed).toBe('simplified');
    expect(result.calculationBase).toBeCloseTo(2428.8, 2);
    expect(result.taxBeforeReduction).toBeCloseTo(0.0, 2);
    expect(result.finalTax).toBeCloseTo(0.0, 2);
  });

  it('Exemplo 2: José, R$ 4.000,00, renda abaixo de R$ 5.000,00', () => {
    const result = calculateIRRF(4000.0, 373.41, 0, 0, rules);
    expect(result.deductionMethodUsed).toBe('simplified');
    expect(result.calculationBase).toBeCloseTo(3392.8, 2);
    expect(result.taxBeforeReduction).toBeCloseTo(114.76, 2);
    expect(result.reduction).toBeCloseTo(114.76, 2);
    expect(result.finalTax).toBeCloseTo(0.0, 2);
  });

  it('Exemplo 3: Maria, R$ 5.000,00, exatamente no limite de isenção', () => {
    const result = calculateIRRF(5000.0, 509.6, 0, 0, rules);
    expect(result.deductionMethodUsed).toBe('simplified');
    expect(result.calculationBase).toBeCloseTo(4392.8, 2);
    expect(result.taxBeforeReduction).toBeCloseTo(312.89, 2);
    expect(result.reduction).toBeCloseTo(312.89, 2);
    expect(result.finalTax).toBeCloseTo(0.0, 2);
  });

  it('Exemplo 4: Rita, R$ 6.000,00, redução parcial (faixa R$5.000,01–R$7.350,00)', () => {
    // Deduções legais (649,60) superam o desconto simplificado (607,20).
    const result = calculateIRRF(6000.0, 649.6, 0, 0, rules);
    expect(result.deductionMethodUsed).toBe('legal');
    expect(result.calculationBase).toBeCloseTo(5350.4, 2);
    expect(result.taxBeforeReduction).toBeCloseTo(562.63, 2);
    expect(result.reduction).toBeCloseTo(179.75, 2);
    expect(result.finalTax).toBeCloseTo(382.88, 2);
  });

  it('Exemplo 5: Vera, R$ 7.607,20, sem redução (acima de R$ 7.350,00)', () => {
    const result = calculateIRRF(7607.2, 0, 0, 0, rules);
    expect(result.deductionMethodUsed).toBe('simplified');
    expect(result.calculationBase).toBeCloseTo(7000.0, 2);
    expect(result.taxBeforeReduction).toBeCloseTo(1016.27, 2);
    expect(result.reduction).toBe(0);
    expect(result.finalTax).toBeCloseTo(1016.27, 2);
  });
});
