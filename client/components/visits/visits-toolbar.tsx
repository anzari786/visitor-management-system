'use client';

export function VisitsToolbar() {
   return (
      <div className="space-y-1.5">
         <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Visits
         </h1>
         <p className="max-w-xl text-sm text-muted-foreground">
            Manage visit requests through their lifecycle — from approval to
            check-in and check-out.
         </p>
      </div>
   );
}

export default VisitsToolbar;
