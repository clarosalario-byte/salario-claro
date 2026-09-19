/**
 * Money handling strategy
 * ------------------------
 * All intermediate arithmetic that involves multiplying a rate by a
 * monetary value is done in **integer cents** to avoid binary
 * floating-point drift (e.g. 0.1 + 0.2 !== 0.3).
 *
 * Rounding rule: every individual monetary result (each INSS bracket
 * contribution, the IRPF tax, the reduction, the final net salary) is
 * rounded to the nearest cent using standard "round half away from zero"
 * rounding, matching how Brazilian payroll systems round each step
 * (this mirrors the official Receita Federal examples, which present
 * every intermediate value already rounded to 2 decimals).
 *
 * Inputs and outputs of the public API are plain JS numbers denominated
 * in reais with 2 decimal places.
 */

/** Converts a reais amount (number) to integer cents. */
export function toCents(reais: number): number {
  return Math.round(reais * 100);
}

/** Converts integer cents back to a reais number (2 decimals). */
export function toReais(cents: number): number {
  return cents / 100;
}

/**
 * Rounds a reais amount to the nearest cent, "round half away from zero".
 * Used at each stage boundary so intermediate values match what a payroll
 * system / the official examples would display.
 */
export function roundCurrency(value: number): number {
  const sign = value < 0 ? -1 : 1;
  // A tiny epsilon compensates for binary floating-point representation
  // error (e.g. 1621 * 0.075 evaluating to 121.57499999999999 instead of
  // 121.575), which would otherwise cause exact ".5 cent" boundaries to
  // round down incorrectly.
  const epsilon = 1e-9;
  return (sign * Math.round(Math.abs(value) * 100 + epsilon)) / 100;
}

/** Multiplies a reais amount by a rate, rounding the result to the nearest cent. */
export function multiplyRounded(reais: number, rate: number): number {
  return roundCurrency(reais * rate);
}

/** Formats a number as Brazilian currency: "R$ 1.234,56". */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
