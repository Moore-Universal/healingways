'use client';

import React, { useState } from 'react';
import { 
  Hotel, 
  FileCheck, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Send, 
  ChevronRight, 
  Sparkles,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { 
  PatientCase, 
  adminSetAccommodationAndVisa 
} from '@/app/lib/firebase/services';

interface AdminAccommodationVisaProps {
  caseRecord: PatientCase;
  onUpdateCase: (updates: Partial<PatientCase>) => void;
  showToast: (msg: string) => void;
  onAdvanceStage: (nextStage: string) => Promise<void>;
}

const TEMPLATES = {
  accomExecutive: `• Accommodation: Apollo Executive Medical Suite (Recommended)
• Location: 400m from Main Hospital Campus (Buggy shuttle included)
• Room Type: 1-Bedroom Wheelchair-Accessible Recovery Apartment
• Amenities: 24/7 nurse call button, medical recliner bed, kitchenette, companion breakfast
• Special Needs: Zero-threshold shower, sterile linen service
• Rate: $85 / night (HealingWays Preferred Medical Partner Rate)
• Booking Ref: HW-ACC-88319`,

  accomApartment: `• Accommodation: Somerset Serviced International Residences
• Location: 800m from Hospital (Dedicated driver shuttle on call)
• Room Type: 2-Bedroom Family Medical Suite (For patient & 2 companions)
• Amenities: Full kitchen, laundry facilities, high-speed WiFi, gym, pharmacy delivery
• Accessibility: Elevators, grab bars, wide doorways, walk-in shower
• Rate: $120 / night
• Booking Ref: HW-SOM-40192`,

  visaMedical: `• Visa Category: e-Medical Visa (Triple Entry) & Medical Attendant Visa (MEDX)
• Hospital Reference Code: HW-HOSP-VISA-9428
• Official Visa Invitation Letter: Formally signed by Medical Director and filed with Immigration Bureau
• Validity: 60 Days from date of arrival (Extendable upon clinical request)
• Status: Eligible for expedited 48-hour electronic approval`,

  visaLongStay: `• Visa Category: Extended Medical Stay Visa (Multiple Entry)
• Hospital Reference Code: HW-REHAB-VISA-1102
• Invitation & Guarantee Letter: Issued for 6-month clinical rehabilitation protocol
• Embassy Desk: Direct priority clearance code provided to International Consulate
• Status: Pre-screened with national visa facilitation unit`,
};

export default function AdminAccommodationVisa({
  caseRecord,
  onUpdateCase,
  showToast,
  onAdvanceStage,
}: AdminAccommodationVisaProps) {
  const [accomText, setAccomText] = useState<string>(
    caseRecord.accommodation_details || TEMPLATES.accomExecutive
  );
  const [visaText, setVisaText] = useState<string>(
    caseRecord.visa_details || TEMPLATES.visaMedical
  );

  const [saving, setSaving] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  const isConfirmed = caseRecord.accommodation_visa_confirmed_by_patient;
  const isDeclined = caseRecord.accommodation_visa_declined;
  const isSent = caseRecord.accommodation_visa_sent_to_patient;

  const handleSendDetails = async () => {
    if (!accomText.trim() || !visaText.trim()) {
      showToast('Please enter both accommodation and visa details.');
      return;
    }
    setSaving(true);
    try {
      await adminSetAccommodationAndVisa(caseRecord.id, accomText.trim(), visaText.trim());
      onUpdateCase({
        accommodation_details: accomText.trim(),
        visa_details: visaText.trim(),
        accommodation_visa_sent_to_patient: true,
        accommodation_visa_confirmed_by_patient: false,
        accommodation_visa_declined: false,
        accommodation_visa_decline_reason: '',
      });
      showToast('Accommodation & visa plan published & sent to patient.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error sending accommodation & visa details.';
      showToast(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickAdvance = async () => {
    setAdvancing(true);
    try {
      await onUpdateCase({
        accommodation_details: accomText.trim() || TEMPLATES.accomExecutive,
        visa_details: visaText.trim() || TEMPLATES.visaMedical,
        accommodation_visa_confirmed_by_patient: true,
        accommodation_visa_declined: false,
      });
      await onAdvanceStage('Travel Preparation');
      showToast('Accommodation & Visa confirmed. Advanced to Travel Preparation.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error advancing to Travel Preparation.';
      showToast(msg);
    } finally {
      setAdvancing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
      {/* Header & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Hotel className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Accommodation &amp; Visa Logistics</span>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                Stage 5
              </span>
            </h3>
            <p className="text-xs text-slate-700 font-medium">
              Assign hospital-adjacent recovery suites and official government medical visa invitations
            </p>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isConfirmed ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Confirmed by Patient
            </span>
          ) : isDeclined ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              Changes Requested
            </span>
          ) : isSent ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              Awaiting Patient Review
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
              Draft / Unsent
            </span>
          )}
        </div>
      </div>

      {/* Decline alert if patient requested change */}
      {isDeclined && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-700" />
            Patient Feedback / Accommodation Preferences:
          </div>
          <p className="text-sm font-semibold text-slate-900 bg-white p-3 rounded-lg border border-amber-200">
            &quot;{caseRecord.accommodation_visa_decline_reason || 'Please provide alternative accommodation options or adjust dates.'}&quot;
          </p>
          <p className="text-xs text-amber-800 font-medium">
            Update the hotel/visa plan below and re-send to patient.
          </p>
        </div>
      )}

      {/* Grid of Accommodation and Visa editors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Accommodation Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Hotel className="w-3.5 h-3.5 text-blue-600" />
              <span>Recovery Accommodation Suite</span>
            </label>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setAccomText(TEMPLATES.accomExecutive)}
                className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Executive Suite
              </button>
              <span className="text-[10px] text-slate-400">·</span>
              <button
                type="button"
                onClick={() => setAccomText(TEMPLATES.accomApartment)}
                className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
              >
                2-Bed Apartment
              </button>
            </div>
          </div>
          <textarea
            rows={8}
            value={accomText}
            onChange={(e) => setAccomText(e.target.value)}
            placeholder="Enter accommodation details, address, room amenities, nightly rate..."
            className="w-full p-3.5 text-xs sm:text-sm font-mono bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-y shadow-2xs leading-relaxed"
          />
        </div>

        {/* Visa Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Medical Visa &amp; Invitation Documentation</span>
            </label>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setVisaText(TEMPLATES.visaMedical)}
                className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
              >
                e-Medical Visa
              </button>
              <span className="text-[10px] text-slate-400">·</span>
              <button
                type="button"
                onClick={() => setVisaText(TEMPLATES.visaLongStay)}
                className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
              >
                6-Month Stay
              </button>
            </div>
          </div>
          <textarea
            rows={8}
            value={visaText}
            onChange={(e) => setVisaText(e.target.value)}
            placeholder="Enter visa category, hospital reference code, immigration invitation details..."
            className="w-full p-3.5 text-xs sm:text-sm font-mono bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all resize-y shadow-2xs leading-relaxed"
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
        <p className="text-xs text-slate-500 font-medium">
          Sent directly to the patient&apos;s accommodation portal with booking codes and official visa guidance.
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={saving || !accomText.trim() || !visaText.trim()}
            onClick={handleSendDetails}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Send Plan to Patient</span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={advancing}
            onClick={handleQuickAdvance}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
          >
            {advancing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <span>Approve &amp; Advance to Travel</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
