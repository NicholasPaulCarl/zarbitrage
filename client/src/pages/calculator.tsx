import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import SubscriptionGuard from "@/components/SubscriptionGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton, useTheme } from "@/components/dark-ui";
import { CalculatorForm } from "../components/CalculatorForm";
import { CalculatorResult } from "../components/CalculatorResult";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ArbitrageOpportunity, ExchangeFee, CalculatorResult as CalculatorResultType } from "@/lib/types";
import { Lock } from "lucide-react";

export default function CalculatorPage() {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [calculationResult, setCalculationResult] = useState<CalculatorResultType | null>(null);

  // Fetch exchange fees
  const feesQuery = useQuery<ExchangeFee[]>({
    queryKey: ["/api/exchange-fees"],
    queryFn: async () => {
      const response = await apiRequest<ExchangeFee[]>("/api/exchange-fees");
      return response;
    },
    enabled: isAuthenticated,
  });

  // Fetch arbitrage opportunities
  const opportunitiesQuery = useQuery<ArbitrageOpportunity[]>({
    queryKey: ["/api/arbitrage"],
    queryFn: async () => {
      const response = await apiRequest<ArbitrageOpportunity[]>("/api/arbitrage");
      return response;
    },
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const isLoading = feesQuery.isLoading || opportunitiesQuery.isLoading;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      // Using setLocation for instant navigation
      setLocation('/login');
    }
  }, [isAuthenticated, setLocation]);
  
  // Show loading state
  if (!isAuthenticated) {
    return null; // This prevents content flash before redirect
  }

  return (
    <Layout headerOptions={{
      refreshRate: 30,
      setRefreshRate: () => {},
      refreshData: () => {},
      isLoading: false
    }}>
      <SubscriptionGuard featureName="Profit Calculator">
        <div className="flex flex-col space-y-6">
          <div>
            <h1 
              className="text-2xl font-bold tracking-tight"
              style={{ color: theme.colors.text.primary }}
            >
              Arbitrage Calculator
            </h1>
            <p style={{ color: theme.colors.text.secondary }}>
              Calculate potential profits with exchange fees and transfers included
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calculator Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Calculate Profit</CardTitle>
                <CardDescription>
                  Enter investment amount and select opportunity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton height="2.5rem" width="100%" />
                    <Skeleton height="2.5rem" width="100%" />
                    <Skeleton height="2.5rem" width="100%" />
                    <Skeleton height="2.5rem" width="75%" />
                  </div>
                ) : (
                  <CalculatorForm 
                    opportunities={opportunitiesQuery.data || []}
                    exchangeFees={feesQuery.data || []}
                    onCalculate={setCalculationResult}
                  />
                )}
              </CardContent>
            </Card>

            {/* Calculation Results */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Profit Calculation Results</CardTitle>
                <CardDescription>
                  Detailed breakdown of your arbitrage transaction
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton height="2.5rem" width="100%" />
                    <Skeleton height="2.5rem" width="100%" />
                    <Skeleton height="2.5rem" width="100%" />
                    <Skeleton height="2.5rem" width="75%" />
                  </div>
                ) : (
                  <CalculatorResult result={calculationResult} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </SubscriptionGuard>
    </Layout>
  );
}