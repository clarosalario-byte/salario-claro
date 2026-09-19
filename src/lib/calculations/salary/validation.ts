export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

const MAX_REASONABLE_SALARY = 10_000_000; // R$ 10 million/month — generous upper sanity bound

export function validateSalaryInput(input: {
  grossSalary: number;
  dependents: number;
  otherDeductions: number;
  alimony?: number;
}): ValidationResult {
  const errors: ValidationError[] = [];

  if (input.grossSalary === undefined || input.grossSalary === null || Number.isNaN(input.grossSalary)) {
    errors.push({ field: 'grossSalary', message: 'Informe um salário bruto válido.' });
  } else if (input.grossSalary < 0) {
    errors.push({ field: 'grossSalary', message: 'O salário bruto não pode ser negativo.' });
  } else if (input.grossSalary > MAX_REASONABLE_SALARY) {
    errors.push({ field: 'grossSalary', message: 'Informe um valor de salário mais realista.' });
  }

  if (input.dependents === undefined || input.dependents === null || Number.isNaN(input.dependents)) {
    errors.push({ field: 'dependents', message: 'Informe um número de dependentes válido.' });
  } else if (input.dependents < 0) {
    errors.push({ field: 'dependents', message: 'O número de dependentes não pode ser negativo.' });
  } else if (!Number.isInteger(input.dependents)) {
    errors.push({ field: 'dependents', message: 'O número de dependentes deve ser um número inteiro.' });
  } else if (input.dependents > 30) {
    errors.push({ field: 'dependents', message: 'Informe um número de dependentes mais realista.' });
  }

  if (
    input.otherDeductions !== undefined &&
    (Number.isNaN(input.otherDeductions) || input.otherDeductions < 0)
  ) {
    errors.push({ field: 'otherDeductions', message: 'Outros descontos não podem ser negativos.' });
  }

  if (input.alimony !== undefined && (Number.isNaN(input.alimony) || input.alimony < 0)) {
    errors.push({ field: 'alimony', message: 'A pensão alimentícia não pode ser negativa.' });
  }

  return { valid: errors.length === 0, errors };
}
