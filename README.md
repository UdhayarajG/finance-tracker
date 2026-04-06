# Personal Finance Tracker

A comprehensive web application for tracking daily expenses, managing loans, and monitoring overall financial health with real-time exchange rates and AI-powered insights.

## Features

### 💰 Expense Tracking
- Record daily expenses with categories, amounts, dates, and descriptions
- Support for multiple currencies with real-time exchange rate conversion
- Transaction history with advanced filtering and search capabilities
- Payment method tracking (cash, credit card, debit card, bank transfer, digital wallet)
- Merchant information and detailed notes for each transaction

### 📋 Loan Management
- Track multiple active loans with principal, interest rate, and payment schedules
- Monitor remaining balance and payment progress
- Automatic payment due date tracking
- Support for different loan types and lenders
- Multi-currency loan support

### 💳 Budget Management
- Set budgets for different expense categories
- Track actual spending against budgeted amounts
- Visual progress indicators showing budget utilization
- Budget alerts when spending approaches or exceeds limits

### 📊 Financial Reports & Analytics
- Monthly and yearly expense reports with category breakdowns
- Interactive charts showing expense trends and patterns
- Loan payment progress visualization
- Financial summary dashboard with net position calculation
- Category-wise spending analysis

### 🤖 AI-Powered Features
- Automatic expense categorization using LLM analysis
- Learning from user corrections to improve accuracy over time
- Receipt image upload with OCR for automatic expense extraction
- Merchant and amount detection from receipt images
- Unusual spending pattern detection

### 🔔 Notifications & Alerts
- Budget threshold notifications when spending exceeds limits
- Loan payment due date reminders
- Unusual spending pattern alerts
- Customizable notification preferences
- Notification history and read status tracking

### 💱 Multi-Currency Support
- Support for 30+ currencies (USD, EUR, GBP, JPY, AUD, CAD, CHF, CNY, INR, MXN, SGD, HKD, NZD, SEK, NOK, DKK, ZAR, BRL, RUB, KRW, THB, MYR, PHP, IDR, VND, PKR, BDT, LKR, AED, SAR)
- Real-time exchange rate integration
- 24-hour rate caching for performance
- Automatic currency conversion for reporting
- Base currency selection for financial summaries

## Tech Stack

### Frontend
- **React 19** - Modern UI framework with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling with OKLCH colors
- **Recharts** - Interactive data visualization
- **shadcn/ui** - High-quality UI components
- **Wouter** - Lightweight routing library
- **React Hook Form** - Efficient form handling
- **Zod** - Schema validation

### Backend
- **Express 4** - Lightweight web server
- **tRPC 11** - End-to-end type-safe APIs
- **Drizzle ORM** - Type-safe database access
- **MySQL/TiDB** - Relational database
- **Node.js** - JavaScript runtime

### Additional Services
- **Manus OAuth** - User authentication
- **LLM Integration** - AI-powered categorization
- **Exchange Rate API** - Real-time currency conversion
- **Image Recognition** - Receipt OCR and parsing

## Project Structure

```
finance-tracker/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── pages/         # Page components (Home, Expenses, Loans, etc.)
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React contexts (Theme, etc.)
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility libraries (tRPC client)
│   │   ├── App.tsx        # Main app component with routing
│   │   ├── main.tsx       # Entry point
│   │   └── index.css      # Global styles
│   └── public/            # Static assets
├── server/                # Backend Express application
│   ├── routers.ts         # tRPC procedure definitions
│   ├── db.ts              # Database query helpers
│   ├── ai-categorization.ts    # LLM integration
│   ├── exchange-rate-service.ts # Currency conversion
│   ├── notification-service.ts  # Alert system
│   └── _core/             # Framework infrastructure
├── drizzle/               # Database schema and migrations
│   └── schema.ts          # Table definitions
├── shared/                # Shared types and constants
├── storage/               # S3 file storage helpers
└── package.json           # Dependencies and scripts
```

## Database Schema

### Core Tables
- **users** - User accounts and authentication
- **expenses** - Daily expense transactions with multi-currency support
- **loans** - Loan tracking with payment schedules
- **budgets** - Budget definitions and thresholds
- **categories** - Expense categories (system and user-defined)
- **notifications** - Alert history and status
- **notification_preferences** - User alert settings
- **receipts** - Receipt metadata and OCR results
- **user_currencies** - User currency preferences
- **exchange_rates** - Cached exchange rate data

## Getting Started

### Prerequisites
- Node.js 22.13.0 or higher
- pnpm 10.4.1 or higher
- MySQL 8.0+ or TiDB

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/UdhayarajG/finance-tracker.git
   cd finance-tracker
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Configure the following variables:
   - `DATABASE_URL` - MySQL/TiDB connection string
   - `JWT_SECRET` - Session signing secret
   - `VITE_APP_ID` - OAuth application ID
   - `OAUTH_SERVER_URL` - OAuth server URL
   - `VITE_OAUTH_PORTAL_URL` - OAuth portal URL

4. **Initialize the database**
   ```bash
   pnpm db:push
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

   The application will be available at `http://localhost:3000`

## Available Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production
- `pnpm start` - Run production build
- `pnpm check` - TypeScript type checking
- `pnpm format` - Format code with Prettier
- `pnpm test` - Run test suite with Vitest
- `pnpm db:push` - Generate and run database migrations

## API Documentation

### tRPC Procedures

#### Expenses
- `expenses.create` - Create new expense
- `expenses.list` - List expenses with pagination
- `expenses.getByDateRange` - Get expenses within date range
- `expenses.getCategoryBreakdown` - Get spending by category
- `expenses.update` - Update expense details
- `expenses.delete` - Delete expense

#### Loans
- `loans.create` - Create new loan
- `loans.list` - List all loans
- `loans.update` - Update loan details
- `loans.delete` - Delete loan
- `loans.recordPayment` - Record loan payment

#### Budgets
- `budgets.create` - Create budget
- `budgets.list` - List budgets
- `budgets.update` - Update budget
- `budgets.delete` - Delete budget

#### Categories
- `categories.list` - List all categories
- `categories.create` - Create custom category

#### Notifications
- `notifications.getUnread` - Get unread notifications
- `notifications.getPreferences` - Get notification settings
- `notifications.updatePreferences` - Update notification settings

#### Currency
- `currency.getUserCurrency` - Get user's base currency
- `currency.setUserCurrency` - Set user's base currency
- `currency.getExchangeRate` - Get exchange rate between currencies
- `currency.convertAmount` - Convert amount between currencies
- `currency.getSupportedCurrencies` - List supported currencies

#### Authentication
- `auth.me` - Get current user
- `auth.logout` - Logout user

## Design System

### Color Palette (OKLCH)
- **Primary**: Blue (#3B82F6)
- **Success/Income**: Green (#10B981)
- **Warning/Expense**: Red (#EF4444)
- **Info/Loan**: Purple (#8B5CF6)
- **Accent/Budget**: Orange (#F59E0B)

### Typography
- **Headings**: Plus Jakarta Sans (600-700 weight)
- **Body**: Inter (400-500 weight)
- **Monospace**: Fira Code (for data display)

### Spacing & Radius
- **Base Unit**: 4px
- **Border Radius**: 8px (standard), 12px (cards)
- **Shadows**: Soft shadows with blur and opacity

## Testing

Run the test suite:
```bash
pnpm test
```

Tests cover:
- Backend procedure logic
- Database operations
- Authentication flows
- Notification system
- Financial calculations

## Performance Optimizations

- Exchange rate caching (24-hour TTL)
- Optimistic UI updates for instant feedback
- Lazy loading for reports and analytics
- Database query optimization with indexes
- Asset compression and bundling

## Security Features

- OAuth 2.0 authentication
- JWT session tokens
- SQL injection prevention via ORM
- CORS protection
- Environment variable isolation
- Private repository for source code

## Future Enhancements

- [ ] Receipt upload integration with OCR
- [ ] Recurring expense templates
- [ ] Budget alerts dashboard
- [ ] Export to PDF/CSV
- [ ] Email report sharing
- [ ] Mobile app (React Native)
- [ ] Advanced analytics and forecasting
- [ ] Investment tracking
- [ ] Tax report generation

## Contributing

Contributions are welcome! Please follow these steps:

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## License

This project is private and proprietary. All rights reserved.

## Support

For issues, questions, or suggestions, please open an issue on GitHub or contact the development team.

## Changelog

### Version 1.0.0 (2026-04-06)
- Initial release with core features
- Multi-currency support
- AI-powered categorization
- Comprehensive reporting
- Notification system
- Receipt OCR capabilities

---

**Built with ❤️ using React, Express, and tRPC**
