'use client';

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { updatePatientCase } from '@/app/lib/firebase/services';

const DIAGNOSIS_OPTIONS = ['Yes', 'No', 'Unsure'];

const TREATMENT_STATUSES = [
  'Not started treatment',
  'Currently receiving treatment',
  'Completed treatment',
  'Seeking another opinion',
];

interface StepThreeProps {
  onNext?: (data: {
    hasDiagnosis: string;
    diagnosis: string;
    treatmentStatus: string;
    caseId?: string;
  }) => void;
  onBack?: () => void;
  initialData?: {
    hasDiagnosis?: string;
    diagnosis?: string;
    treatmentStatus?: string;
  };
  caseId?: string;
}

export default function StepThreeMedicalDetails({
  onNext,
  onBack,
  initialData = {},
  caseId,
}: StepThreeProps) {
  const [formData, setFormData] = useState({
    hasDiagnosis: initialData.hasDiagnosis || 'Yes',
    diagnosis: initialData.diagnosis || '',
    treatmentStatus: initialData.treatmentStatus || 'Not started treatment',
  });

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData((prev) => ({
        ...prev,
        hasDiagnosis: initialData.hasDiagnosis || prev.hasDiagnosis || 'Yes',
        diagnosis: initialData.diagnosis ?? prev.diagnosis ?? '',
        treatmentStatus: initialData.treatmentStatus || prev.treatmentStatus || 'Not started treatment',
      }));
    }
  }, [initialData]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDiagnosisToggle = (opt: string) => {
    setFormData((prev) => ({ ...prev, hasDiagnosis: opt }));
  };

  const handleTreatmentStatusSelect = (status: string) => {
    setFormData((prev) => ({ ...prev, treatmentStatus: status }));
  };

  const handleSubmit = async (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setErrorMsg(null);
    setLoading(true);

    try {
      if (caseId) {
        await updatePatientCase(caseId, {
          has_diagnosis: formData.hasDiagnosis,
          diagnosis: formData.diagnosis,
          treatment_status: formData.treatmentStatus,
        });
      }

      if (onNext) {
        onNext({
          ...formData,
          caseId,
        });
      }
    } catch (err: any) {
      console.warn('Error in Step 2/3 (continuing):', err);
      if (onNext) {
        onNext({
          ...formData,
          caseId,
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

          {/* Question 1: Have you received a medical diagnosis? */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-800">
              Have you received a medical diagnosis?
            </label>
            <div className="flex flex-wrap gap-2.5 pt-0.5">
              {DIAGNOSIS_OPTIONS.map((opt) => {
                const isSelected = formData.hasDiagnosis === opt;
                return (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => handleDiagnosisToggle(opt)}
                    className={`text-xs sm:text-sm py-2 px-5 rounded-full border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-2 border-emerald-600 bg-emerald-50 text-emerald-950 font-semibold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-normal'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question 2: Diagnosis (if known) */}
          <div className="space-y-2 pt-1">
            <label className="block text-sm font-semibold text-slate-800">
              Diagnosis (if known)
            </label>
            <input
              type="text"
              value={formData.diagnosis}
              onChange={(e) => setFormData((prev) => ({ ...prev, diagnosis: e.target.value }))}
              placeholder="e.g. Coronary artery disease"
              className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Question 3: Current treatment status */}
          <div className="space-y-3 pt-1">
            <label className="block text-sm font-semibold text-slate-800">
              Current treatment status
            </label>
            <div className="flex flex-wrap gap-2.5 pt-0.5">
              {TREATMENT_STATUSES.map((status) => {
                const isSelected = formData.treatmentStatus === status;
                return (
                  <button
                    type="button"
                    key={status}
                    onClick={() => handleTreatmentStatusSelect(status)}
                    className={`text-xs sm:text-sm py-2 px-4 rounded-full border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-2 border-emerald-600 bg-emerald-50 text-emerald-950 font-semibold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-normal'
                    }`}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
          </div>
        </form>
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
