import PDFDocument from 'pdfkit';
import { format } from 'date-fns';
import * as db from './db';

/**
 * Generate PDF for financial report
 */
export async function generateFinancialReportPDF(userId: number, month?: string): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: any) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Get user info
      // const user = await db.getUserById(userId);
      
      // Determine date range
      let startDate: Date;
      let endDate: Date;
      let reportTitle: string;

      if (month) {
        const [year, monthNum] = month.split('-');
        startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
        endDate = new Date(parseInt(year), parseInt(monthNum), 0);
        reportTitle = format(startDate, 'MMMM yyyy');
      } else {
        const now = new Date();
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        reportTitle = format(startDate, 'MMMM yyyy');
      }

      // Title
      doc.fontSize(24).font('Helvetica-Bold').text('Financial Report', { align: 'center' });
      doc.fontSize(14).font('Helvetica').text(reportTitle, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).text(`Generated on ${format(new Date(), 'MMMM dd, yyyy')}`, { align: 'center' });
      doc.moveDown(1);

      // User info section removed

      // Get financial data
      const expenses = await db.getExpensesByUser(userId, startDate as any, endDate as any);
      const categoryBreakdown = await db.getTotalExpensesByCategory(userId, startDate, endDate);
      const loans = await db.getLoansByUser(userId);
      const budgets = await db.getBudgetsByUser(userId);

      // Summary section
      doc.fontSize(12).font('Helvetica-Bold').text('Financial Summary');
      const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + parseFloat(exp.amount), 0);
      const totalLoans = loans.reduce((sum, loan) => sum + parseFloat(loan.remainingBalance), 0);
      
      doc.fontSize(10).font('Helvetica');
      doc.text(`Total Expenses: $${totalExpenses.toFixed(2)}`);
      doc.text(`Number of Transactions: ${expenses.length}`);
      doc.text(`Active Loans: ${loans.length}`);
      doc.text(`Total Loan Balance: $${totalLoans.toFixed(2)}`);
      doc.moveDown(1);

      // Expense breakdown
      doc.fontSize(12).font('Helvetica-Bold').text('Expense Breakdown by Category');
      doc.fontSize(10).font('Helvetica');
      
      if (categoryBreakdown.length > 0) {
        for (const category of categoryBreakdown) {
          const categoryTotal = parseFloat(category.total as string);
          const percentage = totalExpenses > 0 ? ((categoryTotal / totalExpenses) * 100).toFixed(1) : '0.0';
          const categoryName = category.categoryId?.toString() || 'Uncategorized';
          doc.text(`${categoryName}: $${categoryTotal.toFixed(2)} (${percentage}%)`);
        }
      } else {
        doc.text('No expenses recorded for this period');
      }
      doc.moveDown(1);

      // Recent transactions
      doc.fontSize(12).font('Helvetica-Bold').text('Recent Transactions');
      doc.fontSize(9).font('Helvetica');
      
      if (expenses.length > 0) {
        const recentExpenses = expenses.slice(0, 10);
        for (const expense of recentExpenses) {
          const date = format(new Date(expense.date), 'MMM dd');
          const category = expense.categoryId ? `Category ${expense.categoryId}` : 'Uncategorized';
          doc.text(`${date} - ${expense.description || 'N/A'} (${category}): $${expense.amount}`);
        }
        if (expenses.length > 10) {
          doc.text(`... and ${expenses.length - 10} more transactions`);
        }
      } else {
        doc.text('No transactions recorded for this period');
      }
      doc.moveDown(1);

      // Loan details
      if (loans.length > 0) {
        doc.fontSize(12).font('Helvetica-Bold').text('Active Loans');
        doc.fontSize(9).font('Helvetica');
        
        for (const loan of loans) {
          doc.text(`${loan.loanName}:`);
          doc.text(`  Principal: $${loan.principal}`);
          doc.text(`  Interest Rate: ${loan.interestRate}%`);
          doc.text(`  Monthly Payment: $${loan.monthlyPayment}`);
          doc.text(`  Remaining Balance: $${loan.remainingBalance}`);
          if (loan.nextPaymentDate) {
            doc.text(`  Next Payment: ${format(new Date(loan.nextPaymentDate), 'MMM dd, yyyy')}`);
          }
          doc.moveDown(0.5);
        }
      }

      // Footer
      doc.moveDown(1);
      doc.fontSize(8).text('This is an automatically generated financial report. Please verify all data before use.', {
        align: 'center',
      });

      doc.end();
    } catch (error) {
      console.error('[PDF Export] Error generating financial report PDF:', error);
      reject(error);
    }
  });
}

/**
 * Generate PDF for transaction history
 */
export async function generateTransactionHistoryPDF(userId: number, startDate?: Date, endDate?: Date): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: any) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Get user info
      // const user = await db.getUserById(userId);
      
      // Title
      doc.fontSize(20).font('Helvetica-Bold').text('Transaction History', { align: 'center' });
      doc.fontSize(10).font('Helvetica').text(`Generated on ${format(new Date(), 'MMMM dd, yyyy')}`, { align: 'center' });
      if (startDate && endDate) {
        doc.text(`Period: ${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`, { align: 'center' });
      }
      doc.moveDown(1);

      // Get expenses
      const expenses = await db.getExpensesByUser(userId, startDate as any, endDate as any);

      // Transaction table
      doc.fontSize(11).font('Helvetica-Bold').text('Expenses');
      doc.fontSize(9).font('Helvetica');
      
      if (expenses.length > 0) {
        // Table header
        const tableTop = doc.y;
        const col1 = 50;
        const col2 = 150;
        const col3 = 280;
        const col4 = 400;
        const col5 = 500;

        doc.font('Helvetica-Bold');
        doc.text('Date', col1, tableTop);
        doc.text('Description', col2, tableTop);
        doc.text('Category', col3, tableTop);
        doc.text('Amount', col4, tableTop);
        doc.text('Currency', col5, tableTop);

        doc.moveTo(col1, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        // Table rows
        doc.font('Helvetica');
        let yPosition = tableTop + 25;
        
        for (const expense of expenses) {
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }

          const date = format(new Date(expense.date), 'MMM dd');
          const category = expense.categoryId ? `Cat ${expense.categoryId}` : 'Other';
          
          doc.text(date, col1, yPosition);
          doc.text(expense.description || 'N/A', col2, yPosition, { width: 120 });
          doc.text(category, col3, yPosition);
          doc.text(`$${expense.amount}`, col4, yPosition);
          doc.text(expense.currency || 'USD', col5, yPosition);

          yPosition += 20;
        }

        // Total
        doc.moveTo(col1, yPosition).lineTo(550, yPosition).stroke();
        doc.font('Helvetica-Bold');
        const totalAmount = expenses.reduce((sum: number, exp: any) => sum + parseFloat(exp.amount), 0);
        doc.text('TOTAL', col1, yPosition + 10);
        doc.text(`$${totalAmount.toFixed(2)}`, col4, yPosition + 10);
      } else {
        doc.text('No transactions found for the specified period');
      }

      // Footer
      doc.moveDown(2);
      doc.fontSize(8).text('This is an automatically generated transaction history. Please verify all data before use.', {
        align: 'center',
      });

      doc.end();
    } catch (error) {
      console.error('[PDF Export] Error generating transaction history PDF:', error);
      reject(error);
    }
  });
}
