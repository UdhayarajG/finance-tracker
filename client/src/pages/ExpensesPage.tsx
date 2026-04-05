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

export default function ExpensesPage() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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
  const { data: categories, isLoading: categoriesLoading } = trpc.categories.list.useQuery(
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

  const displayExpenses = searchQuery ? searchResults : expenses;

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground mt-1">Track and manage your daily expenses</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
              <DialogDescription>Record a new expense transaction</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  placeholder="e.g., Grocery shopping"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesLoading ? (
                      <div className="p-2 text-sm text-muted-foreground">Loading categories...</div>
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

              <Button type="submit" className="w-full" disabled={createExpense.isPending}>
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

      {/* Search and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Card className="card-elegant">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-2xl font-bold text-expense">${totalExpenses.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Expenses List */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle>Expense History</CardTitle>
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
                <div key={expense.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/5 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(expense.date).toLocaleDateString()} {expense.merchant && `• ${expense.merchant}`}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-expense">-${parseFloat(expense.amount.toString()).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground capitalize">{expense.paymentMethod.replace("_", " ")}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(expense.id)}
                      disabled={deleteExpense.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
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
      </Card>
    </div>
  );
}
