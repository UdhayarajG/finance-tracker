import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./hooks/useAuth";
import Home from "./pages/Home";
import DashboardLayout from "./components/DashboardLayout";
import ExpensesPage from "./pages/ExpensesPage";
import LoansPage from "./pages/LoansPage";
import BudgetsPage from "./pages/BudgetsPage";
import CategoriesPage from "./pages/CategoriesPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";

function Router() {
  const { user, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-green-900 dark:text-green-50 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show login/signup pages
  if (!user) {
    return (
      <Switch>
        <Route path={"/login"} component={LoginPage} />
        <Route path={"/signup"} component={SignupPage} />
        <Route path={"/forgot-password"} component={ForgotPasswordPage} />
        <Route path={"*"} component={LoginPage} />
      </Switch>
    );
  }

  // If authenticated, show dashboard
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"}>
        {() => (
          <DashboardLayout>
            <Home />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/expenses"}>
        {() => (
          <DashboardLayout>
            <ExpensesPage />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/loans"}>
        {() => (
          <DashboardLayout>
            <LoansPage />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/budgets"}>
        {() => (
          <DashboardLayout>
            <BudgetsPage />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/categories"}>
        {() => (
          <DashboardLayout>
            <CategoriesPage />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/reports"}>
        {() => (
          <DashboardLayout>
            <ReportsPage />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/settings"}>
        {() => (
          <DashboardLayout>
            <SettingsPage />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
