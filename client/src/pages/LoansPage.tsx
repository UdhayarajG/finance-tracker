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
import { Plus, Trash2, TrendingDown, Calendar, Percent, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LoansPage() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    loanName: "",
    loanType: "personal" as const,
    principal: "",
    interestRate: "",
    loanStartDate: new Date().toISOString().split("T")[0],
    loanEndDate: "",
    monthlyPayment: "",
    paymentFrequency: "monthly" as const,
    nextPaymentDate: "",
    lender: "",
    notes: "",
  });

  // Fetch loans
  const { data: loans, isLoading: loansLoading, refetch: refetchLoans } = trpc.loans.list.useQuery(
    undefined as any,
    { enabled: !!user }
  );

  // Create loan mutation
  const createLoan = trpc.loans.create.useMutation({
    onSuccess: () => {
      toast.success("Loan added successfully");
      setFormData({
        loanName: "",
        loanType: "personal",
        principal: "",
        interestRate: "",
        loanStartDate: new Date().toISOString().split("T")[0],
        loanEndDate: "",
        monthlyPayment: "",
        paymentFrequency: "monthly",
        nextPaymentDate: "",
        lender: "",
        notes: "",
      });
      setIsOpen(false);
      refetchLoans();
    },
    onError: (error) => {
      toast.error("Failed to add loan: " + error.message);
    },
  });

  // Delete loan mutation
  const deleteLoan = trpc.loans.delete.useMutation({
    onSuccess: () => {
      toast.success("Loan deleted successfully");
      refetchLoans();
    },
    onError: (error) => {
      toast.error("Failed to delete loan: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.loanName || !formData.principal || !formData.interestRate || !formData.monthlyPayment) {
      toast.error("Please fill in all required fields");
      return;
    }

    createLoan.mutate({
      loanName: formData.loanName,
      loanType: formData.loanType,
      principal: formData.principal,
      interestRate: formData.interestRate,
      loanStartDate: new Date(formData.loanStartDate),
      loanEndDate: formData.loanEndDate ? new Date(formData.loanEndDate) : undefined,
      monthlyPayment: formData.monthlyPayment,
      paymentFrequency: formData.paymentFrequency,
      nextPaymentDate: formData.nextPaymentDate ? new Date(formData.nextPaymentDate) : undefined,
      lender: formData.lender || undefined,
      notes: formData.notes || undefined,
    });
  };

  const handleDelete = (loanId: number) => {
    if (window.confirm("Are you sure you want to delete this loan?")) {
      deleteLoan.mutate(loanId);
    }
  };

  const activeLoans = loans?.filter((l: any) => l.status === "active") || [];
  const totalBalance = activeLoans.reduce((sum: number, loan: any) => sum + parseFloat(loan.remainingBalance.toString()), 0);
  const totalMonthlyPayment = activeLoans.reduce((sum: number, loan: any) => sum + parseFloat(loan.monthlyPayment.toString()), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Loans</h1>
          <p className="text-muted-foreground mt-1">Manage and track your loans</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Loan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Loan</DialogTitle>
              <DialogDescription>Record a new loan</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="loanName">Loan Name *</Label>
                <Input
                  id="loanName"
                  placeholder="e.g., Car Loan"
                  value={formData.loanName}
                  onChange={(e) => setFormData({ ...formData, loanName: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="loanType">Loan Type</Label>
                  <Select value={formData.loanType} onValueChange={(value: any) => setFormData({ ...formData, loanType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="home">Home</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lender">Lender</Label>
                  <Input
                    id="lender"
                    placeholder="e.g., Bank Name"
                    value={formData.lender}
                    onChange={(e) => setFormData({ ...formData, lender: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="principal">Principal Amount *</Label>
                  <Input
                    id="principal"
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    value={formData.principal}
                    onChange={(e) => setFormData({ ...formData, principal: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interestRate">Interest Rate (%) *</Label>
                  <Input
                    id="interestRate"
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    value={formData.interestRate}
                    onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="loanStartDate">Start Date *</Label>
                  <Input
                    id="loanStartDate"
                    type="date"
                    value={formData.loanStartDate}
                    onChange={(e) => setFormData({ ...formData, loanStartDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loanEndDate">Expected End Date</Label>
                  <Input
                    id="loanEndDate"
                    type="date"
                    value={formData.loanEndDate}
                    onChange={(e) => setFormData({ ...formData, loanEndDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthlyPayment">Monthly Payment *</Label>
                  <Input
                    id="monthlyPayment"
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    value={formData.monthlyPayment}
                    onChange={(e) => setFormData({ ...formData, monthlyPayment: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentFrequency">Payment Frequency</Label>
                  <Select value={formData.paymentFrequency} onValueChange={(value: any) => setFormData({ ...formData, paymentFrequency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Biweekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nextPaymentDate">Next Payment Date</Label>
                <Input
                  id="nextPaymentDate"
                  type="date"
                  value={formData.nextPaymentDate}
                  onChange={(e) => setFormData({ ...formData, nextPaymentDate: e.target.value })}
                />
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

              <Button type="submit" className="w-full" disabled={createLoan.isPending}>
                {createLoan.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Loan"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-elegant">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Total Balance</span>
              <TrendingDown className="w-4 h-4 text-loan" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-loan">${totalBalance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-2">{activeLoans.length} active loan{activeLoans.length !== 1 ? 's' : ''}</p>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Monthly Payment</span>
              <Calendar className="w-4 h-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${totalMonthlyPayment.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-2">Total monthly obligation</p>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Average Interest</span>
              <Percent className="w-4 h-4 text-warning" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {activeLoans.length > 0 
                ? (activeLoans.reduce((sum: number, loan: any) => sum + parseFloat(loan.interestRate.toString()), 0) / activeLoans.length).toFixed(2)
                : "0.00"}%
            </div>
            <p className="text-xs text-muted-foreground mt-2">Weighted average</p>
          </CardContent>
        </Card>
      </div>

      {/* Loans List */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle>Your Loans</CardTitle>
          <CardDescription>{activeLoans.length} active loan{activeLoans.length !== 1 ? 's' : ''}</CardDescription>
        </CardHeader>
        <CardContent>
          {loansLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : activeLoans.length > 0 ? (
            <div className="space-y-4">
              {activeLoans.map((loan: any) => (
                <div key={loan.id} className="p-4 border border-border rounded-lg hover:bg-accent/5 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{loan.loanName}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{loan.loanType.replace("_", " ")}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(loan.id)}
                      disabled={deleteLoan.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Principal</p>
                      <p className="font-semibold">${parseFloat(loan.principal.toString()).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Remaining</p>
                      <p className="font-semibold text-loan">${parseFloat(loan.remainingBalance.toString()).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Interest Rate</p>
                      <p className="font-semibold">{parseFloat(loan.interestRate.toString()).toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Monthly Payment</p>
                      <p className="font-semibold">${parseFloat(loan.monthlyPayment.toString()).toFixed(2)}</p>
                    </div>
                  </div>

                  {loan.nextPaymentDate && (
                    <div className="mt-3 pt-3 border-t border-border text-sm">
                      <p className="text-muted-foreground">Next Payment: <span className="font-semibold">{new Date(loan.nextPaymentDate).toLocaleDateString()}</span></p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No active loans. Add a loan to get started!</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setIsOpen(true)}>
                Add First Loan
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
