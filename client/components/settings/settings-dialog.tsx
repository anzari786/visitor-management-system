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
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import * as React from 'react';
import { toast } from 'sonner';

const SETTINGS_TABS = [
   { id: 'general', label: 'General', icon: Settings2 },
   { id: 'notifications', label: 'Notifications', icon: Bell },
   { id: 'visits', label: 'Visit Management', icon: ClipboardList },
   { id: 'badges', label: 'Badge Management', icon: IdCard },
   { id: 'security', label: 'Security', icon: Shield },
] as const;

type TabId = (typeof SETTINGS_TABS)[number]['id'];

function isSettingsEqual(a: SettingsFormState, b: SettingsFormState) {
   return JSON.stringify(a) === JSON.stringify(b);
}

export function SettingsDialog() {
   const open = useSettingsDialogStore((s) => s.open);
   const setOpen = useSettingsDialogStore((s) => s.setOpen);
   const user = useAuthStore((s) => s.user);
   const canOpen = !!user && canAccess(user.role, 'settings');

   const [activeTab, setActiveTab] = React.useState<TabId>('general');
   const [baseline, setBaseline] =
      React.useState<SettingsFormState>(DEFAULT_SETTINGS);
   const [form, setForm] = React.useState<SettingsFormState>(DEFAULT_SETTINGS);
   const [saveDialogOpen, setSaveDialogOpen] = React.useState(false);
   const [isSaving, setIsSaving] = React.useState(false);

   React.useEffect(() => {
      if (open) {
         setForm(baseline);
         setActiveTab('general');
      }
   }, [open, baseline]);

   React.useEffect(() => {
      if (open && !canOpen) {
         setOpen(false);
      }
   }, [open, canOpen, setOpen]);

   if (!canOpen) return null;

   const isDirty = !isSettingsEqual(form, baseline);

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
               className="flex max-h-[min(92vh,880px)] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl lg:max-w-6xl"
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
                     onValueChange={(value) => setActiveTab(value as TabId)}
                     orientation="vertical"
                     className="flex h-full min-h-0 flex-col items-stretch gap-5 md:flex-row md:gap-8"
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
                                       'relative w-auto cursor-pointer select-none justify-start gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-colors md:w-full',
                                       'hover:bg-muted/60 hover:text-foreground',
                                       isActive
                                          ? 'border-none text-foreground'
                                          : 'border border-border/50 text-muted-foreground',
                                       'shadow-none ring-0 after:hidden data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:ring-0',
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
                                             stiffness: 380,
                                             damping: 32,
                                          }}
                                       />
                                    )}
                                 </TabsTrigger>
                              );
                           })}
                        </TabsList>
                     </div>

                     <div className="relative min-h-0 w-full flex-1 overflow-hidden">
                        <ScrollArea className="h-[min(52vh,520px)] md:h-[min(58vh,560px)]">
                           <AnimatePresence mode="wait" initial={false}>
                              <motion.div
                                 key={activeTab}
                                 initial={{ opacity: 0 }}
                                 animate={{ opacity: 1 }}
                                 exit={{ opacity: 0 }}
                                 transition={{ duration: 0.15 }}
                                 className="rounded-xl border border-border bg-card p-4 sm:p-6"
                              >
                                 {activeTab === 'general' && (
                                    <GeneralPanel
                                       form={form}
                                       onChange={handleChange}
                                    />
                                 )}
                                 {activeTab === 'notifications' && (
                                    <NotificationsPanel
                                       form={form}
                                       onChange={handleChange}
                                    />
                                 )}
                                 {activeTab === 'visits' && (
                                    <VisitManagementPanel
                                       form={form}
                                       onChange={handleChange}
                                    />
                                 )}
                                 {activeTab === 'badges' && (
                                    <BadgeManagementPanel
                                       form={form}
                                       onChange={handleChange}
                                    />
                                 )}
                                 {activeTab === 'security' && (
                                    <SecurityPanel
                                       form={form}
                                       onChange={handleChange}
                                    />
                                 )}
                              </motion.div>
                           </AnimatePresence>
                        </ScrollArea>
                     </div>
                  </Tabs>
               </div>

               <div className="flex shrink-0 flex-col gap-3 border-t bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
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
