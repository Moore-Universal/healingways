'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, Check } from 'lucide-react';
import { auth } from '@/app/lib/firebase/client';

import StepTwoYourSituation from './_components/stepTwo';
import StepThreeMedicalDetails from './_components/stepThree';
import StepFourDocuments from './_components/stepFour';
import StepFivePreferences from './_components/stepFive';
import StepSixConsent, { ReviewData } from './_components/stepSix';
import StepSevenSuccess from './_components/stepSevenSuccess';

interface ConsultationFormState {
  aboutYou?: {
    consultationFor?: string;
    fullName?: string;
    patientName?: string;
    email?: string;
    phone?: string;
    country?: string;
    userId?: string;
  };
  situation?: {
    supportType?: string;
    healthcareArea?: string;
    situationDescription?: string;
  };
  medicalDetails?: {
    hasDiagnosis?: string;
    diagnosis?: string;
    treatmentStatus?: string;
  };
  documentsUploaded?: Array<{ name: string; path: string; size: number }>;
  preferences?: {
    careOutsideCountry?: string;
    preferredLocation?: string;
    priorities?: string[];
  };
}

const STORAGE_KEY = 'hw_consultation_form_data';
const STEP_KEY = 'hw_consultation_current_step';
const CASE_KEY = 'hw_consultation_case_id';

const STEPS = [
  { id: 1, label: 'Your Situation' },
  { id: 2, label: 'Medical Details' },
  { id: 3, label: 'Documents' },
  { id: 4, label: 'Preferences' },
  { id: 5, label: 'Consent' },
];

export default function ConsultationPage() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ConsultationFormState>({});
  const [caseId, setCaseId] = useState<string | undefined>(undefined);
  const [submittedCaseId, setSubmittedCaseId] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load user profile & restore saved consultation progress
  useEffect(() => {
    try {
      const user = auth.currentUser;
      let storedUser: { fullName?: string; email?: string; phone?: string; country?: string; uid?: string } | null = null;
      try {
        const raw = localStorage.getItem('hw_user');
        if (raw) storedUser = JSON.parse(raw);
      } catch {}

      const storedEmail = typeof window !== 'undefined' ? localStorage.getItem('hw_user_email') : '';
      const storedName = typeof window !== 'undefined' ? localStorage.getItem('hw_user_fullname') : '';
      const name = storedUser?.fullName || user?.displayName || storedName || 'Patient';

      const savedData = localStorage.getItem(STORAGE_KEY);
      const savedStep = localStorage.getItem(STEP_KEY);
      const savedCaseId = localStorage.getItem(CASE_KEY);

      let parsedData: ConsultationFormState = {};
      if (savedData) {
        try {
          parsedData = JSON.parse(savedData);
        } catch {}
      }

      setFormData({
        ...parsedData,
        aboutYou: {
          consultationFor: parsedData.aboutYou?.consultationFor || 'Myself',
          fullName: parsedData.aboutYou?.fullName || name,
          patientName: parsedData.aboutYou?.patientName || name,
          email: parsedData.aboutYou?.email || storedUser?.email || user?.email || storedEmail || '',
          phone: parsedData.aboutYou?.phone || storedUser?.phone || '',
          country: parsedData.aboutYou?.country || storedUser?.country || '',
          userId: user?.uid || storedUser?.uid || '',
        },
      });

      if (savedStep) {
        const stepNum = parseInt(savedStep, 10);
        // Only restore in-progress draft steps (1-5). Step 6 is the post-submission confirmation and should never be loaded on revisit.
        if (stepNum >= 1 && stepNum <= 5) {
          setCurrentStep(stepNum);
        } else {
          setCurrentStep(1);
          try {
            localStorage.removeItem(STEP_KEY);
          } catch {}
        }
      } else {
        setCurrentStep(1);
      }
      if (savedCaseId) {
        setCaseId(savedCaseId);
      }
    } catch (e) {
      console.warn('Could not restore consultation state from storage', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Compute initials directly
  const currentUserName = formData.aboutYou?.fullName || 'Patient';
  const userInitials = (() => {
    const parts = currentUserName.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return currentUserName.slice(0, 2).toUpperCase();
  })();

  // Save progress changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      if (currentStep >= 1 && currentStep <= 5) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
        localStorage.setItem(STEP_KEY, currentStep.toString());
        if (caseId) {
          localStorage.setItem(CASE_KEY, caseId);
        }
      }
    } catch (e) {
      console.warn('Could not persist consultation state', e);
    }
  }, [formData, currentStep, caseId, isLoaded]);

  const goBack = () => {
    setCurrentStep((step) => {
      const newStep = Math.max(1, step - 1);
      localStorage.setItem(STEP_KEY, newStep.toString());
      return newStep;
    });
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
    localStorage.setItem(STEP_KEY, step.toString());
  };

  const handleSituationNext = (data: { supportType?: string; healthcareArea?: string; situationDescription?: string; caseId?: string }) => {
    const updated = { ...formData, situation: data };
    setFormData(updated);
    if (data.caseId) {
      setCaseId(data.caseId);
      try {
        localStorage.setItem(CASE_KEY, data.caseId);
        localStorage.setItem('hw_active_case_id', data.caseId);
      } catch {}
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setCurrentStep(2);
    localStorage.setItem(STEP_KEY, '2');
  };

  const handleMedicalDetailsNext = (data: { hasDiagnosis?: string; diagnosis?: string; treatmentStatus?: string; caseId?: string }) => {
    const updated = { ...formData, medicalDetails: data };
    setFormData(updated);
    if (data.caseId) {
      setCaseId(data.caseId);
      try {
        localStorage.setItem(CASE_KEY, data.caseId);
        localStorage.setItem('hw_active_case_id', data.caseId);
      } catch {}
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setCurrentStep(3);
    localStorage.setItem(STEP_KEY, '3');
  };

  const handleDocumentsNext = (data: { documentsUploaded?: Array<{ name: string; path: string; size: number }>; caseId?: string }) => {
    const updated = { ...formData, documentsUploaded: data.documentsUploaded || [] };
    setFormData(updated);
    if (data.caseId) {
      setCaseId(data.caseId);
      try {
        localStorage.setItem(CASE_KEY, data.caseId);
        localStorage.setItem('hw_active_case_id', data.caseId);
      } catch {}
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setCurrentStep(4);
    localStorage.setItem(STEP_KEY, '4');
  };

  const handlePreferencesNext = (data: { careOutsideCountry?: string; preferredLocation?: string; priorities?: string[]; caseId?: string }) => {
    const updated = { ...formData, preferences: data };
    setFormData(updated);
    if (data.caseId) {
      setCaseId(data.caseId);
      try {
        localStorage.setItem(CASE_KEY, data.caseId);
        localStorage.setItem('hw_active_case_id', data.caseId);
      } catch {}
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setCurrentStep(5);
    localStorage.setItem(STEP_KEY, '5');
  };

  const handleConsentSubmit = (consentData?: { caseId?: string; timestamp?: string; consentFlags?: Record<string, boolean> }) => {
    const finalCaseId =
      consentData?.caseId ||
      caseId ||
      (typeof window !== 'undefined'
        ? localStorage.getItem(CASE_KEY) || localStorage.getItem('hw_active_case_id')
        : '') ||
      '';
    setSubmittedCaseId(finalCaseId);
    if (finalCaseId) {
      try {
        localStorage.setItem(CASE_KEY, finalCaseId);
        localStorage.setItem('hw_active_case_id', finalCaseId);
        localStorage.setItem('hw_consultation_completed', 'true');
        localStorage.setItem('hw_consultation_completed_case_id', finalCaseId);
      } catch {}
    }
    setCurrentStep(6);
    try {
      localStorage.removeItem(STEP_KEY);
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  // Step 6 is Success view
  if (currentStep === 6) {
    const resolvedName =
      formData.aboutYou?.fullName ||
      (typeof window !== 'undefined' ? localStorage.getItem('hw_user_fullname') || '' : '');
    const resolvedEmail =
      formData.aboutYou?.email ||
      (typeof window !== 'undefined' ? localStorage.getItem('hw_user_email') || '' : '');
    return (
      <StepSevenSuccess
        userName={resolvedName}
        userEmail={resolvedEmail}
        caseId={submittedCaseId || caseId}
        onGoHome={() => router.push('/')}
      />
    );
  }

  const reviewData: ReviewData = {
    aboutYou: formData.aboutYou,
    situation: {
      supportType: formData.situation?.supportType || 'Not sure, I need guidance',
      healthcareArea: formData.situation?.healthcareArea || 'Fertility',
      description: formData.situation?.situationDescription || '',
    },
    medicalDetails: {
      diagnosed:
        formData.medicalDetails?.hasDiagnosis === 'Yes'
          ? formData.medicalDetails.diagnosis || 'Yes'
          : formData.medicalDetails?.hasDiagnosis || '—',
      treatmentStatus: formData.medicalDetails?.treatmentStatus || '—',
    },
    documents: {
      fileCount: formData.documentsUploaded?.length || 0,
    },
    preferences: {
      careAbroad: formData.preferences?.careOutsideCountry || '—',
      preferredLocation: formData.preferences?.preferredLocation || '—',
      whatMatters: formData.preferences?.priorities || [],
    },
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="border-b border-slate-200/80 bg-white sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            New Consultation
          </h1>
          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              href="/"
              className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              ← Back to Website
            </Link>
            <button
              type="button"
              aria-label="Notifications"
              className="text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
            >
              <Bell className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-full bg-emerald-800 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
              {userInitials}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="max-w-xl mx-auto">
          {/* Breadcrumbs */}
          <div className="text-xs text-slate-500 mb-2">
            <Link href="/" className="hover:underline">
              My Healthcare Journey
            </Link>
            {' '}/{' '}
            <span className="text-slate-800 font-medium">New Consultation</span>
          </div>

          {/* Section Headline & Description */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Let&apos;s understand how we can support you.
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 mb-6">
            Since you&apos;re already signed in, we&apos;ve skipped the questions we already know.
          </p>

          {/* Stepper Status Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 mb-6 shadow-xs overflow-x-auto">
            <div className="flex items-center justify-between min-w-[440px] sm:min-w-0">
              {STEPS.map((step, idx) => {
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;

                return (
                  <React.Fragment key={step.id}>
                    <div className="flex items-center gap-2 shrink-0">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : isCompleted
                            ? 'bg-emerald-600 text-white'
                            : 'border border-slate-300 text-slate-500 bg-white'
                        }`}
                      >
                        {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : step.id}
                      </div>
                      <span
                        className={`text-xs whitespace-nowrap ${
                          isActive
                            ? 'text-emerald-700 font-bold'
                            : isCompleted
                            ? 'text-slate-800 font-medium'
                            : 'text-slate-400 font-normal'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div
                        className={`h-0.5 flex-1 mx-2 sm:mx-3 ${
                          currentStep > step.id ? 'bg-emerald-600' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Step Form Content */}
          {currentStep === 1 && (
            <StepTwoYourSituation
              onNext={handleSituationNext}
              onBack={goBack}
              initialData={formData.situation}
              aboutYou={formData.aboutYou}
              caseId={caseId}
            />
          )}

          {currentStep === 2 && (
            <StepThreeMedicalDetails
              onNext={handleMedicalDetailsNext}
              onBack={goBack}
              initialData={formData.medicalDetails}
              caseId={caseId}
            />
          )}

          {currentStep === 3 && (
            <StepFourDocuments
              onNext={handleDocumentsNext}
              onBack={goBack}
              caseId={caseId}
            />
          )}

          {currentStep === 4 && (
            <StepFivePreferences
              onNext={handlePreferencesNext}
              onBack={goBack}
              initialData={formData.preferences}
              caseId={caseId}
            />
          )}

          {currentStep === 5 && (
            <StepSixConsent
              reviewData={reviewData}
              caseId={caseId}
              onEditStep={goToStep}
              onBack={goBack}
              onSubmit={handleConsentSubmit}
            />
          )}
        </div>
      </main>
    </div>
  );
}
