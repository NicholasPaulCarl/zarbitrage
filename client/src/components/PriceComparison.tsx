import { Card, CardContent, CardHeader, CardTitle } from '@/components/dark-ui';
import { Skeleton } from '@/components/dark-ui';
import { Badge } from '@/components/dark-ui';
import { useTheme } from '@/components/dark-ui';
import { Globe, Flag } from 'lucide-react';
import { formatZAR, formatUSD } from '@/lib/formatters';
import { Exchange } from '@/lib/types';
import { useIsMobile } from '@/hooks/use-mobile';

interface PriceComparisonProps {
  internationalExchanges: (Exchange & { zarEquivalent?: number })[];
  localExchanges: (Exchange & { usdEquivalent?: number })[];
  loading: boolean;
}

export default function PriceComparison({
  internationalExchanges,
  localExchanges,
  loading
}: PriceComparisonProps) {
  const { theme } = useTheme();
  const isMobile = useIsMobile();

  // Table view for desktop
  const renderInternationalExchanges = () => {
    if (loading) {
      // Generate different width skeletons to simulate different exchange names and prices
      const exchanges = [
        { nameWidth: 24, priceWidth: 20, zarWidth: 22 },
        { nameWidth: 22, priceWidth: 18, zarWidth: 20 },
        { nameWidth: 18, priceWidth: 21, zarWidth: 21 },
        { nameWidth: 20, priceWidth: 19, zarWidth: 23 }
      ];
      
      return exchanges.map((item, index) => (
        <tr key={`int-loading-${index}`} style={{ borderBottom: `1px solid ${theme.colors.border.primary}` }}>
          <td className="py-3 px-2 text-sm text-gray-800 font-medium">
            <Skeleton className={`h-5 w-${item.nameWidth}`} />
          </td>
          <td className="py-3 px-2 text-sm text-gray-800 text-right">
            <Skeleton className={`h-5 w-${item.priceWidth} ml-auto`} />
          </td>
          <td className="py-3 px-2 text-sm text-gray-800 text-right">
            <Skeleton className={`h-5 w-${item.zarWidth} ml-auto`} />
          </td>
        </tr>
      ));
    }

    return internationalExchanges.map((exchange, index) => (
      <tr key={`int-${index}`} style={{ borderBottom: `1px solid ${theme.colors.border.primary}` }} data-exchange-id={exchange.name.toLowerCase()}>
        <td className="py-3 px-2 text-sm font-medium" style={{ color: theme.colors.text.primary }}>{exchange.name}</td>
        <td className="py-3 px-2 text-sm text-right font-mono" style={{ color: theme.colors.text.primary }}>{formatUSD(exchange.price)}</td>
        <td className="py-3 px-2 text-sm text-right font-mono" style={{ color: theme.colors.text.primary }}>{formatZAR(exchange.zarEquivalent || 0)}</td>
      </tr>
    ));
  };

  const renderLocalExchanges = () => {
    if (loading) {
      // Generate different width skeletons to simulate different exchange names and prices
      const exchanges = [
        { nameWidth: 20, priceWidth: 22, usdWidth: 18 },
        { nameWidth: 22, priceWidth: 24, usdWidth: 18 },
        { nameWidth: 26, priceWidth: 20, usdWidth: 19 },
        { nameWidth: 18, priceWidth: 23, usdWidth: 20 }
      ];
      
      return exchanges.map((item, index) => (
        <tr key={`local-loading-${index}`} style={{ borderBottom: `1px solid ${theme.colors.border.primary}` }}>
          <td className="py-3 px-2 text-sm text-gray-800 font-medium">
            <Skeleton className={`h-5 w-${item.nameWidth}`} />
          </td>
          <td className="py-3 px-2 text-sm text-gray-800 text-right">
            <Skeleton className={`h-5 w-${item.priceWidth} ml-auto`} />
          </td>
          <td className="py-3 px-2 text-sm text-gray-800 text-right">
            <Skeleton className={`h-5 w-${item.usdWidth} ml-auto`} />
          </td>
        </tr>
      ));
    }

    return localExchanges.map((exchange, index) => (
      <tr key={`local-${index}`} style={{ borderBottom: `1px solid ${theme.colors.border.primary}` }} data-exchange-id={exchange.name.toLowerCase()}>
        <td className="py-3 px-2 text-sm font-medium" style={{ color: theme.colors.text.primary }}>{exchange.name}</td>
        <td className="py-3 px-2 text-sm text-right font-mono" style={{ color: theme.colors.text.primary }}>{formatZAR(exchange.price)}</td>
        <td className="py-3 px-2 text-sm text-right font-mono" style={{ color: theme.colors.text.primary }}>{formatUSD(exchange.usdEquivalent || 0)}</td>
      </tr>
    ));
  };

  // Card view for mobile
  const renderInternationalCards = () => {
    if (loading) {
      const cardConfigs = [
        { nameWidth: 24, usdWidth: 20, zarWidth: 24 },
        { nameWidth: 22, usdWidth: 18, zarWidth: 22 },
        { nameWidth: 26, usdWidth: 19, zarWidth: 23 },
        { nameWidth: 20, usdWidth: 21, zarWidth: 20 }
      ];
      
      return cardConfigs.map((config, index) => (
        <div key={`int-card-loading-${index}`} className="p-3" style={{ borderBottom: `1px solid ${theme.colors.border.primary}` }}>
          <div className="flex justify-between items-center mb-2">
            <Skeleton className={`h-5 w-${config.nameWidth}`} />
            <Skeleton className="h-4 w-12 rounded-full" />
          </div>
          <div className="flex justify-between mt-2">
            <div className="flex flex-col">
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className={`h-4 w-${config.usdWidth}`} />
            </div>
            <div className="flex flex-col items-end">
              <Skeleton className="h-3 w-20 mb-1" />
              <Skeleton className={`h-4 w-${config.zarWidth}`} />
            </div>
          </div>
        </div>
      ));
    }

    return internationalExchanges.map((exchange, index) => (
      <div key={`int-card-${index}`} className="p-3" style={{ borderBottom: `1px solid ${theme.colors.border.primary}` }} data-exchange-id={`card-${exchange.name.toLowerCase()}`}>
        <div className="flex justify-between items-center mb-2">
          <div className="font-medium text-sm" style={{ color: theme.colors.text.primary }}>{exchange.name}</div>
          <Badge variant="outline" className="text-xs">USD</Badge>
        </div>
        <div className="flex justify-between gap-2 text-xs">
          <div className="flex flex-col">
            <div style={{ color: theme.colors.text.secondary }}>USD Price:</div>
            <div className="font-mono font-medium" style={{ color: theme.colors.text.primary }}>{formatUSD(exchange.price)}</div>
          </div>
          <div className="flex flex-col items-end">
            <div style={{ color: theme.colors.text.secondary }}>ZAR Equivalent:</div>
            <div className="font-mono font-medium" style={{ color: theme.colors.text.primary }}>{formatZAR(exchange.zarEquivalent || 0)}</div>
          </div>
        </div>
      </div>
    ));
  };

  const renderLocalCards = () => {
    if (loading) {
      const cardConfigs = [
        { nameWidth: 22, zarWidth: 24, usdWidth: 18 },
        { nameWidth: 24, zarWidth: 26, usdWidth: 16 },
        { nameWidth: 20, zarWidth: 22, usdWidth: 19 },
        { nameWidth: 26, zarWidth: 20, usdWidth: 17 }
      ];
      
      return cardConfigs.map((config, index) => (
        <div key={`local-card-loading-${index}`} className="p-3" style={{ borderBottom: `1px solid ${theme.colors.border.primary}` }}>
          <div className="flex justify-between items-center mb-2">
            <Skeleton className={`h-5 w-${config.nameWidth}`} />
            <Skeleton className="h-4 w-12 rounded-full" />
          </div>
          <div className="flex justify-between mt-2">
            <div className="flex flex-col">
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className={`h-4 w-${config.zarWidth}`} />
            </div>
            <div className="flex flex-col items-end">
              <Skeleton className="h-3 w-20 mb-1" />
              <Skeleton className={`h-4 w-${config.usdWidth}`} />
            </div>
          </div>
        </div>
      ));
    }

    return localExchanges.map((exchange, index) => (
      <div key={`local-card-${index}`} className="p-3" style={{ borderBottom: `1px solid ${theme.colors.border.primary}` }} data-exchange-id={`card-${exchange.name.toLowerCase()}`}>
        <div className="flex justify-between items-center mb-2">
          <div className="font-medium text-sm" style={{ color: theme.colors.text.primary }}>{exchange.name}</div>
          <Badge variant="secondary" className="text-xs">ZAR</Badge>
        </div>
        <div className="flex justify-between gap-2 text-xs">
          <div className="flex flex-col">
            <div style={{ color: theme.colors.text.secondary }}>ZAR Price:</div>
            <div className="font-mono font-medium" style={{ color: theme.colors.text.primary }}>{formatZAR(exchange.price)}</div>
          </div>
          <div className="flex flex-col items-end">
            <div style={{ color: theme.colors.text.secondary }}>USD Equivalent:</div>
            <div className="font-mono font-medium" style={{ color: theme.colors.text.primary }}>{formatUSD(exchange.usdEquivalent || 0)}</div>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6" data-testid="price-comparison">
      {/* International Exchanges Card */}
      <Card data-testid="international-exchanges">
        <CardHeader className="pb-2">
          <CardTitle className="text-base md:text-lg flex items-center">
            <Globe className="h-5 w-5 mr-2" style={{ color: theme.colors.primary.main }} />
            International Exchanges
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-4">
          {/* Desktop View */}
          <div className="hidden md:block overflow-x-auto w-full scrollbar-thin">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.colors.border.secondary}` }}>
                  <th className="py-2 px-4 text-left text-xs md:text-sm font-medium whitespace-nowrap" style={{ color: theme.colors.text.secondary }}>Exchange</th>
                  <th className="py-2 px-4 text-right text-xs md:text-sm font-medium whitespace-nowrap" style={{ color: theme.colors.text.secondary }}>BTC/USD</th>
                  <th className="py-2 px-4 text-right text-xs md:text-sm font-medium whitespace-nowrap" style={{ color: theme.colors.text.secondary }}>≈ ZAR</th>
                </tr>
              </thead>
              <tbody>
                {renderInternationalExchanges()}
              </tbody>
            </table>
          </div>
          
          {/* Mobile Card View */}
          <div className="md:hidden">
            {renderInternationalCards()}
          </div>
        </CardContent>
      </Card>

      {/* South African Exchanges Card */}
      <Card data-testid="local-exchanges">
        <CardHeader className="pb-2">
          <CardTitle className="text-base md:text-lg flex items-center">
            <Flag className="h-5 w-5 mr-2" style={{ color: theme.colors.primary.main }} />
            South African Exchanges
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-4">
          {/* Desktop View */}
          <div className="hidden md:block overflow-x-auto w-full scrollbar-thin">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.colors.border.secondary}` }}>
                  <th className="py-2 px-4 text-left text-xs md:text-sm font-medium whitespace-nowrap" style={{ color: theme.colors.text.secondary }}>Exchange</th>
                  <th className="py-2 px-4 text-right text-xs md:text-sm font-medium whitespace-nowrap" style={{ color: theme.colors.text.secondary }}>BTC/ZAR</th>
                  <th className="py-2 px-4 text-right text-xs md:text-sm font-medium whitespace-nowrap" style={{ color: theme.colors.text.secondary }}>≈ USD</th>
                </tr>
              </thead>
              <tbody>
                {renderLocalExchanges()}
              </tbody>
            </table>
          </div>
          
          {/* Mobile Card View */}
          <div className="md:hidden">
            {renderLocalCards()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}