'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
   DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
   CalendarDays,
   MoreHorizontal,
   Download,
   Share2,
   Maximize2,
   RefreshCw,
   Settings2,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
import type {
   DepartmentTimeRange,
   MeetingTypeChartData,
} from '@/types/dashboard.types';

type TimeRange = DepartmentTimeRange;

/**
 * Static mock meeting-type breakdown — swap for API data when backend is ready.
 */
const MOCK_MEETING_TYPE_DATA: Record<TimeRange, MeetingTypeChartData> = {
   '7days': {
      data: [
         { name: 'Meeting', value: 312, color: '#35b9e9' },
         { name: 'Interview', value: 198, color: '#6e3ff3' },
         { name: 'Delivery', value: 156, color: '#375dfb' },
         { name: 'Training', value: 98, color: '#e255f2' },
      ],
      total: 764,
   },
   '30days': {
      data: [
         { name: 'Meeting', value: 1445, color: '#35b9e9' },
         { name: 'Interview', value: 903, color: '#6e3ff3' },
         { name: 'Delivery', value: 722, color: '#375dfb' },
         { name: 'Training', value: 451, color: '#e255f2' },
      ],
      total: 3521,
   },
   '90days': {
      data: [
         { name: 'Meeting', value: 4235, color: '#35b9e9' },
         { name: 'Interview', value: 2709, color: '#6e3ff3' },
         { name: 'Delivery', value: 2166, color: '#375dfb' },
         { name: 'Training', value: 1353, color: '#e255f2' },
      ],
      total: 10463,
   },
};

const timeRangeLabels: Record<TimeRange, string> = {
   '7days': 'Last 7 days',
   '30days': 'Last 30 days',
   '90days': 'Last 90 days',
};

interface MeetingTypeChartProps {
   /** Optional override — defaults to mock data until backend is wired. */
   dataByRange?: Record<TimeRange, MeetingTypeChartData>;
}

export function MeetingTypeChart({
   dataByRange = MOCK_MEETING_TYPE_DATA,
}: MeetingTypeChartProps) {
   const [timeRange, setTimeRange] = useState<TimeRange>('30days');
   const [activeIndex, setActiveIndex] = useState<number | null>(null);
   const [showLabels, setShowLabels] = useState(true);

   const chartData = dataByRange[timeRange];
   const data = chartData.data;
   const totalVisits = chartData.total;

   const onPieEnter = (_: unknown, index: number) => {
      setActiveIndex(index);
   };

   const onPieLeave = () => {
      setActiveIndex(null);
   };

   const renderActiveShape = (props: unknown) => {
      const typedProps = props as {
         cx: number;
         cy: number;
         innerRadius: number;
         outerRadius: number;
         startAngle: number;
         endAngle: number;
         fill: string;
      };
      const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } =
         typedProps;
      return (
         <g>
            <Sector
               cx={cx}
               cy={cy}
               innerRadius={innerRadius}
               outerRadius={outerRadius + 8}
               startAngle={startAngle}
               endAngle={endAngle}
               fill={fill}
            />
         </g>
      );
   };

   return (
      <div className="flex flex-col gap-4 p-4 sm:p-6 rounded-xl border bg-card w-full xl:w-[410px]">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-2.5">
               <Button variant="outline" size="icon" className="size-7 sm:size-8">
                  <CalendarDays className="size-4 sm:size-[18px] text-muted-foreground" />
               </Button>
               <span className="text-sm sm:text-base font-medium">
                  Meeting Type
               </span>
            </div>
            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-7 sm:size-8">
                     <MoreHorizontal className="size-4 text-muted-foreground" />
                  </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end" className="w-[180px]">
                  <DropdownMenuLabel>Time Range</DropdownMenuLabel>
                  {(Object.keys(timeRangeLabels) as TimeRange[]).map((range) => (
                     <DropdownMenuCheckboxItem
                        key={range}
                        checked={timeRange === range}
                        onCheckedChange={() => setTimeRange(range)}
                     >
                        {timeRangeLabels[range]}
                     </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Display Options</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                     checked={showLabels}
                     onCheckedChange={setShowLabels}
                  >
                     Show labels
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                     <Download className="size-4 mr-2" />
                     Export as PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                     <Share2 className="size-4 mr-2" />
                     Share
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                     <Maximize2 className="size-4 mr-2" />
                     Full Screen
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                     <RefreshCw className="size-4 mr-2" />
                     Refresh Data
                  </DropdownMenuItem>
               </DropdownMenuContent>
            </DropdownMenu>
         </div>

         <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="relative shrink-0 size-[220px]">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius="42%"
                        outerRadius="70%"
                        paddingAngle={2}
                        dataKey="value"
                        strokeWidth={0}
                        activeIndex={
                           activeIndex !== null ? activeIndex : undefined
                        }
                        activeShape={renderActiveShape}
                        onMouseEnter={onPieEnter}
                        onMouseLeave={onPieLeave}
                     >
                        {data.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                     </Pie>
                  </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-lg sm:text-xl font-semibold">
                     {totalVisits.toLocaleString()}
                  </span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground">
                     Total Visits
                  </span>
               </div>
            </div>

            {showLabels && (
               <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-1 gap-2 sm:gap-4">
                  {data.map((item, index) => (
                     <div
                        key={item.name}
                        className={`flex items-center gap-2 sm:gap-2.5 cursor-pointer transition-opacity ${
                           activeIndex !== null && activeIndex !== index
                              ? 'opacity-50'
                              : ''
                        }`}
                        onMouseEnter={() => setActiveIndex(index)}
                        onMouseLeave={() => setActiveIndex(null)}
                     >
                        <div
                           className="w-1 h-4 sm:h-5 rounded-sm shrink-0"
                           style={{ backgroundColor: item.color }}
                        />
                        <span className="flex-1 text-xs sm:text-sm text-muted-foreground truncate">
                           {item.name}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold tabular-nums">
                           {item.value.toLocaleString()}
                        </span>
                     </div>
                  ))}
               </div>
            )}
         </div>

         <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Settings2 className="size-3" />
            <span>{timeRangeLabels[timeRange]}</span>
         </div>
      </div>
   );
}
