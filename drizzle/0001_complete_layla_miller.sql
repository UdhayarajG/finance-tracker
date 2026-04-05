CREATE TABLE `budgets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`categoryId` int NOT NULL,
	`month` varchar(7) NOT NULL,
	`budgetAmount` decimal(12,2) NOT NULL,
	`alertThreshold` int NOT NULL DEFAULT 80,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `budgets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `category_learning` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`description` varchar(255) NOT NULL,
	`merchant` varchar(255),
	`categoryId` int NOT NULL,
	`confidence` decimal(3,2) NOT NULL DEFAULT '0.5',
	`correctionCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `category_learning_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expense_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`color` varchar(7) NOT NULL DEFAULT '#3B82F6',
	`icon` varchar(50) NOT NULL DEFAULT 'Tag',
	`isSystem` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expense_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`categoryId` int NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`description` varchar(255) NOT NULL,
	`date` timestamp NOT NULL,
	`merchant` varchar(255),
	`paymentMethod` enum('cash','credit_card','debit_card','bank_transfer','digital_wallet','other') NOT NULL DEFAULT 'cash',
	`receiptUrl` varchar(500),
	`receiptData` longtext,
	`notes` text,
	`isRecurring` boolean NOT NULL DEFAULT false,
	`recurringFrequency` enum('daily','weekly','monthly','yearly'),
	`aiCategorized` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `loan_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`loanId` int NOT NULL,
	`paymentAmount` decimal(12,2) NOT NULL,
	`principalPaid` decimal(12,2) NOT NULL,
	`interestPaid` decimal(12,2) NOT NULL,
	`paymentDate` timestamp NOT NULL,
	`dueDate` timestamp,
	`status` enum('pending','completed','late','missed') NOT NULL DEFAULT 'pending',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `loan_payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `loans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`loanName` varchar(255) NOT NULL,
	`loanType` enum('personal','auto','home','education','credit_card','other') NOT NULL DEFAULT 'personal',
	`principal` decimal(12,2) NOT NULL,
	`interestRate` decimal(5,2) NOT NULL,
	`loanStartDate` timestamp NOT NULL,
	`loanEndDate` timestamp,
	`monthlyPayment` decimal(12,2) NOT NULL,
	`remainingBalance` decimal(12,2) NOT NULL,
	`paymentFrequency` enum('weekly','biweekly','monthly','quarterly') NOT NULL DEFAULT 'monthly',
	`nextPaymentDate` timestamp,
	`lender` varchar(255),
	`accountNumber` varchar(100),
	`notes` text,
	`status` enum('active','paid_off','defaulted') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `loans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`budgetExceededEnabled` boolean NOT NULL DEFAULT true,
	`budgetExceededThreshold` int NOT NULL DEFAULT 80,
	`loanDueEnabled` boolean NOT NULL DEFAULT true,
	`loanDueDaysBefore` int NOT NULL DEFAULT 3,
	`unusualSpendingEnabled` boolean NOT NULL DEFAULT true,
	`unusualSpendingThreshold` decimal(12,2) NOT NULL DEFAULT '500.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_preferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('budget_exceeded','loan_due','unusual_spending','expense_added','system') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`relatedEntityId` int,
	`relatedEntityType` enum('expense','loan','budget'),
	`isRead` boolean NOT NULL DEFAULT false,
	`actionUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`readAt` timestamp,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `receipts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`expenseId` int,
	`imageUrl` varchar(500) NOT NULL,
	`extractedData` longtext NOT NULL,
	`extractionConfidence` decimal(3,2) NOT NULL,
	`processingStatus` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `receipts_id` PRIMARY KEY(`id`)
);
