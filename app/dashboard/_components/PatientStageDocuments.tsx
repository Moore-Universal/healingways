'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  X, 
  Paperclip
} from 'lucide-react';
import { PatientCase, CaseDocument } from '@/app/lib/firebase/services';

interface PatientStageDocumentsProps {
  caseRecord: PatientCase | null;
  stage: string;
  title?: string;
  description?: string;
}

export default function PatientStageDocuments({
  caseRecord,
  stage,
  title = 'Supplementary Documents',
  description = 'Official documents, quotes, and reports provided by your clinical care coordinator to supplement this stage.',
}: PatientStageDocumentsProps) {
  const [previewDoc, setPreviewDoc] = useState<CaseDocument | null>(null);

  if (!caseRecord) return null;

  // Filter documents attached to this stage or category
  const attachedDocs = (caseRecord.documents || []).filter((d) => {
    const stageMatch = d.stage && d.stage.toLowerCase() === stage.toLowerCase();
    const categoryMatch = d.category && d.category.toLowerCase() === stage.toLowerCase();
    return stageMatch || categoryMatch;
  });

  if (attachedDocs.length === 0) {
    return null;
  }

  const handleDownload = (doc: CaseDocument) => {
    if (doc.fileUrl) {
      const a = document.createElement('a');
      a.href = doc.fileUrl;
      a.download = doc.name || 'document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-3 mt-4">
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {title}
            </h4>
            <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              {attachedDocs.length} {attachedDocs.length === 1 ? 'file' : 'files'}
            </span>
          </div>
          {description && (
            <p className="text-xs text-slate-500">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {attachedDocs.map((doc) => (
          <div
            key={doc.id}
            className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col justify-between space-y-2 hover:border-slate-300 transition-colors shadow-2xs"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-slate-900 truncate" title={doc.name}>
                    {doc.name}
                  </h5>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                    {doc.fileSize && <span>{doc.fileSize}</span>}
                    <span>•</span>
                    <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                      Care Team Verified
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {doc.fileUrl && (
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(doc)}
                    title="Preview Document"
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                )}
                {doc.fileUrl && (
                  <button
                    type="button"
                    onClick={() => handleDownload(doc)}
                    title="Download File"
                    className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Supplementary note */}
            {doc.notes && (
              <div className="p-2 bg-slate-50 rounded-lg text-[11px] text-slate-600 border border-slate-100 leading-relaxed">
                <span className="font-semibold text-slate-700">Coordinator Note: </span>
                {doc.notes}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="truncate">
                  <h3 className="font-bold text-slate-900 text-sm truncate">
                    {previewDoc.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {previewDoc.category || stage} • Provided by {previewDoc.uploadedByName || 'Care Coordinator'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Content View */}
            <div className="flex-1 overflow-auto rounded-xl bg-slate-50 p-4 border border-slate-200 min-h-[300px] flex items-center justify-center">
              {previewDoc.fileType?.startsWith('image/') && previewDoc.fileUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewDoc.fileUrl}
                  alt={previewDoc.name}
                  className="max-h-[500px] object-contain rounded-lg shadow-sm"
                />
              ) : previewDoc.fileUrl && previewDoc.fileType?.includes('pdf') ? (
                <iframe
                  src={previewDoc.fileUrl}
                  title={previewDoc.name}
                  className="w-full h-[500px] rounded-lg border border-slate-200"
                />
              ) : (
                <div className="text-center space-y-3 p-6">
                  <FileText className="w-12 h-12 text-emerald-600 mx-auto" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{previewDoc.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {previewDoc.notes || 'Official clinical document verified by your coordinator.'}
                    </p>
                  </div>
                  {previewDoc.fileUrl && (
                    <button
                      type="button"
                      onClick={() => handleDownload(previewDoc)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download File</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {previewDoc.notes && (
              <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl text-xs text-slate-700">
                <span className="font-bold text-emerald-900">Coordinator Notes: </span>
                {previewDoc.notes}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Close Preview
              </button>
              {previewDoc.fileUrl && (
                <button
                  type="button"
                  onClick={() => handleDownload(previewDoc)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
