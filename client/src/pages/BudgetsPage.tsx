import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function BudgetsPage() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [formData, setFormData] = useState({
    categoryId: "",
    budgetAmount: "",
    alertThreshold: "80",
    notes: "",
  });

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = trpc.categories.list.useQuery(
    undefined as any,
    { enabled: !!user }
  );

  // Fetch budgets for selected month
  const { data: budgets, isLoading: budgetsLoading, refetch: refetchBudgets } = trpc.budgets.listByMonth.useQuery(
    selectedMonth,
    { enabled: !!user }
  );

  // Fetch expenses for the month to calculate spending
  const { data: expenses } = trpc.expenses.getByDateRange.useQuery(
    {
      startDate: new Date(`${selectedMonth}-01`),
      endDate: new Date(new Date(`${selectedMonth}-01`).getFullYear(), new Date(`${selectedMonth}-01`).getMonth() + 1, 0),
    },
    { enabled: !!user }
  );

  // Create budget mutation
  const createBudget = trpc.budgets.create.useMutation({
    onSuccess: () => {
      toast.success("Budget created successfully");
      setFormData({
        categoryId: "",
        budgetAmount: "",
        alertThreshold: "80",
        notes: "",
      });
      setIsOpen(false);
      refetchBudgets();
    },
    onError: (error) => {
      toast.error("Failed to create budget: " + error.message);
    },
  });

  // Delete budget mutation
  const deleteBudget = trpc.budgets.delete.useMutation({
    onSuccess: () => {
      toast.success("Budget deleted successfully");
      refetchBudgets();
    },
    onError: (error) => {
      toast.error("Failed to delete budget: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.categoryId || !formData.budgetAmount) {
      toast.error("Please fill in all required fields");
      return;
    }

    createBudget.mutate({
      categoryId: parseInt(formData.categoryId),
      month: selectedMonth,
      budgetAmount: formData.budgetAmount,
      alertThreshold: parseInt(formData.alertThreshold),
      notes: formData.notes || undefined,
    });
  };

  const handleDelete = (budgetId: number) => {
    if (window.confirm("Are you sure you want to delete this budget?")) {
      deleteBudget.mutate(budgetId);
    }
  };

  // Calculate spending per category
  const spendingByCategory = expenses?.reduce((acc: Record<number, number>, exp: any) => {
    acc[exp.categoryId] = (acc[exp.categoryId] || 0) + parseFloat(exp.amount.toString());
    return acc;
  }, {}) || {};

  // Get category name by ID
  const getCategoryName = (categoryId: number) => {
    return categories?.find((c: any) => c.id === categoryId)?.name || "Unknown";
  };

  const totalBudgeted = budgets?.reduce((sum: number, b: any) => sum + parseFloat(b.budgetAmount.toString()), 0) || 0;
  const totalSpent = Object.values(spendingByCategory).reduce((sum: number, spent: any) => sum + spent, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
          <p className="text-muted-foreground mt-1">Set and track your monthly budgets</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Budget
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Budget</DialogTitle>
              <DialogDescription>Set a budget for {selectedMonth}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <Label htmlFor="budgetAmount">Budget Amount *</Label>
                <Input
                  id="budgetAmount"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={formData.budgetAmount}
                  onChange={(e) => setFormData({ ...formData, budgetAmount: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alertThreshold">Alert Threshold (%)</Label>
                <Input
                  id="alertThreshold"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.alertThreshold}
                  onChange={(e) => setFormData({ ...formData, alertThreshold: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  placeholder="Optional notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full" disabled={createBudget.isPending}>
                {createBudget.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Budget"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Month Selector */}
      <div className="flex items-center gap-4">
        <Label>Month:</Label>
        <Input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-32"
        />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Budgeted</p>
            <p className="text-2xl font-bold text-budget">${totalBudgeted.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Spent</p>
            <p className="text-2xl font-bold text-expense">${totalSpent.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Budgets List */}
      <Card className="bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <CardTitle>Budget Tracking</CardTitle>
          <CardDescription>{budgets?.length || 0} budgets for {selectedMonth}</CardDescription>
        </CardHeader>
        <CardContent>
          {budgetsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : budgets && budgets.length > 0 ? (
            <div className="space-y-4">
              {budgets.map((budget: any) => {
                const spent = spendingByCategory[budget.categoryId] || 0;
                const budgetAmount = parseFloat(budget.budgetAmount.toString());
                const percentage = (spent / budgetAmount) * 100;
                const isExceeded = percentage > 100;
                const isWarning = percentage >= budget.alertThreshold && percentage <= 100;

                return (
                  <div key={budget.id} className="p-4 border border-border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{getCategoryName(budget.categoryId)}</h3>
                        <p className="text-sm text-muted-foreground">
                          ${spent.toFixed(2)} of ${budgetAmount.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isExceeded && <AlertCircle className="w-5 h-5 text-destructive" />}
                        {isWarning && !isExceeded && <AlertCircle className="w-5 h-5 text-warning" />}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(budget.id)}
                          disabled={deleteBudget.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            isExceeded ? "bg-destructive" : isWarning ? "bg-warning" : "bg-income"
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{percentage.toFixed(0)}% spent</span>
                        <span>${(budgetAmount - spent).toFixed(2)} remaining</span>
                      </div>
                    </div>

                    {isExceeded && (
                      <p className="text-xs text-destructive mt-2 font-medium">
                        Budget exceeded by ${(spent - budgetAmount).toFixed(2)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No budgets set for this month. Create one to get started!</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setIsOpen(true)}>
                Create First Budget
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
