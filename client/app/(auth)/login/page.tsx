import Login from '@/components/auth/login';

export default function LoginPage() {
   return (
      <main className="flex min-h-dvh items-center justify-center relative overflow-hidden bg-[#e0f2f1]  flex-col pt-6 pb-12 px-4">
         {/* Mesh Blur Background */}
         <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[-10%] left-[-15%] w-[65vw] h-[120vh] bg-gradient-to-r from-[#6dbf58]/70 via-[#8bc34a]/60 to-transparent rounded-full blur-[100px]" />
            <div className="absolute top-[-10%] right-[-15%] w-[65vw] h-[120vh] bg-gradient-to-l from-[#b2ebf2]/80 via-[#e0f7fa]/70 to-transparent rounded-full blur-[100px]" />
         </div>

         {/* Login Form Wrapper */}
         <div className="w-full max-w-115 z-10">
            <Login />
         </div>
      </main>
   );
}
