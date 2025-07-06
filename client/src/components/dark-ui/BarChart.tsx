import React, { useState } from 'react';
import { scaleBand, scaleLinear } from '@visx/scale';
import { Bar } from '@visx/shape';
import { Group } from '@visx/group';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows } from '@visx/grid';
import { LinearGradient } from '@visx/gradient';
import { useTheme } from './ThemeContext';

export interface BarData {
  label: string;
  value: number;
  color?: string;
}

export interface BarChartProps {
  data: BarData[];
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  showGrid?: boolean;
  showAxes?: boolean;
  gradientColors?: [string, string];
  animate?: boolean;
  horizontal?: boolean;
  onBarClick?: (data: BarData, index: number) => void;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  width,
  height,
  margin = { top: 20, right: 20, bottom: 40, left: 60 },
  showGrid = true,
  showAxes = true,
  gradientColors,
  animate = true,
  horizontal = false,
  onBarClick,
}) => {
  const { theme } = useTheme();
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  
  // Set default colors from theme
  const defaultGradientColors = gradientColors || [theme.colors.primary.main, theme.colors.primary.dark || `${theme.colors.primary.main}80`];

  // Bounds
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Scales
  const xScale = horizontal
    ? scaleLinear({
        domain: [0, Math.max(...data.map(d => d.value))],
        range: [0, innerWidth],
        nice: true,
      })
    : scaleBand({
        domain: data.map(d => d.label),
        range: [0, innerWidth],
        padding: 0.3,
      });

  const yScale = horizontal
    ? scaleBand({
        domain: data.map(d => d.label),
        range: [0, innerHeight],
        padding: 0.3,
      })
    : scaleLinear({
        domain: [0, Math.max(...data.map(d => d.value))],
        range: [innerHeight, 0],
        nice: true,
      });

  return (
    <svg width={width} height={height}>
      {/* Gradient definition */}
      <LinearGradient
        id="bar-gradient"
        from={defaultGradientColors[0]}
        to={defaultGradientColors[1]}
        vertical={!horizontal}
      />

      <Group transform={`translate(${margin.left},${margin.top})`}>
        {/* Grid */}
        {showGrid && (
          <GridRows
            scale={horizontal ? yScale : yScale}
            width={innerWidth}
            stroke={theme.colors.border.primary}
            strokeOpacity={0.2}
            pointerEvents="none"
          />
        )}

        {/* Bars */}
        {data.map((d, i) => {
          const barWidth = horizontal
            ? (xScale as any)(d.value) || 0
            : (xScale as any).bandwidth();
          const barHeight = horizontal
            ? (yScale as any).bandwidth()
            : innerHeight - ((yScale as any)(d.value) || 0);
          const barX = horizontal ? 0 : (xScale as any)(d.label) || 0;
          const barY = horizontal
            ? (yScale as any)(d.label) || 0
            : (yScale as any)(d.value) || 0;

          const isHovered = hoveredBar === i;
          const barFill = d.color || 'url(#bar-gradient)';

          return (
            <g key={`bar-${i}`}>
              <Bar
                x={barX}
                y={barY}
                width={barWidth}
                height={barHeight}
                fill={barFill}
                opacity={hoveredBar !== null && !isHovered ? 0.5 : 1}
                rx={4}
                className={`
                  transition-all duration-300 cursor-pointer
                  ${animate ? 'animate-grow-bar' : ''}
                `}
                style={{
                  filter: isHovered ? 'brightness(1.2)' : 'brightness(1)',
                  transformOrigin: horizontal ? 'left center' : 'center bottom',
                  animationDelay: animate ? `${i * 50}ms` : '0ms',
                }}
                onMouseEnter={() => setHoveredBar(i)}
                onMouseLeave={() => setHoveredBar(null)}
                onClick={() => onBarClick?.(d, i)}
              />
              
              {/* Value label on hover */}
              {isHovered && (
                <text
                  x={horizontal ? barX + barWidth + 5 : barX + barWidth / 2}
                  y={horizontal ? barY + barHeight / 2 : barY - 5}
                  fill={theme.colors.text.primary}
                  fontSize="14"
                  fontWeight="600"
                  textAnchor={horizontal ? 'start' : 'middle'}
                  alignmentBaseline="middle"
                  className="animate-fade-in"
                >
                  {d.value.toLocaleString()}
                </text>
              )}
            </g>
          );
        })}

        {/* Axes */}
        {showAxes && (
          <>
            <AxisBottom
              top={innerHeight}
              scale={horizontal ? xScale : xScale}
              numTicks={horizontal ? 5 : undefined}
              stroke={theme.colors.border.light}
              tickStroke={theme.colors.border.light}
              tickLabelProps={() => ({
                fill: theme.colors.text.secondary,
                fontSize: 12,
                textAnchor: 'middle',
              })}
            />
            <AxisLeft
              scale={horizontal ? yScale : yScale}
              numTicks={horizontal ? undefined : 5}
              stroke={theme.colors.border.light}
              tickStroke={theme.colors.border.light}
              tickLabelProps={() => ({
                fill: theme.colors.text.secondary,
                fontSize: 12,
                textAnchor: 'end',
                dy: '0.33em',
              })}
            />
          </>
        )}
      </Group>

      {/* Animation styles */}
      {animate && (
        <style>{`
          @keyframes growBar {
            from {
              transform: ${horizontal ? 'scaleX(0)' : 'scaleY(0)'};
              opacity: 0;
            }
            to {
              transform: ${horizontal ? 'scaleX(1)' : 'scaleY(1)'};
              opacity: 1;
            }
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          
          .animate-grow-bar {
            animation: growBar 0.6s ease-out forwards;
          }
          
          .animate-fade-in {
            animation: fadeIn 0.3s ease-out;
          }
        `}</style>
      )}
    </svg>
  );
};

// Grouped Bar Chart variant
export interface GroupedBarData {
  label: string;
  values: { key: string; value: number; color?: string }[];
}

export interface GroupedBarChartProps {
  data: GroupedBarData[];
  keys: string[];
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  showLegend?: boolean;
  colorScale?: (key: string) => string;
}

export const GroupedBarChart: React.FC<GroupedBarChartProps> = ({
  data,
  keys,
  width,
  height,
  margin = { top: 20, right: 20, bottom: 40, left: 60 },
  showLegend = true,
  colorScale,
}) => {
  const { theme } = useTheme();
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  
  // Default color scale using theme colors
  const defaultColorScale = colorScale || ((key: string) => {
    const colors = [
      theme.colors.primary.main,
      theme.colors.status.success,
      theme.colors.status.warning,
      theme.colors.status.error,
      theme.colors.text.secondary
    ];
    const index = keys.indexOf(key);
    return colors[index % colors.length];
  });

  // Bounds
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom - (showLegend ? 40 : 0);

  // Scales
  const xScale0 = scaleBand({
    domain: data.map(d => d.label),
    range: [0, innerWidth],
    padding: 0.2,
  });

  const xScale1 = scaleBand({
    domain: keys,
    range: [0, xScale0.bandwidth()],
    padding: 0.05,
  });

  const yScale = scaleLinear({
    domain: [
      0,
      Math.max(...data.flatMap(d => d.values.map(v => v.value))),
    ],
    range: [innerHeight, 0],
    nice: true,
  });

  return (
    <svg width={width} height={height}>
      <Group transform={`translate(${margin.left},${margin.top})`}>
        {/* Bars */}
        {data.map((group) => (
          <Group key={`group-${group.label}`} transform={`translate(${xScale0(group.label)},0)`}>
            {group.values.map((d) => {
              const barWidth = xScale1.bandwidth();
              const barHeight = innerHeight - (yScale(d.value) ?? 0);
              const barX = xScale1(d.key) ?? 0;
              const barY = yScale(d.value) ?? 0;
              const isHovered = hoveredGroup === d.key;

              return (
                <Bar
                  key={`bar-${group.label}-${d.key}`}
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={barHeight}
                  fill={d.color || defaultColorScale(d.key)}
                  opacity={hoveredGroup !== null && !isHovered ? 0.3 : 1}
                  rx={2}
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setHoveredGroup(d.key)}
                  onMouseLeave={() => setHoveredGroup(null)}
                />
              );
            })}
          </Group>
        ))}

        {/* Axes */}
        <AxisBottom
          top={innerHeight}
          scale={xScale0}
          stroke={theme.colors.border.light}
          tickStroke={theme.colors.border.light}
          tickLabelProps={() => ({
            fill: theme.colors.text.secondary,
            fontSize: 12,
            textAnchor: 'middle',
          })}
        />
        <AxisLeft
          scale={yScale}
          numTicks={5}
          stroke={theme.colors.border.light}
          tickStroke={theme.colors.border.light}
          tickLabelProps={() => ({
            fill: theme.colors.text.secondary,
            fontSize: 12,
            textAnchor: 'end',
            dy: '0.33em',
          })}
        />

        {/* Legend */}
        {showLegend && (
          <Group transform={`translate(0, ${innerHeight + 50})`}>
            {keys.map((key, i) => (
              <Group key={`legend-${key}`} transform={`translate(${i * 100}, 0)`}>
                <rect
                  width={16}
                  height={16}
                  fill={defaultColorScale(key)}
                  opacity={hoveredGroup !== null && hoveredGroup !== key ? 0.3 : 1}
                  className="transition-opacity duration-300"
                />
                <text
                  x={20}
                  y={12}
                  fill={theme.colors.text.secondary}
                  fontSize={12}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredGroup(key)}
                  onMouseLeave={() => setHoveredGroup(null)}
                >
                  {key}
                </text>
              </Group>
            ))}
          </Group>
        )}
      </Group>
    </svg>
  );
}; 