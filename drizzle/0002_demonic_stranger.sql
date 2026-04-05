CREATE TABLE `exchange_rates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fromCurrency` varchar(3) NOT NULL,
	`toCurrency` varchar(3) NOT NULL,
	`rate` decimal(18,8) NOT NULL,
	`timestamp` timestamp NOT NULL,
	`source` varchar(50) NOT NULL DEFAULT 'external_api',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exchange_rates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_currencies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`baseCurrency` varchar(3) NOT NULL DEFAULT 'USD',
	`displayCurrency` varchar(3) NOT NULL DEFAULT 'USD',
	`autoConvert` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_currencies_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_currencies_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `budgets` ADD `currency` varchar(3) DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE `expenses` ADD `currency` varchar(3) DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE `expenses` ADD `amountInBaseCurrency` decimal(12,2);--> statement-breakpoint
ALTER TABLE `expenses` ADD `exchangeRate` decimal(18,8);--> statement-breakpoint
ALTER TABLE `loans` ADD `currency` varchar(3) DEFAULT 'USD' NOT NULL;