'use client';

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { updatePatientCase } from '@/app/lib/firebase/services';

const CARE_OUTSIDE_OPTIONS = ['Yes', 'No', 'Maybe / Depends on options'];

const DESTINATION_OPTIONS = [
  'No preference',
  'India',
  'Turkey',
  'Thailand',
  'United Arab Emirates',
  'Germany',
  'Spain',
  'United Kingdom',
  'United States',
  'Other',
];

const PRIORITY_OPTIONS = [
  'Treatment cost',
  'Hospital reputation',
  'Doctor experience',
  'Wait times',
  'Distance & travel ease',
  'Language support',
];

interface StepFiveProps {
  onNext?: (data: {
    careOutsideCountry: string;
    preferredLocation: string;
    priorities: string[];
    caseId?: string;
  }) => void;
  onBack?: () => void;
  initialData?: {
    careOutsideCountry?: string;
    preferredLocation?: string;
    priorities?: string[];
  };
  caseId?: string;
}

export default function StepFivePreferences({
  onNext,
  onBack,
  initialData = {},
  caseId,
}: StepFiveProps) {
  const [formData, setFormData] = useState({
    careOutsideCountry: initialData.careOutsideCountry || 'Yes',
    preferredLocation: initialData.preferredLocation || 'India',
    priorities: (initialData.priorities || ['Treatment cost']) as string[],
  });

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData((prev) => ({
        ...prev,
        careOutsideCountry: initialData.careOutsideCountry || prev.careOutsideCountry || 'Yes',
        preferredLocation: initialData.preferredLocation || prev.preferredLocation || 'India',
        priorities: initialData.priorities || prev.priorities || ['Treatment cost'],
      }));
    }
  }, [initialData]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const togglePriority = (priority: string) => {
    setFormData((prev) => {
      const exists = prev.priorities.includes(priority);
      return {
        ...prev,
        priorities: exists
          ? prev.priorities.filter((item) => item !== priority)
          : [...prev.priorities, priority],
      };
    });
  };

  const handleCareOutsideSelect = (opt: string) => {
    setFormData((prev) => ({ ...prev, careOutsideCountry: opt }));
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
          care_outside_country: formData.careOutsideCountry,
          preferred_location: formData.preferredLocation,
          preferred_destination: formData.preferredLocation,
        });
      }

      if (onNext) {
        onNext({
          ...formData,
          caseId,
        });
      }
    } catch (err: any) {
      console.warn('Error in Step 5 (continuing):', err);
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

          {/* Question 1: Are you open to seeking care outside your home country? */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-800">
              Are you open to seeking care outside your home country?
            </label>
            <div className="flex flex-wrap gap-2.5 pt-0.5">
              {CARE_OUTSIDE_OPTIONS.map((opt) => {
                const isSelected = formData.careOutsideCountry === opt;
                return (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => handleCareOutsideSelect(opt)}
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

          {/* Question 2: Preferred destination (if any) */}
          <div className="space-y-2 pt-1">
            <label className="block text-sm font-semibold text-slate-800">
              Preferred destination (if any)
            </label>
            <div className="relative">
              <select
                value={formData.preferredLocation}
                onChange={(e) => setFormData((prev) => ({ ...prev, preferredLocation: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {DESTINATION_OPTIONS.map((loc) => (
                  <option key={loc} value={loc === 'No preference' ? '' : loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Question 3: What matters most to you? */}
          <div className="space-y-2 pt-1">
            <div>
              <label className="block text-sm font-semibold text-slate-800">
                What matters most to you?
              </label>
              <p className="text-xs text-slate-500 mt-0.5">Select all that apply</p>
            </div>
            <div className="flex flex-wrap gap-2.5 pt-1">
              {PRIORITY_OPTIONS.map((priority) => {
                const isSelected = formData.priorities.includes(priority);
                return (
                  <button
                    type="button"
                    key={priority}
                    onClick={() => togglePriority(priority)}
                    className={`text-xs sm:text-sm py-2 px-4 rounded-full border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-2 border-emerald-600 bg-emerald-50 text-emerald-950 font-semibold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-normal'
                    }`}
                  >
                    {priority}
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
