import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import DashboardLayout from "./components/DashboardLayout";
import ExpensesPage from "./pages/ExpensesPage";
import LoansPage from "./pages/LoansPage";
import BudgetsPage from "./pages/BudgetsPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";

function Router() {
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
