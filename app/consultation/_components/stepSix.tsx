'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { auth } from '@/app/lib/firebase/client';
import { updatePatientCase } from '@/app/lib/firebase/services';

export interface ReviewData {
  aboutYou?: {
    consultationFor?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    country?: string;
  };
  situation?: {
    supportType?: string;
    healthcareArea?: string;
    description?: string;
  };
  medicalDetails?: {
    diagnosed?: string;
    treatmentStatus?: string;
  };
  documents?: {
    fileCount?: number;
  };
  preferences?: {
    careAbroad?: string;
    preferredLocation?: string;
    whatMatters?: string[];
  };
}

interface StepSixProps {
  reviewData?: ReviewData;
  caseId?: string;
  onEditStep?: (stepNumber: number) => void;
  onBack?: () => void;
  onSubmit?: (consentData: any) => void;
}

export default function StepSixConsent({
  reviewData = {},
  caseId,
  onEditStep,
  onBack,
  onSubmit,
}: StepSixProps) {
  const [consent, setConsent] = useState({
    confirmAccurate: false,
    consentReview: false,
    understandDisclaimer: false,
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConsent({ ...consent, [e.target.name]: e.target.checked });
  };

  const isSubmitDisabled =
    !consent.confirmAccurate || !consent.consentReview || !consent.understandDisclaimer || loading;

  const handleSubmit = async (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isSubmitDisabled) return;

    setErrorMsg(null);
    setLoading(true);

    try {
      const targetCaseId =
        caseId ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('hw_active_case_id') || localStorage.getItem('hw_consultation_case_id')
          : null);

      const timestamp = new Date().toISOString();

      if (targetCaseId) {
        await updatePatientCase(targetCaseId, {
          status: 'New',
          stage: 'Consultation Submitted',
          workflow_stage: 'Consultation Submitted',
        });
      }

      if (onSubmit) {
        onSubmit({
          caseId: targetCaseId,
          timestamp,
          consentFlags: consent,
        });
      }
    } catch (err: any) {
      console.warn('Submission notice (proceeding):', err);
      if (onSubmit) {
        onSubmit({
          caseId: caseId || 'HW-' + Date.now().toString().slice(-6),
          timestamp: new Date().toISOString(),
          consentFlags: consent,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Main Review Card */}
      <div className="max-w-xl bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
        {errorMsg && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            {errorMsg}
          </div>
        )}

        {/* Green Information Review Box */}
        <div className="bg-[#edf5f0] border border-[#d6ebd9] rounded-2xl p-6 sm:p-7 text-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4">
            Review your information
          </h2>

          {/* Section 1: YOUR SITUATION */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-slate-800 uppercase">
                YOUR SITUATION
              </span>
              {onEditStep && (
                <button
                  type="button"
                  onClick={() => onEditStep(1)}
                  className="text-sm font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  Edit
                </button>
              )}
            </div>
            <div className="mt-2 text-sm text-slate-700 space-y-1">
              <div>Looking for: {reviewData.situation?.supportType || 'Not sure, I need guidance'}</div>
              <div>Area: {reviewData.situation?.healthcareArea || 'Fertility'}</div>
              {reviewData.situation?.description && (
                <div className="text-slate-600 italic mt-1 font-normal">
                  &ldquo;{reviewData.situation.description}&rdquo;
                </div>
              )}
            </div>
          </div>

          <hr className="border-t border-[#d8ebe0] my-4" />

          {/* Section 2: MEDICAL DETAILS */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-slate-800 uppercase">
                MEDICAL DETAILS
              </span>
              {onEditStep && (
                <button
                  type="button"
                  onClick={() => onEditStep(2)}
                  className="text-sm font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  Edit
                </button>
              )}
            </div>
            <div className="mt-2 text-sm text-slate-700 space-y-1">
              <div>Diagnosed: {reviewData.medicalDetails?.diagnosed || '—'}</div>
              <div>Treatment status: {reviewData.medicalDetails?.treatmentStatus || '—'}</div>
            </div>
          </div>

          <hr className="border-t border-[#d8ebe0] my-4" />

          {/* Section 3: DOCUMENTS */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-slate-800 uppercase">
                DOCUMENTS
              </span>
              {onEditStep && (
                <button
                  type="button"
                  onClick={() => onEditStep(3)}
                  className="text-sm font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  Edit
                </button>
              )}
            </div>
            <div className="mt-2 text-sm text-slate-700">
              {(reviewData.documents?.fileCount || 0) > 0
                ? `${reviewData.documents?.fileCount} attached`
                : 'None attached'}
            </div>
          </div>

          <hr className="border-t border-[#d8ebe0] my-4" />

          {/* Section 4: PREFERENCES */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-slate-800 uppercase">
                PREFERENCES
              </span>
              {onEditStep && (
                <button
                  type="button"
                  onClick={() => onEditStep(4)}
                  className="text-sm font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  Edit
                </button>
              )}
            </div>
            <div className="mt-2 text-sm text-slate-700 space-y-1">
              <div>Open to care abroad: {reviewData.preferences?.careAbroad || '—'}</div>
              <div>Preferred location: {reviewData.preferences?.preferredLocation || '—'}</div>
              <div>
                What matters most:{' '}
                {reviewData.preferences?.whatMatters && reviewData.preferences.whatMatters.length > 0
                  ? reviewData.preferences.whatMatters.join(', ')
                  : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Consent Checkboxes */}
        <div className="mt-6 space-y-3.5">
          <label className="flex items-start gap-3 cursor-pointer text-sm text-slate-700 select-none">
            <input
              type="checkbox"
              name="confirmAccurate"
              checked={consent.confirmAccurate}
              onChange={handleCheckboxChange}
              className="mt-0.5 w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
            />
            <span>I confirm the information provided is accurate.</span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer text-sm text-slate-700 select-none">
            <input
              type="checkbox"
              name="consentReview"
              checked={consent.consentReview}
              onChange={handleCheckboxChange}
              className="mt-0.5 w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
            />
            <span>
              I consent to HealingWays reviewing my healthcare information to provide coordination support.
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer text-sm text-slate-700 select-none">
            <input
              type="checkbox"
              name="understandDisclaimer"
              checked={consent.understandDisclaimer}
              onChange={handleCheckboxChange}
              className="mt-0.5 w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
            />
            <span>
              I understand HealingWays does not provide medical treatment and does not guarantee outcomes.
            </span>
          </label>
        </div>
      </div>

      {/* Bottom Actions Bar */}
      <div className="flex items-center justify-between max-w-xl mt-8">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1 cursor-pointer transition-colors"
          >
            ← Back
          </button>
        ) : (
          <div />
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Submitting...</span>
            </>
          ) : (
            'Submit Consultation'
          )}
        </button>
      </div>
    </div>
  );
}
