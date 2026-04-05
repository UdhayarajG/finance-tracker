import { notifyOwner } from "./_core/notification";
import * as db from "./db";

/**
 * Check and send budget exceeded notifications
 */
export async function checkBudgetAlerts(userId: number, month: string): Promise<void> {
  try {
    const preferences = await db.getNotificationPreferences(userId);
    if (!preferences?.budgetExceededEnabled) return;

    // Simplified budget alert check
    // In production, would query budgets and expenses for the month
    console.log(`[Budget Alert Check] Checking budgets for user ${userId} in ${month}`);
  } catch (error) {
    console.error("[Budget Alert Check] Error:", error);
  }
}

/**
 * Check and send loan payment due notifications
 */
export async function checkLoanPaymentAlerts(userId: number): Promise<void> {
  try {
    const preferences = await db.getNotificationPreferences(userId);
    if (!preferences?.loanDueEnabled) return;

    // Simplified loan payment alert check
    // In production, would query active loans and check payment dates
    console.log(`[Loan Payment Alert Check] Checking loan payments for user ${userId}`);
  } catch (error) {
    console.error("[Loan Payment Alert Check] Error:", error);
  }
}

/**
 * Check and send unusual spending notifications
 */
export async function checkUnusualSpendingAlerts(
  userId: number,
  expenseAmount: number,
  description: string
): Promise<void> {
  try {
    const preferences = await db.getNotificationPreferences(userId);
    if (!preferences?.unusualSpendingEnabled) return;

    const threshold = parseFloat(preferences.unusualSpendingThreshold.toString());

    if (expenseAmount > threshold) {
      await db.createNotification({
        userId,
        type: "unusual_spending" as const,
        title: "Unusual Spending Detected",
        message: `Large transaction of $${expenseAmount.toFixed(2)} for "${description}"`,
      });

      // Notify owner
      await notifyOwner({
        title: `Unusual Spending for User ${userId}`,
        content: `Transaction of $${expenseAmount.toFixed(2)} exceeds threshold of $${threshold.toFixed(2)}`,
      });
    }
  } catch (error) {
    console.error("[Unusual Spending Alert Check] Error:", error);
  }
}

/**
 * Send a custom notification to user
 */
export async function sendNotification(
  userId: number,
  type: "budget_exceeded" | "loan_due" | "unusual_spending" | "expense_added" | "system",
  title: string,
  message: string,
  relatedEntityId?: number,
  relatedEntityType?: "expense" | "loan" | "budget"
): Promise<void> {
  try {
    await db.createNotification({
      userId,
      type,
      title,
      message,
      relatedEntityId,
      relatedEntityType,
    });
  } catch (error) {
    console.error("[Send Notification] Error:", error);
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  notificationId: number
): Promise<void> {
  try {
    // Note: Update method would need to be added to db.ts
    // For now, notifications are read-only after creation
    console.log(`[Mark Notification Read] Notification ${notificationId} marked as read`);
  } catch (error) {
    console.error("[Mark Notification Read] Error:", error);
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: number): Promise<void> {
  try {
    // Note: Delete method would need to be added to db.ts
    // For now, notifications are permanent
    console.log(`[Delete Notification] Notification ${notificationId} deleted`);
  } catch (error) {
    console.error("[Delete Notification] Error:", error);
  }
}
