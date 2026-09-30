import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Layout } from '@/components/layout';
import { RouteGuard } from '@/components/route-guard';

import { ThemeProvider } from '@/components/theme-provider';

// Pages
import Login from '@/pages/login';
import Signup from '@/pages/signup';
import Dashboard from '@/pages/dashboard';
import Customers from '@/pages/customers';
import CustomerDetail from '@/pages/customer-detail';
import Transactions from '@/pages/transactions';
import GraphView from '@/pages/graph';
import Alerts from '@/pages/alerts';
import Reports from '@/pages/reports';
import AuditLogs from '@/pages/audit-logs';
import Settings from '@/pages/settings';
import CrossBank from '@/pages/cross-bank';
import Mules from '@/pages/mules';
import Investigations from '@/pages/investigations';
import Disclosures from '@/pages/disclosures';

const queryClient = new QueryClient();

function ProtectedRoutes() {
  return (
    <RouteGuard>
      <Layout>
        <Switch>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/customers" component={Customers} />
          <Route path="/customers/:id" component={CustomerDetail} />
          <Route path="/transactions" component={Transactions} />
          <Route path="/graph" component={GraphView} />
          <Route path="/alerts" component={Alerts} />
          <Route path="/reports" component={Reports} />
          <Route path="/audit-logs" component={AuditLogs} />
          <Route path="/settings" component={Settings} />
          <Route path="/cross-bank" component={CrossBank} />
          <Route path="/mules" component={Mules} />
          <Route path="/investigations" component={Investigations} />
          <Route path="/disclosures" component={Disclosures} />
          <Route component={NotFound} />
        </Switch>
      </Layout>
    </RouteGuard>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => {
        window.location.href = "/dashboard";
        return null;
      }} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route component={ProtectedRoutes} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
