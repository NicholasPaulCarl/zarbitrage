import React, { useMemo, useState } from 'react';
import { ArbitrageOpportunity } from '@shared/schema';
import { Skeleton, useTheme } from '@/components/dark-ui';
import { useIsMobile } from '../hooks/use-mobile';

// Import Visx components
import { Group } from '@visx/group';
import { Bar } from '@visx/shape';
import { scaleLinear, scaleBand } from '@visx/scale';
import { AxisLeft } from '@visx/axis';
import { GridRows } from '@visx/grid';
import { Tooltip as VisxTooltip, defaultStyles as defaultTooltipStyles } from '@visx/tooltip';
import { ParentSize } from '@visx/responsive';

interface SpreadBarChartProps {
  opportunities: ArbitrageOpportunity[];
  loading: boolean;
}

export default function SpreadBarChart({ opportunities, loading }: SpreadBarChartProps) {
  const isMobile = useIsMobile();

  // State for tooltip
  const [tooltipData, setTooltipData] = useState<ArbitrageOpportunity | null>(null);
  const [tooltipLeft, setTooltipLeft] = useState(0);
  const [tooltipTop, setTooltipTop] = useState(0);

  // Primary color from theme
  const { theme } = useTheme();
  const primaryColor = theme.colors.primary.main;

  // Filter and prepare data for visualization
  const visData = useMemo(() => {
    return opportunities
      // Only include valid opportunities with positive spread
      .filter(opp => opp && opp.spreadPercentage > 0)
      // Take top 5
      .slice(0, 5)
      // Create a new array with the data we need
      .map(opp => ({
        ...opp,
        route: `${opp.buyExchange} → ${opp.sellExchange}`,
      }))
      // Sort by spreadPercentage in descending order
      .sort((a, b) => b.spreadPercentage - a.spreadPercentage);
  }, [opportunities]);

  if (loading) {
    return (
      <div className="w-full h-full">
        <Skeleton height="100%" width="100%" />
      </div>
    );
  }

  if (visData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full rounded-lg border" style={{ backgroundColor: theme.colors.background.tertiary, borderColor: theme.colors.border.primary }}>
        <p className="text-sm" style={{ color: theme.colors.text.secondary }}>No arbitrage opportunities available</p>
      </div>
    );
  }

  // Tooltip styles
  const tooltipStyles = {
    ...defaultTooltipStyles,
    minWidth: 160,
    maxWidth: 240,
    backgroundColor: theme.colors.background.elevated,
    color: theme.colors.text.primary,
    border: `1px solid ${theme.colors.border.primary}`,
    borderRadius: '4px',
    padding: '8px 12px',
    fontSize: '12px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  };

  // Show tooltip
  const showTooltip = (opportunity: ArbitrageOpportunity, top: number, left: number) => {
    setTooltipData(opportunity);
    setTooltipTop(top);
    setTooltipLeft(left);
  };

  // Hide tooltip
  const hideTooltip = () => setTooltipData(null);

  // Render the chart with proper dimensions
  return (
    <div className="w-full h-full">
      <ParentSize>
        {({ width, height }) => {
          // Skip rendering if no dimensions
          if (width < 10 || height < 10) return null;

          // Chart margins
          const margin = { top: 20, right: 20, bottom: 60, left: 60 };

          // Bounds
          const innerWidth = width - margin.left - margin.right;
          const innerHeight = height - margin.top - margin.bottom;

          // Scales
          const yMax = Math.max(...visData.map(d => d.spreadPercentage)) * 1.1;

          const yScale = scaleLinear({
            range: [innerHeight, 0],
            domain: [0, yMax],
            nice: true,
          });

          const xScale = scaleBand({
            range: [0, innerWidth],
            domain: visData.map(d => d.route),
            padding: 0.4,
          });

          // Bar width
          const barWidth = xScale.bandwidth();

          return (
            <>
              <svg width={width} height={height}>
                <Group left={margin.left} top={margin.top}>
                  {/* Add grid */}
                  <GridRows
                    scale={yScale}
                    width={innerWidth}
                    height={innerHeight}
                    stroke={theme.colors.border.primary}
                    strokeOpacity={0.3}
                    strokeDasharray="3,3"
                    numTicks={4}
                  />

                  {/* Add Y-axis */}
                  <AxisLeft
                    scale={yScale}
                    hideAxisLine
                    tickStroke={theme.colors.border.primary}
                    numTicks={4}
                    tickLabelProps={() => ({
                      fill: theme.colors.text.tertiary,
                      fontSize: 10,
                      textAnchor: 'end',
                      dy: '0.3em',
                      dx: -4
                    })}
                    tickFormat={d => `${d.toFixed(1)}%`}
                  />

                  {/* Render bars */}
                  {visData.map((opportunity, i) => {
                    const barHeight = innerHeight - yScale(opportunity.spreadPercentage);
                    const x = xScale(opportunity.route) || 0;
                    const y = innerHeight - barHeight;

                    return (
                      <Bar
                        key={`bar-${i}`}
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        fill={primaryColor}
                        opacity={0.8}
                        rx={4}
                        onMouseEnter={(event) => {
                          const { clientX, clientY } = event;
                          showTooltip(opportunity, clientY, clientX);
                        }}
                        onMouseLeave={hideTooltip}
                        style={{ cursor: 'pointer' }}
                      />
                    );
                  })}

                  {/* Add exchange labels beneath bars */}
                  {visData.map((opportunity, i) => {
                    const x = (xScale(opportunity.route) || 0) + barWidth / 2;
                    return (
                      <text
                        key={`label-${i}`}
                        x={x}
                        y={innerHeight + 20}
                        fontSize={10}
                        textAnchor="middle"
                        fill={theme.colors.text.secondary}
                        transform={`rotate(-20, ${x}, ${innerHeight + 20})`}
                      >
                        {opportunity.route}
                      </text>
                    );
                  })}
                </Group>
              </svg>

              {/* Tooltip */}
              {tooltipData && (
                <VisxTooltip
                  top={tooltipTop - 140} // Offset tooltip to appear above pointer
                  left={tooltipLeft}
                  style={tooltipStyles}
                >
                  <div className="font-medium mb-1">{tooltipData.route}</div>
                    <div className="mb-1">
                      High: <span className="font-medium text-primary">
                        {tooltipData.spreadPercentage.toFixed(2)}%
                      </span>
                    </div>
                    {/* Removed the low spread display as requested */}
                  <div className="grid grid-cols-2 gap-x-2 text-xs mt-2">
                    <span className="text-gray-600">Buy Price:</span>
                    <span className="font-mono">
                      ${tooltipData.buyPrice.toLocaleString('en-US', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      })}
                    </span>

                    <span className="text-gray-600">Sell Price:</span>
                    <span className="font-mono">
                      R {tooltipData.sellPrice.toLocaleString('en-ZA', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      })}
                    </span>
                  </div>
                </VisxTooltip>
              )}
            </>
          );
        }}
      </ParentSize>
    </div>
  );
}