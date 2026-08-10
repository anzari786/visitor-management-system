import { cn } from '@/lib/utils';
import type {
   ManagedVisitStatus,
   VisitorAttendanceStatus,
} from '@/types/visit.types';
import { MANAGED_VISIT_STATUS_LABELS } from '@/data/mock-visits';
import { ATTENDANCE_STATUS_LABELS } from '@/lib/visit-attendance';
import { Badge } from '@/components/ui/badge';

const statusStyles: Record<
   ManagedVisitStatus,
   { bg: string; text: string; border: string; dot: string }
> = {
   requested: {
      bg: 'bg-slate-100 dark:bg-slate-800/60',
      text: 'text-slate-700 dark:text-slate-200',
      border: 'border-slate-200/80 dark:border-slate-700',
      dot: 'bg-slate-500',
   },
   approved: {
      bg: 'bg-emerald-400/15 dark:bg-emerald-400/10',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-400/25',
      dot: 'bg-emerald-500',
   },
   rejected: {
      bg: 'bg-red-400/15 dark:bg-red-400/10',
      text: 'text-red-700 dark:text-red-300',
      border: 'border-red-400/25',
      dot: 'bg-red-500',
   },
   rescheduled: {
      bg: 'bg-violet-400/15 dark:bg-violet-400/10',
      text: 'text-violet-700 dark:text-violet-300',
      border: 'border-violet-400/25',
      dot: 'bg-violet-500',
   },
   partially_checked_in: {
      bg: 'bg-amber-400/15 dark:bg-amber-400/10',
      text: 'text-amber-800 dark:text-amber-300',
      border: 'border-amber-400/30',
      dot: 'bg-amber-500',
   },
   checked_in: {
      bg: 'bg-sky-400/15 dark:bg-sky-400/10',
      text: 'text-sky-700 dark:text-sky-300',
      border: 'border-sky-400/25',
      dot: 'bg-sky-500',
   },
   partially_checked_out: {
      bg: 'bg-orange-400/15 dark:bg-orange-400/10',
      text: 'text-orange-800 dark:text-orange-300',
      border: 'border-orange-400/30',
      dot: 'bg-orange-500',
   },
   checked_out: {
      bg: 'bg-blue-400/15 dark:bg-blue-400/10',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-400/25',
      dot: 'bg-blue-500',
   },
   cancelled: {
      bg: 'bg-rose-400/15 dark:bg-rose-400/10',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-400/25',
      dot: 'bg-rose-500',
   },
};

const attendanceStyles: Record<
   VisitorAttendanceStatus,
   { bg: string; text: string; border: string }
> = {
   pending: {
      bg: 'bg-slate-400/15 dark:bg-slate-400/10',
      text: 'text-slate-600 dark:text-slate-300',
      border: 'border-slate-400/20',
   },
   checked_in: {
      bg: 'bg-teal-400/15 dark:bg-teal-400/10',
      text: 'text-teal-700 dark:text-teal-300',
      border: 'border-teal-400/25',
   },
   checked_out: {
      bg: 'bg-indigo-400/15 dark:bg-indigo-400/10',
      text: 'text-indigo-700 dark:text-indigo-300',
      border: 'border-indigo-400/25',
   },
};

const avatarToneByAttendance: Record<
   VisitorAttendanceStatus,
   string
> = {
   pending: 'bg-slate-100 text-slate-600 ring-slate-200/80 dark:bg-slate-800/50 dark:text-slate-300 dark:ring-slate-700',
   checked_in:
      'bg-teal-50 text-teal-700 ring-teal-200/70 dark:bg-teal-950/40 dark:text-teal-300 dark:ring-teal-800/50',
   checked_out:
      'bg-indigo-50 text-indigo-700 ring-indigo-200/70 dark:bg-indigo-950/40 dark:text-indigo-300 dark:ring-indigo-800/50',
};

export function ManagedVisitStatusBadge({
   status,
   className,
}: {
   status: ManagedVisitStatus;
   className?: string;
}) {
   const styles = statusStyles[status];

   return (
      <Badge
         variant="outline"
         className={cn(
            'h-6 gap-1.5 rounded-md border-0 px-2 py-0 font-medium whitespace-nowrap',
            styles.bg,
            styles.text,
            className,
         )}
      >
         <span className={cn('size-1.5 rounded-full', styles.dot)} />
         {MANAGED_VISIT_STATUS_LABELS[status]}
      </Badge>
   );
}

export function VisitorAttendanceBadge({
   status,
}: {
   status: VisitorAttendanceStatus;
}) {
   const styles = attendanceStyles[status];

   return (
      <Badge
         className={cn(
            'h-5 rounded-md border-0 px-1.5 text-[11px] font-medium',
            styles.bg,
            styles.text,
         )}
      >
         {ATTENDANCE_STATUS_LABELS[status]}
      </Badge>
   );
}

export function visitorAvatarTone(status: VisitorAttendanceStatus) {
   return avatarToneByAttendance[status];
}

export {
   canAttemptCheckIn,
   canAttemptCheckOut,
   canCancel,
   canCheckIn,
   canCheckOut,
} from '@/lib/visit-attendance';
