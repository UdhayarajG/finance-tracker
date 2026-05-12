import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Download } from "lucide-react";
import { ExportButtons, downloadFile } from "@/components/ExportButtons";
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

// Monochromatic green palette with accent colors for contrast
const COLORS = ["#10B981", "#059669", "#047857", "#065F46", "#064E3B", "#F59E0B", "#DC2626", "#7C3AED"];

export default function ReportsPage() {
  const { user } = useAuth();
  const [reportType, setReportType] = useState("monthly");
  const [displayCurrency, setDisplayCurrency] = useState("USD");
  const [isExporting, setIsExporting] = useState(false);
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

  // Export queries
  const exportExpenseReportCSV = trpc.exports.expenseReportCSV.useQuery(
    { month: selectedMonth },
    { enabled: false }
  );
  const exportFinancialReportPDF = trpc.exports.financialReportPDF.useQuery(
    { month: selectedMonth },
    { enabled: false }
  );

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const result = await exportExpenseReportCSV.refetch();
      if (result.data?.csv) {
        downloadFile(result.data.csv, result.data.filename, 'text/csv');
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const result = await exportFinancialReportPDF.refetch();
      if (result.data?.pdf) {
        const binaryString = atob(result.data.pdf);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        downloadFile(new Blob([bytes], { type: 'application/pdf' }), result.data.filename, 'application/pdf');
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

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
      {/* Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 p-6 border border-green-200 dark:border-green-800">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-green-900 dark:text-green-50">Financial Reports</h1>
            <p className="text-green-700 dark:text-green-200 mt-1">Analyze your spending patterns and financial trends</p>
          </div>
          <ExportButtons
            onExportCSV={handleExportCSV}
            onExportPDF={handleExportPDF}
            isLoading={isExporting}
            label="Export"
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="month" className="text-green-900 dark:text-green-100 font-semibold">Select Month</Label>
          <Input
            id="month"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border-green-200 dark:border-green-800 focus:ring-green-500 focus:border-green-500 transition-all"
          />
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="enhanced-card">
          <CardContent className="pt-6">
            <p className="text-sm text-green-600 dark:text-green-400">Total Expenses</p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">${totalExpenses.toFixed(2)}</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-2">{expenses?.length || 0} transactions</p>
          </CardContent>
        </div>

        <div className="enhanced-card">
          <CardContent className="pt-6">
            <p className="text-sm text-green-600 dark:text-green-400">Average Daily</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">${avgDailySpending.toFixed(2)}</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-2">Per day average</p>
          </CardContent>
        </div>

        <div className="enhanced-card">
          <CardContent className="pt-6">
            <p className="text-sm text-green-600 dark:text-green-400">Max Daily Spending</p>
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">${maxDailySpending.toFixed(2)}</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-2">Highest single day</p>
          </CardContent>
        </div>

        <div className="enhanced-card">
          <CardContent className="pt-6">
            <p className="text-sm text-green-600 dark:text-green-400">Total Loan Balance</p>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">${totalLoanBalance.toFixed(2)}</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-2">{activeLoans.length} active loan{activeLoans.length !== 1 ? 's' : ''}</p>
          </CardContent>
        </div>
      </div>

      {/* Charts */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart - Category Breakdown */}
          <div className="enhanced-card">
            <CardHeader className="border-b border-green-200 dark:border-green-800">
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
          </div>

          {/* Line Chart - Daily Spending Trend */}
          <div className="enhanced-card">
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
                      stroke="#10B981"
                      dot={{ fill: "#10B981", r: 4 }}
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
          </div>
        </div>
      )}

      {/* Category Details Table */}
      <div className="enhanced-card">
        <CardHeader className="border-b border-green-200 dark:border-green-800">
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
      </div>

      {/* Summary */}
      <div className="enhanced-card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10">
        <CardHeader className="border-b border-green-200 dark:border-green-800">
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
      </div>
    </div>
  );
}
