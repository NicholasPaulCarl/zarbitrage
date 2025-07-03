import { useState, useMemo } from 'react';
import { Exchange } from '@/lib/types';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface PriceHeatMapProps {
  internationalExchanges: Exchange[];
  localExchanges: Exchange[];
  exchangeRate: number;
  loading: boolean;
}

type ViewType = 'all' | 'international' | 'local';
type SortType = 'name' | 'price-asc' | 'price-desc';

export default function PriceHeatMap({
  internationalExchanges,
  localExchanges,
  exchangeRate,
  loading,
}: PriceHeatMapProps) {
  const [viewType, setViewType] = useState<ViewType>('all');
  const [sortType, setSortType] = useState<SortType>('price-desc');

  // Calculate normalized prices for all exchanges (in USD)
  const normalizedExchanges = useMemo(() => {
    if (loading) return [];

    const internationalNormalized = internationalExchanges.map(exchange => ({
      ...exchange,
      normalizedPrice: exchange.price,
      originalPrice: exchange.price,
      type: 'international' as const,
    }));

    const localNormalized = localExchanges.map(exchange => ({
      ...exchange,
      normalizedPrice: exchange.price / exchangeRate,
      originalPrice: exchange.price,
      type: 'local' as const,
    }));

    const allExchanges = [...internationalNormalized, ...localNormalized];

    return allExchanges;
  }, [internationalExchanges, localExchanges, exchangeRate, loading]);

  // Filter exchanges based on view type
  const filteredExchanges = useMemo(() => {
    if (viewType === 'all') return normalizedExchanges;
    return normalizedExchanges.filter(exchange => exchange.type === viewType);
  }, [normalizedExchanges, viewType]);

  // Sort exchanges based on sort type
  const sortedExchanges = useMemo(() => {
    if (sortType === 'name') {
      return [...filteredExchanges].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortType === 'price-asc') {
      return [...filteredExchanges].sort((a, b) => a.normalizedPrice - b.normalizedPrice);
    } else {
      return [...filteredExchanges].sort((a, b) => b.normalizedPrice - a.normalizedPrice);
    }
  }, [filteredExchanges, sortType]);

  // Calculate the min and max prices for color scaling
  const { minPrice, maxPrice, avgPrice } = useMemo(() => {
    if (filteredExchanges.length === 0) {
      return { minPrice: 0, maxPrice: 0, avgPrice: 0 };
    }

    const prices = filteredExchanges.map(e => e.normalizedPrice);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length;

    return { minPrice: min, maxPrice: max, avgPrice: avg };
  }, [filteredExchanges]);

  // Function to calculate the color gradient based on the price
  const getColorGradient = (price: number) => {
    if (maxPrice === minPrice) return 'bg-gray-100';

    // Normalize the price between 0 and 1
    const normalizedValue = (price - minPrice) / (maxPrice - minPrice);

    // Determine how much the price deviates from average (as percentage)
    const percentFromAvg = (price - avgPrice) / avgPrice;

    if (percentFromAvg > 0.02) {
      // Higher than average - green gradient
      const intensity = Math.min(0.2 + normalizedValue * 0.8, 1);
      if (intensity > 0.8) return 'bg-gradient-to-r from-green-50 to-green-500';
      if (intensity > 0.6) return 'bg-gradient-to-r from-green-50 to-green-400';
      if (intensity > 0.4) return 'bg-gradient-to-r from-green-50 to-green-300';
      if (intensity > 0.2) return 'bg-gradient-to-r from-green-50 to-green-200';
      return 'bg-gradient-to-r from-green-50 to-green-100';
    } else if (percentFromAvg < -0.02) {
      // Lower than average - blue gradient
      const intensity = Math.min(0.2 + (1 - normalizedValue) * 0.8, 1);
      if (intensity > 0.8) return 'bg-gradient-to-r from-blue-50 to-blue-500';
      if (intensity > 0.6) return 'bg-gradient-to-r from-blue-50 to-blue-400';
      if (intensity > 0.4) return 'bg-gradient-to-r from-blue-50 to-blue-300';
      if (intensity > 0.2) return 'bg-gradient-to-r from-blue-50 to-blue-200';
      return 'bg-gradient-to-r from-blue-50 to-blue-100';
    } else {
      // Close to average - neutral gradient
      return 'bg-gradient-to-r from-gray-50 to-gray-200';
    }
  };

  // Calculate the price difference from average as a percentage
  const getPriceDiffPercentage = (price: number) => {
    if (avgPrice === 0) return 0;
    return ((price - avgPrice) / avgPrice) * 100;
  };

  return (
    <Card className="mb-6 shadow-md">
      <CardHeader className="pb-2 md:pb-3">
        <div className="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:items-center sm:space-y-0 gap-2">
          <CardTitle className="text-base md:text-xl">Price Heat Map</CardTitle>
          <div className="flex flex-wrap gap-1 md:gap-2">
            <Button
              variant={sortType === 'name' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortType('name')}
              className="text-xs h-7 md:h-8 px-2 md:px-3"
            >
              Name
            </Button>
            <Button
              variant={sortType === 'price-asc' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortType('price-asc')}
              className="text-xs h-7 md:h-8 px-2 md:px-3"
            >
              Low to High
            </Button>
            <Button
              variant={sortType === 'price-desc' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortType('price-desc')}
              className="text-xs h-7 md:h-8 px-2 md:px-3"
            >
              High to Low
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 md:px-6">
        <Tabs defaultValue="all" className="w-full" onValueChange={(value) => setViewType(value as ViewType)}>
          <TabsList className="mb-3 w-full">
            <TabsTrigger value="all" className="text-xs md:text-sm flex-1">All</TabsTrigger>
            <TabsTrigger value="international" className="text-xs md:text-sm flex-1">USD</TabsTrigger>
            <TabsTrigger value="local" className="text-xs md:text-sm flex-1">ZAR</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="w-full">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="rounded-lg p-3 md:p-4 shadow-sm bg-gray-50">
                    <div className="flex justify-between items-start mb-1 md:mb-2">
                      <Skeleton className="h-5 w-24 md:w-32" />
                      <Skeleton className="h-5 w-10 rounded-md" />
                    </div>
                    <Skeleton className="h-7 md:h-8 w-28 md:w-36 mb-3" />
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-16 md:w-20" />
                      <Skeleton className="h-4 w-12 md:w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                {sortedExchanges.map((exchange) => {
                  const diffPercentage = getPriceDiffPercentage(exchange.normalizedPrice);
                  return (
                    <div 
                      key={exchange.name} 
                      className={`rounded-lg p-3 md:p-4 shadow-sm ${getColorGradient(exchange.normalizedPrice)}`}
                    >
                      <div className="flex justify-between items-start mb-1 md:mb-2">
                        <div className="font-medium text-sm md:text-base">{exchange.name}</div>
                        <Badge variant={exchange.type === 'international' ? 'outline' : 'secondary'} className="text-xs">
                          {exchange.type === 'international' ? 'USD' : 'ZAR'}
                        </Badge>
                      </div>
                      <div className="text-base md:text-lg font-bold">
                        {exchange.type === 'international' 
                          ? formatCurrency(exchange.originalPrice, 'USD')
                          : formatCurrency(exchange.originalPrice, 'ZAR')
                        }
                      </div>
                      <div className="flex justify-between items-center mt-1 md:mt-2 text-xs md:text-sm text-gray-600">
                        <div>
                          {exchange.type === 'local' && (
                            <span>≈ {formatCurrency(exchange.normalizedPrice, 'USD')}</span>
                          )}
                        </div>
                        <div className={`font-medium ${
                          diffPercentage > 2 
                            ? 'text-green-600' 
                            : diffPercentage < -2
                              ? 'text-blue-600' 
                              : 'text-gray-600'
                        }`}>
                          <span title="Difference from average price">
                            {diffPercentage > 0 && '+'}{formatPercentage(diffPercentage/100)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="international" className="w-full">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="rounded-lg p-3 md:p-4 shadow-sm bg-gray-50">
                    <div className="flex justify-between items-start mb-1 md:mb-2">
                      <Skeleton className="h-5 w-24 md:w-32" />
                      <Skeleton className="h-5 w-10 rounded-md" />
                    </div>
                    <Skeleton className="h-7 md:h-8 w-28 md:w-36 mb-3" />
                    <div className="flex justify-between items-center">
                      <div></div>
                      <Skeleton className="h-4 w-12 md:w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                {sortedExchanges.filter(e => e.type === 'international').map((exchange) => {
                  const diffPercentage = getPriceDiffPercentage(exchange.normalizedPrice);
                  return (
                    <div 
                      key={exchange.name} 
                      className={`rounded-lg p-3 md:p-4 shadow-sm ${getColorGradient(exchange.normalizedPrice)}`}
                    >
                      <div className="flex justify-between items-start mb-1 md:mb-2">
                        <div className="font-medium text-sm md:text-base">{exchange.name}</div>
                        <Badge variant="outline" className="text-xs">USD</Badge>
                      </div>
                      <div className="text-base md:text-lg font-bold">
                        {formatCurrency(exchange.originalPrice, 'USD')}
                      </div>
                      <div className="flex justify-between items-center mt-1 md:mt-2 text-xs md:text-sm text-gray-600">
                        <div></div>
                        <div className={`font-medium ${
                          diffPercentage > 2 
                            ? 'text-green-600' 
                            : diffPercentage < -2
                              ? 'text-blue-600' 
                              : 'text-gray-600'
                        }`}>
                          <span title="Difference from average price">
                            {diffPercentage > 0 && '+'}{formatPercentage(diffPercentage/100)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="local" className="w-full">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="rounded-lg p-3 md:p-4 shadow-sm bg-gray-50">
                    <div className="flex justify-between items-start mb-1 md:mb-2">
                      <Skeleton className="h-5 w-24 md:w-32" />
                      <Skeleton className="h-5 w-10 rounded-md" />
                    </div>
                    <Skeleton className="h-7 md:h-8 w-28 md:w-36 mb-3" />
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-16 md:w-20" />
                      <Skeleton className="h-4 w-12 md:w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                {sortedExchanges.filter(e => e.type === 'local').map((exchange) => {
                  const diffPercentage = getPriceDiffPercentage(exchange.normalizedPrice);
                  return (
                    <div 
                      key={exchange.name} 
                      className={`rounded-lg p-3 md:p-4 shadow-sm ${getColorGradient(exchange.normalizedPrice)}`}
                    >
                      <div className="flex justify-between items-start mb-1 md:mb-2">
                        <div className="font-medium text-sm md:text-base">{exchange.name}</div>
                        <Badge variant="secondary" className="text-xs">ZAR</Badge>
                      </div>
                      <div className="text-base md:text-lg font-bold">
                        {formatCurrency(exchange.originalPrice, 'ZAR')}
                      </div>
                      <div className="flex justify-between items-center mt-1 md:mt-2 text-xs md:text-sm text-gray-600">
                        <div>
                          ≈ {formatCurrency(exchange.normalizedPrice, 'USD')}
                        </div>
                        <div className={`font-medium ${
                          diffPercentage > 2 
                            ? 'text-green-600' 
                            : diffPercentage < -2
                              ? 'text-blue-600' 
                              : 'text-gray-600'
                        }`}>
                          <span title="Difference from average price">
                            {diffPercentage > 0 && '+'}{formatPercentage(diffPercentage/100)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-3 pt-3 md:mt-4 md:pt-4 border-t border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0 text-xs text-gray-500">
          <div className="flex flex-wrap gap-2 md:gap-3">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-400 rounded-full mr-1"></div>
              <span>Higher</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-200 rounded-full mr-1"></div>
              <span>Average</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-400 rounded-full mr-1"></div>
              <span>Lower</span>
            </div>
          </div>
          <div>
            Avg price: {loading ? '-' : formatCurrency(avgPrice, 'USD')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}