/**
 * Bank Statement File Parser
 * Parses CSV/TXT bank export files with intelligent delimiter detection
 */

export interface BankTransaction {
  date: Date;
  description: string;
  amount: number;
  reference: string | null;
  rawLine: string;
}

export interface ParseResult {
  transactions: BankTransaction[];
  errors: string[];
  detectedDelimiter: string;
  totalRows: number;
}

/**
 * Detect the delimiter used in a CSV/TXT file
 */
function detectDelimiter(content: string): string {
  const firstLines = content.split('\n').slice(0, 5).join('\n');
  
  const semicolonCount = (firstLines.match(/;/g) || []).length;
  const commaCount = (firstLines.match(/,/g) || []).length;
  const tabCount = (firstLines.match(/\t/g) || []).length;

  if (tabCount > semicolonCount && tabCount > commaCount) return '\t';
  if (semicolonCount > commaCount) return ';';
  return ',';
}

/**
 * Parse a currency string to a number
 * Handles both 1.000,00 (European) and 1,000.00 (US) formats
 */
function parseCurrency(value: string): number {
  if (!value) return 0;
  
  // Clean the string
  let cleaned = value.replace(/[^\\d.,\\-]/g, '').trim();
  
  // Detect format based on last separator position
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  
  if (lastComma > lastDot) {
    // European format: 1.000,00
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma) {
    // US format: 1,000.00
    cleaned = cleaned.replace(/,/g, '');
  }
  
  return parseFloat(cleaned) || 0;
}

/**
 * Parse a date string from various formats
 */
function parseDate(value: string): Date | null {
  if (!value) return null;
  
  const cleaned = value.trim();
  
  // Try different date formats
  const formats = [
    // DD/MM/YYYY
    /^(\d{2})\/(\d{2})\/(\d{4})$/,
    // DD-MM-YYYY
    /^(\d{2})-(\d{2})-(\d{4})$/,
    // YYYY-MM-DD
    /^(\d{4})-(\d{2})-(\d{2})$/,
    // DD.MM.YYYY
    /^(\d{2})\.(\d{2})\.(\d{4})$/,
  ];
  
  for (const format of formats) {
    const match = cleaned.match(format);
    if (match) {
      if (format.source.startsWith('^(\\\\d{4})')) {
        // YYYY-MM-DD format
        return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
      } else {
        // DD/MM/YYYY format
        return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
      }
    }
  }
  
  // Try native parsing as fallback
  const parsed = new Date(cleaned);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Parse a bank statement file (CSV or TXT)
 */
export function parseBankFile(content: string, fileName: string): ParseResult {
  const errors: string[] = [];
  const transactions: BankTransaction[] = [];
  
  const delimiter = detectDelimiter(content);
  const lines = content.split('\n').filter(line => line.trim());
  
  // Skip header row
  const dataLines = lines.slice(1);
  
  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i].trim();
    if (!line) continue;
    
    const columns = line.split(delimiter).map(col => col.trim().replace(/^\"|\"$/g, ''));
    
    // Minimum columns: date, description, amount
    if (columns.length < 3) {
      errors.push(`Row ${i + 2}: Insufficient columns`);
      continue;
    }
    
    // Try to identify columns by content
    let date: Date | null = null;
    let description = '';
    let amount = 0;
    let reference: string | null = null;
    
    for (const col of columns) {
      const parsedDate = parseDate(col);
      if (parsedDate && !date) {
        date = parsedDate;
        continue;
      }
      
      const parsedAmount = parseCurrency(col);
      if (parsedAmount !== 0 && amount === 0) {
        amount = parsedAmount;
        continue;
      }
      
      // Check if it looks like a reference number
      if (/^\d{6,}$/.test(col) && !reference) {
        reference = col;
        continue;
      }
      
      // Otherwise, treat as description
      if (col.length > 5 && !description) {
        description = col;
      }
    }
    
    if (!date) {
      errors.push(`Row ${i + 2}: Could not parse date`);
      continue;
    }
    
    if (amount === 0) {
      errors.push(`Row ${i + 2}: Could not parse amount`);
      continue;
    }
    
    transactions.push({
      date,
      description: description || 'Unknown transaction',
      amount,
      reference,
      rawLine: line,
    });
  }
  
  return {
    transactions,
    errors,
    detectedDelimiter: delimiter === '\t' ? 'TAB' : delimiter,
    totalRows: lines.length - 1, // Exclude header
  };
}

/**
 * Match bank transactions against pending payments
 */
export interface PaymentMatch {
  transaction: BankTransaction;
  paymentId: string | null;
  paymentAmount: number | null;
  matchConfidence: 'high' | 'medium' | 'low' | 'none';
  reason: string;
}

export interface PendingPayment {
  id: string;
  amount: number;
  description: string | null;
  reference: string | null;
  member_name: string;
}

export function matchTransactionsToPayments(
  transactions: BankTransaction[],
  pendingPayments: PendingPayment[],
  tolerance: number = 0.01 // 1% tolerance for amount matching
): PaymentMatch[] {
  return transactions.map(transaction => {
    // Try to find matching payment
    for (const payment of pendingPayments) {
      // Check amount match (with tolerance)
      const amountDiff = Math.abs(transaction.amount - payment.amount);
      const amountTolerance = payment.amount * tolerance;
      
      if (amountDiff > amountTolerance) continue;
      
      // Check reference match
      if (transaction.reference && payment.reference) {
        if (transaction.reference === payment.reference) {
          return {
            transaction,
            paymentId: payment.id,
            paymentAmount: payment.amount,
            matchConfidence: 'high',
            reason: 'Reference and amount match',
          };
        }
      }
      
      // Check description contains member name
      if (transaction.description.toLowerCase().includes(payment.member_name.toLowerCase())) {
        return {
          transaction,
          paymentId: payment.id,
          paymentAmount: payment.amount,
          matchConfidence: 'medium',
          reason: 'Amount matches and description contains member name',
        };
      }
      
      // Amount-only match
      return {
        transaction,
        paymentId: payment.id,
        paymentAmount: payment.amount,
        matchConfidence: 'low',
        reason: 'Amount matches only',
      };
    }
    
    return {
      transaction,
      paymentId: null,
      paymentAmount: null,
      matchConfidence: 'none',
      reason: 'No matching payment found',
    };
  });
}
