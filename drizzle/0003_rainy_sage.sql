ALTER TABLE `expense_categories` ADD `monthlyBudgetLimit` decimal(12,2);--> statement-breakpoint
ALTER TABLE `expense_categories` ADD `budgetAlertThreshold` int DEFAULT 80;