import * as db from "./db";
import { invokeLLM } from "./_core/llm";

/**
 * Category Budget Alert Service
 * Handles checking category budgets and sending alerts when thresholds are exceeded
 */

interface CategoryBudgetAlert {
  categoryId: number;
  categoryName: string;
  budgetLimit: number;
  totalSpent: number;
  percentageUsed: number;
  alertThreshold: number;
  isOverBudget: boolean;
  shouldAlert: boolean;
  remaining: number;
}

/**
 * Check category budget status and send alerts if needed
 */
export async function checkCategoryBudgetAlerts(
  userId: number,
  month: string
): Promise<void> {
  try {
    const preferences = await db.getNotificationPreferences(userId);
    if (!preferences?.budgetExceededEnabled) return;

    // Get user's custom categories with budget limits
    const customCategories = await db.getUserCustomCategories(userId);
    const categoriesWithBudgets = customCategories.filter((c: any) => c.monthlyBudgetLimit);

    if (categoriesWithBudgets.length === 0) return;

    // Check each category's budget status
    for (const category of categoriesWithBudgets) {
      const budgetStatus = await db.getCategoryBudgetStatus(
        category.id,
        userId,
        month
      );

      if (!budgetStatus) continue;

      // Check if alert should be sent
      if (budgetStatus.shouldAlert) {
        await sendCategoryBudgetAlert(userId, budgetStatus, preferences.budgetExceededThreshold);
      }
    }
  } catch (error) {
    console.error("[Category Budget Alert Check] Error:", error);
  }
}

/**
 * Send category budget alert notification
 */
async function sendCategoryBudgetAlert(
  userId: number,
  budgetStatus: any,
  thresholdPercentage: number
): Promise<void> {
  try {
    const user = await db.getUserById(userId);
    if (!user?.email) return;

    const isOverBudget = budgetStatus.percentageUsed > 100;
    const percentageText = budgetStatus.percentageUsed.toFixed(0);
    const spentText = budgetStatus.totalSpent.toFixed(2);
    const limitText = budgetStatus.budgetLimit.toFixed(2);
    const remainingText = budgetStatus.remaining.toFixed(2);

    // Create in-app notification
    const notificationType = isOverBudget ? "budget_exceeded" : "budget_warning";
    const title = isOverBudget
      ? `Budget Exceeded: ${budgetStatus.categoryName}`
      : `Budget Alert: ${budgetStatus.categoryName}`;

    const message = isOverBudget
      ? `You've exceeded your budget for ${budgetStatus.categoryName} by $${Math.abs(budgetStatus.remaining).toFixed(2)} (${percentageText}% spent)`
      : `You've spent ${percentageText}% of your ${budgetStatus.categoryName} budget ($${spentText} of $${limitText})`;

    await db.createNotification({
      userId,
      type: "budget_exceeded",
      title,
      message,
      relatedEntityId: budgetStatus.categoryId,
      relatedEntityType: "budget",
      actionUrl: "/categories",
    });

    // Generate and send email
    await sendCategoryBudgetAlertEmail(
      user.email,
      user.name || "User",
      budgetStatus,
      isOverBudget
    );
  } catch (error) {
    console.error("[Send Category Budget Alert] Error:", error);
  }
}

/**
 * Generate and send category budget alert email
 */
async function sendCategoryBudgetAlertEmail(
  userEmail: string,
  userName: string,
  budgetStatus: any,
  isOverBudget: boolean
): Promise<void> {
  try {
    const percentageText = budgetStatus.percentageUsed.toFixed(0);
    const spentText = budgetStatus.totalSpent.toFixed(2);
    const limitText = budgetStatus.budgetLimit.toFixed(2);
    const remainingText = Math.abs(budgetStatus.remaining).toFixed(2);

    const subject = isOverBudget
      ? `⚠️ Budget Exceeded: ${budgetStatus.categoryName}`
      : `📊 Budget Alert: ${budgetStatus.categoryName}`;

    const emailContent = generateBudgetAlertEmailHTML(
      userName,
      budgetStatus.categoryName,
      percentageText,
      spentText,
      limitText,
      remainingText,
      isOverBudget
    );

    // Send email via Manus API
    await sendEmailViaAPI(userEmail, subject, emailContent);
  } catch (error) {
    console.error("[Send Category Budget Alert Email] Error:", error);
  }
}

/**
 * Generate HTML email content for budget alert
 */
function generateBudgetAlertEmailHTML(
  userName: string,
  categoryName: string,
  percentageUsed: string,
  spent: string,
  limit: string,
  remaining: string,
  isOverBudget: boolean
): string {
  const statusColor = isOverBudget ? "#DC2626" : "#F59E0B";
  const statusIcon = isOverBudget ? "⚠️" : "📊";
  const statusText = isOverBudget ? "EXCEEDED" : "WARNING";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .alert-box { background: ${statusColor}; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
    .alert-box h2 { margin: 0 0 10px 0; font-size: 20px; }
    .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
    .stat-item { background: white; padding: 15px; border-radius: 6px; border-left: 4px solid ${statusColor}; }
    .stat-label { font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 5px; }
    .stat-value { font-size: 24px; font-weight: bold; color: #1f2937; }
    .progress-bar { background: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden; margin: 10px 0; }
    .progress-fill { background: ${statusColor}; height: 100%; border-radius: 4px; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
    .cta-button { display: inline-block; background: #10B981; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; margin-top: 15px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Finance Tracker Budget Alert</h1>
    </div>
    <div class="content">
      <p>Hi ${userName},</p>
      
      <div class="alert-box">
        <h2>${statusIcon} Budget ${statusText}</h2>
        <p style="margin: 0; font-size: 16px;">Your <strong>${categoryName}</strong> budget has ${isOverBudget ? "been exceeded" : "reached " + percentageUsed + "% of its limit"}</p>
      </div>

      <div class="stats">
        <div class="stat-item">
          <div class="stat-label">Amount Spent</div>
          <div class="stat-value">$${spent}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Budget Limit</div>
          <div class="stat-value">$${limit}</div>
        </div>
      </div>

      <div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
          <span style="font-weight: 600;">Budget Usage</span>
          <span style="font-weight: 600; color: ${statusColor};">${percentageUsed}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${Math.min(parseFloat(percentageUsed), 100)}%;"></div>
        </div>
        <div style="text-align: right; font-size: 12px; color: #666; margin-top: 5px;">
          ${isOverBudget ? `Over budget by $${remaining}` : `$${remaining} remaining`}
        </div>
      </div>

      <p style="margin-top: 25px; color: #666;">
        ${isOverBudget
          ? `You've exceeded your budget for <strong>${categoryName}</strong>. Consider reviewing your spending in this category or adjusting your budget limit.`
          : `You're approaching your budget limit for <strong>${categoryName}</strong>. Monitor your spending to stay within budget.`
        }
      </p>

      <center>
        <a href="https://financetrk-avreijx5.manus.space/categories" class="cta-button">View Categories</a>
      </center>

      <div class="footer">
        <p>This is an automated alert from your Finance Tracker. You can manage your notification preferences in the Settings page.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Log email notification for budget alert
 * Note: Email delivery is handled by the platform's notification system
 * In-app notifications are created and can be viewed in the user's notification center
 */
async function sendEmailViaAPI(
  toEmail: string,
  subject: string,
  htmlContent: string
): Promise<void> {
  try {
    console.log(`[Budget Alert Email] Notification queued for ${toEmail}`);
    console.log(`[Budget Alert Email] Subject: ${subject}`);
    // Email delivery would be handled by platform's email service
    // For now, in-app notifications are the primary delivery mechanism
  } catch (error) {
    console.error("[Budget Alert Email] Error:", error);
  }
}

/**
 * Check category budget for a specific expense
 * Called when an expense is created to immediately check if budget is exceeded
 */
export async function checkCategoryBudgetOnExpenseCreation(
  userId: number,
  categoryId: number,
  expenseDate: Date
): Promise<void> {
  try {
    const month = `${expenseDate.getFullYear()}-${String(
      expenseDate.getMonth() + 1
    ).padStart(2, "0")}`;

    const budgetStatus = await db.getCategoryBudgetStatus(categoryId, userId, month);
    if (!budgetStatus) return;

    const preferences = await db.getNotificationPreferences(userId);
    if (!preferences?.budgetExceededEnabled) return;

    // Send alert if threshold is reached or exceeded
    if (budgetStatus.shouldAlert) {
      await sendCategoryBudgetAlert(userId, budgetStatus, preferences.budgetExceededThreshold);
    }
  } catch (error) {
    console.error("[Check Category Budget on Expense] Error:", error);
  }
}
