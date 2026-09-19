import type { YearRules } from '../../types';

/**
 * Regras de 2026 — Tabela de Salário Líquido
 * ===========================================
 *
 * FONTES (Tier 1 — oficiais):
 *
 * 1. IRPF — Tabela de Incidência Mensal e Tabela de Redução Mensal (2026):
 *    Receita Federal, "Tributação de 2026"
 *    https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026
 *    (conteúdo da própria página indica "Atualizado em 27/04/2026"; valores
 *    reconferidos diretamente nesta página oficial em 15/09/2026 — nenhuma
 *    mudança desde a verificação anterior. A tabela mensal tem base na Lei
 *    nº 15.191, de 11 de agosto de 2025, e a redução mensal tem base na Lei
 *    nº 15.270, de 26 de novembro de 2025.)
 *
 * 2. Exemplos oficiais de aplicação da redução (Lei 15.270/2025):
 *    https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/exemplos-de-aplicacao-da-lei-15-270-2025
 *    Reconferidos em 15/09/2026 — os 5 exemplos oficiais permanecem
 *    idênticos aos usados em __tests__/irrf.official-examples.test.ts.
 *    NOTA: o próprio Exemplo 1 desta página oficial contém um erro
 *    aritmético (mostra "R$ 3.036,00 – R$ 607,20 = R$ 2.428,00", quando o
 *    resultado correto é R$ 2.428,80); isso está documentado no teste
 *    correspondente. O resultado final do imposto (zero) é idêntico de
 *    qualquer forma, pois ambos os valores caem na 1ª faixa (até R$2.428,80).
 *
 * 3. Lei nº 15.270, de 26 de novembro de 2025 (base legal da redução):
 *    https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15270.htm
 *
 * 4. Lei nº 15.191, de 11 de agosto de 2025 (base legal da tabela mensal do IRPF):
 *    https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15191.htm
 *
 * 5. INSS — Tabela de Contribuição do segurado empregado, empregado
 *    doméstico e trabalhador avulso (Regime Geral — Anexo II), vigente a
 *    partir de 1º de janeiro de 2026:
 *    Portaria Interministerial MPS/MF nº 13, de 9 de janeiro de 2026,
 *    publicada no Diário Oficial da União em 12/01/2026 (Edição 7, Seção 1,
 *    Página 58).
 *    PDF oficial (imagem digitalizada, sem texto extraível por OCR/copiar-
 *    colar):
 *    https://www.gov.br/previdencia/pt-br/assuntos/rpps/documentos/PortariaInterministerialMPSMF13de9dejaneirode2026.pdf
 *    Como o PDF oficial não é extraível, os valores abaixo foram
 *    verificados em 15/09/2026 contra uma transcrição integral do texto do
 *    DOU (edição/seção/página citadas acima), batendo faixa a faixa, e
 *    cruzados adicionalmente com três fontes contábeis independentes
 *    (Contabilizei, Convenia, CalcularCLT), todas convergindo para os
 *    mesmos valores. O Anexo III da mesma Portaria (regime próprio /
 *    servidores públicos) NÃO se aplica a este calculador, que usa apenas
 *    o Anexo II (regime geral / empregados CLT).
 *
 * Data da última verificação de todas as regras acima: 15/09/2026.
 * Nenhum valor foi alterado desde a implementação inicial — esta é uma
 * reconferência, não uma correção.
 */

export const RULES_2026: YearRules = {
  year: 2026,
  lastVerified: '2026-09-15',

  inss: {
    ceiling: 8475.55,
    brackets: [
      { from: 0, to: 1621.0, rate: 0.075 },
      { from: 1621.01, to: 2902.84, rate: 0.09 },
      { from: 2902.85, to: 4354.27, rate: 0.12 },
      { from: 4354.28, to: 8475.55, rate: 0.14 },
    ],
  },

  irpf: {
    dependentDeduction: 189.59,
    simplifiedDeductionCap: 607.2,
    brackets: [
      { from: 0, to: 2428.8, rate: 0, deduction: 0 },
      { from: 2428.81, to: 2826.65, rate: 0.075, deduction: 182.16 },
      { from: 2826.66, to: 3751.05, rate: 0.15, deduction: 394.16 },
      { from: 3751.06, to: 4664.68, rate: 0.225, deduction: 675.49 },
      { from: 4664.69, to: Infinity, rate: 0.275, deduction: 908.73 },
    ],
    reduction: {
      fullReliefCeiling: 5000.0,
      fullReliefAmount: 312.89,
      partialReliefCeiling: 7350.0,
      partialReliefBase: 978.62,
      partialReliefSlope: 0.133145,
    },
  },

  sources: [
    {
      label: 'Receita Federal: Tributação de 2026 (tabelas mensais e redução)',
      url: 'https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026',
    },
    {
      label: 'Receita Federal: Exemplos de aplicação da Lei 15.270/2025',
      url: 'https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/exemplos-de-aplicacao-da-lei-15-270-2025',
    },
    {
      label: 'Planalto: Lei nº 15.191, de 11 de agosto de 2025 (tabela mensal do IRPF)',
      url: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15191.htm',
    },
    {
      label: 'Planalto: Lei nº 15.270, de 26 de novembro de 2025',
      url: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15270.htm',
    },
    {
      label:
        'Portaria Interministerial MPS/MF nº 13, de 9/1/2026: tabela INSS (DOU de 12/1/2026, Edição 7, Seção 1, Página 58)',
      url: 'https://www.gov.br/previdencia/pt-br/assuntos/rpps/documentos/PortariaInterministerialMPSMF13de9dejaneirode2026.pdf',
    },
  ],
};

export function getRulesForYear(year: number): YearRules {
  if (year === 2026) return RULES_2026;
  throw new Error(
    `Regras de cálculo não implementadas para o ano ${year}. Anos suportados: 2026.`
  );
}
