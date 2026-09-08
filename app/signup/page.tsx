'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, Sparkles, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { registerUser, getUserActiveCase, isAdminEmail } from '@/app/lib/firebase/services';

function RegisterForm() {
  const router = useRouter();

  // Check if signup is coming directly from an explicitly completed consultation flow via URL parameters
  const [hasCompletedConsultation] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const sp = new URLSearchParams(window.location.search);
      return sp.get('from') === 'consultation' && !!sp.get('caseId');
    } catch {
      return false;
    }
  });

  const [caseReference] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    try {
      const sp = new URLSearchParams(window.location.search);
      return sp.get('caseId') || '';
    } catch {
      return '';
    }
  });

  const [fullName, setFullName] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    try {
      const sp = new URLSearchParams(window.location.search);
      return sp.get('name') || sessionStorage.getItem('hw_signup_draft_fullname') || '';
    } catch {
      return '';
    }
  });

  const [email, setEmail] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    try {
      const sp = new URLSearchParams(window.location.search);
      return (
        sp.get('email') ||
        sessionStorage.getItem('hw_signup_draft_email') ||
        sessionStorage.getItem('hw_login_not_found_user') ||
        ''
      );
    } catch {
      return '';
    }
  });

  // Password fields are strictly empty by default and never pre-filled
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);

  // Force clean draft password storage on mount
  useEffect(() => {
    try {
      sessionStorage.removeItem('hw_signup_draft_password');
      sessionStorage.removeItem('hw_signup_draft_confirm_password');
    } catch {}
  }, []);

  const [accountExistsError, setAccountExistsError] = useState<boolean>(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      return sessionStorage.getItem('hw_signup_error_msg') || null;
    } catch {
      return null;
    }
  });

  const handleFullNameChange = (val: string) => {
    setFullName(val);
    try { sessionStorage.setItem('hw_signup_draft_fullname', val); } catch {}
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    setAccountExistsError(false);
    if (errorMessage) {
      setErrorMessage(null);
      try { sessionStorage.removeItem('hw_signup_error_msg'); } catch {}
    }
    try {
      sessionStorage.setItem('hw_signup_draft_email', val);
    } catch {}
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (errorMessage) {
      setErrorMessage(null);
      try { sessionStorage.removeItem('hw_signup_error_msg'); } catch {}
    }
  };

  const handleConfirmPasswordChange = (val: string) => {
    setConfirmPassword(val);
    if (errorMessage) {
      setErrorMessage(null);
      try { sessionStorage.removeItem('hw_signup_error_msg'); } catch {}
    }
  };

  const handleRegister = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      const msg = 'Please provide an email address.';
      setErrorMessage(msg);
      try { sessionStorage.setItem('hw_signup_error_msg', msg); } catch {}
      return;
    }

    if (!password) {
      const msg = 'Please enter a password.';
      setErrorMessage(msg);
      try { sessionStorage.setItem('hw_signup_error_msg', msg); } catch {}
      return;
    }

    if (password !== confirmPassword) {
      const msg = 'Passwords do not match.';
      setErrorMessage(msg);
      try { sessionStorage.setItem('hw_signup_error_msg', msg); } catch {}
      return;
    }

    if (password.length < 6) {
      const msg = 'Password must be at least 6 characters long.';
      setErrorMessage(msg);
      try { sessionStorage.setItem('hw_signup_error_msg', msg); } catch {}
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setAccountExistsError(false);
    try { sessionStorage.removeItem('hw_signup_error_msg'); } catch {}

    try {
      const res = await registerUser({
        fullName: fullName.trim() || 'Patient',
        email: cleanEmail,
        password,
      });

      if (res.success && res.user) {
        // Link any unassigned consultation case to this new user account
        try {
          await getUserActiveCase(res.user.uid, res.user.email);
        } catch (linkErr) {
          console.warn('Failed to link active case:', linkErr);
        }

        // Clear draft session storage upon successful registration
        try {
          sessionStorage.removeItem('hw_signup_draft_fullname');
          sessionStorage.removeItem('hw_signup_draft_email');
          sessionStorage.removeItem('hw_login_not_found_user');
          sessionStorage.removeItem('hw_signup_error_msg');
        } catch {}

        const destination = res.user.role === 'admin' || isAdminEmail(cleanEmail) ? '/admin' : '/dashboard';
        router.push(destination);
        router.refresh();
        return;
      }

      if (res.reason === 'email_already_in_use') {
        setAccountExistsError(true);
        const msg = 'An account with this email address is already registered. Please sign in with your password.';
        setErrorMessage(msg);
        try { sessionStorage.setItem('hw_signup_error_msg', msg); } catch {}
      } else {
        const msg = res.error || 'Failed to create your account. Please try again.';
        setErrorMessage(msg);
        try { sessionStorage.setItem('hw_signup_error_msg', msg); } catch {}
      }
    } catch (err: unknown) {
      console.error('Registration error:', err);
      const typedErr = err as { message?: string };
      const msg = typedErr?.message || 'Failed to create account. Please try again.';
      setErrorMessage(msg);
      try { sessionStorage.setItem('hw_signup_error_msg', msg); } catch {}
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 my-8 sm:my-0">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sm:p-10 space-y-6">
        {/* Header & Logo */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/" className="relative w-44 h-16 mb-1 block">
            <Image
              src="/healing-ways-logo.png"
              alt="HealingWays Logo"
              fill
              className="object-contain"
              priority
            />
          </Link>
          <h1 className="text-xl font-bold text-blue-950">
            {hasCompletedConsultation ? 'Finalize Your Account' : 'Create Your Account'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            {hasCompletedConsultation
              ? 'Enter a password to finalize your account and access your care dashboard.'
              : 'Join HealingWays to manage your medical consultations and track your care journey.'}
          </p>
        </div>

        {/* Informative Banner only when explicitly coming from consultation */}
        {hasCompletedConsultation && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-900 leading-relaxed animate-fadeIn">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-emerald-950">
                Step 2: Finalize Account {caseReference ? `• Case ${caseReference}` : ''}
              </span>
              Consultation intake received! Create a password below to finalize your account.
            </div>
          </div>
        )}

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            {accountExistsError && (
              <div className="pt-1">
                <Link
                  href={`/login?email=${encodeURIComponent(email)}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  <span>Sign in to your account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleRegister} autoComplete="off" className="space-y-4">
          {/* Full Name Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-blue-900">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => handleFullNameChange(e.target.value)}
              placeholder="Jane Doe"
              disabled={loading}
              autoComplete="name"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:opacity-50"
            />
          </div>

          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-blue-900">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="you@example.com"
              disabled={loading}
              autoComplete="email"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:opacity-50"
            />
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label htmlFor="hw_signup_password" className="block text-xs font-bold text-blue-900">
              Password (min. 6 characters)
            </label>
            <div className="relative">
              <input
                id="hw_signup_password"
                name="hw_signup_password_field"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="Create password"
                disabled={loading}
                autoComplete="new-password"
                data-lpignore="true"
                data-form-type="other"
                data-1p-ignore="true"
                className="w-full px-4 py-3 pr-11 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Input */}
          <div className="space-y-1.5">
            <label htmlFor="hw_signup_confirm_password" className="block text-xs font-bold text-blue-900">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="hw_signup_confirm_password"
                name="hw_signup_confirm_password_field"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                placeholder="Confirm password"
                disabled={loading}
                autoComplete="new-password"
                data-lpignore="true"
                data-form-type="other"
                data-1p-ignore="true"
                className="w-full px-4 py-3 pr-11 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors disabled:opacity-50 flex justify-center items-center mt-2 cursor-pointer"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                Creating account...
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                Create Account
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        <div className="border-t border-gray-100 pt-2" />

        {/* Login Back Link */}
        <div className="text-center text-xs text-gray-600 pt-1">
          Already have an account?{' '}
          <Link
            href={email ? `/login?email=${encodeURIComponent(email)}` : '/login'}
            className="font-bold text-blue-900 hover:underline transition-all"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PatientRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
