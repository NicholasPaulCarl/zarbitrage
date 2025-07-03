
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { formatPercentage } from "@/lib/formatters";
import { HistoricalSpread } from "@shared/schema";
import { format, parseISO } from "date-fns";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ChartProps {
  isLoading: boolean;
  data: HistoricalSpread[];
}

// The main Tiny Line Chart component showing spread trends
const TinyLineChartRenderer = ({ isLoading, data }: ChartProps) => {
  // Format data for the chart
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map((item) => ({
      date: format(parseISO(item.date), "MMM dd"),
      value: item.highestSpread,
      fullDate: item.date,
      route: item.route
    }));
  }, [data]);
  
  if (isLoading || !data) {
    return <Skeleton className="w-full h-[120px]" />;
  }
  
  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-md shadow-sm">
          <p className="font-semibold">{data.fullDate}</p>
          <p>{`Spread: ${formatPercentage(data.value)}`}</p>
          <p className="text-gray-600 text-sm">{`Route: ${data.route}`}</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="w-full h-[120px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
        >
          <RechartsTooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default function TinyLineChart() {
  const { isAuthenticated } = useAuth();
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  
  // Fetch data for all users since endpoint is now accessible to everyone
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery<HistoricalSpread[]>({
    queryKey: ['/api/historical-spread'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3, // Increase retry attempts
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gets focus
    queryFn: async ({ queryKey }) => {
      console.log("Fetching historical spread data...");
      const response = await fetch(queryKey[0] as string, {
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include' // Include credentials for authentication
      });
      
      if (!response.ok) {
        console.error(`Error response from historical spread: ${response.status} ${response.statusText}`);
        throw new Error(`Error fetching historical spread data: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Historical spread data:", data);
      return data;
    }
  });
  
  // Attempt to refetch data
  useEffect(() => {
    if (!hasAttemptedFetch) {
      refetch();
      setHasAttemptedFetch(true);
    }
  }, [hasAttemptedFetch, refetch]);
  
  // If there's an error or no data, show an appropriate message
  const hasData = !isLoading && data && data.length > 0;
  
  return (
    <Card className="bg-white shadow-md mb-6">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              Weekly Spread Trends
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Shows the highest spread percentage for each day over the last week based on recorded alerts.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <CardDescription>Highest percentage spread opportunities over time</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-2">
        {error ? (
          <div className="w-full h-[120px] flex items-center justify-center text-gray-500">
            <p>Failed to load historical data. Please try again later.</p>
          </div>
        ) : !hasData && !isLoading ? (
          <div className="w-full h-[120px] flex items-center justify-center text-gray-500">
            <p>No historical data available yet. Alerts will appear here as they are triggered.</p>
          </div>
        ) : (
          <TinyLineChartRenderer isLoading={isLoading} data={data || []} />
        )}
      </CardContent>
    </Card>
  );
}