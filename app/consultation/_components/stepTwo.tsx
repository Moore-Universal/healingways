'use client';

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { auth } from '@/app/lib/firebase/client';
import { createPatientCase, updatePatientCase } from '@/app/lib/firebase/services';

const SUPPORT_TYPES = [
  'Finding the right hospital or specialist',
  'Understanding my medical reports',
  'Seeking medical guidance',
  'Preparing for treatment abroad',
  'Accommodation and logistics support',
  'Visa support',
  'Not sure, I need guidance',
];

const HEALTHCARE_AREAS = [
  'Fertility',
  'Oncology',
  'Cardiology',
  'Orthopedics',
  'Neurology',
  'General Surgery',
  'Pediatrics',
  'Other / Not Sure',
];

interface StepTwoProps {
  onNext?: (data: {
    supportType: string;
    healthcareArea: string;
    situationDescription: string;
    caseId?: string;
  }) => void;
  onBack?: () => void;
  initialData?: {
    supportType?: string;
    healthcareArea?: string;
    situationDescription?: string;
  };
  aboutYou?: {
    consultationFor?: string;
    fullName?: string;
    patientName?: string;
    email?: string;
    phone?: string;
    country?: string;
    userId?: string;
  };
  caseId?: string;
}

export default function StepTwoYourSituation({
  onNext,
  onBack,
  initialData = {},
  aboutYou = {},
  caseId,
}: StepTwoProps) {
  const [formData, setFormData] = useState({
    supportType: initialData.supportType || 'Finding the right hospital or specialist',
    healthcareArea: initialData.healthcareArea || '',
    situationDescription: initialData.situationDescription || '',
  });

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData((prev) => ({
        ...prev,
        supportType: initialData.supportType || prev.supportType || 'Finding the right hospital or specialist',
        healthcareArea: initialData.healthcareArea !== undefined ? initialData.healthcareArea : prev.healthcareArea,
        situationDescription: initialData.situationDescription ?? prev.situationDescription ?? '',
      }));
    }
  }, [initialData]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSupportTypeSelect = (type: string) => {
    setFormData((prev) => ({ ...prev, supportType: type }));
  };

  const handleSubmit = async (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setErrorMsg(null);
    setLoading(true);

    let activeCaseId =
      caseId ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('hw_active_case_id') || localStorage.getItem('hw_consultation_case_id')
        : '') ||
      '';

    try {
      const user = auth.currentUser;
      const effectiveUserId = user?.uid || aboutYou?.userId || `patient_${Date.now()}`;

      if (activeCaseId) {
        await updatePatientCase(activeCaseId, {
          support_type: formData.supportType,
          healthcare_area: formData.healthcareArea,
          need: formData.healthcareArea || formData.supportType || 'Medical Consultation',
          situation_description: formData.situationDescription,
          situation: formData.situationDescription,
          consultation_for: aboutYou?.consultationFor || 'Myself',
          patient_name: aboutYou?.patientName || aboutYou?.fullName || user?.displayName || 'Patient',
          contact_name: aboutYou?.fullName || user?.displayName || '',
          patient_email: aboutYou?.email || user?.email || '',
          patient_phone: aboutYou?.phone || '',
          country: aboutYou?.country || '',
        });
      } else {
        const newCase = await createPatientCase({
          user_id: effectiveUserId,
          consultation_for: aboutYou?.consultationFor || 'Myself',
          patient_name:
            aboutYou?.patientName || aboutYou?.fullName || user?.displayName || user?.email?.split('@')[0] || 'Patient',
          contact_name: aboutYou?.fullName || user?.displayName || '',
          patient_email: aboutYou?.email || user?.email || '',
          patient_phone: aboutYou?.phone || '',
          country: aboutYou?.country || '',
          support_type: formData.supportType,
          healthcare_area: formData.healthcareArea,
          need: formData.healthcareArea || formData.supportType || 'Medical Consultation',
          situation_description: formData.situationDescription,
          situation: formData.situationDescription,
          stage: 'Consultation Submitted',
          workflow_stage: 'Consultation Submitted',
          status: 'New',
        });
        activeCaseId = newCase.id;
      }

      if (onNext) {
        onNext({
          ...formData,
          caseId: activeCaseId,
        });
      }
    } catch (err: any) {
      console.warn('Step 1 save notice (continuing to next step):', err);
      const fallbackCaseId = activeCaseId || caseId || `case_${Date.now()}`;
      if (onNext) {
        onNext({
          ...formData,
          caseId: fallbackCaseId,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Main Form Card */}
      <div className="max-w-xl bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Question 1: Healthcare Support Type */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-800">
              What kind of healthcare support are you looking for? <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2 pt-0.5">
              {SUPPORT_TYPES.map((type) => {
                const isSelected = formData.supportType === type;
                return (
                  <button
                    type="button"
                    key={type}
                    onClick={() => handleSupportTypeSelect(type)}
                    className={`text-xs sm:text-sm py-2 px-4 rounded-full border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'border-2 border-emerald-600 bg-emerald-50 text-emerald-950 font-semibold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-normal'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question 2: Area of healthcare need */}
          <div className="space-y-2 pt-2">
            <label className="block text-sm font-semibold text-slate-800">
              Area of healthcare need
            </label>
            <div className="relative">
              <select
                value={formData.healthcareArea}
                onChange={(e) => setFormData((prev) => ({ ...prev, healthcareArea: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">Select if known</option>
                {HEALTHCARE_AREAS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Question 3: Tell us about your healthcare situation */}
          <div className="space-y-1.5 pt-2">
            <label className="block text-sm font-semibold text-slate-800">
              Tell us about your healthcare situation <span className="text-red-500">*</span>
            </label>
            <p className="text-xs sm:text-sm text-slate-500">
              Share what you&apos;re experiencing, your diagnosis if available, and what support you&apos;re looking for.
            </p>
            <textarea
              rows={4}
              value={formData.situationDescription}
              onChange={(e) => setFormData((prev) => ({ ...prev, situationDescription: e.target.value }))}
              placeholder="Please describe your situation..."
              className="w-full mt-2 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[120px]"
            />
          </div>
        </form>
      </div>

      {/* Bottom Action Button (Centered) */}
      <div className="flex justify-center max-w-xl mt-8">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-9 py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            'Continue'
          )}
        </button>
      </div>
    </div>
  );
}
