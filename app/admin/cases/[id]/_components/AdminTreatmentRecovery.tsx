'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Loader2, 
  Send, 
  Sparkles,
  Calendar,
  UserCheck,
  Award,
  ChevronRight
} from 'lucide-react';
import { 
  PatientCase, 
  TreatmentUpdate, 
  addTreatmentUpdate, 
  getTreatmentUpdatesForCase,
  updatePatientCase 
} from '@/app/lib/firebase/services';
import StageDocumentAttachment from './StageDocumentAttachment';

interface AdminTreatmentRecoveryProps {
  caseRecord: PatientCase;
  onUpdateCase: (updates: Partial<PatientCase>) => void;
  showToast: (msg: string) => void;
  onAdvanceStage: (nextStage: string) => Promise<void>;
}

const PRESETS = [
  {
    title: 'Procedure Completed Successfully',
    notes: 'Lead surgical team confirmed optimal outcome with zero intraoperative complications. Patient has been transferred to the private recovery suite with stable vitals.',
    authorRole: 'Chief Surgeon',
    authorName: 'Dr. R. Sengupta',
  },
  {
    title: 'Post-Op Physical Therapy Milestone Initiated',
    notes: 'Inpatient rehabilitation specialist guided assisted mobility and joint flexion sessions. Target 90° range achieved with minimal discomfort.',
    authorRole: 'Clinical Physiotherapist',
    authorName: 'Sarah James',
  },
  {
    title: 'Discharge & Fit-to-Fly Evaluation Cleared',
    notes: 'Final surgical wound assessment, suture removal completed. International travel clearance and 30-day medication protocol issued to patient.',
    authorRole: 'Medical Director',
    authorName: 'Dr. Marcus Chen',
  },
];

export default function AdminTreatmentRecovery({
  caseRecord,
  onUpdateCase,
  showToast,
  onAdvanceStage,
}: AdminTreatmentRecoveryProps) {
  const [updates, setUpdates] = useState<TreatmentUpdate[]>(
    caseRecord.treatment_updates || []
  );
  const [loadingUpdates, setLoadingUpdates] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [authorName, setAuthorName] = useState(caseRecord.coordinator_name || 'Care Coordinator');
  const [authorRole, setAuthorRole] = useState('Clinical Coordinator');
  const [dateStr, setDateStr] = useState('Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Load updates from Firestore
  const loadUpdates = useCallback(async () => {
    if (!caseRecord.id) return;
    setLoadingUpdates(true);
    try {
      const list = await getTreatmentUpdatesForCase(caseRecord.id);
      if (list && list.length > 0) {
        setUpdates(list);
      } else if (caseRecord.treatment_updates && caseRecord.treatment_updates.length > 0) {
        setUpdates(caseRecord.treatment_updates);
      }
    } catch (err) {
      console.error('Error fetching treatment updates:', err);
    } finally {
      setLoadingUpdates(false);
    }
  }, [caseRecord.id, caseRecord.treatment_updates]);

  useEffect(() => {
    loadUpdates();
  }, [loadUpdates]);

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setTitle(preset.title);
    setNotes(preset.notes);
    setAuthorRole(preset.authorRole);
    setAuthorName(preset.authorName);
  };

  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !notes.trim()) {
      showToast('Please enter both update title and notes.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await addTreatmentUpdate(caseRecord.id, {
        title: title.trim(),
        notes: notes.trim(),
        authorName: authorName.trim() || 'Care Coordinator',
        authorRole: authorRole.trim() || 'Clinical Lead',
        date: dateStr.trim(),
      });

      const nextList = [created, ...updates];
      setUpdates(nextList);
      onUpdateCase({
        treatment_updates: nextList,
        status: 'In Progress',
      });

      // Reset form
      setTitle('');
      setNotes('');
      showToast('Clinical milestone posted to patient recovery feed.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error posting clinical update.';
      showToast(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUpdate = async (idToDelete: string) => {
    try {
      const nextList = updates.filter((u) => u.id !== idToDelete);
      setUpdates(nextList);
      await updatePatientCase(caseRecord.id, { treatment_updates: nextList });
      onUpdateCase({ treatment_updates: nextList });
      showToast('Update removed.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error removing update.';
      showToast(msg);
    }
  };

  const handleCompleteCase = async () => {
    setCompleting(true);
    try {
      await onAdvanceStage('Completed');
      showToast('Patient case marked as Completed and successfully discharged!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error completing case.';
      showToast(msg);
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6">
      {/* Header & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Treatment &amp; Recovery Management</span>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                Stage 7
              </span>
            </h3>
            <p className="text-xs text-slate-700 font-medium">
              Publish continuous clinical updates, doctor consultation summaries, vitals, and discharge clearance
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {caseRecord.workflow_stage === 'Completed' || caseRecord.stage === 'Completed' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
              <Award className="w-3.5 h-3.5 text-emerald-700" />
              Treatment Completed &amp; Discharged
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
              <Activity className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
              Active Inpatient / Recovery
            </span>
          )}
        </div>
      </div>

      {/* New Clinical Update Form */}
      <form onSubmit={handleAddUpdate} className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-teal-600" />
            <span>Publish New Clinical Update to Patient</span>
          </h4>
          
          {/* Quick presets */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Presets:</span>
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="text-[11px] font-bold text-teal-700 hover:text-teal-800 bg-white px-2 py-0.5 rounded border border-slate-200 hover:border-teal-300 transition-colors cursor-pointer"
              >
                {idx === 0 ? 'Procedure' : idx === 1 ? 'Rehab' : 'Discharge'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="text-[11px] font-bold uppercase text-slate-700 block mb-1">
              Milestone / Update Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Day 1: Robotic Surgery Successfully Completed"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm font-semibold border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase text-slate-700 block mb-1">
              Attending Doctor / Coordinator Name
            </label>
            <input
              type="text"
              placeholder="e.g. Dr. Sengupta"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase text-slate-700 block mb-1">
              Role / Department
            </label>
            <input
              type="text"
              placeholder="e.g. Lead Orthopedic Surgeon"
              value={authorRole}
              onChange={(e) => setAuthorRole(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold uppercase text-slate-700 block mb-1">
            Clinical Notes &amp; Observations for Patient *
          </label>
          <textarea
            rows={3}
            required
            placeholder="Document vitals, surgical outcome, mobility status, recovery milestones, or rehabilitation instructions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-3.5 text-xs sm:text-sm font-medium border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs resize-y"
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-semibold"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !title.trim() || !notes.trim()}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Publish Update to Patient</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Existing Updates Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Published Clinical Milestones ({updates.length})
          </h4>
          {loadingUpdates && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
        </div>

        {updates.length === 0 ? (
          <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              No clinical updates published yet. Use the form above to post surgery progress, doctor rounds, or rehabilitation updates.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {updates.map((upd) => (
              <div
                key={upd.id}
                className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-slate-300 transition-all flex items-start justify-between gap-3"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{upd.title}</span>
                    <span className="text-[11px] text-slate-500 font-medium">· {upd.date}</span>
                    <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {upd.authorRole}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                    {upd.notes}
                  </p>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                    <UserCheck className="w-3 h-3 text-slate-400" />
                    <span>Logged by {upd.authorName}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteUpdate(upd.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Remove update"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Supplementary Documents for Treatment & Recovery */}
      <StageDocumentAttachment
        caseRecord={caseRecord}
        stage="Treatment & Recovery"
        title="Treatment & Recovery Documents"
        description="Attach clinical discharge summaries, post-operative care plans, specialist prescriptions, or follow-up laboratory results."
        onUpdateCase={onUpdateCase}
        showToast={showToast}
      />

      {/* Complete Journey Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
        <p className="text-xs text-slate-500 font-medium">
          When the patient is discharged and fully recovered, finalize the case into the Completed archive.
        </p>

        <button
          type="button"
          disabled={completing || caseRecord.workflow_stage === 'Completed'}
          onClick={handleCompleteCase}
          className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-2xs disabled:opacity-50"
        >
          {completing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>Mark Treatment Complete &amp; Finalize Case</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
