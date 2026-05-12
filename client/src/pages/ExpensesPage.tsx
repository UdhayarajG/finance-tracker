import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ExportButtons, downloadFile } from "@/components/ExportButtons";

export default function ExpensesPage() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    categoryId: "",
    date: new Date().toISOString().split("T")[0],
    merchant: "",
    paymentMethod: "cash" as const,
    notes: "",
  });

  // Fetch expenses
  const { data: expenses, isLoading: expensesLoading, refetch: refetchExpenses } = trpc.expenses.list.useQuery(
    { limit: 100, offset: 0 },
    { enabled: !!user }
  );

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading, isError: categoriesError } = trpc.categories.list.useQuery(
    undefined as any,
    { enabled: !!user }
  );

  // Create expense mutation
  const createExpense = trpc.expenses.create.useMutation({
    onSuccess: () => {
      toast.success("Expense added successfully");
      setFormData({
        description: "",
        amount: "",
        categoryId: "",
        date: new Date().toISOString().split("T")[0],
        merchant: "",
        paymentMethod: "cash",
        notes: "",
      });
      setIsOpen(false);
      refetchExpenses();
    },
    onError: (error) => {
      toast.error("Failed to add expense: " + error.message);
    },
  });

  // Delete expense mutation
  const deleteExpense = trpc.expenses.delete.useMutation({
    onSuccess: () => {
      toast.success("Expense deleted successfully");
      refetchExpenses();
    },
    onError: (error) => {
      toast.error("Failed to delete expense: " + error.message);
    },
  });

  // Search expenses
  const { data: searchResults } = trpc.expenses.search.useQuery(
    searchQuery,
    { enabled: !!searchQuery && !!user }
  );

  // Export queries
  const exportTransactionCSV = trpc.exports.transactionCSV.useQuery(
    { startDate: undefined, endDate: undefined },
    { enabled: false }
  );
  const exportTransactionPDF = trpc.exports.transactionHistoryPDF.useQuery(
    { startDate: undefined, endDate: undefined },
    { enabled: false }
  );

  const displayExpenses = searchQuery ? searchResults : expenses;

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const result = await exportTransactionCSV.refetch();
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
      const result = await exportTransactionPDF.refetch();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount || !formData.categoryId) {
      toast.error("Please fill in all required fields");
      return;
    }

    createExpense.mutate({
      description: formData.description,
      amount: formData.amount,
      categoryId: parseInt(formData.categoryId),
      date: new Date(formData.date),
      merchant: formData.merchant || undefined,
      paymentMethod: formData.paymentMethod,
      notes: formData.notes || undefined,
    });
  };

  const handleDelete = (expenseId: number) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      deleteExpense.mutate(expenseId);
    }
  };

  const totalExpenses = displayExpenses?.reduce((sum: number, exp: any) => sum + parseFloat(exp.amount.toString()), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 p-6 border border-green-200 dark:border-green-800">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-green-900 dark:text-green-50">Expenses</h1>
            <p className="text-green-700 dark:text-green-200 mt-1">Track and manage your daily expenses</p>
          </div>
          <div className="flex gap-2">
          <ExportButtons
            onExportCSV={handleExportCSV}
            onExportPDF={handleExportPDF}
            isLoading={isExporting}
            label="Export"
          />
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
            <DialogHeader className="border-b border-green-200 dark:border-green-800 pb-4">
              <DialogTitle className="text-green-900 dark:text-green-50">Add New Expense</DialogTitle>
              <DialogDescription className="text-green-600 dark:text-green-400">Record a new expense transaction</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="description" className="text-green-900 dark:text-green-100 font-semibold">Description *</Label>
                <Input
                  id="description"
                  placeholder="e.g., Grocery shopping"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="border-green-200 dark:border-green-800 focus:ring-green-500 focus:border-green-500 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-green-900 dark:text-green-100 font-semibold">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="border-green-200 dark:border-green-800 focus:ring-green-500 focus:border-green-500 transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-green-900 dark:text-green-100 font-semibold">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="border-green-200 dark:border-green-800 focus:ring-green-500 focus:border-green-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-green-900 dark:text-green-100 font-semibold">Category *</Label>
                <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesLoading ? (
                      <div className="p-2 text-sm text-muted-foreground">Loading categories...</div>
                    ) : categoriesError ? (
                      <div className="p-2 text-sm text-destructive">Failed to load categories</div>
                    ) : (
                      categories?.map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="merchant">Merchant</Label>
                <Input
                  id="merchant"
                  placeholder="e.g., Walmart"
                  value={formData.merchant}
                  onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select value={formData.paymentMethod} onValueChange={(value: any) => setFormData({ ...formData, paymentMethod: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="debit_card">Debit Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="digital_wallet">Digital Wallet</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white" disabled={createExpense.isPending}>
                {createExpense.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Expense"
                )}
              </Button>
            </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-600 dark:text-green-400" />
          <Input
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-green-200 dark:border-green-800 focus:ring-green-500"
          />
        </div>
        <div className="enhanced-card">
          <CardContent className="pt-6">
            <p className="text-sm text-green-600 dark:text-green-400">Total Expenses</p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">${totalExpenses.toFixed(2)}</p>
          </CardContent>
        </div>
      </div>

      {/* Expenses List */}
      <div className="enhanced-card">
        <CardHeader className="border-b border-green-200 dark:border-green-800">
          <CardTitle className="text-green-900 dark:text-green-50">Expense History</CardTitle>
          <CardDescription>{displayExpenses?.length || 0} transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {expensesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : displayExpenses && displayExpenses.length > 0 ? (
            <div className="space-y-2">
              {displayExpenses.map((expense: any) => (
                <div key={expense.id} className="flex items-center justify-between p-4 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-green-900 dark:text-green-50 truncate">{expense.description}</p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {new Date(expense.date).toLocaleDateString()} {expense.merchant && `• ${expense.merchant}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <div className="text-right">
                      <p className="font-semibold text-red-600 dark:text-red-400">-${parseFloat(expense.amount.toString()).toFixed(2)}</p>
                      <p className="text-xs text-green-600 dark:text-green-400 capitalize">{expense.paymentMethod.replace("_", " ")}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(expense.id)}
                      disabled={deleteExpense.isPending}
                      className="hover:bg-red-100 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No expenses found. Start tracking your spending!</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setIsOpen(true)}>
                Add First Expense
              </Button>
            </div>
          )}
        </CardContent>
      </div>
    </div>
  );
}
