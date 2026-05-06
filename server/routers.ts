import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { generateTransactionCSV, generateExpenseReportCSV, generateLoanSummaryCSV, generateBudgetReportCSV } from "./csv-export-service";
import { generateFinancialReportPDF, generateTransactionHistoryPDF } from "./pdf-export-service";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============= EXPENSE PROCEDURES =============
  expenses: router({
    create: protectedProcedure
      .input(z.object({
        categoryId: z.number(),
        amount: z.string(),
        description: z.string(),
        date: z.date(),
        merchant: z.string().optional(),
        paymentMethod: z.enum(["cash", "credit_card", "debit_card", "bank_transfer", "digital_wallet", "other"]).default("cash"),
        notes: z.string().optional(),
        aiCategorized: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.createExpense({
          userId: ctx.user.id,
          categoryId: input.categoryId,
          amount: input.amount,
          description: input.description,
          date: input.date,
          merchant: input.merchant,
          paymentMethod: input.paymentMethod,
          notes: input.notes,
          aiCategorized: input.aiCategorized,
        });
        return result;
      }),

    list: protectedProcedure
      .input(z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getExpensesByUser(ctx.user.id, input.limit, input.offset);
      }),

    getById: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        const expense = await db.getExpenseById(input, ctx.user.id);
        if (!expense) throw new TRPCError({ code: "NOT_FOUND" });
        return expense;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        categoryId: z.number().optional(),
        amount: z.string().optional(),
        description: z.string().optional(),
        date: z.date().optional(),
        merchant: z.string().optional(),
        paymentMethod: z.enum(["cash", "credit_card", "debit_card", "bank_transfer", "digital_wallet", "other"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updateData } = input;
        await db.updateExpense(id, ctx.user.id, updateData);
        return await db.getExpenseById(id, ctx.user.id);
      }),

    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        await db.deleteExpense(input, ctx.user.id);
        return { success: true };
      }),

    getByDateRange: protectedProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getExpensesByDateRange(ctx.user.id, input.startDate, input.endDate);
      }),

    search: protectedProcedure
      .input(z.string())
      .query(async ({ ctx, input }) => {
        return await db.searchExpenses(ctx.user.id, input);
      }),

    getCategoryBreakdown: protectedProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getTotalExpensesByCategory(ctx.user.id, input.startDate, input.endDate);
      }),
  }),

  // ============= CATEGORY PROCEDURES =============
  categories: router({
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        color: z.string().default("#3B82F6"),
        icon: z.string().default("Tag"),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createExpenseCategory({
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          color: input.color,
          icon: input.icon,
          isSystem: false,
        });
      }),

    list: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getCategoriesByUser(ctx.user.id);
      }),

    getSystemCategories: publicProcedure
      .query(async () => {
        return await db.getSystemCategories();
      }),
  }),

  // ============= LOAN PROCEDURES =============
  loans: router({
    create: protectedProcedure
      .input(z.object({
        loanName: z.string(),
        loanType: z.enum(["personal", "auto", "home", "education", "credit_card", "other"]).default("personal"),
        principal: z.string(),
        interestRate: z.string(),
        loanStartDate: z.date(),
        loanEndDate: z.date().optional(),
        monthlyPayment: z.string(),
        paymentFrequency: z.enum(["weekly", "biweekly", "monthly", "quarterly"]).default("monthly"),
        nextPaymentDate: z.date().optional(),
        lender: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createLoan({
          userId: ctx.user.id,
          loanName: input.loanName,
          loanType: input.loanType,
          principal: input.principal,
          interestRate: input.interestRate,
          loanStartDate: input.loanStartDate,
          loanEndDate: input.loanEndDate,
          monthlyPayment: input.monthlyPayment,
          remainingBalance: input.principal,
          paymentFrequency: input.paymentFrequency,
          nextPaymentDate: input.nextPaymentDate,
          lender: input.lender,
          notes: input.notes,
          status: "active",
        });
      }),

    list: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getLoansByUser(ctx.user.id);
      }),

    getById: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        const loan = await db.getLoanById(input, ctx.user.id);
        if (!loan) throw new TRPCError({ code: "NOT_FOUND" });
        return loan;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        loanName: z.string().optional(),
        interestRate: z.string().optional(),
        monthlyPayment: z.string().optional(),
        remainingBalance: z.string().optional(),
        nextPaymentDate: z.date().optional(),
        status: z.enum(["active", "paid_off", "defaulted"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updateData } = input;
        await db.updateLoan(id, ctx.user.id, updateData);
        return await db.getLoanById(id, ctx.user.id);
      }),

    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        await db.deleteLoan(input, ctx.user.id);
        return { success: true };
      }),
  }),

  // ============= LOAN PAYMENT PROCEDURES =============
  loanPayments: router({
    create: protectedProcedure
      .input(z.object({
        loanId: z.number(),
        paymentAmount: z.string(),
        principalPaid: z.string(),
        interestPaid: z.string(),
        paymentDate: z.date(),
        dueDate: z.date().optional(),
        status: z.enum(["pending", "completed", "late", "missed"]).default("completed"),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify loan belongs to user
        const loan = await db.getLoanById(input.loanId, ctx.user.id);
        if (!loan) throw new TRPCError({ code: "FORBIDDEN" });

        return await db.createLoanPayment({
          loanId: input.loanId,
          paymentAmount: input.paymentAmount,
          principalPaid: input.principalPaid,
          interestPaid: input.interestPaid,
          paymentDate: input.paymentDate,
          dueDate: input.dueDate,
          status: input.status,
          notes: input.notes,
        });
      }),

    getByLoan: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        // Verify loan belongs to user
        const loan = await db.getLoanById(input, ctx.user.id);
        if (!loan) throw new TRPCError({ code: "FORBIDDEN" });

        return await db.getLoanPayments(input);
      }),
  }),

  // ============= BUDGET PROCEDURES =============
  budgets: router({
    create: protectedProcedure
      .input(z.object({
        categoryId: z.number(),
        month: z.string(), // YYYY-MM format
        budgetAmount: z.string(),
        alertThreshold: z.number().default(80),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createBudget({
          userId: ctx.user.id,
          categoryId: input.categoryId,
          month: input.month,
          budgetAmount: input.budgetAmount,
          alertThreshold: input.alertThreshold,
          notes: input.notes,
        });
      }),

    listByMonth: protectedProcedure
      .input(z.string())
      .query(async ({ ctx, input }) => {
        return await db.getBudgetsByUser(ctx.user.id, input);
      }),

    getById: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        const budget = await db.getBudgetById(input, ctx.user.id);
        if (!budget) throw new TRPCError({ code: "NOT_FOUND" });
        return budget;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        budgetAmount: z.string().optional(),
        alertThreshold: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updateData } = input;
        await db.updateBudget(id, ctx.user.id, updateData);
        return await db.getBudgetById(id, ctx.user.id);
      }),

    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        await db.deleteBudget(input, ctx.user.id);
        return { success: true };
      }),
  }),

  // ============= NOTIFICATION PROCEDURES =============
  notifications: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }))
      .query(async ({ ctx, input }) => {
        return await db.getNotificationsByUser(ctx.user.id, input.limit);
      }),

    getUnread: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getUnreadNotifications(ctx.user.id);
      }),

    markAsRead: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        await db.markNotificationAsRead(input);
        return { success: true };
      }),

    getPreferences: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getNotificationPreferences(ctx.user.id);
      }),

    updatePreferences: protectedProcedure
      .input(z.object({
        budgetExceededEnabled: z.boolean().optional(),
        budgetExceededThreshold: z.number().optional(),
        loanDueEnabled: z.boolean().optional(),
        loanDueDaysBefore: z.number().optional(),
        unusualSpendingEnabled: z.boolean().optional(),
        unusualSpendingThreshold: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createOrUpdateNotificationPreferences({
          userId: ctx.user.id,
          ...input,
        });
      }),
  }),

  // ============= RECEIPT PROCEDURES =============
  receipts: router({
    create: protectedProcedure
      .input(z.object({
        imageUrl: z.string(),
        extractedData: z.string(), // JSON string
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createReceipt({
          userId: ctx.user.id,
          imageUrl: input.imageUrl,
          extractedData: input.extractedData,
          extractionConfidence: "0.5",
          processingStatus: "pending",
        });
      }),

    list: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getReceiptsByUser(ctx.user.id);
      }),

    getById: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        const receipt = await db.getReceiptById(input, ctx.user.id);
        if (!receipt) throw new TRPCError({ code: "NOT_FOUND" });
        return receipt;
      }),
  }),

  // ============= FINANCIAL SUMMARY PROCEDURES =============
  summary: router({
    getFinancialOverview: protectedProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getFinancialSummary(ctx.user.id, input.startDate, input.endDate);
      }),
  }),
  // ============= EXPORT PROCEDURES =============
  exports: router({
    transactionCSV: protectedProcedure
      .input(z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const csv = await generateTransactionCSV(ctx.user.id, input.startDate, input.endDate);
        return { csv, filename: `transactions-${new Date().toISOString().split('T')[0]}.csv` };
      }),
    expenseReportCSV: protectedProcedure
      .input(z.object({
        month: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const csv = await generateExpenseReportCSV(ctx.user.id, input.month);
        return { csv, filename: `expense-report-${input.month || new Date().toISOString().split('T')[0]}.csv` };
      }),
    loanSummaryCSV: protectedProcedure
      .query(async ({ ctx }) => {
        const csv = await generateLoanSummaryCSV(ctx.user.id);
        return { csv, filename: `loan-summary-${new Date().toISOString().split('T')[0]}.csv` };
      }),
    budgetReportCSV: protectedProcedure
      .query(async ({ ctx }) => {
        const csv = await generateBudgetReportCSV(ctx.user.id);
        return { csv, filename: `budget-report-${new Date().toISOString().split('T')[0]}.csv` };
      }),
    financialReportPDF: protectedProcedure
      .input(z.object({
        month: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const pdfBuffer = await generateFinancialReportPDF(ctx.user.id, input.month);
        return { pdf: pdfBuffer.toString('base64'), filename: `financial-report-${input.month || new Date().toISOString().split('T')[0]}.pdf` };
      }),
    transactionHistoryPDF: protectedProcedure
      .input(z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const pdfBuffer = await generateTransactionHistoryPDF(ctx.user.id, input.startDate, input.endDate);
        return { pdf: pdfBuffer.toString('base64'), filename: `transaction-history-${new Date().toISOString().split('T')[0]}.pdf` };
      }),
  }),
});

export type AppRouter = typeof appRouter;
