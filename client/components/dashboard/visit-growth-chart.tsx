'use client';

import { Button } from '@/components/ui/button';
import {
   DropdownMenu,
   DropdownMenuCheckboxItem,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuSub,
   DropdownMenuSubContent,
   DropdownMenuSubTrigger,
   DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useVisitGrowth } from '@/hooks/use-dashboard';
import { AlertCircle, MoreHorizontal, TrendingUp } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import {
   Area,
   AreaChart,
   Bar,
   BarChart,
   CartesianGrid,
   Line,
   LineChart,
   ResponsiveContainer,
   Tooltip,
   XAxis,
   YAxis,
} from 'recharts';
import type {
   VisitGrowthDataPoint,
   GrowthPeriod,
} from '@/types/dashboard.types';
import { Skeleton } from '../ui/skeleton';

type ChartType = 'line' | 'area' | 'bar';

interface CustomTooltipProps {
   active?: boolean;
   payload?: Array<{ value: number; payload: VisitGrowthDataPoint }>;
   allData: VisitGrowthDataPoint[];
}

function CustomTooltip({ active, payload, allData }: CustomTooltipProps) {
   if (!active || !payload?.length) return null;

   const data = payload[0];
   const currentIndex = allData.findIndex((d) => d.week === data.payload.week);

   // walk backward until we hit a week that actually has a month label
   const monthPoint =
      [...allData]
         .slice(0, currentIndex + 1)
         .reverse()
         .find((d) => d.month !== '') ?? data.payload;

   const prevValue =
      currentIndex > 0 ? allData[currentIndex - 1].visits : data.value;
   const change =
      prevValue > 0
         ? (((data.value - prevValue) / prevValue) * 100).toFixed(1)
         : '0';

   return (
      <div className="bg-card border rounded-md p-2">
         <p className="text-xs text-muted-foreground">
            {monthPoint.month}, {monthPoint.year}
         </p>
         <div className="flex items-center gap-2 mt-1">
            <span className="font-semibold text-sm">{data.value}</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
               <TrendingUp className="size-3" />
               {change}%
            </span>
         </div>
      </div>
   );
}

function GrowthChartSkeleton() {
   return (
      <div className="bg-card text-card-foreground rounded-xl border flex-1">
         <div className="flex items-center justify-between py-5 px-5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="size-8" />
         </div>
         <div className="px-5 pb-5">
            <Skeleton className="h-50 sm:h-62.5 w-full rounded-lg" />
         </div>
      </div>
   );
}

export function VisitGrowthChart() {
   const { theme } = useTheme();
   const [chartType, setChartType] = useState<ChartType>('area');
   const [period, setPeriod] = useState<GrowthPeriod>('12m');
   const [showGrid, setShowGrid] = useState(true);
   const [smoothCurve, setSmoothCurve] = useState(true);

   const { data: growthData, isPending, isError } = useVisitGrowth(period);
   const chartData = (growthData ?? []).map((point) => ({
      ...point,
      year: point.year ?? '',
      month: point.month ?? '',
      week: Number(point.week ?? 0),
      visits: Number(point.visits ?? 0),
   }));

   const axisColor = theme === 'dark' ? '#525866' : '#868c98';
   const gridColor = theme === 'dark' ? '#27272a' : '#e2e4e9';
   const lineColor = '#6e3ff3';

   const resetToDefault = () => {
      setChartType('area');
      setPeriod('12m');
      setShowGrid(true);
      setSmoothCurve(true);
   };

   const sharedAxisProps = {
      axisLine: false,
      tickLine: false,
   } as const;

   const sharedChartProps = {
      margin: { top: 20, right: 10, left: -20, bottom: 0 },
   } as const;

   const maxVisits = Math.max(...chartData.map((d) => d.visits), 0);
   const yMax = Math.max(50, Math.ceil((maxVisits * 1.1) / 50) * 50);
   const yTicks = Array.from({ length: yMax / 50 + 1 }, (_, i) => i * 50);

   const renderChart = () => {
      if (chartType === 'bar') {
         return (
            <BarChart data={chartData} {...sharedChartProps}>
               {showGrid && (
                  <CartesianGrid
                     strokeDasharray="3 3"
                     stroke={gridColor}
                     vertical={false}
                  />
               )}
               <XAxis
                  dataKey="month"
                  {...sharedAxisProps}
                  tick={{ fontSize: 12, fill: axisColor }}
                  interval="preserveStartEnd"
               />
               <YAxis
                  {...sharedAxisProps}
                  tick={{ fontSize: 10, fill: axisColor }}
                  domain={[0, yMax]}
                  ticks={yTicks}
               />
               <Tooltip content={<CustomTooltip allData={chartData} />} />
               <defs>
                  <linearGradient
                     id="visitBarGradient"
                     x1="0"
                     y1="0"
                     x2="0"
                     y2="1"
                  >
                     <stop offset="0%" stopColor="#6e3ff3" />
                     <stop offset="100%" stopColor="#aa8ef9" />
                  </linearGradient>
               </defs>
               <Bar
                  dataKey="visits"
                  fill="url(#visitBarGradient)"
                  radius={[4, 4, 0, 0]}
               />
            </BarChart>
         );
      }

      if (chartType === 'area') {
         return (
            <AreaChart data={chartData} {...sharedChartProps}>
               {showGrid && (
                  <CartesianGrid
                     strokeDasharray="3 3"
                     stroke={gridColor}
                     vertical={false}
                  />
               )}
               <XAxis
                  dataKey="month"
                  {...sharedAxisProps}
                  tick={{ fontSize: 12, fill: axisColor }}
                  interval="preserveStartEnd"
               />
               <YAxis
                  {...sharedAxisProps}
                  tick={{ fontSize: 10, fill: axisColor }}
                  domain={[0, yMax]}
                  ticks={yTicks}
               />
               <Tooltip content={<CustomTooltip allData={chartData} />} />
               <defs>
                  <linearGradient
                     id="visitAreaGradient"
                     x1="0"
                     y1="0"
                     x2="0"
                     y2="1"
                  >
                     <stop offset="0%" stopColor="#6e3ff3" stopOpacity={0.15} />
                     <stop offset="100%" stopColor="#6e3ff3" stopOpacity={0} />
                  </linearGradient>
               </defs>
               <Area
                  type={smoothCurve ? 'monotone' : 'linear'}
                  dataKey="visits"
                  stroke={lineColor}
                  strokeWidth={2}
                  fill="url(#visitAreaGradient)"
                  dot={false}
                  activeDot={{
                     r: 6,
                     fill: lineColor,
                     stroke: '#fff',
                     strokeWidth: 2,
                  }}
               />
            </AreaChart>
         );
      }

      return (
         <LineChart data={chartData} {...sharedChartProps}>
            {showGrid && (
               <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridColor}
                  vertical={false}
               />
            )}
            <XAxis
               dataKey="month"
               {...sharedAxisProps}
               tick={{ fontSize: 12, fill: axisColor }}
               interval="preserveStartEnd"
            />
            <YAxis
               {...sharedAxisProps}
               tick={{ fontSize: 10, fill: axisColor }}
               domain={[0, yMax]}
               ticks={yTicks}
            />
            <Tooltip content={<CustomTooltip allData={chartData} />} />
            <Line
               type={smoothCurve ? 'monotone' : 'linear'}
               dataKey="visits"
               stroke={lineColor}
               strokeWidth={2}
               dot={false}
               activeDot={{
                  r: 6,
                  fill: lineColor,
                  stroke: '#fff',
                  strokeWidth: 2,
               }}
            />
         </LineChart>
      );
   };

   if (isPending) return <GrowthChartSkeleton />;

   if (isError) {
      return (
         <div className="bg-card rounded-xl border flex-1 flex flex-col items-center justify-center gap-2 p-6 text-sm text-destructive">
            <AlertCircle className="h-6 w-6" />
            <span>Failed to load growth data.</span>
         </div>
      );
   }

   if (!chartData.length) {
      return (
         <div className="bg-card text-card-foreground rounded-xl border flex-1">
            <div className="flex flex-row items-center justify-between py-5 px-5">
               <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="size-8">
                     <TrendingUp className="size-4 text-muted-foreground" />
                  </Button>
                  <h3 className="font-medium text-sm sm:text-base">
                     Monthly Visit Growth
                  </h3>
               </div>
               <Button variant="ghost" size="icon" className="size-8" disabled>
                  <MoreHorizontal className="size-4 text-muted-foreground" />
               </Button>
            </div>
            <div className="px-5 pb-5">
               <div className="h-50 sm:h-62.5 w-full flex items-center justify-center text-sm text-muted-foreground">
                  No visit growth data available for this period.
               </div>
            </div>
         </div>
      );
   }

   return (
      <div className="bg-card text-card-foreground rounded-xl border flex-1">
         <div className="flex flex-row items-center justify-between py-5 px-5">
            <div className="flex items-center gap-2">
               <Button variant="outline" size="icon" className="size-8">
                  <TrendingUp className="size-4 text-muted-foreground" />
               </Button>
               <h3 className="font-medium text-sm sm:text-base">
                  Monthly Visit Growth
               </h3>
            </div>
            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8">
                     <MoreHorizontal className="size-4 text-muted-foreground" />
                  </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuSub>
                     <DropdownMenuSubTrigger>Chart Type</DropdownMenuSubTrigger>
                     <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => setChartType('line')}>
                           Line Chart {chartType === 'line' && '✓'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setChartType('area')}>
                           Area Chart {chartType === 'area' && '✓'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setChartType('bar')}>
                           Bar Chart {chartType === 'bar' && '✓'}
                        </DropdownMenuItem>
                     </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSub>
                     <DropdownMenuSubTrigger>
                        Time Period
                     </DropdownMenuSubTrigger>
                     <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => setPeriod('3m')}>
                           Last 3 Months {period === '3m' && '✓'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setPeriod('6m')}>
                           Last 6 Months {period === '6m' && '✓'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setPeriod('12m')}>
                           Last 12 Months {period === '12m' && '✓'}
                        </DropdownMenuItem>
                     </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                     checked={showGrid}
                     onCheckedChange={setShowGrid}
                  >
                     Show Grid
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                     checked={smoothCurve}
                     onCheckedChange={setSmoothCurve}
                     disabled={chartType === 'bar'}
                  >
                     Smooth Curve
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={resetToDefault}>
                     Reset to Default
                  </DropdownMenuItem>
               </DropdownMenuContent>
            </DropdownMenu>
         </div>
         <div className="px-5 pb-5">
            <div className="h-50 sm:h-62.5 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  {renderChart()}
               </ResponsiveContainer>
            </div>
         </div>
      </div>
   );
}
