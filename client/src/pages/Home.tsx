import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, TrendingDown, Wallet, DollarSign, AlertCircle, ArrowRight, Bell } from "lucide-react";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = now;
    return { startDate, endDate };
  });

  // Fetch financial data
  const { data: summary, isLoading: summaryLoading } = trpc.summary.getFinancialOverview.useQuery(
    dateRange as any,
    { enabled: isAuthenticated } as any
  );

  const { data: expenses, isLoading: expensesLoading } = trpc.expenses.list.useQuery(
    { limit: 5, offset: 0 },
    { enabled: isAuthenticated } as any
  );

  const { data: loans, isLoading: loansLoading } = trpc.loans.list.useQuery(
    undefined as any,
    { enabled: isAuthenticated } as any
  );

  const { data: notifications } = trpc.notifications.getUnread.useQuery(
    undefined as any,
    { enabled: isAuthenticated } as any
  );

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Redirect to login
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const totalExpenses = summary?.totalExpenses || 0;
  const totalLoans = summary?.totalLoans || 0;
  const activeLoans = loans?.filter(l => l.status === "active").length || 0;

  return (
    <div className="space-y-8">
      {/* Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 p-8 border border-green-200 dark:border-green-800">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold tracking-tight text-green-900 dark:text-green-50">
            Welcome back, {user?.name}
          </h1>
          <p className="text-green-700 dark:text-green-200 mt-2">
            Here's your financial overview for this month
          </p>
        </div>
        <div className="absolute top-0 right-0 w-40 h-40 bg-green-200 dark:bg-green-700 opacity-10 rounded-full blur-3xl"></div>
      </div>

      {/* Alerts */}
      {notifications && notifications.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 border border-green-300 dark:border-green-700 rounded-xl p-4 flex gap-3 animate-pulse-soft">
          <Bell className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-green-900 dark:text-green-100">
              {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
            </p>
            <p className="text-sm text-green-700 dark:text-green-200">
              Check your notifications for important updates
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-700"
            onClick={() => navigate("/notifications") as any}
          >
            View
          </Button>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Expenses Card */}
        <div className="stat-card group cursor-pointer fade-in-up" onClick={() => navigate("/expenses") as any}>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-green-900 dark:text-green-100">Total Expenses</span>
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-800 transition-colors">
                <TrendingDown className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-green-700 dark:text-green-300 group-hover:text-green-800 dark:group-hover:text-green-200 transition-colors">
              ${totalExpenses.toFixed(2)}
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-3">
              {expenses?.length || 0} transactions
            </p>
          </div>
        </div>

        {/* Active Loans Card */}
        <div className="stat-card group cursor-pointer fade-in-up" onClick={() => navigate("/loans") as any}>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-green-900 dark:text-green-100">Active Loans</span>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
                <Wallet className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-purple-700 dark:text-purple-300 group-hover:text-purple-800 dark:group-hover:text-purple-200 transition-colors">
              ${totalLoans.toFixed(2)}
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-3">
              {activeLoans} active loan{activeLoans !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Net Position Card */}
        <div className="stat-card group cursor-pointer fade-in-up" onClick={() => navigate("/reports") as any}>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-green-900 dark:text-green-100">Net Position</span>
              <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg group-hover:bg-red-200 dark:group-hover:bg-red-800 transition-colors">
                <DollarSign className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors">
              ${(totalExpenses + totalLoans).toFixed(2)}
            </div>
            <p className="text-xs text-red-600 dark:text-red-400 mt-3">
              This month's snapshot
            </p>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="stat-card fade-in-up">
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-green-900 dark:text-green-100">Quick Actions</span>
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="space-y-2">
              <Button 
                size="sm" 
                className="w-full justify-between bg-green-600 hover:bg-green-700 text-white btn-interactive"
                onClick={() => navigate("/expenses") as any}
              >
                <span>Add Expense</span>
                <ArrowRight className="w-3 h-3" />
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="w-full justify-between border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 btn-interactive"
                onClick={() => navigate("/loans") as any}
              >
                <span>Add Loan</span>
                <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="enhanced-card">
        <CardHeader className="border-b border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-green-900 dark:text-green-50">Recent Transactions</CardTitle>
              <CardDescription className="text-green-600 dark:text-green-400">Your latest expenses</CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30"
              onClick={() => navigate("/expenses") as any}
            >
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {expensesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-green-600" />
            </div>
          ) : expenses && expenses.length > 0 ? (
            <div className="space-y-3">
              {expenses.map((expense: any, index: number) => (
                <div 
                  key={expense.id} 
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex-1">
                    <p className="font-medium text-green-900 dark:text-green-50">{expense.description}</p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {new Date(expense.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600 dark:text-red-400">
                      -${parseFloat(expense.amount.toString()).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-green-600 dark:text-green-400 mb-4">No expenses yet. Start tracking your spending!</p>
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => navigate("/expenses") as any}
              >
                Add First Expense
              </Button>
            </div>
          )}
        </CardContent>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          className="enhanced-card group cursor-pointer fade-in-up" 
          onClick={() => navigate("/expenses") as any}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-green-900 dark:text-green-50">Manage Expenses</CardTitle>
              <ArrowRight className="w-5 h-5 text-green-600 dark:text-green-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-600 dark:text-green-400">
              Track and categorize your spending with ease
            </p>
          </CardContent>
        </div>

        <div 
          className="enhanced-card group cursor-pointer fade-in-up" 
          onClick={() => navigate("/loans") as any}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-green-900 dark:text-green-50">Manage Loans</CardTitle>
              <ArrowRight className="w-5 h-5 text-green-600 dark:text-green-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-600 dark:text-green-400">
              Monitor your loan payments and balances
            </p>
          </CardContent>
        </div>

        <div 
          className="enhanced-card group cursor-pointer fade-in-up" 
          onClick={() => navigate("/reports") as any}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-green-900 dark:text-green-50">View Reports</CardTitle>
              <ArrowRight className="w-5 h-5 text-green-600 dark:text-green-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-600 dark:text-green-400">
              Analyze your financial trends and insights
            </p>
          </CardContent>
        </div>
      </div>
    </div>
  );
}
