import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, longtext } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  avatarUrl: text("avatarUrl"),
  bio: text("bio"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * User currency preferences and base currency
 */
export const userCurrencies = mysqlTable("user_currencies", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  baseCurrency: varchar("baseCurrency", { length: 3 }).default("USD").notNull(), // ISO 4217 code
  displayCurrency: varchar("displayCurrency", { length: 3 }).default("USD").notNull(), // Currency for display
  autoConvert: boolean("autoConvert").default(true).notNull(), // Auto-convert to base currency
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserCurrency = typeof userCurrencies.$inferSelect;
export type InsertUserCurrency = typeof userCurrencies.$inferInsert;

/**
 * Exchange rates cache for performance
 */
export const exchangeRates = mysqlTable("exchange_rates", {
  id: int("id").autoincrement().primaryKey(),
  fromCurrency: varchar("fromCurrency", { length: 3 }).notNull(),
  toCurrency: varchar("toCurrency", { length: 3 }).notNull(),
  rate: decimal("rate", { precision: 18, scale: 8 }).notNull(),
  timestamp: timestamp("timestamp").notNull(),
  source: varchar("source", { length: 50 }).default("external_api").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type InsertExchangeRate = typeof exchangeRates.$inferInsert;

/**
 * Expense categories with user-defined and system categories
 */
export const expenseCategories = mysqlTable("expense_categories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#3B82F6").notNull(), // Hex color
  icon: varchar("icon", { length: 50 }).default("Tag").notNull(), // Lucide icon name
  isSystem: boolean("isSystem").default(false).notNull(), // True for default categories
  monthlyBudgetLimit: decimal("monthlyBudgetLimit", { precision: 12, scale: 2 }), // Optional monthly limit
  budgetAlertThreshold: int("budgetAlertThreshold").default(80), // Percentage (0-100) for alerts
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type InsertExpenseCategory = typeof expenseCategories.$inferInsert;

/**
 * Expense transactions
 */
export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  categoryId: int("categoryId").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(), // ISO 4217 code
  amountInBaseCurrency: decimal("amountInBaseCurrency", { precision: 12, scale: 2 }), // Converted to user's base currency
  exchangeRate: decimal("exchangeRate", { precision: 18, scale: 8 }), // Rate used for conversion
  description: varchar("description", { length: 255 }).notNull(),
  date: timestamp("date").notNull(), // Transaction date
  merchant: varchar("merchant", { length: 255 }),
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "credit_card", "debit_card", "bank_transfer", "digital_wallet", "other"]).default("cash").notNull(),
  receiptUrl: varchar("receiptUrl", { length: 500 }), // S3 URL to receipt image
  receiptData: longtext("receiptData"), // JSON: extracted data from receipt
  notes: text("notes"),
  isRecurring: boolean("isRecurring").default(false).notNull(),
  recurringFrequency: mysqlEnum("recurringFrequency", ["daily", "weekly", "monthly", "yearly"]),
  aiCategorized: boolean("aiCategorized").default(false).notNull(), // True if auto-categorized by LLM
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

/**
 * Loans tracking
 */
export const loans = mysqlTable("loans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  loanName: varchar("loanName", { length: 255 }).notNull(),
  loanType: mysqlEnum("loanType", ["personal", "auto", "home", "education", "credit_card", "other"]).default("personal").notNull(),
  principal: decimal("principal", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(), // ISO 4217 code
  interestRate: decimal("interestRate", { precision: 5, scale: 2 }).notNull(), // Annual percentage rate
  loanStartDate: timestamp("loanStartDate").notNull(),
  loanEndDate: timestamp("loanEndDate"), // Expected payoff date
  monthlyPayment: decimal("monthlyPayment", { precision: 12, scale: 2 }).notNull(),
  remainingBalance: decimal("remainingBalance", { precision: 12, scale: 2 }).notNull(),
  paymentFrequency: mysqlEnum("paymentFrequency", ["weekly", "biweekly", "monthly", "quarterly"]).default("monthly").notNull(),
  nextPaymentDate: timestamp("nextPaymentDate"),
  lender: varchar("lender", { length: 255 }),
  accountNumber: varchar("accountNumber", { length: 100 }), // Encrypted in production
  notes: text("notes"),
  status: mysqlEnum("status", ["active", "paid_off", "defaulted"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Loan = typeof loans.$inferSelect;
export type InsertLoan = typeof loans.$inferInsert;

/**
 * Loan payments tracking
 */
export const loanPayments = mysqlTable("loan_payments", {
  id: int("id").autoincrement().primaryKey(),
  loanId: int("loanId").notNull(),
  paymentAmount: decimal("paymentAmount", { precision: 12, scale: 2 }).notNull(),
  principalPaid: decimal("principalPaid", { precision: 12, scale: 2 }).notNull(),
  interestPaid: decimal("interestPaid", { precision: 12, scale: 2 }).notNull(),
  paymentDate: timestamp("paymentDate").notNull(),
  dueDate: timestamp("dueDate"),
  status: mysqlEnum("status", ["pending", "completed", "late", "missed"]).default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LoanPayment = typeof loanPayments.$inferSelect;
export type InsertLoanPayment = typeof loanPayments.$inferInsert;

/**
 * Monthly budgets
 */
export const budgets = mysqlTable("budgets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  categoryId: int("categoryId").notNull(),
  month: varchar("month", { length: 7 }).notNull(), // YYYY-MM format
  budgetAmount: decimal("budgetAmount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(), // ISO 4217 code
  alertThreshold: int("alertThreshold").default(80).notNull(), // Percentage (0-100)
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = typeof budgets.$inferInsert;

/**
 * Category learning data for AI categorization
 */
export const categoryLearning = mysqlTable("category_learning", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  merchant: varchar("merchant", { length: 255 }),
  categoryId: int("categoryId").notNull(),
  confidence: decimal("confidence", { precision: 3, scale: 2 }).default("0.5").notNull(), // 0-1 scale
  correctionCount: int("correctionCount").default(0).notNull(), // Times user corrected this
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CategoryLearning = typeof categoryLearning.$inferSelect;
export type InsertCategoryLearning = typeof categoryLearning.$inferInsert;

/**
 * Notifications and alerts
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["budget_exceeded", "loan_due", "unusual_spending", "expense_added", "system"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  relatedEntityId: int("relatedEntityId"), // ID of expense, loan, or budget
  relatedEntityType: mysqlEnum("relatedEntityType", ["expense", "loan", "budget"]),
  isRead: boolean("isRead").default(false).notNull(),
  actionUrl: varchar("actionUrl", { length: 500 }), // Link to relevant page
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  readAt: timestamp("readAt"),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Notification preferences
 */
export const notificationPreferences = mysqlTable("notification_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  budgetExceededEnabled: boolean("budgetExceededEnabled").default(true).notNull(),
  budgetExceededThreshold: int("budgetExceededThreshold").default(80).notNull(), // Percentage
  loanDueEnabled: boolean("loanDueEnabled").default(true).notNull(),
  loanDueDaysBefore: int("loanDueDaysBefore").default(3).notNull(), // Days before due date
  unusualSpendingEnabled: boolean("unusualSpendingEnabled").default(true).notNull(),
  unusualSpendingThreshold: decimal("unusualSpendingThreshold", { precision: 12, scale: 2 }).default("500.00").notNull(), // Amount threshold
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;

/**
 * Receipt metadata and extraction results
 */
export const receipts = mysqlTable("receipts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  expenseId: int("expenseId"), // Link to created expense
  imageUrl: varchar("imageUrl", { length: 500 }).notNull(), // S3 URL
  extractedData: longtext("extractedData").notNull(), // JSON: {amount, merchant, date, category, items}
  extractionConfidence: decimal("extractionConfidence", { precision: 3, scale: 2 }).notNull(), // 0-1 scale
  processingStatus: mysqlEnum("processingStatus", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Receipt = typeof receipts.$inferSelect;
export type InsertReceipt = typeof receipts.$inferInsert;
