import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, TrendingDown, Wallet, DollarSign, AlertCircle } from "lucide-react";
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
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Welcome back, {user?.name}</h1>
        <p className="text-muted-foreground">Here's your financial overview for this month</p>
      </div>

      {/* Alerts */}
      {notifications && notifications.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-900 dark:text-yellow-100">You have {notifications.length} notification{notifications.length !== 1 ? 's' : ''}</p>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">Check your notifications for important updates</p>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Expenses */}
        <Card className="card-elegant">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Total Expenses</span>
              <TrendingDown className="w-4 h-4 text-expense" />
            </CardTitle>
            <CardDescription>This month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-expense">
              ${totalExpenses.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {expenses?.length || 0} transactions
            </p>
          </CardContent>
        </Card>

        {/* Active Loans */}
        <Card className="card-elegant">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Active Loans</span>
              <Wallet className="w-4 h-4 text-loan" />
            </CardTitle>
            <CardDescription>Outstanding balance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-loan">
              ${totalLoans.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {activeLoans} active loan{activeLoans !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        {/* Net Position */}
        <Card className="card-elegant">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Net Position</span>
              <DollarSign className="w-4 h-4 text-primary" />
            </CardTitle>
            <CardDescription>Expenses + Loans</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              ${(totalExpenses + totalLoans).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              This month's financial snapshot
            </p>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="card-elegant flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => navigate("/expenses") as any}
            >
              + Add Expense
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => navigate("/loans") as any}
            >
              + Add Loan
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest expenses</CardDescription>
        </CardHeader>
        <CardContent>
          {expensesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : expenses && expenses.length > 0 ? (
            <div className="space-y-4">
              {expenses.map((expense: any) => (
                <div key={expense.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex-1">
                    <p className="font-medium">{expense.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(expense.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-expense">
                      -${parseFloat(expense.amount.toString()).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No expenses yet. Start tracking your spending!</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => navigate("/expenses") as any}
              >
                Add First Expense
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-elegant cursor-pointer hover:border-primary transition-colors" onClick={() => navigate("/expenses") as any}>
          <CardHeader>
            <CardTitle className="text-base">Manage Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Track and categorize your spending</p>
          </CardContent>
        </Card>

        <Card className="card-elegant cursor-pointer hover:border-primary transition-colors" onClick={() => navigate("/loans") as any}>
          <CardHeader>
            <CardTitle className="text-base">Manage Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Monitor your loan payments and balances</p>
          </CardContent>
        </Card>

        <Card className="card-elegant cursor-pointer hover:border-primary transition-colors" onClick={() => navigate("/reports") as any}>
          <CardHeader>
            <CardTitle className="text-base">View Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Analyze your financial trends</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
