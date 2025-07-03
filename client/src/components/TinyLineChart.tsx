import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { formatPercentage } from "@/lib/formatters";
import { HistoricalSpread } from "@shared/schema";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Visx imports
import { curveMonotoneX } from '@visx/curve';
import { Group } from '@visx/group';
import { LinePath } from '@visx/shape';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows } from '@visx/grid';
import { scaleLinear, scaleTime } from '@visx/scale';
import { Tooltip as VisxTooltip, defaultStyles as defaultTooltipStyles } from '@visx/tooltip';
import { ParentSize } from '@visx/responsive';

// Helper functions
const getDate = (d: HistoricalSpread) => new Date(d.date);
const getHighValue = (d: HistoricalSpread) => d.highestSpread;
const getLowValue = (d: HistoricalSpread) => {
  // Always use the actual lowest spread value from our database
  // Ensure it's a number for type safety
  return typeof d.lowestSpread === 'number' ? d.lowestSpread : d.highestSpread;
};

// Constants
const MARGIN = { top: 20, right: 20, bottom: 40, left: 40 };
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
const Chart = ({ data, width, height }: { data: HistoricalSpread[], width: number, height: number }) => {
  const [tooltip, setTooltip] = useState<{
    data: HistoricalSpread;
    x: number;
    y: number;
  } | null>(null);

  // Chart bounds calculation
  const innerWidth = width - MARGIN.left - MARGIN.right;
  const innerHeight = height - MARGIN.top - MARGIN.bottom;

  // Process data - filter positive spreads and select best routes by date
  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Filter out negative spreads
    const positiveSpreadData = data.filter(item => 
      item.highestSpread > 0 && 
      typeof item.lowestSpread === 'number' && 
      item.lowestSpread > 0
    );
    
    // Group by date
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
  }, [data]);

  // Filter data based on screen width for responsive display
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
    
    // Ensure we always show at least 7 days, with more on larger screens
    let daysToShow = 30; // Desktop default
    if (width < 640) daysToShow = 14;  // Mobile - increased from 7 to 14
    else if (width < 1024) daysToShow = 21; // Tablet - increased from 14 to 21
    
    const cutoffDate = new Date(maxDate);
    cutoffDate.setDate(cutoffDate.getDate() - daysToShow);
    
    // Apply filter
    const filtered = sortedData.filter(d => getDate(d) >= cutoffDate);
    
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
    const minX = new Date(Math.max(minDateOriginal.getTime(), cutoffDate.getTime()));
    const highs = filtered.map(getHighValue);
    const lows = filtered.map(getLowValue);
    
    return {
      filteredData: filtered,
      dataExtent: {
        minY: Math.max(0, Math.min(...lows) - 0.3),
        maxY: Math.max(...highs) + 0.3,
        minX,
        maxX: maxDate
      }
    };
  }, [sortedData, width]);

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
          {/* Grid */}
          <GridRows
            scale={yScale}
            width={innerWidth}
            height={innerHeight}
            stroke="#e0e0e0"
            strokeOpacity={0.3}
            strokeDasharray="3,3"
            numTicks={5}
          />
          
          {/* Y-axis */}
          <AxisLeft
            scale={yScale}
            hideAxisLine
            tickStroke="#e0e0e0"
            numTicks={4}
            tickLabelProps={() => ({
              fill: '#888',
              fontSize: 10,
              textAnchor: 'end',
              dy: '0.3em',
              dx: -4
            })}
            tickFormat={(d) => `${d}%`}
          />
          
          {/* X-axis - ensure we show ALL dates clearly */}
          <AxisBottom
            scale={xScale}
            top={innerHeight}
            hideAxisLine
            tickStroke="#e0e0e0"
            tickLabelProps={() => ({
              fill: '#888',
              fontSize: 10,
              textAnchor: 'middle',
              dy: '1em'
            })}
            tickFormat={(d) => format(new Date(d as number), 'MMM dd')}
            tickValues={filteredData.map(d => getDate(d).getTime())} // Show a tick for each date point
          />
          
          {/* High line - use pre-calculated values */}
          <LinePath
            data={lineDataHigh}
            x={d => d.x}
            y={d => d.y}
            stroke={PRIMARY_COLOR}
            strokeWidth={2.5}
            curve={curveMonotoneX}
          />
          
          {/* Low line - use pre-calculated values */}
          <LinePath
            data={lineDataLow}
            x={d => d.x}
            y={d => d.y}
            stroke={SECONDARY_COLOR}
            strokeWidth={1.5}
            curve={curveMonotoneX}
            opacity={0.7}
          />
          
          {/* High data points - only show a subset of points based on screen size */}
          {displayPoints.map((d, i) => (
            <circle
              key={`high-point-${i}`}
              cx={xScale(getDate(d))}
              cy={yScale(getHighValue(d))}
              r={3.5}
              fill="white"
              stroke={PRIMARY_COLOR}
              strokeWidth={1.5}
            />
          ))}
          
          {/* Low data points - only show a subset */}
          {displayPoints.map((d, i) => (
            <circle
              key={`low-point-${i}`}
              cx={xScale(getDate(d))}
              cy={yScale(getLowValue(d))}
              r={2.5}
              fill="white"
              stroke={SECONDARY_COLOR}
              strokeWidth={1}
              opacity={0.7}
            />
          ))}
          
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
          style={TOOLTIP_STYLES}
        >
          <div>
            <div className="text-sm font-semibold">
              {format(getDate(tooltip.data), 'MMM d, yyyy')}
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs">High:</span>
                <span className="font-semibold" style={{ color: PRIMARY_COLOR }}>
                  {formatPercentage(tooltip.data.highestSpread)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 mt-1">
                <span className="text-xs">Low:</span>
                <span className="font-semibold" style={{ color: SECONDARY_COLOR }}>
                  {tooltip.data.lowestSpread && tooltip.data.lowestSpread < tooltip.data.highestSpread
                    ? formatPercentage(tooltip.data.lowestSpread)
                    : formatPercentage(getLowValue(tooltip.data))}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                <span className="font-medium">Route:</span> {tooltip.data.route}
              </div>
            </div>
          </div>
        </VisxTooltip>
      )}
    </>
  );
};

// Skeleton for loading state
const ChartSkeleton = ({ height = 250 }: { height?: number }) => (
  <div className="w-full" style={{ height }}>
    <div className="flex justify-between text-xs text-gray-500 mb-1">
      <div>Monthly High: <Skeleton className="inline-block h-3 w-12" /></div>
      <div>Monthly Low: <Skeleton className="inline-block h-3 w-12" /></div>
    </div>
    <div className="relative h-[90%]">
      <div className="absolute inset-0 bg-gray-50 rounded-md"></div>
      
      <div className="absolute inset-x-0 top-1/4 border-b border-dashed border-gray-200 w-full"></div>
      <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-gray-200 w-full"></div>
      <div className="absolute inset-x-0 top-3/4 border-b border-dashed border-gray-200 w-full"></div>
      
      <div className="absolute top-0 bottom-0 left-5 flex flex-col justify-between py-4">
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-3 w-8" />
      </div>
      
      <div className="absolute inset-x-0 top-4 bottom-8 mx-10">
        <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
          <path 
            d="M0,40 C10,30 20,35 30,25 C40,15 50,20 60,15 C70,10 80,5 90,10 L100,15" 
            fill="none" 
            stroke="#FF007F" 
            strokeWidth="2"
          />
          <path 
            d="M0,45 C10,40 20,42 30,35 C40,30 50,32 60,28 C70,25 80,20 90,22 L100,25" 
            fill="none" 
            stroke="rgba(0, 128, 255, 0.8)" 
            strokeWidth="1.5"
            opacity="0.7"
          />
        </svg>
      </div>
      
      <div className="absolute bottom-0 inset-x-0 flex justify-between px-10">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  </div>
);

// Main Chart Component
export default function TinyLineChart({ period = '30d' }: { period?: string }) {
  const auth = useAuth();
  const { data = [], isLoading } = useQuery<HistoricalSpread[]>({
    queryKey: [`/api/historical-spread`, period],
    enabled: true, // Enable for all users to see the chart
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: false
  });


  
  // Calculate high/low summary metrics
  const { monthlyHigh, monthlyLow } = useMemo(() => {
    if (!data || data.length === 0) return { monthlyHigh: 0, monthlyLow: 0 };
    
    // Filter to only positive spread items with valid lowest values
    const validItems = data.filter(item => 
      item.highestSpread > 0 && 
      typeof item.lowestSpread === 'number' && 
      item.lowestSpread > 0
    );
    
    if (validItems.length === 0) return { monthlyHigh: 0, monthlyLow: 0 };
    
    const high = Math.max(...validItems.map(item => item.highestSpread));
    
    // Find the lowest that isn't equal to highest (if available)
    const validLows = validItems.filter(item => 
      typeof item.lowestSpread === 'number' && 
      item.lowestSpread < item.highestSpread
    );
    
    const low = validLows.length > 0
      ? Math.min(...validLows.map(item => item.lowestSpread as number))
      : high * 0.9; // Fallback to 90% of high if all lows equal highest
    
    return { monthlyHigh: high, monthlyLow: low };
  }, [data]);
  
  return (
    <Card className="bg-white shadow-none border-none rounded-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            Spread Trends
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info size={16} className="text-gray-400 cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="max-w-xs">
                    Shows highest and lowest daily spread percentages over time.
                    <br /><br />
                    <span className="text-primary font-semibold">Pink line</span>: Highest daily spread
                    <br />
                    <span style={{ color: "rgba(0, 128, 255, 0.8)" }} className="font-semibold">Blue line</span>: Lowest daily spread
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </div>
        <CardDescription className="text-xs text-gray-500">
          Displays spread percentage trends over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          {isLoading || !data ? (
            <ChartSkeleton height={250} />
          ) : (
            <>
              {data.length > 0 && (
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <div>Monthly High: <span className="font-bold text-primary">{formatPercentage(monthlyHigh)}</span></div>
                  <div>Monthly Low: <span className="font-bold" style={{ color: "rgba(0, 128, 255, 0.8)" }}>
                    {formatPercentage(monthlyLow)}
                  </span></div>
                </div>
              )}
              <div className="relative" style={{ height: '90%' }}>
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
                      />
                    )}
                  </ParentSize>
                )}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}