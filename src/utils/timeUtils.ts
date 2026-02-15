/**
 * Validates time in HH:MM format
 * Rules:
 * - Minutes cannot be 00 (no "closed" times)
 * - Must be valid time format
 */
export function validateTime(time: string): { valid: boolean; error?: string } {
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return { valid: false, error: 'Formato inválido. Use HH:MM' };

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  if (hours < 0 || hours > 23) return { valid: false, error: 'Hora deve ser entre 0 e 23' };
  if (minutes < 0 || minutes > 59) return { valid: false, error: 'Minutos devem ser entre 0 e 59' };
  if (minutes === 0) return { valid: false, error: 'Horários fechados (minutos = 00) não são permitidos' };

  return { valid: true };
}

/**
 * Convert HH:MM to decimal hours
 */
export function timeToDecimal(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h + m / 60;
}

/**
 * Calculate total hours from time entries
 */
export function calculateDailyHours(
  entry1: string | null,
  exit1: string | null,
  entry2: string | null,
  exit2: string | null
): number {
  let total = 0;

  if (entry1 && exit1) {
    total += timeToDecimal(exit1) - timeToDecimal(entry1);
  }
  if (entry2 && exit2) {
    total += timeToDecimal(exit2) - timeToDecimal(entry2);
  }

  return Math.round(total * 100) / 100;
}

/**
 * Validate that exit is after entry and no overlap
 */
export function validateTimeSequence(
  entry1: string | null,
  exit1: string | null,
  entry2: string | null,
  exit2: string | null
): { valid: boolean; error?: string } {
  if (entry1 && exit1) {
    if (timeToDecimal(exit1) <= timeToDecimal(entry1)) {
      return { valid: false, error: 'Saída 1 deve ser após Entrada 1' };
    }
  }
  if (entry2 && exit2) {
    if (timeToDecimal(exit2) <= timeToDecimal(entry2)) {
      return { valid: false, error: 'Saída 2 deve ser após Entrada 2' };
    }
  }
  if (exit1 && entry2) {
    if (timeToDecimal(entry2) <= timeToDecimal(exit1)) {
      return { valid: false, error: 'Entrada 2 deve ser após Saída 1' };
    }
  }
  return { valid: true };
}

/**
 * Format decimal hours for display
 */
export function formatHoursDecimal(hours: number): string {
  return hours.toFixed(2) + 'h';
}

/**
 * Format balance with sign
 */
export function formatBalance(balance: number): string {
  const sign = balance >= 0 ? '+' : '';
  return sign + balance.toFixed(2) + 'h';
}
