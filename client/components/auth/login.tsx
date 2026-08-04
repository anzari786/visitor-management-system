'use client';

import Logo from '@/components/common/logo';
import { useLogin } from '@/hooks/use-auth';
import {
  loginSchema,
  type LoginFormValues,
} from '@/lib/validations/auth.schema';
import { ApiErrorResponse } from '@/types/api.types';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import { EyeIcon, EyeOffIcon, Lock, User, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

export default function Login() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [language, setLanguage] = useState<'en' | 'am'>('en');
  const [rememberMe, setRememberMe] = useState(true);

  const { mutate: login, isPending } = useLogin();

  const {
    register,
    handleSubmit,
    setValue,
    setFocus,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (values: LoginFormValues) => {
    login(values, {
      onError: (error: AxiosError<ApiErrorResponse>) => {
        const code = error.response?.data?.code;

        if (code === 'INVALID_USERNAME') {
          setValue('username', '', { shouldDirty: true });
          setFocus('username');
        } else {
          setValue('password', '', { shouldDirty: true });
          setFocus('password');
        }
      },
    });
  };

  return (
    <div className="bg-[#f2f9f4]/85 backdrop-blur-xl rounded-[32px] p-8 sm:p-9 shadow-xl shadow-emerald-950/10 border border-white/90 flex flex-col justify-between">
      <div>
        {/* Top Header: Imported Logo from /image.png */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <Logo width={32} height={32} />
            <span className="font-bold text-slate-800 text-lg tracking-tight">
              ATI <span className="text-[#00a859]">VMS</span>
            </span>
          </div>

          {/* Language Selector */}
          <div className="bg-white/90 border border-slate-200/70 p-1 rounded-full flex items-center gap-1 shadow-xs">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
                language === 'en'
                  ? 'bg-[#00a859] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('am')}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
                language === 'am'
                  ? 'bg-[#00a859] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              አማርኛ
            </button>
          </div>
        </div>

        {/* Center Avatar */}
        <div className="flex justify-center mb-6">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="absolute top-0 w-7 h-7 bg-amber-400 rounded-full shadow-xs" />
            <div className="absolute bottom-0 w-16 h-8 bg-[#00a859] rounded-t-full shadow-xs" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Visitor Management System
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 font-medium">
            Please sign in to continue.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Username Input */}
          <div className="space-y-1.5">
            <label htmlFor="username" className="text-xs font-semibold text-slate-700 ml-1">
              Username
            </label>
            <div className="relative flex items-center">
              <User className="absolute left-4 w-4 h-4 text-slate-400" />
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                aria-invalid={!!errors.username}
                {...register('username')}
                className="w-full bg-[#f8fcf9] border border-slate-200/90 rounded-full py-3 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-[#00a859] transition-all shadow-xs"
              />
            </div>
            {errors.username && (
              <p className="text-xs text-red-500 ml-3 font-medium">
                {errors.username.message}
              </p>
            )}
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-semibold text-slate-700 ml-1">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-4 w-4 h-4 text-slate-400" />
              <input
                id="password"
                type={isPasswordVisible ? 'text' : 'password'}
                placeholder="Enter your password"
                aria-invalid={!!errors.password}
                {...register('password')}
                className="w-full bg-[#f8fcf9] border border-slate-200/90 rounded-full py-3 pl-11 pr-11 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-[#00a859] transition-all shadow-xs"
              />
              <button
                type="button"
                onClick={() => setIsPasswordVisible((v) => !v)}
                className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
              >
                {isPasswordVisible ? (
                  <EyeOffIcon className="w-4 h-4" />
                ) : (
                  <EyeIcon className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 ml-3 font-medium">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between text-xs pt-1 px-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#00a859] focus:ring-emerald-500 accent-[#00a859]"
              />
              Remember me
            </label>
            <a
              href="#"
              className="font-semibold text-[#00a859] hover:text-emerald-700 hover:underline transition-all"
            >
              Forgot password?
            </a>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full mt-2 bg-[#00a859] hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold py-3.5 px-6 rounded-full flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all hover:shadow-emerald-600/30 disabled:opacity-50"
          >
            <span>{isPending ? 'Signing in…' : 'Login'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Footer Notice */}
      <div className="mt-8 text-center text-[11px] text-slate-400 font-medium leading-relaxed">
        <p>© 2026 Ethiopian Agricultural Transformation Institute (ATI) •</p>
        <p>Visitor Management System</p>
      </div>
    </div>
  );
}