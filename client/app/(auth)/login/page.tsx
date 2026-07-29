import Login from "@/components/auth/login";

export default function LoginPage() {
  return (
    <main className="min-h-screen w-full relative overflow-hidden bg-[#e0f2f1] flex flex-col items-center justify-start pt-6 pb-12 px-4">
      {/* Mesh Blur Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-15%] w-[65vw] h-[120vh] bg-gradient-to-r from-[#6dbf58]/70 via-[#8bc34a]/60 to-transparent rounded-full blur-[100px]" />
        <div className="absolute top-[-10%] right-[-15%] w-[65vw] h-[120vh] bg-gradient-to-l from-[#b2ebf2]/80 via-[#e0f7fa]/70 to-transparent rounded-full blur-[100px]" />
      </div>

      {/* Navigation Pill */}
      <div className="mb-6 z-10 flex items-center bg-white/90 backdrop-blur-md p-1.5 rounded-full shadow-sm border border-slate-200/60">
        <button className="px-5 py-2 text-sm font-semibold rounded-full bg-[#00a859] text-white shadow-sm transition-all">
          Login
        </button>
        <button className="px-5 py-2 text-sm font-semibold rounded-full text-slate-700 hover:text-emerald-700 transition-all">
          Dashboard
        </button>
        <button className="px-5 py-2 text-sm font-semibold rounded-full text-slate-700 hover:text-emerald-700 transition-all">
          New Visit Request
        </button>
      </div>

      {/* Login Form Wrapper */}
      <div className="w-full max-w-[460px] z-10">
        <Login />
      </div>
    </main>
  );
}