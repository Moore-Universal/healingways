'use client';

import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Send, 
  ChevronRight, 
  Sparkles,
  FileText
} from 'lucide-react';
import { 
  PatientCase, 
  adminSetMedicalItinerary 
} from '@/app/lib/firebase/services';

interface AdminMedicalItineraryProps {
  caseRecord: PatientCase;
  onUpdateCase: (updates: Partial<PatientCase>) => void;
  showToast: (msg: string) => void;
  onAdvanceStage: (nextStage: string) => Promise<void>;
}

const TEMPLATES = {
  standard: `• Day 1 (Arrival & Intake):
  - 10:30 AM: VIP Airport greeting and barrier-free transfer to hotel suite
  - 02:00 PM: Comprehensive clinical registration & initial specialist intake
  - 04:30 PM: Pre-operative laboratory screenings & high-resolution imaging

• Day 2 (Procedure & Treatment):
  - 07:30 AM: Hospital admission and surgical suite preparation
  - 09:00 AM: Procedure conducted by lead medical team
  - 02:00 PM: Post-anesthesia care recovery unit monitoring

• Day 3 - 5 (Inpatient Care & Observation):
  - Dedicated daily specialist rounds and recovery evaluation
  - Physiotherapy & personalized mobility sessions
  - 24/7 bilingual patient coordinator on-site support

• Day 6 (Discharge & Fit-to-Fly Certification):
  - Final clinical assessment with lead consultant
  - Medication supply, discharge summary & travel clearance issued
  - Transfer back to airport or extended recovery suite`,

  robotic: `• Day 1 (Arrival & Pre-Op Workup):
  - 11:00 AM: Executive medical transfer from International Airport to suite
  - 02:30 PM: Consultation with Chief Robotic Surgeon and anesthesiology panel
  - 04:00 PM: 3D CT joint mapping & pre-surgical baseline kinematics

• Day 2 (Robotic Precision Surgery):
  - 07:00 AM: Hospital admission & sterile robotic prep
  - 08:30 AM: Mako/DaVinci robotic-assisted surgical procedure
  - 01:30 PM: Immediate surgical ICU recovery monitoring

• Day 3 - 7 (Post-Operative Rehabilitation):
  - Day 3: First assisted ambulation with zero-gravity walking harness
  - Day 4-5: Intensive hydrotherapy & targeted range-of-motion sessions
  - Day 6-7: Independent gait training and stairs navigation clearance

• Day 8 - 10 (Final Clearance & Repatriation):
  - Wound healing audit & suture inspection
  - Formal Fit-to-Fly travel manifest issued
  - Ground transit transfer to departure terminal`,

  diagnostic: `• Day 1 (Arrival & Diagnostic Batteries):
  - 09:30 AM: Ground transfer to Hospital International Lounge
  - 11:00 AM: Advanced multislice CT & high-field 3T MRI scanning
  - 03:00 PM: Comprehensive metabolic, genetic & biometric blood work

• Day 2 (Specialist Multidisciplinary Review):
  - 10:00 AM: Multi-specialty clinical board review with lead consultants
  - 01:30 PM: Targeted diagnostic endoscopy / non-invasive intervention
  - 05:00 PM: Preliminary treatment pathway debrief

• Day 3 - 4 (Outpatient Plan & Travel Authorization):
  - Tailored international prescription & medical translation bundle
  - Telemedicine follow-up schedule established
  - Airport transfer for outbound journey`,
};

export default function AdminMedicalItinerary({
  caseRecord,
  onUpdateCase,
  showToast,
  onAdvanceStage,
}: AdminMedicalItineraryProps) {
  const [itineraryText, setItineraryText] = useState<string>(
    caseRecord.itinerary_notes || TEMPLATES.standard
  );
  const [saving, setSaving] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  const isConfirmed = caseRecord.itinerary_confirmed_by_patient;
  const isDeclined = caseRecord.itinerary_declined;
  const isSent = caseRecord.itinerary_sent_to_patient;

  const handleSendItinerary = async () => {
    if (!itineraryText.trim()) {
      showToast('Please enter itinerary details.');
      return;
    }
    setSaving(true);
    try {
      await adminSetMedicalItinerary(caseRecord.id, itineraryText.trim());
      onUpdateCase({
        itinerary_notes: itineraryText.trim(),
        itinerary_sent_to_patient: true,
        itinerary_confirmed_by_patient: false,
        itinerary_declined: false,
        itinerary_decline_reason: '',
      });
      showToast('Medical itinerary published & sent to patient portal.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error sending itinerary.';
      showToast(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickAdvance = async () => {
    setAdvancing(true);
    try {
      await onUpdateCase({
        itinerary_notes: itineraryText.trim() || TEMPLATES.standard,
        itinerary_confirmed_by_patient: true,
        itinerary_declined: false,
      });
      await onAdvanceStage('Accommodation & Visa');
      showToast('Itinerary confirmed. Advanced to Accommodation & Visa.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error advancing to Accommodation & Visa.';
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
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Medical Itinerary &amp; Clinical Schedule</span>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                Stage 4
              </span>
            </h3>
            <p className="text-xs text-slate-700 font-medium">
              Define the day-by-day clinical timeline, surgery admission, daily rounds, and discharge clearance
            </p>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isConfirmed ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Patient Confirmed Schedule
            </span>
          ) : isDeclined ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              Revision Requested
            </span>
          ) : isSent ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              Awaiting Patient Confirmation
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
              Draft / Unsent
            </span>
          )}
        </div>
      </div>

      {/* Decline alert if patient requested modification */}
      {isDeclined && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-700" />
            Patient Revision Feedback:
          </div>
          <p className="text-sm font-semibold text-slate-900 bg-white p-3 rounded-lg border border-amber-200">
            &quot;{caseRecord.itinerary_decline_reason || 'Please adjust the schedule timing or allow more rest days.'}&quot;
          </p>
          <p className="text-xs text-amber-800 font-medium">
            Update the timeline below and click &quot;Send Itinerary to Patient&quot; to notify them of the revisions.
          </p>
        </div>
      )}

      {/* Template selector pills */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Load Quick Schedule Templates</span>
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setItineraryText(TEMPLATES.standard)}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors cursor-pointer border border-slate-200"
          >
            Standard 6-Day Inpatient &amp; Recovery
          </button>
          <button
            type="button"
            onClick={() => setItineraryText(TEMPLATES.robotic)}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors cursor-pointer border border-slate-200"
          >
            10-Day Robotic Surgery Protocol
          </button>
          <button
            type="button"
            onClick={() => setItineraryText(TEMPLATES.diagnostic)}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors cursor-pointer border border-slate-200"
          >
            4-Day Diagnostic &amp; Outpatient Plan
          </button>
        </div>
      </div>

      {/* Editor textarea */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Medical Itinerary Content (Visible to Patient)
        </label>
        <textarea
          rows={11}
          value={itineraryText}
          onChange={(e) => setItineraryText(e.target.value)}
          placeholder="Enter day-by-day medical itinerary schedule..."
          className="w-full p-4 text-xs sm:text-sm font-mono bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-y shadow-2xs leading-relaxed"
        />
      </div>

      {/* Footer Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
        <p className="text-xs text-slate-500 font-medium">
          The patient can review and accept this schedule or request adjustments in their dashboard.
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={saving || !itineraryText.trim()}
            onClick={handleSendItinerary}
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
                <span>Send Itinerary to Patient</span>
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
                <span>Approve &amp; Advance to Accom. &amp; Visa</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
