import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { formatPercentage } from "@/lib/formatters";
import { HistoricalSpread } from "@shared/schema";
import { format, parseISO, subDays } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

// Visx imports
import { curveMonotoneX } from '@visx/curve';
import { Group } from '@visx/group';
import { LinePath } from '@visx/shape';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows } from '@visx/grid';
import { scaleLinear, scaleTime } from '@visx/scale';
import { Tooltip as VisxTooltip, defaultStyles as defaultTooltipStyles } from '@visx/tooltip';
import { ParentSize } from '@visx/responsive';

// Helper functions - handles both daily dates and hourly timestamps
const getDate = (d: HistoricalSpread) => new Date(d.date);
const getHighValue = (d: HistoricalSpread) => d.highestSpread;
const getLowValue = (d: HistoricalSpread) => {
  // Always use the actual lowest spread value from our database
  // Ensure it's a number for type safety
  return typeof d.lowestSpread === 'number' ? d.lowestSpread : d.highestSpread;
};

// Constants - Minimal margins for full-width effect
const MARGIN = { top: 10, right: 0, bottom: 30, left: 30 };
const PRIMARY_COLOR = "#FF007F";
const SECONDARY_COLOR = "rgba(0, 128, 255, 0.8)";
const TOOLTIP_STYLES = {
  ...defaultTooltipStyles,
  minWidth: 160,
  maxWidth: 240,
  backgroundColor: 'white',
  color: '#333',
  border: '1px solid #ddd',
  borderRadius: '4px',
  padding: '8px 12px',
  fontSize: '12px',
  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
};

// Performance-optimized Chart component
const Chart = ({ data, width, height, isHourlyData = false }: { data: HistoricalSpread[], width: number, height: number, isHourlyData?: boolean }) => {
  const [tooltip, setTooltip] = useState<{
    data: HistoricalSpread;
    x: number;
    y: number;
  } | null>(null);

  // Chart bounds calculation
  const innerWidth = width - MARGIN.left - MARGIN.right;
  const innerHeight = height - MARGIN.top - MARGIN.bottom;

  // Process data - handle hourly vs daily data differently
  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Filter out negative spreads
    const positiveSpreadData = data.filter(item => 
      item.highestSpread > 0 && 
      typeof item.lowestSpread === 'number' && 
      item.lowestSpread > 0
    );
    
    if (isHourlyData) {
      // For hourly data: group by hour timestamp and select best route per hour
      const groupedByHour = new Map<string, HistoricalSpread[]>();
      positiveSpreadData.forEach(item => {
        const hourStr = item.date; // Full timestamp for hourly data
        if (!groupedByHour.has(hourStr)) {
          groupedByHour.set(hourStr, []);
        }
        groupedByHour.get(hourStr)?.push(item);
      });
      
      // For each hour, select the route with the highest average spread
      const bestRoutesByHour: HistoricalSpread[] = [];
      groupedByHour.forEach((items, hour) => {
        // Sort by average spread
        items.sort((a, b) => {
          const aLow = typeof a.lowestSpread === 'number' ? a.lowestSpread : a.highestSpread;
          const bLow = typeof b.lowestSpread === 'number' ? b.lowestSpread : b.highestSpread;
          const avgA = (a.highestSpread + aLow) / 2;
          const avgB = (b.highestSpread + bLow) / 2;
          return avgB - avgA; // Descending
        });
        
        // Take the best route for this hour
        if (items.length > 0) {
          bestRoutesByHour.push(items[0]);
        }
      });
      
      // Sort by timestamp
      return bestRoutesByHour.sort((a, b) => getDate(a).getTime() - getDate(b).getTime());
    } else {
      // For daily data: group by date and select best route per day (existing logic)
      const groupedByDate = new Map<string, HistoricalSpread[]>();
      positiveSpreadData.forEach(item => {
        const dateStr = item.date;
        if (!groupedByDate.has(dateStr)) {
          groupedByDate.set(dateStr, []);
        }
        groupedByDate.get(dateStr)?.push(item);
      });
      
      // For each date, select the route with the highest average spread
      const bestRoutesByDate: HistoricalSpread[] = [];
      groupedByDate.forEach((items, date) => {
        // Sort by average spread
        items.sort((a, b) => {
          const aLow = typeof a.lowestSpread === 'number' ? a.lowestSpread : a.highestSpread;
          const bLow = typeof b.lowestSpread === 'number' ? b.lowestSpread : b.highestSpread;
          const avgA = (a.highestSpread + aLow) / 2;
          const avgB = (b.highestSpread + bLow) / 2;
          return avgB - avgA; // Descending
        });
        
        // Take the best route
        if (items.length > 0) {
          bestRoutesByDate.push(items[0]);
        }
      });
      
      // Sort by date
      return bestRoutesByDate.sort((a, b) => getDate(a).getTime() - getDate(b).getTime());
    }
  }, [data, isHourlyData]);

  // Filter data based on data type - different logic for hourly vs daily
  const { filteredData, dataExtent } = useMemo(() => {
    if (sortedData.length === 0) {
      return {
        filteredData: [],
        dataExtent: { 
          minY: 0, 
          maxY: 5, 
          minX: new Date(), 
          maxX: new Date() 
        }
      };
    }
    
    const dates = sortedData.map(d => getDate(d));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    const minDateOriginal = new Date(Math.min(...dates.map(d => d.getTime())));
    
    let filtered = sortedData;
    let minX = minDateOriginal;
    
    if (isHourlyData) {
      // For hourly data: show all 24 hours without filtering
      // The API already provides exactly 24 hours with gap filling
      filtered = sortedData;
      minX = minDateOriginal;
    } else {
      // For daily data: use responsive filtering based on screen size
      let daysToShow = 30; // Desktop default
      if (width < 640) daysToShow = 14;  // Mobile
      else if (width < 1024) daysToShow = 21; // Tablet
      
      const cutoffDate = new Date(maxDate);
      cutoffDate.setDate(cutoffDate.getDate() - daysToShow);
      
      // Apply filter
      filtered = sortedData.filter(d => getDate(d) >= cutoffDate);
      minX = new Date(Math.max(minDateOriginal.getTime(), cutoffDate.getTime()));
    }
    
    // Skip empty or insufficient data
    if (filtered.length === 0) {
      return {
        filteredData: [],
        dataExtent: { 
          minY: 0, 
          maxY: 5, 
          minX: new Date(), 
          maxX: new Date() 
        }
      };
    }
    
    // Pre-calculate derived values for better performance
    const highs = filtered.map(getHighValue);
    const lows = filtered.map(getLowValue);
    
    // For missing data (0% spreads), ensure we show a small positive range
    const minY = Math.max(0, Math.min(...lows) - 0.3);
    const maxY = Math.max(1, Math.max(...highs) + 0.3); // Ensure at least 1% max for visibility
    
    return {
      filteredData: filtered,
      dataExtent: {
        minY,
        maxY,
        minX,
        maxX: maxDate
      }
    };
  }, [sortedData, width, isHourlyData]);

  // Create scales
  const xScale = useMemo(() => scaleTime({
    range: [0, innerWidth],
    domain: [dataExtent.minX, dataExtent.maxX],
  }), [innerWidth, dataExtent.minX, dataExtent.maxX]);

  const yScale = useMemo(() => scaleLinear({
    range: [innerHeight, 0],
    domain: [dataExtent.minY, dataExtent.maxY],
    nice: true,
  }), [innerHeight, dataExtent.minY, dataExtent.maxY]);

  // Memoize point positions to avoid recalculations
  const lineDataHigh = useMemo(() => 
    filteredData.map(d => ({
      x: xScale(getDate(d)),
      y: yScale(getHighValue(d)),
      data: d
    })), 
  [filteredData, xScale, yScale]);

  const lineDataLow = useMemo(() => 
    filteredData.map(d => ({
      x: xScale(getDate(d)),
      y: yScale(getLowValue(d)),
      data: d
    })),
  [filteredData, xScale, yScale]);

  // Optimize tooltip handler with throttling/debouncing
  const handleTooltip = (event: React.TouchEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>) => {
    if (filteredData.length === 0 || lineDataHigh.length === 0) return;
    
    const clientX = 'clientX' in event ? event.clientX : 0;
    const clientY = 'clientY' in event ? event.clientY : 0;
    
    const svgPoint = event.currentTarget.ownerSVGElement?.createSVGPoint();
    if (!svgPoint) return;
    
    svgPoint.x = clientX;
    svgPoint.y = clientY;
    const point = svgPoint.matrixTransform(event.currentTarget.getScreenCTM()?.inverse());
    
    // Find closest point using pre-calculated positions
    const x0 = point.x;
    let closestPoint = lineDataHigh[0];
    let minDistance = Math.abs(closestPoint.x - x0);
    
    for (let i = 1; i < lineDataHigh.length; i++) {
      const distance = Math.abs(lineDataHigh[i].x - x0);
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = lineDataHigh[i];
      }
    }
    
    setTooltip({
      data: closestPoint.data,
      x: closestPoint.x + MARGIN.left,
      y: closestPoint.y + MARGIN.top - 10
    });
  };

  if (filteredData.length === 0) return null;

  // Calculate reduced number of data points for markers when data is dense
  const pointInterval = Math.max(1, Math.floor(filteredData.length / (width < 640 ? 5 : 10)));
  const displayPoints = filteredData.filter((_, i) => i % pointInterval === 0);

  return (
    <>
      <svg width={width} height={height}>
        <Group left={MARGIN.left} top={MARGIN.top}>
          {/* Minimal grid - only horizontal lines */}
          <GridRows
            scale={yScale}
            width={innerWidth}
            height={innerHeight}
            stroke="#f0f0f0"
            strokeOpacity={0.5}
            numTicks={3}
          />
          
          {/* Minimal Y-axis */}
          <AxisLeft
            scale={yScale}
            hideAxisLine
            hideTicks
            numTicks={3}
            tickLabelProps={() => ({
              fill: '#999',
              fontSize: 9,
              textAnchor: 'end',
              dy: '0.3em',
              dx: -8
            })}
            tickFormat={(d) => `${d}%`}
          />
          
          {/* Minimal X-axis - reduced ticks */}
          <AxisBottom
            scale={xScale}
            top={innerHeight}
            hideAxisLine
            hideTicks
            tickLabelProps={() => ({
              fill: '#999',
              fontSize: 9,
              textAnchor: 'middle',
              dy: '1em'
            })}
            tickFormat={(d) => {
              const date = new Date(d as number);
              return isHourlyData 
                ? format(date, 'MMM dd HH:mm') 
                : format(date, 'MMM dd');
            }}
            numTicks={Math.min(5, filteredData.length)}
          />
          
          {/* High line - with conditional styling for missing data */}
          <LinePath
            data={lineDataHigh}
            x={d => d.x}
            y={d => d.y}
            stroke={isHourlyData ? "#ccc" : PRIMARY_COLOR} // Grey for hourly (will be overridden by segments)
            strokeWidth={2.5}
            curve={curveMonotoneX}
            opacity={isHourlyData ? 0.3 : 1}
          />
          
          {/* Low line - with conditional styling for missing data */}
          <LinePath
            data={lineDataLow}
            x={d => d.x}
            y={d => d.y}
            stroke={isHourlyData ? "#ccc" : SECONDARY_COLOR} // Grey for hourly (will be overridden by segments)
            strokeWidth={1.5}
            curve={curveMonotoneX}
            opacity={isHourlyData ? 0.2 : 0.7}
          />
          
          {/* Real data segments - only for hourly data with actual values */}
          {isHourlyData && lineDataHigh.map((d, i) => {
            if (i === 0 || !d.data) return null;
            const prevPoint = lineDataHigh[i - 1];
            if (!prevPoint.data) return null;
            
            // Draw colored segments for real data (non-zero spreads), grey for missing data (zero spreads)
            const hasRealData = d.data.highestSpread > 0 && prevPoint.data.highestSpread > 0;
            const strokeColor = hasRealData ? PRIMARY_COLOR : "#ccc";
            const strokeOpacity = hasRealData ? 1 : 0.3;
            
            return (
              <line
                key={`real-high-${i}`}
                x1={prevPoint.x}
                y1={prevPoint.y}
                x2={d.x}
                y2={d.y}
                stroke={strokeColor}
                strokeWidth={2.5}
                opacity={strokeOpacity}
              />
            );
          })}
          
          {isHourlyData && lineDataLow.map((d, i) => {
            if (i === 0 || !d.data) return null;
            const prevPoint = lineDataLow[i - 1];
            if (!prevPoint.data) return null;
            
            // Draw colored segments for real data (non-zero spreads), grey for missing data (zero spreads)
            const hasRealData = d.data.lowestSpread > 0 && prevPoint.data.lowestSpread > 0;
            const strokeColor = hasRealData ? SECONDARY_COLOR : "#ccc";
            const strokeOpacity = hasRealData ? 0.7 : 0.2;
            
            return (
              <line
                key={`real-low-${i}`}
                x1={prevPoint.x}
                y1={prevPoint.y}
                x2={d.x}
                y2={d.y}
                stroke={strokeColor}
                strokeWidth={1.5}
                opacity={strokeOpacity}
              />
            );
          })}
          
          {/* Data points with conditional styling for missing data */}
          {displayPoints.map((d, i) => {
            const isMissingData = d.highestSpread === 0;
            return (
              <circle
                key={`high-point-${i}`}
                cx={xScale(getDate(d))}
                cy={yScale(getHighValue(d))}
                r={isMissingData ? 1 : 2}
                fill={isMissingData ? "#ccc" : PRIMARY_COLOR}
                opacity={isMissingData ? 0.3 : (isHourlyData ? 0.8 : 0.6)}
              />
            );
          })}
          
          {displayPoints.map((d, i) => {
            const isMissingData = d.lowestSpread === 0;
            return (
              <circle
                key={`low-point-${i}`}
                cx={xScale(getDate(d))}
                cy={yScale(getLowValue(d))}
                r={isMissingData ? 1 : 1.5}
                fill={isMissingData ? "#ccc" : SECONDARY_COLOR}
                opacity={isMissingData ? 0.2 : (isHourlyData ? 0.6 : 0.4)}
              />
            );
          })}
          
          {/* Interaction layer */}
          <rect
            x={0}
            y={0}
            width={innerWidth}
            height={innerHeight}
            fill="transparent"
            onTouchStart={handleTooltip}
            onTouchMove={handleTooltip}
            onMouseMove={handleTooltip}
            onMouseLeave={() => setTooltip(null)}
          />
        </Group>
      </svg>
      
      {/* Tooltip */}
      {tooltip && (
        <VisxTooltip
          top={tooltip.y}
          left={tooltip.x}
          style={{
            ...TOOLTIP_STYLES,
            padding: '6px 8px',
            fontSize: '11px',
            backgroundColor: 'rgba(0,0,0,0.8)',
            color: 'white',
            border: 'none',
            borderRadius: '6px'
          }}
        >
          <div className="text-center">
            <div className="text-xs font-medium mb-1">
              {isHourlyData 
                ? format(getDate(tooltip.data), 'MMM d HH:mm') 
                : format(getDate(tooltip.data), 'MMM d')}
            </div>
            <div className="text-xs">
              <span style={{ color: PRIMARY_COLOR }}>High: {formatPercentage(tooltip.data.highestSpread)}</span>
              <br />
              <span style={{ color: SECONDARY_COLOR }}>Low: {
                tooltip.data.lowestSpread && tooltip.data.lowestSpread < tooltip.data.highestSpread
                  ? formatPercentage(tooltip.data.lowestSpread)
                  : formatPercentage(getLowValue(tooltip.data))
              }</span>
            </div>
          </div>
        </VisxTooltip>
      )}
    </>
  );
};

// Skeleton for loading state - minimal version
const ChartSkeleton = ({ height = 250 }: { height?: number }) => (
  <div className="w-full" style={{ height }}>
    <div className="relative h-full">
      <div className="absolute inset-0 bg-gray-50/30"></div>
      
      <div className="absolute inset-x-0 top-1/4 border-b border-dashed border-gray-200/50 w-full"></div>
      <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-gray-200/50 w-full"></div>
      <div className="absolute inset-x-0 top-3/4 border-b border-dashed border-gray-200/50 w-full"></div>
      
      <div className="absolute top-0 bottom-0 left-5 flex flex-col justify-between py-4">
        <Skeleton className="h-2 w-6" />
        <Skeleton className="h-2 w-6" />
        <Skeleton className="h-2 w-6" />
        <Skeleton className="h-2 w-6" />
      </div>
      
      <div className="absolute inset-x-0 top-4 bottom-8 mx-5">
        <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
          <path 
            d="M0,40 C10,30 20,35 30,25 C40,15 50,20 60,15 C70,10 80,5 90,10 L100,15" 
            fill="none" 
            stroke="#FF007F" 
            strokeWidth="2"
            opacity="0.3"
          />
          <path 
            d="M0,45 C10,40 20,42 30,35 C40,30 50,32 60,28 C70,25 80,20 90,22 L100,25" 
            fill="none" 
            stroke="rgba(0, 128, 255, 0.8)" 
            strokeWidth="1.5"
            opacity="0.2"
          />
        </svg>
      </div>
      
      <div className="absolute bottom-0 inset-x-0 flex justify-between px-5">
        <Skeleton className="h-2 w-8" />
        <Skeleton className="h-2 w-8" />
        <Skeleton className="h-2 w-8" />
        <Skeleton className="h-2 w-8" />
      </div>
    </div>
  </div>
);

// Main Chart Component
export default function TinyLineChart({ period = '7d' }: { period?: string }) {
  const auth = useAuth();
  
  // Period state - Daily (7d), Weekly (30d), or Monthly (90d)
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>(() => {
    // Try to load from localStorage
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('spread-trends-period');
        if (saved && (saved === '7d' || saved === '30d' || saved === '90d')) {
          return saved as '7d' | '30d' | '90d';
        }
      } catch (error) {
        console.warn('Failed to parse saved period:', error);
      }
    }
    return '7d'; // Default to daily view
  });

  // Save period to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('spread-trends-period', selectedPeriod);
      } catch (error) {
        console.warn('Failed to save period:', error);
      }
    }
  }, [selectedPeriod]);

  // Build query parameters and URL based on selected period
  const { queryUrl, queryKey } = useMemo(() => {
    // Daily view (7d) should use hourly granularity, others use daily
    const granularity = selectedPeriod === '7d' ? 'hour' : 'day';
    const url = `/api/historical-spread?period=${selectedPeriod}&granularity=${granularity}`;
    return {
      queryUrl: url,
      queryKey: [`/api/historical-spread`, 'period', selectedPeriod, granularity]
    };
  }, [selectedPeriod]);

  const { data = [], isLoading } = useQuery<HistoricalSpread[]>({
    queryKey,
    queryFn: async () => {
      const response = await fetch(queryUrl, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    enabled: true, // Enable for all users to see the chart
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnMount: true,
    refetchOnWindowFocus: false
  });


  
  // Period toggle handler
  const handlePeriodChange = (period: '7d' | '30d' | '90d') => {
    setSelectedPeriod(period);
  };
  
  return (
    <div className="w-full mb-6">
      {/* Minimal header with title and period toggle */}
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="text-lg font-semibold text-gray-900">Spread Trends</h3>
        <div className="flex rounded-lg bg-gray-100 p-1">
          <Button
            variant={selectedPeriod === '7d' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={() => handlePeriodChange('7d')}
          >
            Daily
          </Button>
          <Button
            variant={selectedPeriod === '30d' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={() => handlePeriodChange('30d')}
          >
            Weekly
          </Button>
          <Button
            variant={selectedPeriod === '90d' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={() => handlePeriodChange('90d')}
          >
            Monthly
          </Button>
        </div>
      </div>
      
      {/* Full-width chart */}
      <div className="h-[250px] w-full">
        {isLoading || !data ? (
          <ChartSkeleton height={250} />
        ) : (
          <div className="relative h-full w-full">
            {data.length < 3 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <p className="text-gray-500 text-sm mb-2">Limited historical data available</p>
                <p className="text-xs text-gray-400">
                  The chart requires more historical data to display trends properly.
                  <br />As you continue using the platform, more data will be collected.
                </p>
              </div>
            ) : (
              <ParentSize>
                {({ width, height }) => (
                  <Chart 
                    data={data} 
                    width={width} 
                    height={height} 
                    isHourlyData={selectedPeriod === '7d'}
                  />
                )}
              </ParentSize>
            )}
          </div>
        )}
      </div>
    </div>
  );
}