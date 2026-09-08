'use client';

import React, { useEffect, useState } from 'react';
import { Check, Loader2, LogIn, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/app/lib/firebase/client';
import { getUserActiveCase, getCaseById } from '@/app/lib/firebase/services';

interface StepSevenSuccessProps {
  userName?: string;
  userEmail?: string;
  caseId?: string;
  onGoToLogin?: () => void;
  onGoHome?: () => void;
}

export default function StepSevenSuccess({
  userName: initialUserName,
  userEmail: initialUserEmail,
  caseId: initialCaseId,
  onGoToLogin,
  onGoHome,
}: StepSevenSuccessProps) {
  const [userName, setUserName] = useState<string>(initialUserName || 'Patient');
  const [userEmail, setUserEmail] = useState<string>(() => {
    if (initialUserEmail) return initialUserEmail;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hw_user_email') || '';
    }
    return '';
  });
  const [caseReference, setCaseReference] = useState<string>(initialCaseId || '');
  const [loading, setLoading] = useState<boolean>(!initialUserName || !initialCaseId);

  useEffect(() => {
    async function fetchLatestSubmission() {
      try {
        const user = auth.currentUser;
        if (user) {
          if (user.displayName && !initialUserName) {
            setUserName(user.displayName.split(' ')[0]);
          }

          if (!initialCaseId) {
            const latestCase = await getUserActiveCase(user.uid);
            if (latestCase) {
              setCaseReference(latestCase.case_number || latestCase.id);
            }
          }
        } else if (initialCaseId) {
          const c = await getCaseById(initialCaseId);
          if (c) {
            setCaseReference(c.case_number || c.id);
            if (c.patient_name) setUserName(c.patient_name.split(' ')[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching context:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLatestSubmission();
  }, [initialUserName, initialCaseId]);

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-50 pointer-events-auto">
      <div className="max-w-xl w-full text-center space-y-6">
        {/* Success Icon Circle */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-sm">
            <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white">
              <Check className="w-7 h-7 stroke-[3]" />
            </div>
          </div>
        </div>

        {/* Main Heading */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-950 tracking-tight leading-tight">
            Consultation Submitted, <br className="hidden sm:inline" />
            {userName}.
          </h1>
          <p className="text-slate-500 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
            {loading ? (
              <span className="inline-flex items-center gap-2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" /> Finalizing case file...
              </span>
            ) : (
              <>
                Your request has been filed under Case{' '}
                <span className="font-bold text-slate-800">
                  {caseReference || 'HW-Intake'}
                </span>
                . Our clinical coordination team is actively evaluating your medical details.
              </>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 relative z-50">
          <Link
            href={`/signup?from=consultation&caseId=${encodeURIComponent(caseReference || '')}&email=${encodeURIComponent(userEmail || '')}&name=${encodeURIComponent(userName !== 'Patient' ? userName : '')}`}
            className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Proceed to Create Account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
