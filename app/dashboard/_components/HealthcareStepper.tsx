'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Check, Lock } from 'lucide-react';
import { auth } from '@/app/lib/firebase/client';
import { 
  getUserActiveCase, 
  getJourneyStepNumber, 
  getStoredUser, 
  PatientCase 
} from '@/app/lib/firebase/services';

export interface Step {
  number: number;
  label: string;
  href: string;
}

const defaultSteps: Step[] = [
  { number: 1, label: 'Consultation Submitted', href: '/dashboard' },
  { number: 2, label: 'Case Review', href: '/dashboard/case-review' },
  { number: 3, label: 'Hospital Recommendation', href: '/dashboard/recommendations' },
  { number: 4, label: 'Medical Itinerary', href: '/dashboard/medical-itinerary' },
  { number: 5, label: 'Accommodation & Visa', href: '/dashboard/accommodation' },
  { number: 6, label: 'Travel Preparation', href: '/dashboard/travel-preparation' },
  { number: 7, label: 'Treatment & Recovery', href: '/dashboard/treatment-recovery' },
];

interface HealthcareStepperProps {
  steps?: Step[];
  className?: string;
  activeCase?: PatientCase | null;
  journeyStage?: number | string;
}

export default function HealthcareStepper({
  steps = defaultSteps,
  className = '',
  activeCase: initialCase,
  journeyStage,
}: HealthcareStepperProps) {
  const pathname = usePathname();
  const [fetchedCase, setFetchedCase] = useState<PatientCase | null>(null);
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);

  const caseRecord = initialCase !== undefined ? initialCase : fetchedCase;

  useEffect(() => {
    if (initialCase !== undefined) {
      return;
    }

    let isMounted = true;
    async function loadCase() {
      try {
        const stored = getStoredUser();
        const user = auth.currentUser;
        const uid = user?.uid || stored?.uid || null;
        const email = user?.email || stored?.email || null;
        const c = await getUserActiveCase(uid, email);
        if (isMounted && c) {
          setFetchedCase(c);
        }
      } catch (err) {
        console.warn('Could not load case for stepper:', err);
      }
    }
    loadCase();

    return () => {
      isMounted = false;
    };
  }, [initialCase]);

  // Compute the user's real progression stage in their medical journey (1 to 7)
  const actualStageNumber = journeyStage
    ? typeof journeyStage === 'number'
      ? journeyStage
      : getJourneyStepNumber(journeyStage)
    : caseRecord
    ? getJourneyStepNumber(caseRecord.workflow_stage || caseRecord.stage)
    : 1;

  // Max unlocked step in the journey
  const maxUnlockedStep = Math.max(actualStageNumber, 1);

  const currentStageStepObj = steps.find((s) => s.number === actualStageNumber) || steps[0];

  return (
    <div
      className={`bg-white p-4 sm:p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-5 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            YOUR HEALTHCARE JOURNEY
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            Stage {actualStageNumber} of 7: {currentStageStepObj.label}
          </span>
        </div>

        {caseRecord?.case_number && (
          <span className="text-xs font-medium text-slate-400">
            Case Ref: <span className="font-semibold text-slate-600">{caseRecord.case_number}</span>
          </span>
        )}
      </div>

      {lockedNotice && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>{lockedNotice}</span>
          </div>
          <button
            onClick={() => setLockedNotice(null)}
            className="text-amber-700 hover:text-amber-900 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      <div className="overflow-x-auto pb-4 pt-2 -mx-4 sm:mx-0 px-4 sm:px-0 touch-pan-x scrollbar-none">
        <div className="min-w-[680px] sm:min-w-[700px] flex items-center justify-between relative px-4">
          <div className="absolute top-4 left-8 right-8 h-0.5 bg-gray-200 -z-0" />
          <div
            className="absolute top-4 left-8 h-0.5 bg-emerald-600 -z-0 transition-all duration-300"
            style={{
              width: `${
                ((Math.min(actualStageNumber, steps.length) - 1) / (steps.length - 1)) * 92
              }%`,
            }}
          />

          {steps.map((step) => {
            const isCompleted = step.number < actualStageNumber;
            const isCurrentJourneyStage = step.number === actualStageNumber;
            const isCurrentPage = step.href === pathname;
            const isUnlocked = step.number <= maxUnlockedStep;

            const handleClick = (e: React.MouseEvent) => {
              if (!isUnlocked) {
                e.preventDefault();
                setLockedNotice(
                  `Step ${step.number} (${step.label}) is locked. Complete Step ${actualStageNumber} (${currentStageStepObj.label}) to progress.`
                );
              }
            };

            return (
              <Link
                key={step.number}
                href={step.href}
                onClick={handleClick}
                className={`relative z-10 flex flex-col items-center max-w-[90px] sm:max-w-[100px] text-center space-y-2 group transition-all ${
                  isUnlocked ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                }`}
              >
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all ${
                    isCurrentPage
                      ? 'border-emerald-600 text-emerald-700 bg-white ring-4 ring-emerald-100 shadow-xs'
                      : isCompleted
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                      : isCurrentJourneyStage
                      ? 'border-blue-600 text-blue-700 bg-white ring-4 ring-blue-50 shadow-xs'
                      : 'border-gray-200 text-gray-400 bg-white'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                  ) : !isUnlocked ? (
                    <Lock className="w-3 h-3 text-slate-400" />
                  ) : (
                    step.number
                  )}
                </div>

                <div className="flex flex-col items-center">
                  <span
                    className={`text-[10px] sm:text-[11px] font-semibold leading-tight transition-colors ${
                      isCurrentPage
                        ? 'text-emerald-700 font-bold'
                        : isCurrentJourneyStage
                        ? 'text-blue-700 font-bold'
                        : isCompleted
                        ? 'text-slate-800 font-medium'
                        : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                  {isCurrentJourneyStage && (
                    <span className="inline-block mt-0.5 text-[9px] font-bold text-blue-600 uppercase tracking-tighter">
                      Current
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}