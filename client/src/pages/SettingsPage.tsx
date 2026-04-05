import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { CurrencySelector } from "@/components/CurrencySelector";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    budgetExceededEnabled: true,
    budgetExceededThreshold: 80,
    loanDueEnabled: true,
    loanDueDaysBefore: 3,
    unusualSpendingEnabled: true,
    unusualSpendingThreshold: "500",
  });

  // Fetch notification preferences
  const { data: savedPreferences, isLoading: preferencesLoading } = trpc.notifications.getPreferences.useQuery(
    undefined as any,
    { enabled: !!user }
  );

  // Update preferences mutation
  const updatePreferences = trpc.notifications.updatePreferences.useMutation({
    onSuccess: () => {
      toast.success("Preferences saved successfully");
      setIsSaving(false);
    },
    onError: (error) => {
      toast.error("Failed to save preferences: " + error.message);
      setIsSaving(false);
    },
  });

  // Logout mutation
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      logout();
      toast.success("Logged out successfully");
    },
  });

  useEffect(() => {
    if (savedPreferences) {
      setPreferences({
        budgetExceededEnabled: savedPreferences.budgetExceededEnabled,
        budgetExceededThreshold: savedPreferences.budgetExceededThreshold,
        loanDueEnabled: savedPreferences.loanDueEnabled,
        loanDueDaysBefore: savedPreferences.loanDueDaysBefore,
        unusualSpendingEnabled: savedPreferences.unusualSpendingEnabled,
        unusualSpendingThreshold: savedPreferences.unusualSpendingThreshold.toString(),
      });
    }
  }, [savedPreferences]);

  const handleSavePreferences = () => {
    setIsSaving(true);
    updatePreferences.mutate({
      budgetExceededEnabled: preferences.budgetExceededEnabled,
      budgetExceededThreshold: preferences.budgetExceededThreshold,
      loanDueEnabled: preferences.loanDueEnabled,
      loanDueDaysBefore: preferences.loanDueDaysBefore,
      unusualSpendingEnabled: preferences.unusualSpendingEnabled,
      unusualSpendingThreshold: preferences.unusualSpendingThreshold,
    });
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      logoutMutation.mutate();
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your preferences and account</p>
      </div>

      {/* Currency Settings */}
      <Card className="bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <CardTitle>Currency Settings</CardTitle>
          <CardDescription>Set your preferred currency for transactions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CurrencySelector onCurrencyChange={(currency) => {
            toast.success(`Base currency set to ${currency}`);
          }} />
          <p className="text-sm text-muted-foreground mt-4">
            All expenses and loans will be converted to your base currency for reporting and analysis.
          </p>
        </CardContent>
      </Card>

      {/* Account Section */}
      <Card className="bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Name</Label>
            <p className="text-lg font-medium">{user?.name || "Not set"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Email</Label>
            <p className="text-lg font-medium">{user?.email || "Not set"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Account Type</Label>
            <p className="text-lg font-medium capitalize">{user?.role || "user"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Control when you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {preferencesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Budget Exceeded Notifications */}
              <div className="space-y-4 pb-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Budget Exceeded Alerts</Label>
                    <p className="text-sm text-muted-foreground mt-1">Get notified when spending exceeds your budget</p>
                  </div>
                  <Switch
                    checked={preferences.budgetExceededEnabled}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, budgetExceededEnabled: checked })
                    }
                  />
                </div>
                {preferences.budgetExceededEnabled && (
                  <div className="ml-0 space-y-2">
                    <Label htmlFor="budgetThreshold">Alert Threshold (%)</Label>
                    <Input
                      id="budgetThreshold"
                      type="number"
                      min="0"
                      max="100"
                      value={preferences.budgetExceededThreshold}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          budgetExceededThreshold: parseInt(e.target.value) || 80,
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      You'll be notified when spending reaches {preferences.budgetExceededThreshold}% of your budget
                    </p>
                  </div>
                )}
              </div>

              {/* Loan Due Notifications */}
              <div className="space-y-4 pb-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Loan Payment Due Alerts</Label>
                    <p className="text-sm text-muted-foreground mt-1">Get notified before loan payments are due</p>
                  </div>
                  <Switch
                    checked={preferences.loanDueEnabled}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, loanDueEnabled: checked })
                    }
                  />
                </div>
                {preferences.loanDueEnabled && (
                  <div className="ml-0 space-y-2">
                    <Label htmlFor="loanDueDays">Notify me (days before)</Label>
                    <Input
                      id="loanDueDays"
                      type="number"
                      min="1"
                      max="30"
                      value={preferences.loanDueDaysBefore}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          loanDueDaysBefore: parseInt(e.target.value) || 3,
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      You'll receive a reminder {preferences.loanDueDaysBefore} day{preferences.loanDueDaysBefore !== 1 ? 's' : ''} before payment is due
                    </p>
                  </div>
                )}
              </div>

              {/* Unusual Spending Notifications */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Unusual Spending Alerts</Label>
                    <p className="text-sm text-muted-foreground mt-1">Get notified of unusual spending patterns</p>
                  </div>
                  <Switch
                    checked={preferences.unusualSpendingEnabled}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, unusualSpendingEnabled: checked })
                    }
                  />
                </div>
                {preferences.unusualSpendingEnabled && (
                  <div className="ml-0 space-y-2">
                    <Label htmlFor="unusualThreshold">Threshold Amount ($)</Label>
                    <Input
                      id="unusualThreshold"
                      type="number"
                      placeholder="500.00"
                      step="0.01"
                      value={preferences.unusualSpendingThreshold}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          unusualSpendingThreshold: e.target.value,
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      You'll be notified of single transactions exceeding ${parseFloat(preferences.unusualSpendingThreshold || "0").toFixed(2)}
                    </p>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <Button onClick={handleSavePreferences} disabled={isSaving} className="w-full mt-6">
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Preferences"
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card className="bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow duration-200 border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive">Account Actions</CardTitle>
          <CardDescription>Manage your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {logoutMutation.isPending ? "Logging out..." : "Log Out"}
          </Button>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <CardTitle>Help & Support</CardTitle>
          <CardDescription>Need help?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            For support, questions, or feature requests, please contact our support team.
          </p>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Email:</span> support@financetracker.com
            </p>
            <p className="text-sm">
              <span className="font-medium">Documentation:</span> Available in the help center
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
