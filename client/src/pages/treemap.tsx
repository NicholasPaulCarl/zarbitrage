import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import SpreadTreeMap from '@/components/SpreadTreeMap';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArbitrageOpportunity } from '@shared/schema';

export default function TreeMapPage() {
  const { isAuthenticated } = useAuth();

  const { data: opportunities, isLoading: opportunitiesLoading } = useQuery<ArbitrageOpportunity[]>({
    queryKey: ['/api/arbitrage'],
    enabled: isAuthenticated,
  });

  return (
    <ProtectedRoute>
      <Layout>
        <div className="container mx-auto py-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Arbitrage Spread TreeMap</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                This interactive visualization displays current arbitrage opportunities using a tree map chart. 
                Each rectangle represents a trading route between exchanges with:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-4">
                <li><span className="font-medium">Size</span> - Proportional to the spread percentage (bigger = higher %)</li>
                <li><span className="font-medium">Color</span> - Intensity indicates potential profit (more vibrant green = higher %)</li>
                <li><span className="font-medium">Tooltip</span> - Hover over any rectangle to see detailed information</li>
              </ul>
              <p className="text-sm text-muted-foreground bg-amber-50 p-3 rounded-md border border-amber-200">
                <span className="font-medium">Pro Tip:</span> The largest rectangles represent the most profitable arbitrage opportunities at this moment.
                Focus on these for potentially higher returns.
              </p>
            </CardContent>
          </Card>

          <SpreadTreeMap 
            opportunities={Array.isArray(opportunities) ? opportunities : []} 
            loading={opportunitiesLoading} 
          />
        </div>
      </Layout>
    </ProtectedRoute>
  );
}