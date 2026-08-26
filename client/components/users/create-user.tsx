import { Button } from '@/components/ui/button';
import {
   Dialog,
   DialogContent,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from '@/components/ui/dialog';
import {
   Field,
   FieldDescription,
   FieldError,
   FieldGroup,
   FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
   createUserSchema,
   createSsoUserSchema,
   type CreateUserFormValues,
   type CreateSsoUserFormValues,
} from '@/lib/validations/user.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Badge } from '../reui/badge';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '../ui/select';
import {
   Check,
   KeyRound,
   ShieldCheck,
   Loader2,
   Info,
   LoaderCircleIcon,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
   Autocomplete,
   AutocompleteContent,
   AutocompleteEmpty,
   AutocompleteGroup,
   AutocompleteGroupLabel,
   AutocompleteInput,
   AutocompleteItem,
   AutocompleteList,
   AutocompleteSeparator,
   AutocompleteStatus,
} from '@/components/ui/autocomplete';
import { selfServiceService } from '@/services/self-service.service';
import type { EmployeeSearchResult } from '@/types/self-service.types';

type CreateUserProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onSubmit?: (
      values: CreateUserFormValues | CreateSsoUserFormValues,
   ) => void | Promise<void>;
};

const scrollAreaClass =
   'flex-1 space-y-8 overflow-y-auto px-6 py-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden';

async function searchEmployees(query: string): Promise<EmployeeSearchResult[]> {
   const { data } = await selfServiceService.searchEmployees({
      q: query.trim(),
      limit: 25,
   });
   return data.data;
}

function groupEmployeesByDepartment(hosts: EmployeeSearchResult[]) {
   const groups = new Map<string, EmployeeSearchResult[]>();
   hosts
      .filter((employee) => employee.isActive)
      .forEach((employee) => {
         const group = groups.get(employee.departmentName) ?? [];
         group.push(employee);
         groups.set(employee.departmentName, group);
      });
   return [...groups.entries()].map(([departmentName, items]) => ({
      departmentName,
      items,
   }));
}

const CIRCLE_RADIUS = 7;
const CIRCLE_LENGTH = 2 * Math.PI * CIRCLE_RADIUS;
const USERNAME_REGEX = /^[a-zA-Z0-9_]*$/;

const getStrokeColorClass = (p: number) => {
   if (p <= 0) return 'stroke-transparent';
   if (p <= 0.35) return 'stroke-red-500';
   if (p <= 0.7) return 'stroke-orange-500';
   return 'stroke-teal-400';
};

const AnimatedCheckmarkCircle = ({ progress }: { progress: number }) => {
   const isComplete = progress >= 1;
   return (
      <div className="relative flex items-center justify-center w-5 h-5 select-none">
         <svg width="20" height="20" className="-rotate-90">
            <circle
               cx="10"
               cy="10"
               r={CIRCLE_RADIUS}
               className="stroke-muted-foreground/20"
               strokeWidth="1.5"
               fill="transparent"
            />
            <motion.circle
               cx="10"
               cy="10"
               r={CIRCLE_RADIUS}
               className={cn(
                  'transition-colors duration-300',
                  getStrokeColorClass(progress),
               )}
               strokeWidth="1.5"
               fill="transparent"
               strokeDasharray={CIRCLE_LENGTH}
               initial={{ strokeDashoffset: CIRCLE_LENGTH }}
               animate={{
                  strokeDashoffset: CIRCLE_LENGTH - progress * CIRCLE_LENGTH,
               }}
               transition={{
                  duration: 0.35,
                  ease: 'easeInOut',
               }}
            />
            <motion.circle
               cx="10"
               cy="10"
               r={CIRCLE_RADIUS}
               className="fill-teal-400"
               style={{ transformOrigin: 'center' }}
               initial={{ scale: 0, opacity: 0 }}
               animate={{
                  scale: isComplete ? 1 : 0,
                  opacity: isComplete ? 1 : 0,
               }}
               transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                  delay: isComplete ? 0.15 : 0,
               }}
            />
         </svg>
         <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
               initial={{ scale: 0, opacity: 0 }}
               animate={{
                  scale: isComplete ? 1 : 0,
                  opacity: isComplete ? 1 : 0,
               }}
               transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 15,
                  delay: isComplete ? 0.28 : 0,
               }}
            >
               <Check className="text-white size-3" strokeWidth={3} />
            </motion.div>
         </div>
      </div>
   );
};

function SectionHeading({
   title,
   description,
}: {
   title: string;
   description: string;
}) {
   return (
      <div className="space-y-1">
         <h3 className="text-sm font-semibold text-foreground">{title}</h3>
         <p className="text-sm text-muted-foreground">{description}</p>
      </div>
   );
}

const LocalUserForm = ({ onOpenChange, onSubmit, open }: CreateUserProps) => {
   const {
      register,
      handleSubmit,
      control,
      reset,
      watch,
      formState: { errors, isSubmitting },
   } = useForm<CreateUserFormValues>({
      resolver: zodResolver(createUserSchema),
      defaultValues: {
         firstName: '',
         lastName: '',
         email: '',
         username: '',
         role: 'front_desk',
      },
   });

   const usernameValue = watch('username');
   const isUsernameCharsValid = USERNAME_REGEX.test(usernameValue || '');
   const usernameProgress = isUsernameCharsValid
      ? Math.min((usernameValue || '').length / 3, 1.0)
      : 0.0;

   // Reset form whenever dialog is opened
   React.useEffect(() => {
      if (open) {
         reset();
      }
   }, [open, reset]);

   const handleFormSubmit = handleSubmit(async (values) => {
      await onSubmit?.(values);
      onOpenChange(false);
   });

   return (
      <form
         onSubmit={handleFormSubmit}
         noValidate
         className="flex min-h-0 flex-1 flex-col"
      >
         <div className={scrollAreaClass}>
            <FieldGroup className="gap-6">
               <div className="space-y-4">
                  <SectionHeading
                     title="User Information"
                     description="Basic profile details for the user."
                  />
                  {/* First / Last name row */}
                  <div className="grid grid-cols-2 gap-3">
                     <Field>
                        <FieldLabel htmlFor="first-name">
                           First Name
                           <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                           id="first-name"
                           aria-invalid={!!errors.firstName}
                           {...register('firstName')}
                        />
                        {errors.firstName && (
                           <FieldError>{errors.firstName.message}</FieldError>
                        )}
                     </Field>

                     <Field>
                        <FieldLabel htmlFor="last-name">
                           Last Name
                           <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                           id="last-name"
                           aria-invalid={!!errors.lastName}
                           {...register('lastName')}
                        />
                        {errors.lastName && (
                           <FieldError>{errors.lastName.message}</FieldError>
                        )}
                     </Field>
                  </div>

                  {/* Email */}
                  <Field>
                     <FieldLabel htmlFor="email">
                        Email
                        <span className="text-destructive">*</span>
                     </FieldLabel>
                     <Input
                        id="email"
                        type="email"
                        placeholder="email@example.com"
                        aria-invalid={!!errors.email}
                        {...register('email')}
                     />
                     {errors.email && (
                        <FieldError>{errors.email.message}</FieldError>
                     )}
                  </Field>

                  {/* Username */}
                  <Field>
                     <FieldLabel htmlFor="username">
                        Username
                        <span className="text-destructive">*</span>
                     </FieldLabel>
                     <FieldDescription>
                        Min. 3 characters, alphanumeric &amp; underscores
                     </FieldDescription>
                     <div className="relative">
                        <Input
                           id="username"
                           type="text"
                           className="bg-transparent pr-16 focus-visible:ring-1"
                           aria-invalid={!!errors.username}
                           {...register('username')}
                        />

                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                           <AnimatedCheckmarkCircle
                              progress={usernameProgress}
                           />
                        </div>
                     </div>

                     {errors.username && (
                        <FieldError>{errors.username.message}</FieldError>
                     )}
                  </Field>

                  {/* Role */}
                  <Field>
                     <FieldLabel htmlFor="role">
                        Role
                        <span className="text-destructive">*</span>
                     </FieldLabel>
                     <Controller
                        name="role"
                        control={control}
                        render={({ field }) => (
                           <Select
                              value={field.value}
                              onValueChange={field.onChange}
                           >
                              <SelectTrigger
                                 id="role"
                                 aria-invalid={!!errors.role}
                              >
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                 <SelectItem value="admin">Admin</SelectItem>
                                 <SelectItem value="front_desk">
                                    Front Desk
                                 </SelectItem>
                              </SelectContent>
                           </Select>
                        )}
                     />
                     {errors.role && (
                        <FieldError>{errors.role.message}</FieldError>
                     )}
                  </Field>
               </div>

               <div className="space-y-4">
                  <SectionHeading
                     title="Authentication"
                     description="How this user will sign in to the system."
                  />
                  <div className="flex items-start gap-3 rounded-xl border bg-muted/30 p-4">
                     <div className="mt-0.5 rounded-full bg-primary/10 p-1.5 text-primary">
                        <KeyRound className="size-4" />
                     </div>
                     <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                           Local Account
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                           Uses username and password authentication. The user
                           will be prompted to set their password upon first
                           login or via a reset link.
                        </p>
                     </div>
                  </div>
               </div>
            </FieldGroup>
         </div>

         <DialogFooter className="shrink-0 gap-2 border-t px-6 py-4 sm:justify-end">
            <Button
               type="button"
               variant="outline"
               className="cursor-pointer"
               disabled={isSubmitting}
               onClick={() => onOpenChange(false)}
            >
               Cancel
            </Button>
            <Button
               type="submit"
               className="cursor-pointer gap-2"
               disabled={isSubmitting}
            >
               {isSubmitting ? (
                  <>
                     <Loader2 className="size-4 animate-spin" />
                     Creating…
                  </>
               ) : (
                  'Create User'
               )}
            </Button>
         </DialogFooter>
      </form>
   );
};

const SsoUserForm = ({ onOpenChange, onSubmit, open }: CreateUserProps) => {
   const {
      handleSubmit,
      control,
      reset,
      setValue,
      watch,
      formState: { errors, isSubmitting },
   } = useForm<CreateSsoUserFormValues>({
      resolver: zodResolver(createSsoUserSchema),
      defaultValues: {
         employeeId: '',
         role: 'front_desk',
      },
   });

   const [autocompleteOpen, setAutocompleteOpen] = React.useState(false);
   const [inputValue, setInputValue] = React.useState('');
   const [isLoadingEmployees, setIsLoadingEmployees] = React.useState(false);
   const [results, setResults] = React.useState<EmployeeSearchResult[]>([]);
   const [searchError, setSearchError] = React.useState<string | null>(null);

   const selectedEmployeeId = watch('employeeId');
   const selectedEmployee = React.useMemo(
      () => results.find((e) => e.id === selectedEmployeeId),
      [results, selectedEmployeeId],
   );

   React.useEffect(() => {
      if (open) {
         reset();
         setInputValue('');
      }
   }, [open, reset]);

   React.useEffect(() => {
      setIsLoadingEmployees(true);
      setSearchError(null);
      let ignore = false;

      const timer = setTimeout(async () => {
         try {
            const data = await searchEmployees(inputValue);
            if (!ignore) setResults(data);
         } catch {
            if (!ignore) {
               setSearchError('Unable to search employees. Please try again.');
               setResults([]);
            }
         } finally {
            if (!ignore) setIsLoadingEmployees(false);
         }
      }, 300);

      return () => {
         clearTimeout(timer);
         ignore = true;
      };
   }, [inputValue]);

   const grouped = React.useMemo(
      () => groupEmployeesByDepartment(results),
      [results],
   );

   const handleFormSubmit = handleSubmit(async (values) => {
      await onSubmit?.(values);
      onOpenChange(false);
   });

   let status: React.ReactNode = null;
   if (isLoadingEmployees) {
      status = (
         <div className="flex items-center gap-2">
            <LoaderCircleIcon className="size-4 animate-spin" />
            Searching employees...
         </div>
      );
   } else if (searchError) {
      status = searchError;
   } else if (inputValue && results.length === 0) {
      status = `No employees found for "${inputValue}"`;
   } else if (results.length > 0) {
      status = `${results.length} employee${results.length === 1 ? '' : 's'} found`;
   }

   return (
      <form
         onSubmit={handleFormSubmit}
         noValidate
         className="flex min-h-0 flex-1 flex-col"
      >
         <div className={scrollAreaClass}>
            <FieldGroup className="gap-6">
               <div className="space-y-4">
                  <SectionHeading
                     title="Employee Selection"
                     description="Select an organization employee to provision their account."
                  />

                  <Controller
                     name="employeeId"
                     control={control}
                     render={({ field }) => (
                        <Field>
                           <FieldLabel htmlFor="employeeId">
                              Employee{' '}
                              <span className="text-destructive">*</span>
                           </FieldLabel>
                           <Autocomplete
                              open={autocompleteOpen}
                              onOpenChange={setAutocompleteOpen}
                              value={field.value ?? null}
                              onValueChange={(value) => {
                                 field.onChange(value ?? '');
                              }}
                              onInputValueChange={setInputValue}
                              defaultInputValue={
                                 results.find((e) => e.id === field.value)
                                    ? `${results.find((e) => e.id === field.value)?.firstName} ${results.find((e) => e.id === field.value)?.lastName}`
                                    : ''
                              }
                           >
                              <AutocompleteInput
                                 id="employeeId"
                                 placeholder="Search by name or department"
                                 autoComplete="off"
                                 showTrigger
                                 showClear
                                 aria-invalid={!!errors.employeeId}
                                 onFocus={() => setAutocompleteOpen(true)}
                              />
                              <AutocompleteContent>
                                 {status && (
                                    <AutocompleteStatus>
                                       {status}
                                    </AutocompleteStatus>
                                 )}
                                 <AutocompleteList>
                                    {!isLoadingEmployees &&
                                    results.length === 0 ? (
                                       <AutocompleteEmpty>
                                          No matching employees found.
                                       </AutocompleteEmpty>
                                    ) : (
                                       grouped.map((group, groupIndex) => (
                                          <AutocompleteGroup
                                             key={group.departmentName}
                                          >
                                             {groupIndex > 0 && (
                                                <AutocompleteSeparator />
                                             )}
                                             <AutocompleteGroupLabel>
                                                {group.departmentName}
                                             </AutocompleteGroupLabel>
                                             {group.items.map((employee) => (
                                                <AutocompleteItem
                                                   key={employee.id}
                                                   value={employee.id}
                                                   label={`${employee.firstName} ${employee.lastName}`}
                                                >
                                                   <div className="min-w-0 flex-1">
                                                      <p className="truncate text-sm font-medium">
                                                         {employee.firstName}{' '}
                                                         {employee.lastName}
                                                      </p>
                                                      <p className="truncate text-xs text-muted-foreground">
                                                         {employee.position ??
                                                            employee.departmentName}
                                                      </p>
                                                   </div>
                                                </AutocompleteItem>
                                             ))}
                                          </AutocompleteGroup>
                                       ))
                                    )}
                                 </AutocompleteList>
                              </AutocompleteContent>
                           </Autocomplete>
                           <FieldError>{errors.employeeId?.message}</FieldError>
                        </Field>
                     )}
                  />

                  {selectedEmployee && (
                     <div className="rounded-xl border bg-muted/30 p-4 transition-all animate-in fade-in slide-in-from-top-2">
                        <div className="grid grid-cols-2 gap-y-3">
                           <div className="space-y-0.5">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                 Full Name
                              </p>
                              <p className="text-sm font-medium">
                                 {selectedEmployee.firstName}{' '}
                                 {selectedEmployee.lastName}
                              </p>
                           </div>
                           <div className="space-y-0.5">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                 Email
                              </p>
                              <p className="text-sm font-medium">
                                 {selectedEmployee.id}@organization.com
                              </p>
                           </div>
                           <div className="space-y-0.5">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                 Department
                              </p>
                              <p className="text-sm font-medium">
                                 {selectedEmployee.departmentName}
                              </p>
                           </div>
                           <div className="space-y-0.5">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                 Job Title
                              </p>
                              <p className="text-sm font-medium">
                                 {selectedEmployee.position ??
                                    selectedEmployee.departmentName}
                              </p>
                           </div>
                        </div>
                     </div>
                  )}

                  <Field>
                     <FieldLabel htmlFor="sso-role">
                        Role
                        <span className="text-destructive">*</span>
                     </FieldLabel>
                     <Controller
                        name="role"
                        control={control}
                        render={({ field }) => (
                           <Select
                              value={field.value}
                              onValueChange={field.onChange}
                           >
                              <SelectTrigger
                                 id="sso-role"
                                 aria-invalid={!!errors.role}
                              >
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                 <SelectItem value="admin">Admin</SelectItem>
                                 <SelectItem value="front_desk">
                                    Front Desk
                                 </SelectItem>
                              </SelectContent>
                           </Select>
                        )}
                     />
                     {errors.role && (
                        <FieldError>{errors.role.message}</FieldError>
                     )}
                  </Field>
               </div>

               <div className="space-y-4">
                  <SectionHeading
                     title="Authentication"
                     description="How this user will sign in to the system."
                  />
                  <div className="flex items-start gap-3 rounded-xl border bg-muted/30 p-4">
                     <div className="mt-0.5 rounded-full bg-primary/10 p-1.5 text-primary">
                        <ShieldCheck className="size-4" />
                     </div>
                     <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                           SSO Authentication
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                           Uses your organization&apos;s identity provider
                           (e.g., Azure AD, Okta). The user will sign in using
                           their existing work credentials.
                        </p>
                     </div>
                  </div>
               </div>
            </FieldGroup>
         </div>

         <DialogFooter className="shrink-0 gap-2 border-t px-6 py-4 sm:justify-end">
            <Button
               type="button"
               variant="outline"
               className="cursor-pointer"
               onClick={() => onOpenChange(false)}
            >
               Cancel
            </Button>
            <Button
               type="submit"
               className="cursor-pointer gap-2"
               disabled={isSubmitting}
            >
               {isSubmitting ? (
                  <>
                     <Loader2 className="size-4 animate-spin" />
                     Creating…
                  </>
               ) : (
                  'Create User'
               )}
            </Button>
         </DialogFooter>
      </form>
   );
};

const CreateUser = ({ open, onOpenChange, onSubmit }: CreateUserProps) => {
   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent
            aria-describedby={undefined}
            className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
         >
            <DialogHeader className="shrink-0 space-y-1.5 border-b px-6 py-5 text-left">
               <DialogTitle>Create User</DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="local" className="flex min-h-0 flex-1 flex-col">
               <div className="px-6 pt-5">
                  <TabsList className="grid w-full grid-cols-2">
                     <TabsTrigger value="local" className="cursor-pointer">
                        <KeyRound className="mr-2 size-4" />
                        Local
                     </TabsTrigger>
                     <TabsTrigger value="sso" className="cursor-pointer">
                        <ShieldCheck className="mr-2 size-4" />
                        SSO
                     </TabsTrigger>
                  </TabsList>
               </div>

               <TabsContent
                  value="local"
                  className="flex min-h-0 flex-1 flex-col outline-none"
               >
                  <LocalUserForm
                     open={open}
                     onOpenChange={onOpenChange}
                     onSubmit={onSubmit}
                  />
               </TabsContent>
               <TabsContent
                  value="sso"
                  className="flex min-h-0 flex-1 flex-col outline-none"
               >
                  <SsoUserForm
                     open={open}
                     onOpenChange={onOpenChange}
                     onSubmit={onSubmit}
                  />
               </TabsContent>
            </Tabs>
         </DialogContent>
      </Dialog>
   );
};

export default CreateUser;
