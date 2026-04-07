import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LotListPage from "@/pages/LotListPage";
import LotDetailPage from "@/pages/LotDetailPage";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={LotListPage} />
      <Route path="/lote/:itemId" component={LotDetailPage} />
      <Route>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-500">Página não encontrada</p>
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
