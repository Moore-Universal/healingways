'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FileText, Image as ImageIcon, Lightbulb, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { 
  getAllCasesForAdmin, 
  CaseDocument,
  PatientCase 
} from '@/app/lib/firebase/services';

interface DocumentItem {
  id: string;
  filename: string;
  type: 'pdf' | 'image';
  patientName: string;
  caseId: string;
  caseDbId: string;
  category: string;
  date: string;
  status: 'Uploaded' | 'Under Review' | 'Accepted';
}

export default function DocumentReviewPage() {
  const [pendingDocs, setPendingDocs] = useState<DocumentItem[]>([]);
  const [resolvedDocs, setResolvedDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const cases = await getAllCasesForAdmin();

      const pending: DocumentItem[] = [];
      const resolved: DocumentItem[] = [];

      cases.forEach((c) => {
        if (c.documents && c.documents.length > 0) {
          c.documents.forEach((d) => {
            const isImg = d.name.toLowerCase().endsWith('.png') || d.name.toLowerCase().endsWith('.jpg');
            pending.push({
              id: d.id,
              filename: d.name,
              type: isImg ? 'image' : 'pdf',
              patientName: c.patient_name || 'Patient',
              caseId: c.case_number,
              caseDbId: c.id,
              category: d.category || 'Medical Record',
              date: new Date(d.createdAt || d.date || Date.now()).toLocaleDateString(),
              status: 'Uploaded',
            });
          });
        }
      });

      setPendingDocs(pending);
      setResolvedDocs(resolved);
    } catch (err) {
      console.error('Error loading documents for review:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return (
    <div className="space-y-6 sm:space-y-8 font-sans max-w-7xl mx-auto w-full p-4 sm:p-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Clinical Document Review</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review uploaded patient imaging, pathology scans, and physician referral notes.
          </p>
        </div>
        <Link
          href="/admin"
          className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
        >
          ← Back to Admin Dashboard
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-16 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-6 h-6 text-blue-900 animate-spin mr-2" />
          <span className="text-xs sm:text-sm text-slate-500">Loading documents...</span>
        </div>
      ) : pendingDocs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs sm:text-sm">
          <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="font-semibold text-slate-700">No documents pending review</p>
          <p className="text-xs text-slate-400 mt-1">
            Documents submitted by patients through consultations will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {pendingDocs.map((doc) => {
              const FileIcon = doc.type === 'image' ? ImageIcon : FileText;
              return (
                <div
                  key={doc.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-emerald-600 shrink-0">
                          <FileIcon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-blue-900 truncate">{doc.filename}</h4>
                          <p className="text-[11px] text-slate-500">{doc.category} · {doc.date}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-100 rounded-md shrink-0">
                        {doc.status}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-600 border border-slate-100">
                      <p><strong className="text-slate-800">Patient:</strong> {doc.patientName}</p>
                      <p><strong className="text-slate-800">Case ID:</strong> {doc.caseId}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Ready for doctor review</span>
                    <Link
                      href={`/admin/cases/${doc.caseDbId}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                    >
                      <span>Open Case &amp; Review</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
