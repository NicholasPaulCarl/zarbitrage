import React, { useMemo } from 'react';
import { scaleLinear, scaleTime } from '@visx/scale';
import { curveMonotoneX } from '@visx/curve';
import { LinePath } from '@visx/shape';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows, GridColumns } from '@visx/grid';
import { LinearGradient } from '@visx/gradient';
import { useTheme } from './ThemeContext';

export interface DataPoint {
  date: Date | string;
  value: number;
}

export interface LineChartProps {
  data: DataPoint[];
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  showGrid?: boolean;
  showAxes?: boolean;
  gradientColors?: [string, string];
  strokeColor?: string;
  strokeWidth?: number;
  animate?: boolean;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  width,
  height,
  margin = { top: 20, right: 20, bottom: 40, left: 60 },
  showGrid = true,
  showAxes = true,
  gradientColors,
  strokeColor,
  strokeWidth = 3,
  animate = true,
}) => {
  const { theme } = useTheme();
  
  // Set default colors from theme
  const defaultGradientColors = gradientColors || [theme.colors.primary.main, `${theme.colors.primary.main}40`];
  const defaultStrokeColor = strokeColor || theme.colors.primary.main;
  // Bounds
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Prepare data
  const preparedData = useMemo(() => 
    data.map(d => ({
      ...d,
      date: typeof d.date === 'string' ? new Date(d.date) : d.date
    })),
    [data]
  );

  // Scales
  const xScale = useMemo(() => 
    scaleTime({
      domain: [
        Math.min(...preparedData.map(d => d.date.getTime())),
        Math.max(...preparedData.map(d => d.date.getTime()))
      ],
      range: [0, innerWidth],
    }),
    [preparedData, innerWidth]
  );

  const yScale = useMemo(() => {
    const minValue = Math.min(...preparedData.map(d => d.value));
    const maxValue = Math.max(...preparedData.map(d => d.value));
    const padding = (maxValue - minValue) * 0.1;
    
    return scaleLinear({
      domain: [minValue - padding, maxValue + padding],
      range: [innerHeight, 0],
      nice: true,
    });
  }, [preparedData, innerHeight]);

  const getX = (d: typeof preparedData[0]) => xScale(d.date) ?? 0;
  const getY = (d: typeof preparedData[0]) => yScale(d.value) ?? 0;

  return (
    <svg width={width} height={height}>
      {/* Gradient definition */}
      <LinearGradient
        id="line-gradient"
        from={defaultGradientColors[0]}
        to={defaultGradientColors[1]}
        fromOpacity={0.8}
        toOpacity={0.3}
      />

      <g transform={`translate(${margin.left},${margin.top})`}>
        {/* Grid */}
        {showGrid && (
          <>
            <GridRows
              scale={yScale}
              width={innerWidth}
              stroke={theme.colors.border.primary}
              strokeOpacity={0.2}
              pointerEvents="none"
            />
            <GridColumns
              scale={xScale}
              height={innerHeight}
              stroke={theme.colors.border.primary}
              strokeOpacity={0.2}
              pointerEvents="none"
            />
          </>
        )}

        {/* Line */}
        <LinePath
          data={preparedData}
          x={getX}
          y={getY}
          stroke={defaultStrokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          curve={curveMonotoneX}
          className={animate ? 'animate-draw-line' : ''}
        />

        {/* Axes */}
        {showAxes && (
          <>
            <AxisBottom
              top={innerHeight}
              scale={xScale}
              numTicks={5}
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
          </>
        )}
      </g>

      {/* Animation styles */}
      {animate && (
        <style>{`
          @keyframes drawLine {
            to {
              stroke-dashoffset: 0;
            }
          }
          
          .animate-draw-line {
            stroke-dasharray: 2000;
            stroke-dashoffset: 2000;
            animation: drawLine 2s ease-out forwards;
          }
        `}</style>
      )}
    </svg>
  );
};

// Sparkline variant for small inline charts
export interface SparklineProps {
  data: number[];
  width: number;
  height: number;
  strokeColor?: string;
  gradientColors?: [string, string];
  showArea?: boolean;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width,
  height,
  strokeColor,
  gradientColors,
  showArea = false,
}) => {
  const { theme } = useTheme();
  
  // Set default colors from theme
  const defaultStrokeColor = strokeColor || theme.colors.primary.main;
  const defaultGradientColors = gradientColors || [theme.colors.primary.main, `${theme.colors.primary.main}40`];
  const preparedData = data.map((value, index) => ({
    x: index,
    y: value,
  }));

  const xScale = scaleLinear({
    domain: [0, data.length - 1],
    range: [0, width],
  });

  const yScale = scaleLinear({
    domain: [Math.min(...data), Math.max(...data)],
    range: [height, 0],
    nice: true,
  });

  const getX = (d: typeof preparedData[0]) => xScale(d.x) ?? 0;
  const getY = (d: typeof preparedData[0]) => yScale(d.y) ?? 0;

  return (
    <svg width={width} height={height}>
      <LinearGradient
        id="sparkline-gradient"
        from={defaultGradientColors[0]}
        to={defaultGradientColors[1]}
        fromOpacity={0.3}
        toOpacity={0}
      />

      {showArea && (
        <path
          d={`
            M ${getX(preparedData[0])},${getY(preparedData[0])}
            ${preparedData.slice(1).map(d => `L ${getX(d)},${getY(d)}`).join(' ')}
            L ${getX(preparedData[preparedData.length - 1])},${height}
            L ${getX(preparedData[0])},${height}
            Z
          `}
          fill="url(#sparkline-gradient)"
        />
      )}

      <LinePath
        data={preparedData}
        x={getX}
        y={getY}
        stroke={defaultStrokeColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        curve={curveMonotoneX}
      />
    </svg>
  );
}; 