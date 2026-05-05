import { format } from 'date-fns';
import * as db from './db';

/**
 * Generate CSV content for transaction history
 */
export async function generateTransactionCSV(userId: number, startDate?: Date, endDate?: Date): Promise<string> {
  try {
    // Get expenses
    const expenses = await db.getExpensesByUser(userId, startDate as any, endDate as any);
    
    // Get loans
    const loans = await db.getLoansByUser(userId);

    // Build CSV header
    const headers = ['Date', 'Type', 'Description', 'Category', 'Amount', 'Currency', 'Notes'];
    const rows: string[][] = [headers];

    // Add expenses
    for (const expense of expenses) {
      const category = expense.categoryId ? `Category ${expense.categoryId}` : 'Uncategorized';
      rows.push([
        format(new Date(expense.date), 'yyyy-MM-dd'),
        'Expense',
        expense.description || '',
        category,
        expense.amount,
        expense.currency || 'USD',
        expense.notes || '',
      ]);
    }

    // Add loans as separate entries
    for (const loan of loans) {
      rows.push([
        format(new Date(loan.createdAt), 'yyyy-MM-dd'),
        'Loan',
        loan.loanName,
        'Loan',
        loan.principal,
        loan.currency || 'USD',
        `Interest Rate: ${loan.interestRate}%`,
      ]);
    }

    // Convert to CSV format
    const csv = rows.map(row => 
      row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma
        const escaped = cell.replace(/"/g, '""');
        return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n') 
          ? `"${escaped}"` 
          : escaped;
      }).join(',')
    ).join('\n');

    return csv;
  } catch (error) {
    console.error('[CSV Export] Error generating transaction CSV:', error);
    throw error;
  }
}

/**
 * Generate CSV content for expense report by category
 */
export async function generateExpenseReportCSV(userId: number, month?: string): Promise<string> {
  try {
    let startDate: Date;
    let endDate: Date;

    if (month) {
      const [year, monthNum] = month.split('-');
      startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      endDate = new Date(parseInt(year), parseInt(monthNum), 0);
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    // Get category breakdown
    const categoryBreakdown = await db.getTotalExpensesByCategory(userId, startDate, endDate);

    // Build CSV
    const headers = ['Category', 'Total Expenses', 'Currency', 'Percentage of Total'];
    const rows: string[][] = [headers];

    let totalExpenses = 0;
    for (const category of categoryBreakdown) {
      totalExpenses += parseFloat(category.total as string);
    }

    for (const category of categoryBreakdown) {
      const categoryTotal = parseFloat(category.total as string);
      const percentage = totalExpenses > 0 ? ((categoryTotal / totalExpenses) * 100).toFixed(2) : '0.00';
      
      rows.push([
        category.categoryId?.toString() || 'Uncategorized',
        categoryTotal.toFixed(2),
        'USD',
        `${percentage}%`,
      ]);
    }

    // Add total row
    rows.push(['TOTAL', totalExpenses.toFixed(2), 'USD', '100%']);

    // Convert to CSV format
    const csv = rows.map(row => 
      row.map(cell => {
        const escaped = cell.replace(/"/g, '""');
        return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n') 
          ? `"${escaped}"` 
          : escaped;
      }).join(',')
    ).join('\n');

    return csv;
  } catch (error) {
    console.error('[CSV Export] Error generating expense report CSV:', error);
    throw error;
  }
}

/**
 * Generate CSV content for loan summary
 */
export async function generateLoanSummaryCSV(userId: number): Promise<string> {
  try {
    const loans = await db.getLoansByUser(userId);

    // Build CSV
    const headers = ['Loan Name', 'Principal Amount', 'Interest Rate (%)', 'Monthly Payment', 'Remaining Balance', 'Next Payment Date', 'Currency', 'Status'];
    const rows: string[][] = [headers];
    for (const loan of loans) {
      const status = parseFloat(loan.remainingBalance) > 0 ? 'Active' : 'Paid Off';
      rows.push([
        loan.loanName,
        loan.principal,    loan.interestRate,
        loan.monthlyPayment,
        loan.remainingBalance,
        loan.nextPaymentDate ? format(new Date(loan.nextPaymentDate), 'yyyy-MM-dd') : 'N/A',
        loan.currency || 'USD',
        status,
      ]);
    }

    // Convert to CSV format
    const csv = rows.map(row => 
      row.map(cell => {
        const escaped = cell.replace(/"/g, '""');
        return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n') 
          ? `"${escaped}"` 
          : escaped;
      }).join(',')
    ).join('\n');

    return csv;
  } catch (error) {
    console.error('[CSV Export] Error generating loan summary CSV:', error);
    throw error;
  }
}

/**
 * Generate CSV content for budget report
 */
export async function generateBudgetReportCSV(userId: number): Promise<string> {
  try {
    const budgets = await db.getBudgetsByUser(userId);

    // Build CSV
    const headers = ['Category', 'Budget Amount', 'Month', 'Alert Threshold (%)', 'Currency', 'Notes'];
    const rows: string[][] = [headers];

    for (const budget of budgets) {
      rows.push([
        budget.categoryId?.toString() || 'All',
        budget.budgetAmount,
        budget.month,
        budget.alertThreshold.toString(),
        budget.currency || 'USD',
        budget.notes || '',
      ]);
    }

    // Convert to CSV format
    const csv = rows.map(row => 
      row.map(cell => {
        const escaped = cell.replace(/"/g, '""');
        return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n') 
          ? `"${escaped}"` 
          : escaped;
      }).join(',')
    ).join('\n');

    return csv;
  } catch (error) {
    console.error('[CSV Export] Error generating budget report CSV:', error);
    throw error;
  }
}
