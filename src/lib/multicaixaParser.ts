/**
 * Multicaixa Express Proof Parser
 * Simulates OCR extraction from payment receipts (comprovativos)
 * Extracts: Transaction ID, Amount, Date, IBAN
 */

export interface ParsedMulticaixaProof {
  transactionId: string | null;
  amount: number | null;
  date: string | null;
  iban: string | null;
  rawText: string;
  isValid: boolean;
  errors: string[];
}

/**
 * Parse a Multicaixa Express payment proof text
 * In production, this would integrate with an OCR service
 */
export function parseMulticaixaProof(text: string): ParsedMulticaixaProof {
  const errors: string[] = [];
  let transactionId: string | null = null;
  let amount: number | null = null;
  let date: string | null = null;
  let iban: string | null = null;

  // Extract Transaction ID (e.g., "Transacção 12345" or "Referência: 12345")
  const transactionIdMatch = text.match(/(?:Transac[çc][ãa]o|Refer[êe]ncia|ID)[:\s]*(\d+)/i);
  if (transactionIdMatch) {
    transactionId = transactionIdMatch[1];
  } else {
    errors.push('Transaction ID not found');
  }

  // Extract Amount (handles formats like "250.000,00 Kz" or "250000.00 AOA")
  const amountPatterns = [
    /(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*(?:Kz|AOA)/i,  // 250.000,00 Kz
    /(?:Valor|Montante|Amount)[:\s]*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i,  // Valor: 250.000,00
    /AOA\s*(\d+(?:[.,]\d+)?)/i,  // AOA 250000.00
  ];

  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      // Convert Angolan format (1.000,00) to number
      const amountStr = match[1]
        .replace(/\./g, '')  // Remove thousand separators
        .replace(',', '.');   // Convert decimal separator
      amount = parseFloat(amountStr);
      break;
    }
  }

  if (amount === null) {
    errors.push('Amount not found');
  }

  // Extract Date (YYYY-MM-DD HH:MM:SS or DD/MM/YYYY)
  const datePatterns = [
    /(\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2}:\d{2})?)/,  // 2024-01-15 14:30:00
    /(\d{2}\/\d{2}\/\d{4}(?:\s+\d{2}:\d{2}(?::\d{2})?)?)/,  // 15/01/2024 14:30
    /(?:Data|Date)[:\s]*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i,  // Data: 15/01/2024
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      // Normalize date format
      let dateStr = match[1];
      if (dateStr.includes('/')) {
        const parts = dateStr.split(/[\s\/]/);
        if (parts.length >= 3) {
          dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }
      date = dateStr;
      break;
    }
  }

  if (date === null) {
    errors.push('Date not found');
  }

  // Extract IBAN (Angolan IBANs start with AO and have 25 characters)
  const ibanMatch = text.match(/\b(AO\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{3})\b/i);
  if (ibanMatch) {
    iban = ibanMatch[1].replace(/\s/g, '').toUpperCase();
  } else {
    errors.push('IBAN not found');
  }

  return {
    transactionId,
    amount,
    date,
    iban,
    rawText: text,
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate an Angolan IBAN
 */
export function validateAngolanIBAN(iban: string): { valid: boolean; error?: string } {
  // Remove spaces and convert to uppercase
  const cleanIban = iban.replace(/\s/g, '').toUpperCase();

  // Check format
  if (!cleanIban.startsWith('AO')) {
    return { valid: false, error: 'IBAN must start with AO (Angola)' };
  }

  if (cleanIban.length !== 25) {
    return { valid: false, error: 'Angolan IBAN must have exactly 25 characters' };
  }

  // Check if rest is digits
  if (!/^AO\d{23}$/.test(cleanIban)) {
    return { valid: false, error: 'IBAN contains invalid characters' };
  }

  // IBAN checksum validation (MOD 97)
  // Move first 4 chars to end and replace letters with numbers (A=10, O=24)
  const rearranged = cleanIban.slice(4) + '1024' + cleanIban.slice(2, 4);
  const numericIban = rearranged;
  
  // Calculate MOD 97
  let remainder = 0;
  for (let i = 0; i < numericIban.length; i++) {
    remainder = (remainder * 10 + parseInt(numericIban[i], 10)) % 97;
  }

  if (remainder !== 1) {
    return { valid: false, error: 'Invalid IBAN checksum' };
  }

  return { valid: true };
}

/**
 * Compare extracted IBAN with stored gym IBAN
 */
export function validateProofIBAN(
  extractedIban: string | null,
  storedIban: string | null
): { valid: boolean; error?: string } {
  if (!extractedIban) {
    return { valid: false, error: 'No IBAN found in proof' };
  }

  if (!storedIban) {
    return { valid: false, error: 'No IBAN configured in gym settings' };
  }

  const cleanExtracted = extractedIban.replace(/\s/g, '').toUpperCase();
  const cleanStored = storedIban.replace(/\s/g, '').toUpperCase();

  if (cleanExtracted !== cleanStored) {
    return { 
      valid: false, 
      error: 'IBAN mismatch: Payment was sent to a different account' 
    };
  }

  return { valid: true };
}

/**
 * Format currency in Angolan style (Kwanza)
 */
export function formatAngolaCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-AO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' Kz';
}

/**
 * Parse currency from Angolan format to number
 */
export function parseAngolaCurrency(value: string): number {
  // Remove currency suffix and spaces
  const cleaned = value.replace(/\s*(?:Kz|AOA)\s*/gi, '').trim();
  // Convert from 1.000,00 to 1000.00
  const normalized = cleaned.replace(/\./g, '').replace(',', '.');
  return parseFloat(normalized) || 0;
}
