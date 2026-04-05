import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Download } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

const COLORS = ["#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#06B6D4", "#6366F1", "#EF4444"];

export default function ReportsPage() {
  const { user } = useAuth();
  const [reportType, setReportType] = useState("monthly");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  // Fetch expenses for the month
  const { data: expenses, isLoading: expensesLoading } = trpc.expenses.getByDateRange.useQuery(
    {
      startDate: new Date(`${selectedMonth}-01`),
      endDate: new Date(new Date(`${selectedMonth}-01`).getFullYear(), new Date(`${selectedMonth}-01`).getMonth() + 1, 0),
    },
    { enabled: !!user }
  );

  // Fetch category breakdown
  const { data: categoryBreakdown, isLoading: breakdownLoading } = trpc.expenses.getCategoryBreakdown.useQuery(
    {
      startDate: new Date(`${selectedMonth}-01`),
      endDate: new Date(new Date(`${selectedMonth}-01`).getFullYear(), new Date(`${selectedMonth}-01`).getMonth() + 1, 0),
    },
    { enabled: !!user }
  );

  // Fetch categories for names
  const { data: categories } = trpc.categories.list.useQuery(
    undefined as any,
    { enabled: !!user }
  );

  // Fetch loans for summary
  const { data: loans } = trpc.loans.list.useQuery(
    undefined as any,
    { enabled: !!user }
  );

  // Prepare pie chart data
  const pieData = categoryBreakdown?.map((item: any) => {
    const category = categories?.find((c: any) => c.id === item.categoryId);
    return {
      name: category?.name || "Unknown",
      value: parseFloat(item.total.toString()),
      count: item.count,
    };
  }) || [];

  // Prepare daily spending data
  const dailySpending: Record<string, number> = {};
  expenses?.forEach((exp: any) => {
    const date = new Date(exp.date).toLocaleDateString();
    dailySpending[date] = (dailySpending[date] || 0) + parseFloat(exp.amount.toString());
  });

  const dailyData = Object.entries(dailySpending)
    .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
    .map(([date, amount]) => ({
      date,
      amount: parseFloat(amount.toFixed(2)),
    }));

  // Calculate statistics
  const totalExpenses = expenses?.reduce((sum: number, exp: any) => sum + parseFloat(exp.amount.toString()), 0) || 0;
  const avgDailySpending = dailyData.length > 0 ? totalExpenses / dailyData.length : 0;
  const maxDailySpending = dailyData.length > 0 ? Math.max(...dailyData.map(d => d.amount)) : 0;
  const activeLoans = loans?.filter((l: any) => l.status === "active") || [];
  const totalLoanBalance = activeLoans.reduce((sum: number, loan: any) => sum + parseFloat(loan.remainingBalance.toString()), 0);

  const isLoading = expensesLoading || breakdownLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
        <p className="text-muted-foreground mt-1">Analyze your spending patterns and financial trends</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="month">Select Month</Label>
          <Input
            id="month"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-2xl font-bold text-expense">${totalExpenses.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-2">{expenses?.length || 0} transactions</p>
          </CardContent>
        </Card>

        <Card className="bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Average Daily</p>
            <p className="text-2xl font-bold text-primary">${avgDailySpending.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-2">Per day average</p>
          </CardContent>
        </Card>

        <Card className="bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Max Daily Spending</p>
            <p className="text-2xl font-bold text-warning">${maxDailySpending.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-2">Highest single day</p>
          </CardContent>
        </Card>

        <Card className="bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Loan Balance</p>
            <p className="text-2xl font-bold text-loan">${totalLoanBalance.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-2">{activeLoans.length} active loan{activeLoans.length !== 1 ? 's' : ''}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart - Category Breakdown */}
          <Card className="bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
              <CardDescription>Breakdown of expenses by category</CardDescription>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: $${value.toFixed(0)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `$${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No expense data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Line Chart - Daily Spending Trend */}
          <Card className="bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle>Daily Spending Trend</CardTitle>
              <CardDescription>Your spending pattern throughout the month</CardDescription>
            </CardHeader>
            <CardContent>
              {dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(value: any) => `$${value.toFixed(2)}`} />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#3B82F6"
                      dot={{ fill: "#3B82F6", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No spending data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Details Table */}
      <Card className="bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <CardTitle>Category Details</CardTitle>
          <CardDescription>Detailed breakdown by category</CardDescription>
        </CardHeader>
        <CardContent>
          {pieData.length > 0 ? (
            <div className="space-y-2">
              {pieData.map((item: any, index: number) => {
                const percentage = (item.value / totalExpenses) * 100;
                return (
                  <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.count} transaction{item.count !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${item.value.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No expense data available for this period</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow duration-200 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Month</p>
              <p className="text-lg font-semibold">{new Date(selectedMonth + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Spending</p>
              <p className="text-lg font-semibold text-expense">${totalExpenses.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Outstanding Loans</p>
              <p className="text-lg font-semibold text-loan">${totalLoanBalance.toFixed(2)}</p>
            </div>
          </div>
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">Net Financial Position</p>
            <p className="text-2xl font-bold text-destructive">
              -${(totalExpenses + totalLoanBalance).toFixed(2)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
