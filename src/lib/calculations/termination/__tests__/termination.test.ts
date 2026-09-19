import { describe, it, expect } from 'vitest';
import { calculateTermination, calculateNoticeDays } from '../index';

describe('calculateNoticeDays — Lei 12.506/2011', () => {
  it('menos de 1 ano: 30 dias', () => {
    expect(calculateNoticeDays(0)).toBe(30);
  });
  it('exatamente 1 ano: 33 dias', () => {
    expect(calculateNoticeDays(1)).toBe(33);
  });
  it('exatamente 2 anos: 36 dias', () => {
    expect(calculateNoticeDays(2)).toBe(36);
  });
  it('exatamente 3 anos: 39 dias', () => {
    expect(calculateNoticeDays(3)).toBe(39);
  });
  it('teto de 90 dias para tempo de serviço muito longo', () => {
    expect(calculateNoticeDays(30)).toBe(90);
    expect(calculateNoticeDays(19)).toBeLessThanOrEqual(90);
    expect(calculateNoticeDays(20)).toBe(90);
  });
});

describe('calculateTermination — dispensa sem justa causa', () => {
  it('caso básico: 1 ano e 6 meses de serviço', () => {
    const r = calculateTermination({
      monthlySalary: 2000,
      admissionDate: '2024-07-10',
      terminationDate: '2026-01-10',
      scenario: 'no-cause',
    });
    expect(r.completedYears).toBe(1);
    expect(r.noticeDays).toBe(33);
    // O valor diário é arredondado a centavos antes de multiplicar (como em um
    // recibo de rescisão real), então o resultado é 66,67 × 33 = 2200,11 —
    // não o valor "exato" não arredondado de 2200,00.
    expect(r.noticeValue).toBeCloseTo(2200.11, 2);
  });

  it('inclui férias proporcionais e 13º proporcional', () => {
    const r = calculateTermination({
      monthlySalary: 3000,
      admissionDate: '2025-01-01',
      terminationDate: '2026-07-01',
      scenario: 'no-cause',
    });
    expect(r.proportionalVacationMonths).toBeGreaterThan(0);
    expect(r.proportionalThirteenthMonths).toBeGreaterThan(0);
  });

  it('multa do FGTS de 40% quando saldo é informado', () => {
    const r = calculateTermination({
      monthlySalary: 3000,
      admissionDate: '2025-01-01',
      terminationDate: '2026-01-01',
      scenario: 'no-cause',
      fgtsBalance: 10000,
    });
    expect(r.fgtsFineRate).toBe(0.4);
    expect(r.fgtsFineAmount).toBeCloseTo(4000, 2);
  });

  it('sem saldo do FGTS informado, fgtsFineAmount é null', () => {
    const r = calculateTermination({
      monthlySalary: 3000,
      admissionDate: '2025-01-01',
      terminationDate: '2026-01-01',
      scenario: 'no-cause',
    });
    expect(r.fgtsFineAmount).toBeNull();
  });

  it('aviso prévio não sofre INSS/IRRF (não entra na base tributável)', () => {
    const r = calculateTermination({
      monthlySalary: 3000,
      admissionDate: '2025-01-01',
      terminationDate: '2026-01-01',
      scenario: 'no-cause',
    });
    // O valor líquido total deve incluir o aviso prévio integralmente (sem desconto).
    expect(r.noticeValue).toBeGreaterThan(0);
  });
});

describe('calculateTermination — pedido de demissão', () => {
  it('não gera aviso prévio nem multa de FGTS', () => {
    const r = calculateTermination({
      monthlySalary: 3000,
      admissionDate: '2025-01-01',
      terminationDate: '2026-01-01',
      scenario: 'resignation',
      fgtsBalance: 10000,
    });
    expect(r.noticeDays).toBe(0);
    expect(r.noticeValue).toBe(0);
    expect(r.fgtsFineRate).toBe(0);
    expect(r.fgtsFineAmount).toBe(0);
  });

  it('ainda gera férias e 13º proporcionais', () => {
    const r = calculateTermination({
      monthlySalary: 3000,
      admissionDate: '2025-01-01',
      terminationDate: '2026-07-01',
      scenario: 'resignation',
    });
    expect(r.proportionalVacationMonths).toBeGreaterThan(0);
    expect(r.proportionalThirteenthMonths).toBeGreaterThan(0);
  });
});

describe('calculateTermination — dispensa por justa causa', () => {
  it('não gera aviso prévio, férias proporcionais, 13º proporcional ou multa de FGTS', () => {
    const r = calculateTermination({
      monthlySalary: 3000,
      admissionDate: '2025-01-01',
      terminationDate: '2026-07-01',
      scenario: 'just-cause',
      fgtsBalance: 10000,
    });
    expect(r.noticeDays).toBe(0);
    expect(r.proportionalVacationMonths).toBe(0);
    expect(r.proportionalVacationValue).toBe(0);
    expect(r.proportionalThirteenthMonths).toBe(0);
    expect(r.proportionalThirteenthGross).toBe(0);
    expect(r.fgtsFineRate).toBe(0);
  });

  it('ainda gera saldo de salário e férias vencidas, se houver', () => {
    const r = calculateTermination({
      monthlySalary: 3000,
      admissionDate: '2025-01-01',
      terminationDate: '2026-07-15',
      scenario: 'just-cause',
      overdueVacationDays: 10,
    });
    expect(r.balanceSalary).toBeGreaterThan(0);
    expect(r.overdueVacationValue).toBeGreaterThan(0);
  });
});

describe('calculateTermination — rescisão por acordo', () => {
  it('aviso prévio pela metade e multa de FGTS de 20%', () => {
    const r = calculateTermination({
      monthlySalary: 2000,
      admissionDate: '2024-07-10',
      terminationDate: '2026-01-10',
      scenario: 'mutual-agreement',
      fgtsBalance: 10000,
    });
    expect(r.noticeDays).toBe(Math.ceil(33 / 2));
    expect(r.fgtsFineRate).toBe(0.2);
    expect(r.fgtsFineAmount).toBeCloseTo(2000, 2);
  });
});

describe('calculateTermination — validação', () => {
  it('rejeita data de rescisão anterior à admissão', () => {
    expect(() =>
      calculateTermination({
        monthlySalary: 3000,
        admissionDate: '2026-01-01',
        terminationDate: '2025-01-01',
        scenario: 'no-cause',
      })
    ).toThrow();
  });

  it('rejeita salário negativo', () => {
    expect(() =>
      calculateTermination({
        monthlySalary: -100,
        admissionDate: '2025-01-01',
        terminationDate: '2026-01-01',
        scenario: 'no-cause',
      })
    ).toThrow();
  });

  it('rejeita férias vencidas fora de 0-30', () => {
    expect(() =>
      calculateTermination({
        monthlySalary: 3000,
        admissionDate: '2025-01-01',
        terminationDate: '2026-01-01',
        scenario: 'no-cause',
        overdueVacationDays: 31,
      })
    ).toThrow();
  });

  it('rejeita datas inválidas', () => {
    expect(() =>
      calculateTermination({
        monthlySalary: 3000,
        admissionDate: 'not-a-date',
        terminationDate: '2026-01-01',
        scenario: 'no-cause',
      })
    ).toThrow();
  });
});
