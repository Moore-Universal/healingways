'use client';

import React, { useState, useEffect } from 'react';
import { Check, User, Users, Heart, Baby } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'About You' },
  { id: 2, label: 'Your Situation' },
  { id: 3, label: 'Medical Details' },
  { id: 4, label: 'Documents' },
  { id: 5, label: 'Preferences' },
  { id: 6, label: 'Consent' },
];

const PATIENT_RELATION_OPTIONS = [
  {
    id: 'myself',
    value: 'Myself',
    label: 'Myself',
    description: 'Direct care for myself',
    icon: User,
  },
  {
    id: 'child',
    value: 'My child',
    label: 'My child',
    description: 'Pediatric care for my child',
    icon: Baby,
  },
  {
    id: 'spouse',
    value: 'My spouse',
    label: 'My spouse',
    description: 'Partner, husband, or wife',
    icon: Heart,
  },
  {
    id: 'family',
    value: 'Another family member',
    label: 'Another family member',
    description: 'Parent, sibling, or relative',
    icon: Users,
  },
];

interface StepOneProps {
  onNext?: (data: {
    consultationFor: string;
    fullName: string;
    patientName: string;
    email: string;
    phone: string;
    country: string;
    userId: string;
  }) => void;
  initialData?: {
    consultationFor?: string;
    fullName?: string;
    patientName?: string;
    email?: string;
    phone?: string;
    country?: string;
    userId?: string;
  };
}

export default function StepOneAboutYou({ onNext, initialData = {} }: StepOneProps) {
  const [formData, setFormData] = useState({
    consultationFor: initialData?.consultationFor || 'Myself',
    fullName: initialData?.fullName || '',
    patientName: initialData?.patientName || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    country: initialData?.country || '',
  });

  useEffect(() => {
    try {
      const sp = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const qEmail = sp?.get('email') || (typeof window !== 'undefined' ? (sessionStorage.getItem('hw_signup_draft_email') || localStorage.getItem('hw_user_email')) : '');
      const qName = sp?.get('name') || (typeof window !== 'undefined' ? (sessionStorage.getItem('hw_signup_draft_fullname') || localStorage.getItem('hw_user_fullname')) : '');
      
      setFormData((prev) => ({
        ...prev,
        consultationFor: initialData?.consultationFor || prev.consultationFor || 'Myself',
        fullName: initialData?.fullName || prev.fullName || qName || '',
        patientName: initialData?.patientName || prev.patientName || '',
        email: initialData?.email || prev.email || qEmail || '',
        phone: initialData?.phone || prev.phone || '',
        country: initialData?.country || prev.country || '',
      }));
    } catch {
      if (initialData && Object.keys(initialData).length > 0) {
        setFormData((prev) => ({
          ...prev,
          consultationFor: initialData.consultationFor || prev.consultationFor || 'Myself',
          fullName: initialData.fullName || prev.fullName || '',
          patientName: initialData.patientName || prev.patientName || '',
          email: initialData.email || prev.email || '',
          phone: initialData.phone || prev.phone || '',
          country: initialData.country || prev.country || '',
        }));
      }
    }
  }, [initialData]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRelationSelect = (rel: string) => {
    setFormData((prev) => ({ ...prev, consultationFor: rel }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('handleSubmit called, formData:', formData);
    setErrorMsg(null);

    // Validate email
    const cleanEmail = formData.email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please provide a valid email address.');
      return;
    }

    if (!formData.fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    if (!formData.phone.trim()) {
      setErrorMsg('Please provide a contact phone number.');
      return;
    }

    if (!formData.country.trim()) {
      setErrorMsg('Please enter your country of residence.');
      return;
    }

    setLoading(true);

    try {
      const resolvedUserId = `patient_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;

      if (typeof window !== 'undefined') {
        localStorage.setItem('hw_user_email', cleanEmail);
        localStorage.setItem('hw_user_name', formData.fullName);
      }

      // Smoothly advance to Step 2
      if (onNext) {
        onNext({
          ...formData,
          email: cleanEmail,
          userId: resolvedUserId,
        });
      }
    } catch (err: any) {
      console.error('Error in Step 1:', err);
      if (onNext) {
        onNext({
          ...formData,
          email: cleanEmail,
          userId: `patient_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="max-w-3xl mx-auto text-center space-y-3">
        <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xsss font-semibold rounded-full border border-emerald-100">
          Step 1: Account Creation & Patient Profile
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-950 tracking-tight">
          Create Your Account & Start Consultation
        </h1>
        <p className="text-slate-500 text-sm sm:text-base max-w-xl mx-auto">
          Filling out your consultation intake registers your secure HealingWayz patient account and initializes your clinical case file.
        </p>

        {/* Stepper Header Bar */}
        <div className="pt-8 pb-10">
          <div className="flex items-center justify-between relative max-w-2xl mx-auto px-2">
            <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />

            {STEPS.map((step) => {
              const isActive = step.id === 1;
              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center group">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xsss font-bold transition-all ${
                      isActive
                        ? 'border-2 border-emerald-600 bg-white text-emerald-700 ring-4 ring-emerald-50'
                        : 'border border-slate-300 bg-white text-slate-500'
                    }`}
                  >
                    {step.id}
                  </div>
                  <span
                    className={`mt-2 text-xsss font-medium whitespace-nowrap hidden sm:block ${
                      isActive ? 'text-emerald-700 font-bold' : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-10 mt-2">
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Relation Selector */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-800">
              Who is this consultation for? <span className="text-emerald-600">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PATIENT_RELATION_OPTIONS.map((opt) => {
                const isSelected = formData.consultationFor === opt.value;
                const IconComp = opt.icon;
                return (
                  <button
                    type="button"
                    key={opt.id}
                    id={`relation-btn-${opt.id}`}
                    onClick={() => handleRelationSelect(opt.value)}
                    className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer relative group ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-600/20 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0 pr-5">
                      <span className={`block text-xsss sm:text-sm font-semibold leading-tight ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}>
                        {opt.label}
                      </span>
                      <span className="block text-[11px] text-slate-500 mt-0.5 leading-snug">
                        {opt.description}
                      </span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 absolute top-3.5 right-3.5 transition-colors ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Patient Name (if consultation is for a family member) */}
          {formData.consultationFor !== 'Myself' && (
            <div className="space-y-1.5 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 animate-in fade-in duration-200">
              <label className="block text-sm font-semibold text-slate-800">
                Patient&apos;s Full Name (for {formData.consultationFor})
              </label>
              <input
                type="text"
                name="patientName"
                value={formData.patientName}
                onChange={handleChange}
                placeholder="e.g. John Doe"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-400"
              />
            </div>
          )}

          {/* Full Name / Contact Person */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-800">
              {formData.consultationFor === 'Myself' ? 'Full Name' : 'Your Full Name (Primary Contact)'}{' '}
              <span className="text-emerald-600">*</span>
            </label>
            <input
              type="text"
              name="fullName"
              required
              value={formData.fullName}
              onChange={handleChange}
              placeholder="e.g. Eleanor Vance"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-800">
              Email Address <span className="text-emerald-600">*</span>
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="eleanor.vance@example.com"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-800">
              Phone Number <span className="text-emerald-600">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 234-5678"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Country of Residence */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-800">
              Country of Residence <span className="text-emerald-600">*</span>
            </label>
            <input
              type="text"
              name="country"
              required
              value={formData.country}
              onChange={handleChange}
              placeholder="e.g. United States, United Kingdom, Canada"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-400"
            />
          </div>



          {/* Submit Action */}
          <div className="pt-4">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving Profile...
                </>
              ) : (
                'Continue to Step 2 (Your Situation)'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
