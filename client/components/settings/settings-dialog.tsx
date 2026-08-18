'use client';

import {
   BadgeManagementPanel,
   DEFAULT_SETTINGS,
   GeneralPanel,
   NotificationsPanel,
   SecurityPanel,
   VisitManagementPanel,
   type SettingsFormState,
} from '@/components/settings/settings-panels';
import { SaveSettingsDialog } from '@/components/settings/save-settings-dialog';
import { Button } from '@/components/ui/button';
import {
   Dialog,
   DialogClose,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { canAccess } from '@/lib/access';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { useSettingsDialogStore } from '@/store/settings-dialog-store';
import {
   Bell,
   ClipboardList,
   IdCard,
   Settings2,
   Shield,
   type LucideIcon,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import * as React from 'react';
import { toast } from 'sonner';

const SETTINGS_TABS = [
   {
      id: 'general',
      label: 'General',
      description: 'Organization and display defaults',
      icon: Settings2,
   },
   {
      id: 'notifications',
      label: 'Notifications',
      description: 'Alerts for staff and hosts',
      icon: Bell,
   },
   {
      id: 'visits',
      label: 'Visit Management',
      description: 'Approvals, duration, and overdue rules',
      icon: ClipboardList,
   },
   {
      id: 'badges',
      label: 'Badge Management',
      description: 'Assignment and lost-badge handling',
      icon: IdCard,
   },
   {
      id: 'security',
      label: 'Security',
      description: 'Sessions, auth, and visit codes',
      icon: Shield,
   },
] as const;

type TabId = (typeof SETTINGS_TABS)[number]['id'];

const panelVariants = {
   enter: (dir: number) => ({ y: dir > 0 ? -48 : 48, opacity: 0 }),
   center: { y: 0, opacity: 1 },
   exit: (dir: number) => ({ y: dir > 0 ? 48 : -48, opacity: 0 }),
};

const panelTransition = { type: 'spring' as const, stiffness: 320, damping: 30 };

function isSettingsEqual(a: SettingsFormState, b: SettingsFormState) {
   return JSON.stringify(a) === JSON.stringify(b);
}

function PanelForTab({
   tabId,
   icon,
   form,
   onChange,
}: {
   tabId: TabId;
   icon: LucideIcon;
   form: SettingsFormState;
   onChange: (patch: Partial<SettingsFormState>) => void;
}) {
   switch (tabId) {
      case 'general':
         return <GeneralPanel icon={icon} form={form} onChange={onChange} />;
      case 'notifications':
         return (
            <NotificationsPanel icon={icon} form={form} onChange={onChange} />
         );
      case 'visits':
         return (
            <VisitManagementPanel icon={icon} form={form} onChange={onChange} />
         );
      case 'badges':
         return (
            <BadgeManagementPanel icon={icon} form={form} onChange={onChange} />
         );
      case 'security':
         return <SecurityPanel icon={icon} form={form} onChange={onChange} />;
   }
}

export function SettingsDialog() {
   const open = useSettingsDialogStore((s) => s.open);
   const setOpen = useSettingsDialogStore((s) => s.setOpen);
   const user = useAuthStore((s) => s.user);
   const canOpen = !!user && canAccess(user.roles, 'settings');

   const [activeTab, setActiveTab] = React.useState<TabId>('general');
   const [direction, setDirection] = React.useState(1);
   const [baseline, setBaseline] =
      React.useState<SettingsFormState>(DEFAULT_SETTINGS);
   const [form, setForm] = React.useState<SettingsFormState>(DEFAULT_SETTINGS);
   const [saveDialogOpen, setSaveDialogOpen] = React.useState(false);
   const [isSaving, setIsSaving] = React.useState(false);

   React.useEffect(() => {
      if (open) {
         setForm(baseline);
         setActiveTab('general');
         setDirection(1);
      }
   }, [open, baseline]);

   const handleTabChange = (newId: string) => {
      const prevIdx = SETTINGS_TABS.findIndex((t) => t.id === activeTab);
      const nextIdx = SETTINGS_TABS.findIndex((t) => t.id === newId);
      setDirection(nextIdx > prevIdx ? 1 : -1);
      setActiveTab(newId as TabId);
   };

   React.useEffect(() => {
      if (open && !canOpen) {
         setOpen(false);
      }
   }, [open, canOpen, setOpen]);

   if (!canOpen) return null;

   const isDirty = !isSettingsEqual(form, baseline);
   const active = SETTINGS_TABS.find((tab) => tab.id === activeTab)!;

   const handleChange = (patch: Partial<SettingsFormState>) => {
      setForm((prev) => ({ ...prev, ...patch }));
   };

   const handleCancel = () => {
      setForm(baseline);
   };

   const handleSave = () => {
      setIsSaving(true);
      window.setTimeout(() => {
         setBaseline(form);
         setIsSaving(false);
         setSaveDialogOpen(false);
         setOpen(false);
         toast.success('Settings saved successfully');
      }, 400);
   };

   return (
      <>
         <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
               showCloseButton={false}
               className="flex max-h-[min(92vh,900px)] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl lg:max-w-6xl"
            >
               <DialogHeader className="shrink-0 border-b px-5 py-4 sm:px-6">
                  <DialogTitle className="text-base font-medium">
                     System Settings
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                     Configure organization, visit, badge, notification, and
                     security settings.
                  </DialogDescription>
               </DialogHeader>

               <div className="min-h-0 flex-1 overflow-hidden px-5 py-5 sm:px-6 sm:py-6">
                  <Tabs
                     value={activeTab}
                     onValueChange={handleTabChange}
                     orientation="vertical"
                     className="flex h-full min-h-0 flex-col items-start gap-6 md:flex-row md:gap-10 lg:gap-12"
                  >
                     <div className="w-full shrink-0 md:w-56">
                        <TabsList className="flex h-auto w-full flex-row justify-start gap-1.5 overflow-x-auto rounded-none border-none bg-transparent p-0 md:flex-col md:overflow-visible">
                           {SETTINGS_TABS.map((tab) => {
                              const Icon = tab.icon;
                              const isActive = activeTab === tab.id;

                              return (
                                 <TabsTrigger
                                    key={tab.id}
                                    value={tab.id}
                                    className={cn(
                                       'relative w-auto cursor-pointer select-none justify-start gap-3 whitespace-nowrap rounded-lg px-3.5 py-3 text-sm font-medium outline-none transition-all md:w-full',
                                       'hover:bg-muted/60 hover:text-foreground',
                                       isActive
                                          ? 'border-none text-foreground'
                                          : 'border border-border/50 text-muted-foreground',
                                       'shadow-none ring-0 after:hidden data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:ring-0',
                                    )}
                                 >
                                    <Icon className="relative z-10 size-4 shrink-0" />
                                    <span className="relative z-10 text-left">
                                       {tab.label}
                                    </span>
                                    {isActive && (
                                       <motion.div
                                          layoutId="settings-tab-indicator"
                                          className="pointer-events-none absolute inset-0 rounded-lg bg-muted"
                                          initial={false}
                                          transition={{
                                             type: 'spring',
                                             stiffness: 300,
                                             damping: 25,
                                          }}
                                       />
                                    )}
                                 </TabsTrigger>
                              );
                           })}
                        </TabsList>
                     </div>

                     <div className="relative min-h-[360px] w-full flex-1 overflow-hidden md:min-h-[380px]">
                        <div className="relative h-[min(54vh,560px)] w-full md:h-[min(60vh,600px)]">
                           <AnimatePresence
                              mode="wait"
                              custom={direction}
                              initial={false}
                           >
                              <motion.div
                                 key={activeTab}
                                 custom={direction}
                                 variants={panelVariants}
                                 initial="enter"
                                 animate="center"
                                 exit="exit"
                                 transition={panelTransition}
                                 className="absolute inset-0 flex h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-card"
                              >
                                 <ScrollArea className="h-full">
                                    <div className="flex flex-col gap-5 p-5 sm:p-7">
                                       <PanelForTab
                                          tabId={activeTab}
                                          icon={active.icon}
                                          form={form}
                                          onChange={handleChange}
                                       />
                                    </div>
                                 </ScrollArea>
                              </motion.div>
                           </AnimatePresence>
                        </div>
                     </div>
                  </Tabs>
               </div>

               <div className="flex shrink-0 flex-col gap-3 border-t bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <p className="text-sm text-muted-foreground">
                     {isDirty
                        ? 'You have unsaved changes'
                        : 'All changes are saved'}
                  </p>
                  <div className="flex w-full gap-3 sm:w-auto">
                     <DialogClose asChild>
                        <Button
                           type="button"
                           variant="outline"
                           className="h-9 flex-1 rounded-lg shadow-xs sm:flex-none"
                           onClick={handleCancel}
                        >
                           Cancel
                        </Button>
                     </DialogClose>
                     <Button
                        type="button"
                        className="h-9 flex-1 rounded-lg sm:flex-none"
                        disabled={!isDirty || isSaving}
                        onClick={() => setSaveDialogOpen(true)}
                     >
                        {isSaving ? 'Saving…' : 'Save Settings'}
                     </Button>
                  </div>
               </div>
            </DialogContent>
         </Dialog>

         <SaveSettingsDialog
            open={saveDialogOpen}
            onOpenChange={setSaveDialogOpen}
            onConfirm={handleSave}
            isPending={isSaving}
         />
      </>
   );
}
