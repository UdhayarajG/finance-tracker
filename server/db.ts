import { eq, and, gte, lte, like, desc, asc, sum, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, expenses, expenseCategories, loans, loanPayments, budgets, notifications, notificationPreferences, categoryLearning, receipts, userCurrencies, exchangeRates } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============= EXPENSE QUERIES =============

export async function createExpense(data: typeof expenses.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(expenses).values(data);
  return result;
}

export async function getExpensesByUser(userId: number, limit?: number, offset?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  let query = db.select().from(expenses).where(eq(expenses.userId, userId)).orderBy(desc(expenses.date)) as any;
  
  if (limit) query = query.limit(limit);
  if (offset) query = query.offset(offset);
  
  return await query;
}

export async function getExpenseById(expenseId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(expenses).where(
    and(eq(expenses.id, expenseId), eq(expenses.userId, userId))
  ).limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function updateExpense(expenseId: number, userId: number, data: Partial<typeof expenses.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(expenses).set({
    ...data,
    updatedAt: new Date(),
  }).where(
    and(eq(expenses.id, expenseId), eq(expenses.userId, userId))
  );
}

export async function deleteExpense(expenseId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(expenses).where(
    and(eq(expenses.id, expenseId), eq(expenses.userId, userId))
  );
}

export async function getExpensesByDateRange(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(expenses).where(
    and(
      eq(expenses.userId, userId),
      gte(expenses.date, startDate),
      lte(expenses.date, endDate)
    )
  ).orderBy(desc(expenses.date));
}

export async function searchExpenses(userId: number, query: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const searchTerm = `%${query}%`;
  return await db.select().from(expenses).where(
    and(
      eq(expenses.userId, userId),
      like(expenses.description, searchTerm)
    )
  ).orderBy(desc(expenses.date));
}

export async function getTotalExpensesByCategory(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select({
    categoryId: expenses.categoryId,
    total: sum(expenses.amount),
    count: count(),
  }).from(expenses).where(
    and(
      eq(expenses.userId, userId),
      gte(expenses.date, startDate),
      lte(expenses.date, endDate)
    )
  ).groupBy(expenses.categoryId);
}

// ============= CATEGORY QUERIES =============

export async function createExpenseCategory(data: typeof expenseCategories.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(expenseCategories).values(data);
}

export async function getCategoriesByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const userCategories = await db.select().from(expenseCategories).where(
    eq(expenseCategories.userId, userId)
  ).orderBy(asc(expenseCategories.name));
  
  const systemCategories = await db.select().from(expenseCategories).where(
    eq(expenseCategories.isSystem, true)
  ).orderBy(asc(expenseCategories.name));
  
  return [...systemCategories, ...userCategories];
}

export async function getSystemCategories() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(expenseCategories).where(
    eq(expenseCategories.isSystem, true)
  ).orderBy(asc(expenseCategories.name));
}

export async function getCategoryById(categoryId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(expenseCategories).where(
    eq(expenseCategories.id, categoryId)
  ).limit(1);
  
  return result.length > 0 ? result[0] : null;
}

// ============= LOAN QUERIES =============

export async function createLoan(data: typeof loans.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(loans).values(data);
}

export async function getLoansByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(loans).where(
    eq(loans.userId, userId)
  ).orderBy(desc(loans.createdAt));
}

export async function getLoanById(loanId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(loans).where(
    and(eq(loans.id, loanId), eq(loans.userId, userId))
  ).limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function updateLoan(loanId: number, userId: number, data: Partial<typeof loans.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(loans).set({
    ...data,
    updatedAt: new Date(),
  }).where(
    and(eq(loans.id, loanId), eq(loans.userId, userId))
  );
}

export async function deleteLoan(loanId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(loans).where(
    and(eq(loans.id, loanId), eq(loans.userId, userId))
  );
}

// ============= LOAN PAYMENT QUERIES =============

export async function createLoanPayment(data: typeof loanPayments.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(loanPayments).values(data);
}

export async function getLoanPayments(loanId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(loanPayments).where(
    eq(loanPayments.loanId, loanId)
  ).orderBy(desc(loanPayments.paymentDate));
}

// ============= BUDGET QUERIES =============

export async function createBudget(data: typeof budgets.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(budgets).values(data);
}

export async function getBudgetsByUser(userId: number, month?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  let query = db.select().from(budgets).where(eq(budgets.userId, userId)) as any;
  
  if (month) {
    query = query.where(eq(budgets.month, month));
  }
  
  return await query.orderBy(asc(budgets.month));
}

export async function getBudgetById(budgetId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(budgets).where(
    and(eq(budgets.id, budgetId), eq(budgets.userId, userId))
  ).limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function updateBudget(budgetId: number, userId: number, data: Partial<typeof budgets.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(budgets).set({
    ...data,
    updatedAt: new Date(),
  }).where(
    and(eq(budgets.id, budgetId), eq(budgets.userId, userId))
  );
}

export async function deleteBudget(budgetId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(budgets).where(
    and(eq(budgets.id, budgetId), eq(budgets.userId, userId))
  );
}

// ============= NOTIFICATION QUERIES =============

export async function createNotification(data: typeof notifications.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(notifications).values(data);
}

export async function getNotificationsByUser(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(notifications).where(
    eq(notifications.userId, userId)
  ).orderBy(desc(notifications.createdAt)).limit(limit);
}

export async function getUnreadNotifications(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(notifications).where(
    and(eq(notifications.userId, userId), eq(notifications.isRead, false))
  ).orderBy(desc(notifications.createdAt));
}

export async function markNotificationAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(notifications).set({
    isRead: true,
    readAt: new Date(),
  }).where(eq(notifications.id, notificationId));
}

export async function getNotificationPreferences(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(notificationPreferences).where(
    eq(notificationPreferences.userId, userId)
  ).limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function createOrUpdateNotificationPreferences(data: typeof notificationPreferences.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(notificationPreferences).values(data).onDuplicateKeyUpdate({
    set: data,
  });
}

// ============= CATEGORY LEARNING QUERIES =============

export async function recordCategoryLearning(data: typeof categoryLearning.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(categoryLearning).values(data);
}

export async function getCategoryLearningByDescriptionAndMerchant(userId: number, description: string, merchant?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  let query = db.select().from(categoryLearning).where(
    and(
      eq(categoryLearning.userId, userId),
      like(categoryLearning.description, `%${description}%`)
    )
  ) as any;
  
  if (merchant) {
    query = query.where(like(categoryLearning.merchant, `%${merchant}%`));
  }
  
  return await query.orderBy(desc(categoryLearning.confidence));
}

// ============= RECEIPT QUERIES =============

export async function createReceipt(data: typeof receipts.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(receipts).values(data);
}

export async function getReceiptsByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(receipts).where(
    eq(receipts.userId, userId)
  ).orderBy(desc(receipts.createdAt));
}

export async function getReceiptById(receiptId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(receipts).where(
    and(eq(receipts.id, receiptId), eq(receipts.userId, userId))
  ).limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function updateReceipt(receiptId: number, data: Partial<typeof receipts.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(receipts).set({
    ...data,
    updatedAt: new Date(),
  }).where(eq(receipts.id, receiptId));
}

// ============= FINANCIAL SUMMARY QUERIES =============

export async function getFinancialSummary(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Total expenses
  const expenseResult = await db.select({
    total: sum(expenses.amount),
  }).from(expenses).where(
    and(
      eq(expenses.userId, userId),
      gte(expenses.date, startDate),
      lte(expenses.date, endDate)
    )
  );
  
  const totalExpenses = expenseResult[0]?.total ? parseFloat(expenseResult[0].total.toString()) : 0;
  
  // Total loans
  const userLoans = await db.select({
    total: sum(loans.remainingBalance),
  }).from(loans).where(
    and(
      eq(loans.userId, userId),
      eq(loans.status, "active")
    )
  );
  
  const totalLoans = userLoans[0]?.total ? parseFloat(userLoans[0].total.toString()) : 0;
  
  return {
    totalExpenses,
    totalLoans,
    netFinancialPosition: -totalExpenses - totalLoans,
  };
}


// ============= MULTI-CURRENCY QUERIES =============

export async function getUserCurrency(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(userCurrencies).where(
    eq(userCurrencies.userId, userId)
  ).limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function upsertUserCurrency(data: {
  userId: number;
  baseCurrency: string;
  displayCurrency: string;
  autoConvert: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getUserCurrency(data.userId);
  
  if (existing) {
    return await db.update(userCurrencies).set({
      baseCurrency: data.baseCurrency,
      displayCurrency: data.displayCurrency,
      autoConvert: data.autoConvert,
      updatedAt: new Date(),
    }).where(eq(userCurrencies.userId, data.userId));
  } else {
    return await db.insert(userCurrencies).values({
      userId: data.userId,
      baseCurrency: data.baseCurrency,
      displayCurrency: data.displayCurrency,
      autoConvert: data.autoConvert,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

export async function getExchangeRateFromCache(fromCurrency: string, toCurrency: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(exchangeRates).where(
    and(
      eq(exchangeRates.fromCurrency, fromCurrency),
      eq(exchangeRates.toCurrency, toCurrency)
    )
  ).orderBy(desc(exchangeRates.timestamp)).limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function cacheExchangeRate(fromCurrency: string, toCurrency: string, rate: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(exchangeRates).values({
    fromCurrency,
    toCurrency,
    rate: rate.toString(),
    timestamp: new Date(),
    source: "external_api",
    createdAt: new Date(),
  });
}

export async function getAllCurrencyPairs() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get all unique currency pairs from expenses and loans
  const pairs: Array<{ fromCurrency: string; toCurrency: string }> = [];
  
  // Get unique currencies from expenses
  const expenseCurrencies = await db.select({
    currency: expenses.currency,
  }).from(expenses).where(
    eq(expenses.currency, "USD") // Placeholder - would need distinct
  );
  
  // For now, return empty array - in production, would aggregate from all transactions
  return pairs;
}
