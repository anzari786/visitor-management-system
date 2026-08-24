'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
   Popover,
   PopoverContent,
   PopoverTrigger,
} from '@/components/ui/popover';
import {
   Select,
   SelectContent,
   SelectGroup,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useDepartments } from '@/hooks/use-departments';
import { useExportVisitLog } from '@/hooks/use-report';
import type { ExportPeriod } from '@/types/report.types';
import { format, subDays } from 'date-fns';
import {
   CalendarIcon,
   Circle as CircleIcon,
   Download,
   FileSpreadsheet,
   Loader2,
} from 'lucide-react';
import * as React from 'react';
import type { DateRange } from 'react-day-picker';

const PERIOD_LABELS: Record<ExportPeriod, string> = {
   '7d': 'Last 7 Days',
   '30d': 'This Month',
   '3m': 'Last 3 Months',
   '6m': 'Last 6 Months',
   all: 'All Time',
   custom: 'Custom Range',
};

// Same grouped status model used by the visits table status toggle —
// kept local here so this dialog has no hard dependency on that file.
type ExportStatusFilter =
   | 'all'
   | 'pending'
   | 'approved'
   | 'rejected'
   | 'rescheduled'
   | 'checked_in'
   | 'checked_out';

const STATUS_OPTIONS: {
   value: ExportStatusFilter;
   label: string;
   color: string;
}[] = [
   {
      value: 'all',
      label: 'All Statuses',
      color: 'text-slate-400 fill-slate-400',
   },
   {
      value: 'pending',
      label: 'Pending',
      color: 'text-amber-400 fill-amber-400',
   },
   {
      value: 'approved',
      label: 'Approved',
      color: 'text-teal-600 fill-teal-600',
   },
   {
      value: 'rejected',
      label: 'Rejected',
      color: 'text-red-500 fill-red-500',
   },
   {
      value: 'rescheduled',
      label: 'Rescheduled',
      color: 'text-violet-500 fill-violet-500',
   },
   {
      value: 'checked_in',
      label: 'Checked In',
      color: 'text-blue-500 fill-blue-500',
   },
   {
      value: 'checked_out',
      label: 'Checked Out',
      color: 'text-slate-500 fill-slate-500',
   },
];

const scrollAreaClass =
   'flex-1 space-y-8 overflow-y-auto px-6 py-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden';

interface ExportVisitLogDialogProps {
   trigger?: React.ReactNode;
}

export function ExportVisitLogDialog({ trigger }: ExportVisitLogDialogProps) {
   const [open, setOpen] = React.useState(false);
   const [period, setPeriod] = React.useState<ExportPeriod>('7d');
   const [departmentId, setDepartmentId] = React.useState('all');
   const [status, setStatus] = React.useState<ExportStatusFilter>('all');
   const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
      from: subDays(new Date(), 7),
      to: new Date(),
   });

   const { data: departments, isLoading: loadingDepts } = useDepartments();
   const { mutate: exportLog, isPending } = useExportVisitLog();

   const selectedStatus = STATUS_OPTIONS.find((s) => s.value === status);

   // Reset form state whenever the dialog is opened
   React.useEffect(() => {
      if (open) {
         setPeriod('7d');
         setDepartmentId('all');
         setStatus('all');
         setDateRange({
            from: subDays(new Date(), 7),
            to: new Date(),
         });
      }
   }, [open]);

   const isCustomInvalid =
      period === 'custom' && (!dateRange?.from || !dateRange?.to);

   function handleExport() {
      exportLog(
         {
            period,
            departmentId:
               departmentId === 'all' ? undefined : Number(departmentId),
            // status: status === 'all' ? undefined : status,
            from:
               period === 'custom' && dateRange?.from
                  ? format(dateRange.from, 'yyyy-MM-dd')
                  : undefined,
            to:
               period === 'custom' && dateRange?.to
                  ? format(dateRange.to, 'yyyy-MM-dd')
                  : undefined,
         },
         { onSuccess: () => setOpen(false) },
      );
   }

   return (
      <Dialog open={open} onOpenChange={setOpen}>
         <DialogTrigger asChild>
            {trigger ?? (
               <Button variant="outline" className="cursor-pointer gap-2">
                  <FileSpreadsheet className="size-4" />
                  Export Visitor Log
               </Button>
            )}
         </DialogTrigger>
         <DialogContent className="data-open:slide-in-from-left-8 data-closed:slide-out-to-left-8 data-open:zoom-in-100 data-closed:zoom-out-100 flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 duration-300 sm:max-w-lg [[data-slot=dialog-overlay]:has(~_&)]:duration-300">
            <DialogHeader className="shrink-0 space-y-1.5 border-b px-6 py-5 text-left">
               <DialogTitle>Export Visitor Log</DialogTitle>
               <DialogDescription>
                  Choose your filters to generate a CSV report of visit
                  activity.
               </DialogDescription>
            </DialogHeader>

            <div className={scrollAreaClass}>
               <FieldGroup className="gap-4">
                  {/* Period */}
                  <Field>
                     <FieldLabel>Report Period</FieldLabel>
                     <Select
                        value={period}
                        onValueChange={(v) => setPeriod(v as ExportPeriod)}
                     >
                        <SelectTrigger className="w-full">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent
                           align="start"
                           className="data-[state=open]:slide-in-from-bottom-8 data-[state=open]:zoom-in-100 duration-400"
                        >
                           {(
                              Object.entries(PERIOD_LABELS) as [
                                 ExportPeriod,
                                 string,
                              ][]
                           ).map(([key, label]) => (
                              <SelectItem key={key} value={key}>
                                 {label}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </Field>

                  {/* Custom date range */}
                  {period === 'custom' && (
                     <Field>
                        <FieldLabel>Custom Date Range</FieldLabel>
                        <Popover>
                           <PopoverTrigger asChild>
                              <Button
                                 variant="outline"
                                 className="justify-start px-2.5 font-normal"
                              >
                                 <CalendarIcon className="size-4" />
                                 {dateRange?.from ? (
                                    dateRange.to ? (
                                       <>
                                          {format(dateRange.from, 'LLL dd, y')}{' '}
                                          – {format(dateRange.to, 'LLL dd, y')}
                                       </>
                                    ) : (
                                       format(dateRange.from, 'LLL dd, y')
                                    )
                                 ) : (
                                    <span className="text-muted-foreground">
                                       Select date range
                                    </span>
                                 )}
                              </Button>
                           </PopoverTrigger>
                           <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                 mode="range"
                                 defaultMonth={dateRange?.from}
                                 selected={dateRange}
                                 onSelect={setDateRange}
                                 numberOfMonths={2}
                              />
                           </PopoverContent>
                        </Popover>
                     </Field>
                  )}

                  {/* Department */}
                  <Field>
                     <FieldLabel>Department</FieldLabel>
                     {loadingDepts ? (
                        <Skeleton className="h-9 w-full rounded-md" />
                     ) : (
                        <Select
                           value={departmentId}
                           onValueChange={setDepartmentId}
                        >
                           <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select department" />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectGroup>
                                 <SelectItem value="all">
                                    All Departments
                                 </SelectItem>
                                 {departments?.map((dept) => (
                                    <SelectItem
                                       key={dept.id}
                                       value={String(dept.id)}
                                    >
                                       {dept.name}
                                    </SelectItem>
                                 ))}
                              </SelectGroup>
                           </SelectContent>
                        </Select>
                     )}
                  </Field>

                  {/* Status */}
                  <Field>
                     <FieldLabel>Status</FieldLabel>
                     <Select
                        value={status}
                        onValueChange={(v) =>
                           setStatus(v as ExportStatusFilter)
                        }
                     >
                        <SelectTrigger className="w-full [&>span]:flex [&>span]:items-center [&>span]:gap-2">
                           <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent
                           align="start"
                           className="data-[state=open]:slide-in-from-bottom-8 data-[state=open]:zoom-in-100 duration-400"
                        >
                           <SelectGroup>
                              {STATUS_OPTIONS.map((item) => (
                                 <SelectItem
                                    key={item.value}
                                    value={item.value}
                                 >
                                    <div className="flex items-center gap-2">
                                       <CircleIcon
                                          className={`size-2 ${item.color}`}
                                       />
                                       <span className="truncate">
                                          {item.label}
                                       </span>
                                    </div>
                                 </SelectItem>
                              ))}
                           </SelectGroup>
                        </SelectContent>
                     </Select>
                  </Field>
               </FieldGroup>
            </div>

            <DialogFooter className="shrink-0 gap-2 border-t px-6 py-4 sm:justify-end">
               <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer"
                  disabled={isPending}
                  onClick={() => setOpen(false)}
               >
                  Cancel
               </Button>
               <Button
                  onClick={handleExport}
                  disabled={isPending || isCustomInvalid}
                  className="cursor-pointer gap-2"
               >
                  {isPending ? (
                     <>
                        <Loader2 className="size-4 animate-spin" />
                        Exporting...
                     </>
                  ) : (
                     <>
                        <Download className="size-4" />
                        Export CSV
                     </>
                  )}
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}
