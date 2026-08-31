import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth-server';
import SetPassword from '@/components/auth/set-password';

export default async function SetPasswordPage() {
   const user = await getServerUser();

   if (!user) redirect('/login');

   // Session exists but password change not required → send to dashboard
   if (!user.mustChangePassword) redirect('/');

   return (
      <div className="min-h-screen w-full relative bg-background">
         {/* Layer 1: Primary Glow (theme-aware) */}
         <div
            className="absolute inset-0 z-0"
            style={{
               backgroundImage: `radial-gradient(125% 125% at 50% 90%, var(--background) 40%, color-mix(in oklch, var(--primary) 35%, var(--background)) 100%)`,
               backgroundSize: '100% 100%',
            }}
         />

         {/* Layer 2: Dashed Grid (theme-aware) */}
         <div
            className="absolute inset-0 z-0"
            style={{
               backgroundImage: `
        linear-gradient(to right, var(--border) 1px, transparent 1px),
        linear-gradient(to bottom, var(--border) 1px, transparent 1px)
      `,
               backgroundSize: '20px 20px',
               backgroundPosition: '0 0, 0 0',
               opacity: 0.6,
               maskImage: `
         repeating-linear-gradient(
              to right,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            repeating-linear-gradient(
              to bottom,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            radial-gradient(ellipse 100% 80% at 50% 100%, #000 50%, transparent 90%)
      `,
               WebkitMaskImage: `
  repeating-linear-gradient(
              to right,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            repeating-linear-gradient(
              to bottom,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            radial-gradient(ellipse 100% 80% at 50% 100%, #000 50%, transparent 90%)
      `,
               maskComposite: 'intersect',
               WebkitMaskComposite: 'source-in',
            }}
         />

         {/* Content */}
         <div className="relative z-10">
            <SetPassword />
         </div>
      </div>
   );
}
