'use client';

import {
   Field,
   FieldContent,
   FieldDescription,
   FieldGroup,
   FieldLabel,
   FieldTitle,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
   Select,
   SelectContent,
   SelectGroup,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export type SettingsFormState = {
   // General
   orgName: string;
   timezone: string;
   dateFormat: string;
   timeFormat: string;
   defaultVisitDuration: string;

   // Notifications
   emailNotifications: boolean;
   dashboardNotifications: boolean;
   approvalReminders: boolean;
   reminderInterval: string;
   visitDecisionAlerts: boolean;
   checkInOutAlerts: boolean;

   // Visit Management
   requireHostApproval: boolean;
   allowWalkIns: boolean;
   allowedVisitDuration: string;
   allowMultiDayVisits: boolean;
   maxVisitDays: string;
   overdueDetection: boolean;
   overdueAfterMins: string;

   // Badge Management
   badgePrefix: string;
   requireBadgeOnCheckIn: boolean;
   autoAssignBadge: boolean;
   releaseBadgeOnCheckout: boolean;
   deactivateLostBadges: boolean;
   blockDeactivatedBadges: boolean;

   // Security
   sessionTimeout: string;
   requirePasswordChange: boolean;
   twoFactorOptional: boolean;
   qrCodeExpiry: string;
   singleUseVisitCodes: boolean;
};

export const DEFAULT_SETTINGS: SettingsFormState = {
   orgName: 'Ethiopian Agricultural Transformation Institute',
   timezone: 'Africa/Addis_Ababa',
   dateFormat: 'dd/MM/yyyy',
   timeFormat: '24h',
   defaultVisitDuration: '120',

   emailNotifications: true,
   dashboardNotifications: true,
   approvalReminders: true,
   reminderInterval: '60',
   visitDecisionAlerts: true,
   checkInOutAlerts: true,

   requireHostApproval: true,
   allowWalkIns: true,
   allowedVisitDuration: '480',
   allowMultiDayVisits: true,
   maxVisitDays: '3',
   overdueDetection: true,
   overdueAfterMins: '120',

   badgePrefix: 'ATI',
   requireBadgeOnCheckIn: true,
   autoAssignBadge: true,
   releaseBadgeOnCheckout: true,
   deactivateLostBadges: true,
   blockDeactivatedBadges: true,

   sessionTimeout: '480',
   requirePasswordChange: true,
   twoFactorOptional: false,
   qrCodeExpiry: '24',
   singleUseVisitCodes: true,
};

function PanelHeader({
   icon: Icon,
   title,
   description,
}: {
   icon: LucideIcon;
   title: string;
   description: string;
}) {
   return (
      <div className="space-y-5">
         <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
               <Icon className="size-4 text-foreground" />
            </div>
            <div className="min-w-0 space-y-1">
               <h3 className="text-xl font-semibold tracking-tight text-foreground">
                  {title}
               </h3>
               <p className="text-sm text-muted-foreground">{description}</p>
            </div>
         </div>
         <div className="h-px bg-border" />
      </div>
   );
}

function SettingsSection({
   title,
   children,
   className,
}: {
   title?: string;
   children: ReactNode;
   className?: string;
}) {
   return (
      <section className={cn('space-y-3', className)}>
         {title && (
            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
               {title}
            </h4>
         )}
         {children}
      </section>
   );
}

function SettingsCard({
   children,
   className,
}: {
   children: ReactNode;
   className?: string;
}) {
   return (
      <div
         className={cn(
            'overflow-hidden rounded-lg border border-border/70 bg-background/60',
            className,
         )}
      >
         {children}
      </div>
   );
}

function SettingRow({
   id,
   title,
   description,
   checked,
   onCheckedChange,
   disabled,
   children,
}: {
   id: string;
   title: string;
   description: string;
   checked: boolean;
   onCheckedChange: (checked: boolean) => void;
   disabled?: boolean;
   children?: ReactNode;
}) {
   return (
      <div className="border-b border-border/60 last:border-b-0">
         <FieldLabel htmlFor={id} className="w-full px-4 py-3.5">
            <Field orientation="horizontal" className="items-start gap-4">
               <FieldContent className="gap-1">
                  <FieldTitle className="text-sm font-medium">
                     {title}
                  </FieldTitle>
                  <FieldDescription className="text-sm leading-relaxed">
                     {description}
                  </FieldDescription>
                  {children && (
                     <div
                        className={cn(
                           'mt-3 max-w-xs',
                           !checked && 'pointer-events-none opacity-50',
                        )}
                     >
                        {children}
                     </div>
                  )}
               </FieldContent>
               <Switch
                  id={id}
                  checked={checked}
                  onCheckedChange={onCheckedChange}
                  disabled={disabled}
                  className="mt-0.5 shrink-0"
               />
            </Field>
         </FieldLabel>
      </div>
   );
}

function FormFieldBlock({
   children,
   className,
}: {
   children: ReactNode;
   className?: string;
}) {
   return (
      <div className={cn('space-y-4 px-4 py-4', className)}>{children}</div>
   );
}

type PanelProps = {
   icon: LucideIcon;
   form: SettingsFormState;
   onChange: (patch: Partial<SettingsFormState>) => void;
};

export function GeneralPanel({ icon, form, onChange }: PanelProps) {
   return (
      <div className="space-y-6">
         <PanelHeader
            icon={icon}
            title="General"
            description="Organization identity and default display preferences."
         />

         <SettingsSection title="Organization">
            <SettingsCard>
               <FormFieldBlock>
                  <Field className="gap-1.5">
                     <FieldLabel htmlFor="settings-org-name">
                        Organization Name
                     </FieldLabel>
                     <FieldDescription>
                        Displayed across the app and on visitor reports.
                     </FieldDescription>
                     <Input
                        id="settings-org-name"
                        value={form.orgName}
                        onChange={(e) => onChange({ orgName: e.target.value })}
                        className="h-9 shadow-xs dark:bg-background"
                     />
                  </Field>
               </FormFieldBlock>
            </SettingsCard>
         </SettingsSection>

         <SettingsSection title="Defaults">
            <SettingsCard>
               <FormFieldBlock>
                  <FieldGroup className="gap-5">
                     <div className="grid gap-5 sm:grid-cols-2">
                        <Field className="gap-1.5">
                           <FieldLabel htmlFor="settings-timezone">
                              Timezone
                           </FieldLabel>
                           <FieldDescription>
                              Used for visit schedules and timestamps.
                           </FieldDescription>
                           <Select
                              value={form.timezone}
                              onValueChange={(value) =>
                                 onChange({ timezone: value })
                              }
                           >
                              <SelectTrigger
                                 id="settings-timezone"
                                 className="h-9 w-full shadow-xs dark:bg-background"
                              >
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                 <SelectGroup>
                                    <SelectItem value="Africa/Addis_Ababa">
                                       Africa/Addis Ababa (EAT)
                                    </SelectItem>
                                    <SelectItem value="UTC">UTC</SelectItem>
                                    <SelectItem value="Africa/Nairobi">
                                       Africa/Nairobi (EAT)
                                    </SelectItem>
                                    <SelectItem value="Europe/London">
                                       Europe/London
                                    </SelectItem>
                                 </SelectGroup>
                              </SelectContent>
                           </Select>
                        </Field>

                        <Field className="gap-1.5">
                           <FieldLabel htmlFor="settings-default-duration">
                              Default Visit Duration
                           </FieldLabel>
                           <FieldDescription>
                              Suggested length when creating a new visit.
                           </FieldDescription>
                           <Select
                              value={form.defaultVisitDuration}
                              onValueChange={(value) =>
                                 onChange({ defaultVisitDuration: value })
                              }
                           >
                              <SelectTrigger
                                 id="settings-default-duration"
                                 className="h-9 w-full shadow-xs dark:bg-background"
                              >
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                 <SelectGroup>
                                    <SelectItem value="30">
                                       30 minutes
                                    </SelectItem>
                                    <SelectItem value="60">1 hour</SelectItem>
                                    <SelectItem value="120">2 hours</SelectItem>
                                    <SelectItem value="240">4 hours</SelectItem>
                                    <SelectItem value="480">
                                       Full day
                                    </SelectItem>
                                 </SelectGroup>
                              </SelectContent>
                           </Select>
                        </Field>

                        <Field className="gap-1.5">
                           <FieldLabel htmlFor="settings-date-format">
                              Date Format
                           </FieldLabel>
                           <Select
                              value={form.dateFormat}
                              onValueChange={(value) =>
                                 onChange({ dateFormat: value })
                              }
                           >
                              <SelectTrigger
                                 id="settings-date-format"
                                 className="h-9 w-full shadow-xs dark:bg-background"
                              >
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                 <SelectGroup>
                                    <SelectItem value="dd/MM/yyyy">
                                       DD/MM/YYYY
                                    </SelectItem>
                                    <SelectItem value="MM/dd/yyyy">
                                       MM/DD/YYYY
                                    </SelectItem>
                                    <SelectItem value="yyyy-MM-dd">
                                       YYYY-MM-DD
                                    </SelectItem>
                                 </SelectGroup>
                              </SelectContent>
                           </Select>
                        </Field>

                        <Field className="gap-1.5">
                           <FieldLabel htmlFor="settings-time-format">
                              Time Format
                           </FieldLabel>
                           <Select
                              value={form.timeFormat}
                              onValueChange={(value) =>
                                 onChange({ timeFormat: value })
                              }
                           >
                              <SelectTrigger
                                 id="settings-time-format"
                                 className="h-9 w-full shadow-xs dark:bg-background"
                              >
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                 <SelectGroup>
                                    <SelectItem value="24h">24-hour</SelectItem>
                                    <SelectItem value="12h">
                                       12-hour (AM/PM)
                                    </SelectItem>
                                 </SelectGroup>
                              </SelectContent>
                           </Select>
                        </Field>
                     </div>
                  </FieldGroup>
               </FormFieldBlock>
            </SettingsCard>
         </SettingsSection>
      </div>
   );
}

export function NotificationsPanel({ icon, form, onChange }: PanelProps) {
   return (
      <div className="space-y-6">
         <PanelHeader
            icon={icon}
            title="Notifications"
            description="Choose how visit events are delivered to staff and hosts."
         />

         <SettingsSection title="Delivery channels">
            <SettingsCard>
               <SettingRow
                  id="settings-email-notifications"
                  title="Email notifications"
                  description="Send visit updates and approvals by email."
                  checked={form.emailNotifications}
                  onCheckedChange={(checked) =>
                     onChange({ emailNotifications: checked })
                  }
               />
               <SettingRow
                  id="settings-dashboard-notifications"
                  title="Dashboard notifications"
                  description="Show alerts in the header notification center."
                  checked={form.dashboardNotifications}
                  onCheckedChange={(checked) =>
                     onChange({ dashboardNotifications: checked })
                  }
               />
            </SettingsCard>
         </SettingsSection>

         <SettingsSection title="Visit events">
            <SettingsCard>
               <SettingRow
                  id="settings-approval-reminders"
                  title="Approval reminders"
                  description="Remind hosts about pending visit requests."
                  checked={form.approvalReminders}
                  onCheckedChange={(checked) =>
                     onChange({ approvalReminders: checked })
                  }
               >
                  <Select
                     value={form.reminderInterval}
                     onValueChange={(value) =>
                        onChange({ reminderInterval: value })
                     }
                  >
                     <SelectTrigger className="h-9 w-full shadow-xs dark:bg-background">
                        <SelectValue placeholder="Reminder interval" />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectGroup>
                           <SelectItem value="30">Every 30 minutes</SelectItem>
                           <SelectItem value="60">Every hour</SelectItem>
                           <SelectItem value="120">Every 2 hours</SelectItem>
                           <SelectItem value="240">Every 4 hours</SelectItem>
                        </SelectGroup>
                     </SelectContent>
                  </Select>
               </SettingRow>
               <SettingRow
                  id="settings-decision-alerts"
                  title="Visit decision alerts"
                  description="Notify when a visit is approved, rejected, or cancelled."
                  checked={form.visitDecisionAlerts}
                  onCheckedChange={(checked) =>
                     onChange({ visitDecisionAlerts: checked })
                  }
               />
               <SettingRow
                  id="settings-checkin-alerts"
                  title="Check-in & checkout alerts"
                  description="Notify hosts when visitors arrive or leave."
                  checked={form.checkInOutAlerts}
                  onCheckedChange={(checked) =>
                     onChange({ checkInOutAlerts: checked })
                  }
               />
            </SettingsCard>
         </SettingsSection>
      </div>
   );
}

export function VisitManagementPanel({ icon, form, onChange }: PanelProps) {
   return (
      <div className="space-y-6">
         <PanelHeader
            icon={icon}
            title="Visit Management"
            description="Approval rules, duration limits, and overdue monitoring."
         />

         <SettingsSection title="Access rules">
            <SettingsCard>
               <SettingRow
                  id="settings-require-approval"
                  title="Require host approval"
                  description="Scheduled visits must be approved before check-in."
                  checked={form.requireHostApproval}
                  onCheckedChange={(checked) =>
                     onChange({ requireHostApproval: checked })
                  }
               />
               <SettingRow
                  id="settings-allow-walkins"
                  title="Allow walk-in visits"
                  description="Front desk can register visitors without a prior request."
                  checked={form.allowWalkIns}
                  onCheckedChange={(checked) =>
                     onChange({ allowWalkIns: checked })
                  }
               />
            </SettingsCard>
         </SettingsSection>

         <SettingsSection title="Duration">
            <SettingsCard>
               <FormFieldBlock className="border-b border-border/60">
                  <Field className="gap-1.5">
                     <FieldLabel htmlFor="settings-allowed-duration">
                        Allowed visit duration
                     </FieldLabel>
                     <FieldDescription>
                        Maximum time a visitor may stay for a single-day visit.
                     </FieldDescription>
                     <Select
                        value={form.allowedVisitDuration}
                        onValueChange={(value) =>
                           onChange({ allowedVisitDuration: value })
                        }
                     >
                        <SelectTrigger
                           id="settings-allowed-duration"
                           className="h-9 w-full max-w-xs shadow-xs dark:bg-background"
                        >
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectGroup>
                              <SelectItem value="120">2 hours</SelectItem>
                              <SelectItem value="240">4 hours</SelectItem>
                              <SelectItem value="480">8 hours</SelectItem>
                              <SelectItem value="720">12 hours</SelectItem>
                           </SelectGroup>
                        </SelectContent>
                     </Select>
                  </Field>
               </FormFieldBlock>
               <SettingRow
                  id="settings-multi-day"
                  title="Allow multi-day visits"
                  description="Visitors can be scheduled across consecutive days."
                  checked={form.allowMultiDayVisits}
                  onCheckedChange={(checked) =>
                     onChange({ allowMultiDayVisits: checked })
                  }
               >
                  <Select
                     value={form.maxVisitDays}
                     onValueChange={(value) =>
                        onChange({ maxVisitDays: value })
                     }
                  >
                     <SelectTrigger className="h-9 w-full shadow-xs dark:bg-background">
                        <SelectValue placeholder="Maximum days" />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectGroup>
                           <SelectItem value="2">Up to 2 days</SelectItem>
                           <SelectItem value="3">Up to 3 days</SelectItem>
                           <SelectItem value="5">Up to 5 days</SelectItem>
                           <SelectItem value="7">Up to 7 days</SelectItem>
                        </SelectGroup>
                     </SelectContent>
                  </Select>
               </SettingRow>
            </SettingsCard>
         </SettingsSection>

         <SettingsSection title="Monitoring">
            <SettingsCard>
               <SettingRow
                  id="settings-overdue"
                  title="Overdue visit detection"
                  description="Flag active visits that exceed the allowed duration."
                  checked={form.overdueDetection}
                  onCheckedChange={(checked) =>
                     onChange({ overdueDetection: checked })
                  }
               >
                  <Select
                     value={form.overdueAfterMins}
                     onValueChange={(value) =>
                        onChange({ overdueAfterMins: value })
                     }
                  >
                     <SelectTrigger className="h-9 w-full shadow-xs dark:bg-background">
                        <SelectValue placeholder="Overdue after" />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectGroup>
                           <SelectItem value="30">After 30 minutes</SelectItem>
                           <SelectItem value="60">After 1 hour</SelectItem>
                           <SelectItem value="120">After 2 hours</SelectItem>
                           <SelectItem value="240">After 4 hours</SelectItem>
                        </SelectGroup>
                     </SelectContent>
                  </Select>
               </SettingRow>
            </SettingsCard>
         </SettingsSection>
      </div>
   );
}

export function BadgeManagementPanel({ icon, form, onChange }: PanelProps) {
   const preview = `${form.badgePrefix || '—'}-001`;

   return (
      <div className="space-y-6">
         <PanelHeader
            icon={icon}
            title="Badge Management"
            description="Badge assignment rules and lost or deactivated badge handling."
         />

         <SettingsSection title="Formatting">
            <SettingsCard>
               <FormFieldBlock>
                  <Field className="gap-1.5">
                     <FieldLabel htmlFor="settings-badge-prefix">
                        Badge prefix
                     </FieldLabel>
                     <FieldDescription>
                        Prefix used when formatting visitor badge numbers.
                     </FieldDescription>
                     <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <Input
                           id="settings-badge-prefix"
                           value={form.badgePrefix}
                           maxLength={10}
                           onChange={(e) =>
                              onChange({ badgePrefix: e.target.value })
                           }
                           className="h-9 max-w-xs font-mono shadow-xs dark:bg-background"
                        />
                        <div className="rounded-lg border border-border/70 bg-muted/40 px-3 py-2 text-sm">
                           <span className="text-muted-foreground">
                              Preview{' '}
                           </span>
                           <span className="font-mono font-semibold tabular-nums">
                              {preview}
                           </span>
                        </div>
                     </div>
                  </Field>
               </FormFieldBlock>
            </SettingsCard>
         </SettingsSection>

         <SettingsSection title="Assignment">
            <SettingsCard>
               <SettingRow
                  id="settings-require-badge"
                  title="Require badge at check-in"
                  description="Visitors must be assigned an available badge before entry."
                  checked={form.requireBadgeOnCheckIn}
                  onCheckedChange={(checked) =>
                     onChange({ requireBadgeOnCheckIn: checked })
                  }
               />
               <SettingRow
                  id="settings-auto-assign"
                  title="Auto-assign next available badge"
                  description="Suggest the next free badge when checking a visitor in."
                  checked={form.autoAssignBadge}
                  onCheckedChange={(checked) =>
                     onChange({ autoAssignBadge: checked })
                  }
               />
               <SettingRow
                  id="settings-release-badge"
                  title="Release badge on checkout"
                  description="Return badges to the available pool after checkout."
                  checked={form.releaseBadgeOnCheckout}
                  onCheckedChange={(checked) =>
                     onChange({ releaseBadgeOnCheckout: checked })
                  }
               />
            </SettingsCard>
         </SettingsSection>

         <SettingsSection title="Lost & deactivated">
            <SettingsCard>
               <SettingRow
                  id="settings-deactivate-lost"
                  title="Deactivate lost badges"
                  description="Mark reported lost badges as unavailable for reuse."
                  checked={form.deactivateLostBadges}
                  onCheckedChange={(checked) =>
                     onChange({ deactivateLostBadges: checked })
                  }
               />
               <SettingRow
                  id="settings-block-deactivated"
                  title="Block deactivated badges"
                  description="Prevent check-in or checkout with lost or disabled badges."
                  checked={form.blockDeactivatedBadges}
                  onCheckedChange={(checked) =>
                     onChange({ blockDeactivatedBadges: checked })
                  }
               />
            </SettingsCard>
         </SettingsSection>
      </div>
   );
}

export function SecurityPanel({ icon, form, onChange }: PanelProps) {
   return (
      <div className="space-y-6">
         <PanelHeader
            icon={icon}
            title="Security"
            description="Session controls, authentication, and visit code security."
         />

         <SettingsSection title="Sessions & authentication">
            <SettingsCard>
               <FormFieldBlock className="border-b border-border/60">
                  <Field className="gap-1.5">
                     <FieldLabel htmlFor="settings-session-timeout">
                        Session timeout
                     </FieldLabel>
                     <FieldDescription>
                        Sign users out after a period of inactivity.
                     </FieldDescription>
                     <Select
                        value={form.sessionTimeout}
                        onValueChange={(value) =>
                           onChange({ sessionTimeout: value })
                        }
                     >
                        <SelectTrigger
                           id="settings-session-timeout"
                           className="h-9 w-full max-w-xs shadow-xs dark:bg-background"
                        >
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectGroup>
                              <SelectItem value="60">1 hour</SelectItem>
                              <SelectItem value="240">4 hours</SelectItem>
                              <SelectItem value="480">8 hours</SelectItem>
                              <SelectItem value="1440">24 hours</SelectItem>
                           </SelectGroup>
                        </SelectContent>
                     </Select>
                  </Field>
               </FormFieldBlock>
               <SettingRow
                  id="settings-password-change"
                  title="Require password change on first login"
                  description="New or reset accounts must set a new password."
                  checked={form.requirePasswordChange}
                  onCheckedChange={(checked) =>
                     onChange({ requirePasswordChange: checked })
                  }
               />
               <SettingRow
                  id="settings-2fa"
                  title="Allow optional two-factor authentication"
                  description="Let users enable an extra verification step at sign-in."
                  checked={form.twoFactorOptional}
                  onCheckedChange={(checked) =>
                     onChange({ twoFactorOptional: checked })
                  }
               />
            </SettingsCard>
         </SettingsSection>

         <SettingsSection title="Visit codes">
            <SettingsCard>
               <FormFieldBlock className="border-b border-border/60">
                  <Field className="gap-1.5">
                     <FieldLabel htmlFor="settings-qr-expiry">
                        QR / visit code expiry
                     </FieldLabel>
                     <FieldDescription>
                        How long invitation or self-service codes remain valid.
                     </FieldDescription>
                     <Select
                        value={form.qrCodeExpiry}
                        onValueChange={(value) =>
                           onChange({ qrCodeExpiry: value })
                        }
                     >
                        <SelectTrigger
                           id="settings-qr-expiry"
                           className="h-9 w-full max-w-xs shadow-xs dark:bg-background"
                        >
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectGroup>
                              <SelectItem value="4">4 hours</SelectItem>
                              <SelectItem value="12">12 hours</SelectItem>
                              <SelectItem value="24">24 hours</SelectItem>
                              <SelectItem value="72">3 days</SelectItem>
                           </SelectGroup>
                        </SelectContent>
                     </Select>
                  </Field>
               </FormFieldBlock>
               <SettingRow
                  id="settings-single-use-codes"
                  title="Single-use visit codes"
                  description="Invalidate QR and access codes after the first successful check-in."
                  checked={form.singleUseVisitCodes}
                  onCheckedChange={(checked) =>
                     onChange({ singleUseVisitCodes: checked })
                  }
               />
            </SettingsCard>
         </SettingsSection>
      </div>
   );
}
