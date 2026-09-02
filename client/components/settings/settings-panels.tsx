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
import { useTranslation } from '@/lib/i18n';
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
   const { t } = useTranslation();

   return (
      <div className="space-y-6">
         <PanelHeader
            icon={icon}
            title={t('settings.general')}
            description={t('settings.generalHint')}
         />

         <SettingsSection title={t('settings.section.organization')}>
            <SettingsCard>
               <FormFieldBlock>
                  <Field className="gap-1.5">
                     <FieldLabel htmlFor="settings-org-name">
                        {t('settings.orgName')}
                     </FieldLabel>
                     <FieldDescription>
                        {t('settings.orgNameHint')}
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

         <SettingsSection title={t('settings.section.defaults')}>
            <SettingsCard>
               <FormFieldBlock>
                  <FieldGroup className="gap-5">
                     <div className="grid gap-5 sm:grid-cols-2">
                        <Field className="gap-1.5">
                           <FieldLabel htmlFor="settings-timezone">
                              {t('settings.timezone')}
                           </FieldLabel>
                           <FieldDescription>
                              {t('settings.timezoneHint')}
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
                                       {t('settings.tz.addis')}
                                    </SelectItem>
                                    <SelectItem value="UTC">UTC</SelectItem>
                                    <SelectItem value="Africa/Nairobi">
                                       {t('settings.tz.nairobi')}
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
                              {t('settings.defaultDuration')}
                           </FieldLabel>
                           <FieldDescription>
                              {t('settings.defaultDurationHint')}
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
                                       {t('settings.duration.30m')}
                                    </SelectItem>
                                    <SelectItem value="60">{t('settings.duration.1h')}</SelectItem>
                                    <SelectItem value="120">{t('settings.duration.2h')}</SelectItem>
                                    <SelectItem value="240">{t('settings.duration.4h')}</SelectItem>
                                    <SelectItem value="480">
                                       {t('settings.duration.fullDay')}
                                    </SelectItem>
                                 </SelectGroup>
                              </SelectContent>
                           </Select>
                        </Field>

                        <Field className="gap-1.5">
                           <FieldLabel htmlFor="settings-date-format">
                              {t('settings.dateFormat')}
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
                              {t('settings.timeFormat')}
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
                                    <SelectItem value="24h">{t('settings.time.24h')}</SelectItem>
                                    <SelectItem value="12h">
                                       {t('settings.time.12h')}
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
   const { t } = useTranslation();

   return (
      <div className="space-y-6">
         <PanelHeader
            icon={icon}
            title={t('settings.notifications')}
            description={t('settings.notificationsHint')}
         />

         <SettingsSection title={t('settings.section.deliveryChannels')}>
            <SettingsCard>
               <SettingRow
                  id="settings-email-notifications"
                  title={t('settings.emailNotifications')}
                  description={t('settings.emailNotificationsHint')}
                  checked={form.emailNotifications}
                  onCheckedChange={(checked) =>
                     onChange({ emailNotifications: checked })
                  }
               />
               <SettingRow
                  id="settings-dashboard-notifications"
                  title={t('settings.dashboardNotifications')}
                  description={t('settings.dashboardNotificationsHint')}
                  checked={form.dashboardNotifications}
                  onCheckedChange={(checked) =>
                     onChange({ dashboardNotifications: checked })
                  }
               />
            </SettingsCard>
         </SettingsSection>

         <SettingsSection title={t('settings.section.visitEvents')}>
            <SettingsCard>
               <SettingRow
                  id="settings-approval-reminders"
                  title={t('settings.approvalReminders')}
                  description={t('settings.approvalRemindersHint')}
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
                        <SelectValue placeholder={t('settings.reminderInterval')} />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectGroup>
                           <SelectItem value="30">{t('settings.every.30m')}</SelectItem>
                           <SelectItem value="60">{t('settings.every.1h')}</SelectItem>
                           <SelectItem value="120">{t('settings.every.2h')}</SelectItem>
                           <SelectItem value="240">{t('settings.every.4h')}</SelectItem>
                        </SelectGroup>
                     </SelectContent>
                  </Select>
               </SettingRow>
               <SettingRow
                  id="settings-decision-alerts"
                  title={t('settings.decisionAlerts')}
                  description={t('settings.decisionAlertsHint')}
                  checked={form.visitDecisionAlerts}
                  onCheckedChange={(checked) =>
                     onChange({ visitDecisionAlerts: checked })
                  }
               />
               <SettingRow
                  id="settings-checkin-alerts"
                  title={t('settings.checkInAlerts')}
                  description={t('settings.checkInAlertsHint')}
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
   const { t } = useTranslation();

   return (
      <div className="space-y-6">
         <PanelHeader
            icon={icon}
            title={t('settings.visitManagement')}
            description={t('settings.visitManagementHint')}
         />

         <SettingsSection title={t('settings.section.accessRules')}>
            <SettingsCard>
               <SettingRow
                  id="settings-require-approval"
                  title={t('settings.requireApproval')}
                  description={t('settings.requireApprovalHint')}
                  checked={form.requireHostApproval}
                  onCheckedChange={(checked) =>
                     onChange({ requireHostApproval: checked })
                  }
               />
               <SettingRow
                  id="settings-allow-walkins"
                  title={t('settings.allowWalkIns')}
                  description={t('settings.allowWalkInsHint')}
                  checked={form.allowWalkIns}
                  onCheckedChange={(checked) =>
                     onChange({ allowWalkIns: checked })
                  }
               />
            </SettingsCard>
         </SettingsSection>

         <SettingsSection title={t('settings.section.duration')}>
            <SettingsCard>
               <FormFieldBlock className="border-b border-border/60">
                  <Field className="gap-1.5">
                     <FieldLabel htmlFor="settings-allowed-duration">
                        {t('settings.allowedDuration')}
                     </FieldLabel>
                     <FieldDescription>
                        {t('settings.allowedDurationHint')}
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
                              <SelectItem value="120">{t('settings.duration.2h')}</SelectItem>
                              <SelectItem value="240">{t('settings.duration.4h')}</SelectItem>
                              <SelectItem value="480">{t('settings.duration.8h')}</SelectItem>
                              <SelectItem value="720">{t('settings.duration.12h')}</SelectItem>
                           </SelectGroup>
                        </SelectContent>
                     </Select>
                  </Field>
               </FormFieldBlock>
               <SettingRow
                  id="settings-multi-day"
                  title={t('settings.allowMultiDay')}
                  description={t('settings.allowMultiDayHint')}
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
                        <SelectValue placeholder={t('settings.maxDays')} />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectGroup>
                           <SelectItem value="2">{t('settings.upTo.2d')}</SelectItem>
                           <SelectItem value="3">{t('settings.upTo.3d')}</SelectItem>
                           <SelectItem value="5">{t('settings.upTo.5d')}</SelectItem>
                           <SelectItem value="7">{t('settings.upTo.7d')}</SelectItem>
                        </SelectGroup>
                     </SelectContent>
                  </Select>
               </SettingRow>
            </SettingsCard>
         </SettingsSection>

         <SettingsSection title={t('settings.section.monitoring')}>
            <SettingsCard>
               <SettingRow
                  id="settings-overdue"
                  title={t('settings.overdueDetection')}
                  description={t('settings.overdueDetectionHint')}
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
                        <SelectValue placeholder={t('settings.overdueAfter')} />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectGroup>
                           <SelectItem value="30">{t('settings.after.30m')}</SelectItem>
                           <SelectItem value="60">{t('settings.after.1h')}</SelectItem>
                           <SelectItem value="120">{t('settings.after.2h')}</SelectItem>
                           <SelectItem value="240">{t('settings.after.4h')}</SelectItem>
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
   const { t } = useTranslation();

   const preview = `${form.badgePrefix || '—'}-001`;

   return (
      <div className="space-y-6">
         <PanelHeader
            icon={icon}
            title={t('settings.badgeManagement')}
            description={t('settings.badgeManagementHint')}
         />

         <SettingsSection title={t('settings.section.formatting')}>
            <SettingsCard>
               <FormFieldBlock>
                  <Field className="gap-1.5">
                     <FieldLabel htmlFor="settings-badge-prefix">
                        {t('settings.badgePrefix')}
                     </FieldLabel>
                     <FieldDescription>
                        {t('settings.badgePrefixHint')}
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

         <SettingsSection title={t('settings.section.assignment')}>
            <SettingsCard>
               <SettingRow
                  id="settings-require-badge"
                  title={t('settings.requireBadge')}
                  description={t('settings.requireBadgeHint')}
                  checked={form.requireBadgeOnCheckIn}
                  onCheckedChange={(checked) =>
                     onChange({ requireBadgeOnCheckIn: checked })
                  }
               />
               <SettingRow
                  id="settings-auto-assign"
                  title={t('settings.autoAssignBadge')}
                  description={t('settings.autoAssignBadgeHint')}
                  checked={form.autoAssignBadge}
                  onCheckedChange={(checked) =>
                     onChange({ autoAssignBadge: checked })
                  }
               />
               <SettingRow
                  id="settings-release-badge"
                  title={t('settings.releaseBadge')}
                  description={t('settings.releaseBadgeHint')}
                  checked={form.releaseBadgeOnCheckout}
                  onCheckedChange={(checked) =>
                     onChange({ releaseBadgeOnCheckout: checked })
                  }
               />
            </SettingsCard>
         </SettingsSection>

         <SettingsSection title={t('settings.section.lostDeactivated')}>
            <SettingsCard>
               <SettingRow
                  id="settings-deactivate-lost"
                  title={t('settings.deactivateLost')}
                  description={t('settings.deactivateLostHint')}
                  checked={form.deactivateLostBadges}
                  onCheckedChange={(checked) =>
                     onChange({ deactivateLostBadges: checked })
                  }
               />
               <SettingRow
                  id="settings-block-deactivated"
                  title={t('settings.blockDeactivated')}
                  description={t('settings.blockDeactivatedHint')}
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
   const { t } = useTranslation();

   return (
      <div className="space-y-6">
         <PanelHeader
            icon={icon}
            title={t('settings.security')}
            description={t('settings.securityHint')}
         />

         <SettingsSection title={t('settings.section.sessions')}>
            <SettingsCard>
               <FormFieldBlock className="border-b border-border/60">
                  <Field className="gap-1.5">
                     <FieldLabel htmlFor="settings-session-timeout">
                        {t('settings.sessionTimeout')}
                     </FieldLabel>
                     <FieldDescription>
                        {t('settings.sessionTimeoutHint')}
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
                              <SelectItem value="60">{t('settings.duration.1h')}</SelectItem>
                              <SelectItem value="240">{t('settings.duration.4h')}</SelectItem>
                              <SelectItem value="480">{t('settings.duration.8h')}</SelectItem>
                              <SelectItem value="1440">{t('settings.duration.24h')}</SelectItem>
                           </SelectGroup>
                        </SelectContent>
                     </Select>
                  </Field>
               </FormFieldBlock>
               <SettingRow
                  id="settings-password-change"
                  title={t('settings.requirePasswordChange')}
                  description={t('settings.requirePasswordChangeHint')}
                  checked={form.requirePasswordChange}
                  onCheckedChange={(checked) =>
                     onChange({ requirePasswordChange: checked })
                  }
               />
               <SettingRow
                  id="settings-2fa"
                  title={t('settings.twoFactor')}
                  description={t('settings.twoFactorHint')}
                  checked={form.twoFactorOptional}
                  onCheckedChange={(checked) =>
                     onChange({ twoFactorOptional: checked })
                  }
               />
            </SettingsCard>
         </SettingsSection>

         <SettingsSection title={t('settings.section.visitCodes')}>
            <SettingsCard>
               <FormFieldBlock className="border-b border-border/60">
                  <Field className="gap-1.5">
                     <FieldLabel htmlFor="settings-qr-expiry">
                        {t('settings.qrExpiry')}
                     </FieldLabel>
                     <FieldDescription>
                        {t('settings.qrExpiryHint')}
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
                              <SelectItem value="4">{t('settings.duration.4h')}</SelectItem>
                              <SelectItem value="12">{t('settings.duration.12h')}</SelectItem>
                              <SelectItem value="24">{t('settings.duration.24h')}</SelectItem>
                              <SelectItem value="72">{t('settings.duration.3d')}</SelectItem>
                           </SelectGroup>
                        </SelectContent>
                     </Select>
                  </Field>
               </FormFieldBlock>
               <SettingRow
                  id="settings-single-use-codes"
                  title={t('settings.singleUseCodes')}
                  description={t('settings.singleUseCodesHint')}
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
