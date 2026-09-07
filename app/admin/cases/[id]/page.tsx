'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ShieldAlert,
  Lock,
  Check,
  X,
  FileText,
  CheckCircle2,
  Clock,
  Plus,
  Send,
  MessageSquare,
  AlertCircle,
  Eye,
  Building2,
  BedDouble,
  Receipt,
  Loader2,
  ChevronRight,
  Sparkles,
  Calendar,
  Plane,
  Activity,
} from 'lucide-react';
import { 
  getCaseById, 
  updatePatientCase, 
  adminSubmitCaseReview,
  adminAdvanceCaseStage,
  sendChatMessage,
  subscribeToCaseMessages,
  ChatMessage,
  DEFAULT_COORDINATORS,
  DEFAULT_HOSPITALS,
  PatientCase,
  Hospital
} from '@/app/lib/firebase/services';
import AdminHospitalRecommendations from './_components/AdminHospitalRecommendations';
import AdminMedicalItinerary from './_components/AdminMedicalItinerary';
import AdminAccommodationVisa from './_components/AdminAccommodationVisa';
import AdminTravelPreparation from './_components/AdminTravelPreparation';
import AdminTreatmentRecovery from './_components/AdminTreatmentRecovery';

const JOURNEY_STAGES = [
  'Consultation Submitted',
  'Case Review',
  'Hospital Recommendation',
  'Medical Itinerary',
  'Accommodation & Visa',
  'Travel Preparation',
  'Treatment & Recovery',
  'Completed',
];

interface InternalNote {
  id: string;
  author: string;
  text: string;
  date: string;
}

interface CaseTask {
  id: string;
  title: string;
  stage: string;
  status: 'open' | 'resolved';
}

interface AccommodationItem {
  id: string;
  name: string;
  type: string;
  location: string;
  pricePerNight: string;
}

export default function AdminCaseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const caseId = params?.id || '';

  const [loading, setLoading] = useState(true);
  const [caseRecord, setCaseRecord] = useState<PatientCase | null>(null);

  // Active Journey Workstation Tab
  const [activeWorkstationTab, setActiveWorkstationTab] = useState<string>('Hospital Recommendation');

  // Modals state
  const [showRequestInfoModal, setShowRequestInfoModal] = useState(false);
  const [requestInfoText, setRequestInfoText] = useState('');
  const [sendingRequestInfo, setSendingRequestInfo] = useState(false);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewInput, setReviewInput] = useState('');
  const [savingReview, setSavingReview] = useState(false);

  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showAddAccomModal, setShowAddAccomModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);

  // Interactive notes state
  const [newNoteInput, setNewNoteInput] = useState('');
  const [notesList, setNotesList] = useState<InternalNote[]>([]);

  // Tasks state
  const [tasksList, setTasksList] = useState<CaseTask[]>([
    {
      id: 'task-1',
      title: 'Begin case review for new patient',
      stage: 'Consultation Submitted',
      status: 'open',
    },
  ]);

  // Document state
  const [docStatus, setDocStatus] = useState<'Pending Review' | 'Accepted' | 'Update Requested'>('Pending Review');
  const [docName, setDocName] = useState<string>('Consultation page 5.PNG');

  // Billing state
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [outstandingAmount, setOutstandingAmount] = useState<number>(300);
  const [billingStatus, setBillingStatus] = useState<'Outstanding' | 'Paid'>('Outstanding');

  // Accommodations state
  const [accommodationsList, setAccommodationsList] = useState<AccommodationItem[]>([]);
  const [newAccomName, setNewAccomName] = useState('');
  const [newAccomType, setNewAccomType] = useState('Serviced Medical Apartment');
  const [newAccomPrice, setNewAccomPrice] = useState('$85 / night');
  const [newAccomLocation, setNewAccomLocation] = useState('Near Apollo Hospital, Chennai');

  // Chat message state
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    {
      sender: 'System',
      text: 'Patient consultation submitted successfully. All intake details recorded.',
      time: 'Today, 09:15 AM',
    },
  ]);
  const [chatInput, setChatInput] = useState('');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  const fetchCase = useCallback(async () => {
    if (!caseId) return;
    setLoading(true);
    try {
      const c = await getCaseById(caseId);
      if (c) {
        setCaseRecord(c);
        if (c.review_text) {
          setReviewInput(c.review_text);
        }
        if (c.billing_paid !== undefined) {
          setPaidAmount(c.billing_paid);
        }
        if (c.billing_outstanding !== undefined) {
          setOutstandingAmount(c.billing_outstanding);
          setBillingStatus(c.billing_outstanding === 0 ? 'Paid' : 'Outstanding');
        }
        if (c.document_status) {
          setDocStatus(c.document_status);
        }
        if (c.document_name) {
          setDocName(c.document_name);
        }
        if (c.internal_notes && c.internal_notes.length > 0) {
          setNotesList(c.internal_notes);
        }
        if (c.tasks && c.tasks.length > 0) {
          setTasksList(c.tasks);
        }
        if (c.accommodations && c.accommodations.length > 0) {
          setAccommodationsList(
            c.accommodations.map((a) => ({
              id: a.id,
              name: a.name,
              type: a.type,
              location: a.location,
              pricePerNight: a.price,
            }))
          );
        }
        if (c.workflow_stage === 'Medical Itinerary') {
          setActiveWorkstationTab('Medical Itinerary');
        } else if (c.workflow_stage === 'Accommodation & Visa') {
          setActiveWorkstationTab('Accommodation & Visa');
        } else if (c.workflow_stage === 'Travel Preparation') {
          setActiveWorkstationTab('Travel Preparation');
        } else if (c.workflow_stage === 'Treatment & Recovery' || c.workflow_stage === 'Completed') {
          setActiveWorkstationTab('Treatment & Recovery');
        } else {
          setActiveWorkstationTab('Hospital Recommendation');
        }
      }
    } catch (err) {
      console.error('Error loading patient case:', err);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchCase();
  }, [fetchCase]);

  // Helper to determine stage index (0 to 7)
  const getStageIndex = (stageName?: string) => {
    if (!stageName) return 0;
    const idx = JOURNEY_STAGES.findIndex((s) => s.toLowerCase() === stageName.toLowerCase());
    return idx !== -1 ? idx : 0;
  };

  const currentStageIndex = getStageIndex(caseRecord?.workflow_stage || caseRecord?.stage);
  const currentStageName = caseRecord?.workflow_stage || caseRecord?.stage || 'Consultation Submitted';

  // Count open tasks and pending documents
  const openTasks = tasksList.filter((t) => t.status === 'open');
  const isDocPending = docStatus === 'Pending Review';
  const canAdvanceStage = !isDocPending && openTasks.length === 0;

  // Handler: Add Internal Note
  const handleAddNote = async () => {
    if (!newNoteInput.trim() || !caseRecord) return;
    const newNote: InternalNote = {
      id: 'note-' + Date.now(),
      author: caseRecord.coordinator_name || 'Sarah James',
      text: newNoteInput.trim(),
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
    };
    const updated = [newNote, ...notesList];
    setNotesList(updated);
    setNewNoteInput('');
    try {
      await updatePatientCase(caseRecord.id, { internal_notes: updated });
    } catch {}
    showToast('Internal note saved successfully.');
  };

  // Handler: Accept Document
  const handleAcceptDoc = async () => {
    if (!caseRecord) return;
    setDocStatus('Accepted');
    showToast(`"${docName}" has been accepted and verified.`);
    try {
      await updatePatientCase(caseRecord.id, { document_status: 'Accepted' });
    } catch {}
  };

  // Handler: Request Document Update
  const handleRequestDocUpdate = async () => {
    if (!caseRecord) return;
    setDocStatus('Update Requested');
    showToast(`Re-upload request sent to ${caseRecord.patient_name}.`);
    try {
      await updatePatientCase(caseRecord.id, { document_status: 'Update Requested' });
    } catch {}
  };

  // Handler: Toggle Task
  const handleToggleTask = async (taskId: string) => {
    const updated = tasksList.map((t) =>
      t.id === taskId ? { ...t, status: t.status === 'open' ? ('resolved' as const) : ('open' as const) } : t
    );
    setTasksList(updated);
    if (caseRecord) {
      try {
        await updatePatientCase(caseRecord.id, { tasks: updated });
      } catch {}
    }
  };

  const [updatingStage, setUpdatingStage] = useState(false);

  // Callback when child components update case data
  const handleChildUpdateCase = (updates: Partial<PatientCase>) => {
    setCaseRecord((prev) => (prev ? { ...prev, ...updates } : null));
  };

  // Handler: Advance or Set Stage Directly as Admin
  const handleAdminSetStage = async (newStage: string) => {
    if (!caseRecord || updatingStage) return;
    setUpdatingStage(true);
    try {
      await adminAdvanceCaseStage(caseRecord.id, newStage);
      setCaseRecord((prev) =>
        prev
          ? {
              ...prev,
              workflow_stage: newStage as PatientCase['workflow_stage'],
              stage: newStage,
            }
          : null
      );
      if (
        newStage === 'Hospital Recommendation' ||
        newStage === 'Medical Itinerary' ||
        newStage === 'Accommodation & Visa' ||
        newStage === 'Travel Preparation' ||
        newStage === 'Treatment & Recovery'
      ) {
        setActiveWorkstationTab(newStage);
      } else if (newStage === 'Completed') {
        setActiveWorkstationTab('Treatment & Recovery');
      }
      showToast(`Journey stage updated to "${newStage}".`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating stage.';
      showToast(msg);
    } finally {
      setUpdatingStage(false);
    }
  };

  // Handler: Submit Review
  const handleSubmitReview = async () => {
    if (!reviewInput.trim() || !caseRecord) return;
    setSavingReview(true);
    try {
      await adminSubmitCaseReview(caseRecord.id, reviewInput.trim());
      await updatePatientCase(caseRecord.id, {
        workflow_stage: 'Case Review',
        stage: 'Case Review',
        status: 'Under Review',
      });
      setCaseRecord((prev) =>
        prev
          ? {
              ...prev,
              review_text: reviewInput.trim(),
              workflow_stage: 'Case Review',
              stage: 'Case Review',
              status: 'Under Review',
            }
          : null
      );
      setShowReviewModal(false);
      showToast('Clinical case review submitted and published.');
    } catch (err: any) {
      showToast(err.message || 'Error submitting review.');
    } finally {
      setSavingReview(false);
    }
  };

  // Handler: Send Request for More Information
  const handleSendInfoRequest = async () => {
    if (!requestInfoText.trim() || !caseRecord) return;
    setSendingRequestInfo(true);
    try {
      const note: InternalNote = {
        id: 'note-req-' + Date.now(),
        author: caseRecord.coordinator_name || 'Sarah James',
        text: `Requested info from patient: "${requestInfoText.trim()}"`,
        date: 'Just now',
      };
      const updatedNotes = [note, ...notesList];
      setNotesList(updatedNotes);
      await updatePatientCase(caseRecord.id, {
        status: 'Under Review',
        internal_notes: updatedNotes,
      });
      setShowRequestInfoModal(false);
      setRequestInfoText('');
      showToast(`Information request delivered to ${caseRecord.patient_email || caseRecord.patient_name}.`);
    } catch (err) {
      showToast('Failed to send request.');
    } finally {
      setSendingRequestInfo(false);
    }
  };

  // Handler: Mark Payment
  const handleMarkPaymentReceived = async () => {
    if (!caseRecord) return;
    setPaidAmount(300);
    setOutstandingAmount(0);
    setBillingStatus('Paid');
    try {
      await updatePatientCase(caseRecord.id, {
        billing_paid: 300,
        billing_outstanding: 0,
      });
    } catch {}
    setShowReceiptModal(false);
    showToast('Payment of USD $300 marked as received.');
  };

  // Handler: Add Accommodation
  const handleAddAccommodation = async () => {
    if (!newAccomName.trim() || !caseRecord) return;
    const item: AccommodationItem = {
      id: 'acc-' + Date.now(),
      name: newAccomName.trim(),
      type: newAccomType,
      pricePerNight: newAccomPrice,
      location: newAccomLocation,
    };
    const updated = [...accommodationsList, item];
    setAccommodationsList(updated);
    setNewAccomName('');
    setShowAddAccomModal(false);
    try {
      await updatePatientCase(caseRecord.id, {
        accommodations: updated.map((a) => ({
          id: a.id,
          name: a.name,
          type: a.type,
          price: a.pricePerNight,
          location: a.location,
        })),
      });
    } catch {}
    showToast('Accommodation option added to case.');
  };

  // Handler: Send chat message
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !caseRecord) return;
    const textToSend = chatInput.trim();
    setChatInput('');

    try {
      await sendChatMessage({
        caseId: caseRecord.id,
        altCaseId: caseRecord.case_number,
        sender: 'agent',
        senderName: `${caseRecord.coordinator_name || 'Sarah James'} (Coordinator)`,
        senderRole: 'coordinator',
        text: textToSend,
      });
    } catch (err) {
      console.error('Error sending message from case modal:', err);
    }
  };

  // Subscribe to real-time messages for this patient case
  useEffect(() => {
    if (!caseRecord) return;

    const unsubscribe = subscribeToCaseMessages(
      caseRecord.id,
      (msgs) => {
        setChatMessages(
          msgs.map((m) => ({
            sender: m.sender === 'agent' ? m.senderName : caseRecord.patient_name || 'Patient',
            text: m.text,
            time: m.timestamp || 'Just now',
          }))
        );
      },
      caseRecord.case_number
    );

    return () => {
      unsubscribe();
    };
  }, [caseRecord]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[550px] space-y-3 font-sans">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading patient case record...</p>
      </div>
    );
  }

  if (!caseRecord) {
    return (
      <div className="max-w-3xl mx-auto p-8 font-sans text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Case Record Not Found</h2>
        <p className="text-sm text-slate-500">The requested case number or ID could not be loaded.</p>
        <Link
          href="/admin/patient-cases"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Patient Cases
        </Link>
      </div>
    );
  }

  return (
    <div className="font-sans max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-8 space-y-6 text-[#1e293b]">
      
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 text-xs sm:text-sm animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Navigation */}
      <div>
        <Link
          href="/admin/patient-cases"
          className="text-sm font-semibold text-blue-600 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Patient Cases
        </Link>
      </div>

      {/* Patient Name Header & Subtitle */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {caseRecord.patient_name}
          </h1>
          <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1 rounded-full border border-slate-200/60">
            {caseRecord.status || 'New'}
          </span>
        </div>
        <div className="text-sm text-slate-500">
          {caseRecord.case_number} · {caseRecord.patient_email || 's@a.com'} · {caseRecord.country || 'India'}
        </div>
      </div>

      {/* CARD 1: INITIAL CONSULTATION (Snapshot 1) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">
            INITIAL CONSULTATION
          </h2>
          <button
            onClick={() => setShowRequestInfoModal(true)}
            className="text-sm font-semibold text-blue-600 hover:underline cursor-pointer"
          >
            Request More Information
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          
          {/* Row 1 */}
          <div className="bg-[#f8fafc] rounded-xl p-4 border border-slate-200">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              PATIENT FOR
            </div>
            <div className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
              {caseRecord.patient_for || caseRecord.consultation_for || 'Myself (Default)'}
            </div>
          </div>

          <div className="bg-[#f8fafc] rounded-xl p-4 border border-slate-200">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              PHONE
            </div>
            <div className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
              {caseRecord.patient_phone || 'None provided'}
            </div>
          </div>

          {/* Row 2 (Pale Mint Tint) */}
          <div className="bg-[#eaf7ee] rounded-xl p-4 border border-emerald-200/90">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1.5">
              LOOKING FOR
            </div>
            <div className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
              {caseRecord.looking_for || caseRecord.support_type || 'Not sure, I need guidance'}
            </div>
          </div>

          <div className="bg-[#eaf7ee] rounded-xl p-4 border border-emerald-200/90">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1.5">
              AREA OF NEED
            </div>
            <div className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
              {caseRecord.healthcare_area || caseRecord.need || 'Eye Care'}
            </div>
          </div>

          {/* Row 3 (Full Width Situation) */}
          <div className="md:col-span-2 bg-[#f8fafc] rounded-xl p-4 border border-slate-200">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              SITUATION DESCRIBED BY PATIENT
            </div>
            <div className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
              &quot;{caseRecord.situation || caseRecord.situation_description || 'as'}&quot;
            </div>
          </div>

          {/* Row 4 */}
          <div className="bg-[#f8fafc] rounded-xl p-4 border border-slate-200">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              DIAGNOSED?
            </div>
            <div className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
              {caseRecord.diagnosed ||
                (caseRecord.has_diagnosis
                  ? `${caseRecord.has_diagnosis}${caseRecord.diagnosis ? ' — ' + caseRecord.diagnosis : ''}`
                  : 'Unsure — as')}
            </div>
          </div>

          <div className="bg-[#f8fafc] rounded-xl p-4 border border-slate-200">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              TREATMENT STATUS
            </div>
            <div className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
              {caseRecord.treatment_status || 'Not started treatment'}
            </div>
          </div>

          {/* Row 5 (Pale Mint Tint) */}
          <div className="bg-[#eaf7ee] rounded-xl p-4 border border-emerald-200/90">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1.5">
              OPEN TO CARE ABROAD?
            </div>
            <div className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
              {caseRecord.open_to_care_abroad || caseRecord.care_outside_country || 'Not sure'}
            </div>
          </div>

          <div className="bg-[#eaf7ee] rounded-xl p-4 border border-emerald-200/90">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1.5">
              PREFERRED LOCATION
            </div>
            <div className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
              {caseRecord.preferred_location || caseRecord.preferred_destination || 'West Africa'}
            </div>
          </div>

          {/* Row 6 */}
          <div className="bg-[#f8fafc] rounded-xl p-4 border border-slate-200">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              WHAT MATTERS MOST
            </div>
            <div className="text-sm sm:text-base font-bold text-slate-900 flex flex-wrap gap-1.5 leading-snug">
              <span className="inline-block">
                {Array.isArray(caseRecord.what_matters_most)
                  ? caseRecord.what_matters_most.join(', ')
                  : caseRecord.what_matters_most || 'Reputation'}
              </span>
            </div>
          </div>

          <div className="bg-[#f8fafc] rounded-xl p-4 border border-slate-200">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              DOCUMENTS SUBMITTED
            </div>
            <div className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
              {caseRecord.documents_submitted || 1} document — see the Documents card below
            </div>
          </div>

        </div>
      </div>

      {/* CARD 3: CASE REVIEW (Snapshot 2) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">
            CASE REVIEW
          </h2>
          <button
            onClick={() => setShowReviewModal(true)}
            className="text-sm font-semibold text-blue-600 hover:underline cursor-pointer"
          >
            {caseRecord.review_text ? 'Edit Review' : 'Submit Review'}
          </button>
        </div>

        {caseRecord.review_text ? (
          <div className="space-y-2 pt-1">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 leading-relaxed">
              {caseRecord.review_text}
            </div>
            <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                Clinical evaluation published by {caseRecord.coordinator_name || 'Sarah James'}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm font-medium text-slate-700 leading-relaxed pt-1">
            Not yet submitted. The patient won&apos;t see a case review, and hospital recommendations
            can&apos;t be added, until you submit one.
          </p>
        )}
      </div>

      {/* Active Workflow Stage Section */}
      <div className="space-y-4">
        {/* Workstation Content Component */}
        {activeWorkstationTab === 'Hospital Recommendation' && (
          <AdminHospitalRecommendations
            caseRecord={caseRecord}
            onUpdateCase={handleChildUpdateCase}
            showToast={showToast}
            onAdvanceStage={handleAdminSetStage}
          />
        )}

        {activeWorkstationTab === 'Medical Itinerary' && (
          <AdminMedicalItinerary
            caseRecord={caseRecord}
            onUpdateCase={handleChildUpdateCase}
            showToast={showToast}
            onAdvanceStage={handleAdminSetStage}
          />
        )}

        {activeWorkstationTab === 'Accommodation & Visa' && (
          <AdminAccommodationVisa
            caseRecord={caseRecord}
            onUpdateCase={handleChildUpdateCase}
            showToast={showToast}
            onAdvanceStage={handleAdminSetStage}
          />
        )}

        {activeWorkstationTab === 'Travel Preparation' && (
          <AdminTravelPreparation
            caseRecord={caseRecord}
            onUpdateCase={handleChildUpdateCase}
            showToast={showToast}
            onAdvanceStage={handleAdminSetStage}
          />
        )}

        {activeWorkstationTab === 'Treatment & Recovery' && (
          <AdminTreatmentRecovery
            caseRecord={caseRecord}
            onUpdateCase={handleChildUpdateCase}
            showToast={showToast}
            onAdvanceStage={handleAdminSetStage}
          />
        )}
      </div>

      {/* CARD 5: BILLING & PAYMENTS (Snapshot 2) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">
          BILLING &amp; PAYMENTS
        </h2>

        <div className="grid grid-cols-2 gap-4 max-w-sm">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-600">Paid</div>
            <div className="text-2xl font-bold text-emerald-700 mt-0.5">
              ${paidAmount}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-600">Outstanding</div>
            <div className="text-2xl font-bold text-red-600 mt-0.5">
              ${outstandingAmount}
            </div>
          </div>
        </div>

        {/* Invoice row item */}
        <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-4">
            <span className="text-slate-600 font-semibold w-16">Today</span>
            <span className="font-bold text-slate-900">HW Service Charge</span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <span className="font-bold text-slate-900">USD 300</span>
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                billingStatus === 'Paid'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              {billingStatus}
            </span>
            <button
              onClick={() => setShowReceiptModal(true)}
              className="text-sm font-semibold text-blue-600 hover:underline cursor-pointer"
            >
              View Receipt
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM 2-COLUMN SECTION (Snapshots 2 & 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* LEFT COLUMN: Case Summary, Documents, Internal Notes */}
        <div className="space-y-6">
          
          {/* CASE SUMMARY CARD (Snapshot 2 Bottom Left) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">
              CASE SUMMARY
            </h2>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  Status
                </label>
                <select
                  value={caseRecord.status}
                  onChange={async (e) => {
                    const next = e.target.value as any;
                    await updatePatientCase(caseRecord.id, { status: next });
                    setCaseRecord((p) => (p ? { ...p, status: next } : null));
                    showToast(`Status updated to ${next}.`);
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                >
                  <option value="New">New</option>
                  <option value="Under Review">Under Review</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  Coordinator
                </label>
                <select
                  value={caseRecord.coordinator_name || 'Sarah James'}
                  onChange={async (e) => {
                    const next = e.target.value;
                    await updatePatientCase(caseRecord.id, { coordinator_name: next });
                    setCaseRecord((p) => (p ? { ...p, coordinator_name: next } : null));
                    showToast(`Assigned to ${next}.`);
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                >
                  {DEFAULT_COORDINATORS.map((coord) => (
                    <option key={coord.id} value={coord.full_name}>
                      {coord.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  Priority
                </label>
                <select
                  value={caseRecord.priority || 'Normal'}
                  onChange={async (e) => {
                    const next = e.target.value as any;
                    await updatePatientCase(caseRecord.id, { priority: next });
                    setCaseRecord((p) => (p ? { ...p, priority: next } : null));
                    showToast(`Priority marked as ${next}.`);
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                >
                  <option value="Normal">Normal</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  Area of Need
                </label>
                <span className="font-bold text-slate-900 text-sm block pt-1.5">
                  {caseRecord.healthcare_area || caseRecord.need || 'Eye Care'}
                </span>
              </div>
            </div>
          </div>

          {/* DOCUMENTS CARD (Snapshot 3 Top Left) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">
              DOCUMENTS
            </h2>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-700" />
                  <span className="font-bold text-slate-900 text-sm">
                    {docName}
                  </span>
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    docStatus === 'Accepted'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : docStatus === 'Update Requested'
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {docStatus}
                </span>
              </div>

              {/* Action links exactly matching snapshot 3 */}
              <div className="flex items-center gap-4 pt-1 text-sm font-semibold text-blue-600">
                <button
                  onClick={() => setShowDocModal(true)}
                  className="hover:underline cursor-pointer"
                >
                  Open &amp; Review
                </button>
                <button
                  onClick={handleAcceptDoc}
                  className="hover:underline cursor-pointer"
                >
                  Accept
                </button>
                <button
                  onClick={handleRequestDocUpdate}
                  className="hover:underline cursor-pointer"
                >
                  Request Update
                </button>
              </div>
            </div>
          </div>

          {/* INTERNAL NOTES CARD (Snapshot 3 Bottom Left) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">
              INTERNAL NOTES
            </h2>

            {/* Notes List or "No notes yet." */}
            {notesList.length === 0 ? (
              <p className="text-sm font-medium text-slate-600 italic">No notes yet.</p>
            ) : (
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {notesList.map((note) => (
                  <div
                    key={note.id}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="font-bold text-slate-800">{note.author}</span>
                      <span className="font-medium">{note.date}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 leading-relaxed">{note.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Add Note textarea & button */}
            <div className="space-y-3 pt-1">
              <textarea
                rows={3}
                value={newNoteInput}
                onChange={(e) => setNewNoteInput(e.target.value)}
                placeholder="Add an internal note..."
                className="w-full p-3.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none shadow-2xs"
              />
              <button
                type="button"
                onClick={handleAddNote}
                disabled={!newNoteInput.trim()}
                className="bg-[#107c41] hover:bg-[#0e6b37] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
              >
                Add Note
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Tasks, Hospital Recommendations, Accommodations, Messages */}
        <div className="space-y-6">
          
          {/* TASKS CARD (Snapshot 2 Bottom Right) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">
              TASKS
            </h2>

            <div className="space-y-2">
              {tasksList.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleToggleTask(task.id)}
                  className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-100 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        task.status === 'resolved'
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {task.status === 'resolved' && <Check className="w-3 h-3" />}
                    </div>
                    <span
                      className={`text-xs sm:text-sm font-medium ${
                        task.status === 'resolved'
                          ? 'line-through text-slate-400'
                          : 'text-slate-800'
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      task.status === 'resolved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {task.status === 'resolved' ? 'Completed' : 'Open'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ACCOMMODATION OPTIONS CARD (Snapshot 3 Middle Right) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">
                ACCOMMODATION OPTIONS
              </h2>
              <button
                onClick={() => setShowAddAccomModal(true)}
                className="text-xs sm:text-sm font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                + Add
              </button>
            </div>

            {accommodationsList.length === 0 ? (
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                No accommodation options added yet.
              </p>
            ) : (
              <div className="space-y-2 pt-1">
                {accommodationsList.map((acc) => (
                  <div
                    key={acc.id}
                    className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{acc.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {acc.type} · {acc.location}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-700">{acc.pricePerNight}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MESSAGES CARD (Snapshot 3 Bottom Right) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">
              MESSAGES
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              No unread messages.
            </p>

            <div>
              <button
                onClick={() => setShowChatModal(true)}
                className="border border-emerald-600 text-emerald-700 hover:bg-emerald-50 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer transition-colors inline-flex items-center gap-1.5"
              >
                <span>Open Conversation</span>
                <span>→</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================= */}
      {/* MODAL: Request More Information */}
      {/* ========================================================= */}
      {showRequestInfoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Request More Information</h3>
              <button onClick={() => setShowRequestInfoModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm font-medium text-slate-700">
              Select or specify the medical or logistical details needed from {caseRecord.patient_name}:
            </p>

            <div className="flex flex-wrap gap-2 text-xs">
              {[
                'Recent ophthalmic / MRI scan',
                'Previous hospital referral summary',
                'Passport / Travel validity confirmation',
                'Preferred travel dates',
              ].map((template) => (
                <button
                  key={template}
                  type="button"
                  onClick={() => setRequestInfoText((prev) => (prev ? `${prev}\n• ${template}` : `• ${template}`))}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  + {template}
                </button>
              ))}
            </div>

            <textarea
              rows={4}
              value={requestInfoText}
              onChange={(e) => setRequestInfoText(e.target.value)}
              placeholder="Type information request to send to patient..."
              className="w-full p-3.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowRequestInfoModal(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={sendingRequestInfo || !requestInfoText.trim()}
                onClick={handleSendInfoRequest}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-2xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {sendingRequestInfo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Request to Patient
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: Submit Case Review */}
      {/* ========================================================= */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Doctor &amp; Specialist Case Review</h3>
              <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm font-medium text-slate-700">
              Provide clinical evaluation for {caseRecord.patient_name} ({caseRecord.need}). Submitting this review unlocks hospital recommendations.
            </p>

            <textarea
              rows={6}
              value={reviewInput}
              onChange={(e) => setReviewInput(e.target.value)}
              placeholder="e.g. Clinical assessment completed by senior specialist board. Patient is an optimal candidate for corneal collagen cross-linking / specialized ocular surgery abroad..."
              className="w-full p-3.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingReview || !reviewInput.trim()}
                onClick={handleSubmitReview}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-2xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {savingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Publish Clinical Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: View Receipt */}
      {/* ========================================================= */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Invoice</span>
                <h3 className="font-bold text-slate-900 text-base">Healing Wayz Service Charge</h3>
              </div>
              <button onClick={() => setShowReceiptModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Case Number:</span>
                <span className="font-bold text-slate-900">{caseRecord.case_number}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Patient:</span>
                <span className="font-bold text-slate-900">{caseRecord.patient_name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Description:</span>
                <span className="font-semibold text-slate-900">Initial Clinical Consultation &amp; Hospital Matching</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Status:</span>
                <span className={`font-bold ${billingStatus === 'Paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {billingStatus}
                </span>
              </div>
              <div className="flex justify-between py-2.5 text-base font-bold text-slate-900">
                <span>Total Amount:</span>
                <span>USD $300.00</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              {billingStatus === 'Outstanding' ? (
                <button
                  type="button"
                  onClick={handleMarkPaymentReceived}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer shadow-2xs"
                >
                  Record Payment (Mark Paid)
                </button>
              ) : (
                <div className="w-full text-center py-2.5 bg-emerald-50 text-emerald-800 text-sm font-bold rounded-xl border border-emerald-200">
                  Payment Confirmed &amp; Recorded
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: Document Preview */}
      {/* ========================================================= */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">{docName}</h3>
              </div>
              <button onClick={() => setShowDocModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 bg-slate-50 rounded-xl text-center space-y-2 border border-slate-200">
              <FileText className="w-12 h-12 text-slate-400 mx-auto" />
              <div className="text-base font-bold text-slate-900">Medical Document Scans</div>
              <div className="text-xs font-medium text-slate-600">
                Submitted by {caseRecord.patient_name} · Format: PNG · Size: 1.4 MB
              </div>
              <div className="text-sm font-bold text-emerald-700 pt-2">
                Status: {docStatus}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleRequestDocUpdate}
                className="px-3.5 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
              >
                Request Re-upload
              </button>
              <button
                type="button"
                onClick={() => {
                  handleAcceptDoc();
                  setShowDocModal(false);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl cursor-pointer shadow-2xs"
              >
                Accept &amp; Verify Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: Add Accommodation Option */}
      {/* ========================================================= */}
      {showAddAccomModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Add Accommodation Option</h3>
              <button onClick={() => setShowAddAccomModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  Hotel / Apartment Name
                </label>
                <input
                  type="text"
                  value={newAccomName}
                  onChange={(e) => setNewAccomName(e.target.value)}
                  placeholder="e.g. Radisson Blu Medical Suites"
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  Type &amp; Category
                </label>
                <input
                  type="text"
                  value={newAccomType}
                  onChange={(e) => setNewAccomType(e.target.value)}
                  placeholder="e.g. Serviced Apartment"
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  Price per Night
                </label>
                <input
                  type="text"
                  value={newAccomPrice}
                  onChange={(e) => setNewAccomPrice(e.target.value)}
                  placeholder="e.g. $85 / night"
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  Proximity / Location
                </label>
                <input
                  type="text"
                  value={newAccomLocation}
                  onChange={(e) => setNewAccomLocation(e.target.value)}
                  placeholder="e.g. 500m from Apollo Hospital"
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddAccomModal(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newAccomName.trim()}
                onClick={handleAddAccommodation}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl cursor-pointer disabled:opacity-50 shadow-2xs"
              >
                Add Option
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: Messages / Direct Conversation */}
      {/* ========================================================= */}
      {showChatModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Conversation with {caseRecord.patient_name}</h3>
                <span className="text-xs font-semibold text-slate-500">{caseRecord.case_number} · Direct Coordinator Channel</span>
              </div>
              <button onClick={() => setShowChatModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="h-60 overflow-y-auto space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-sm">
              {chatMessages.map((msg, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                    <span className="font-bold text-slate-800">{msg.sender}</span>
                    <span>{msg.time}</span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium leading-relaxed shadow-2xs">
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type message to patient..."
                className="flex-1 p-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
              />
              <button
                type="button"
                onClick={handleSendMessage}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl cursor-pointer shadow-2xs"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
