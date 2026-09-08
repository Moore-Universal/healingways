'use client';

import React, { useState, useRef } from 'react';
import { 
  FileText, 
  UploadCloud, 
  Plus, 
  X, 
  Download, 
  Eye, 
  Trash2, 
  Loader2, 
  Check, 
  FileCheck, 
  Paperclip,
  Sparkles,
  Info
} from 'lucide-react';
import { 
  PatientCase, 
  CaseDocument, 
  saveCaseDocument, 
  deleteCaseDocument 
} from '@/app/lib/firebase/services';

interface StageDocumentAttachmentProps {
  caseRecord: PatientCase;
  stage: string;
  title?: string;
  description?: string;
  onUpdateCase: (updates: Partial<PatientCase>) => void;
  showToast: (msg: string) => void;
  compact?: boolean;
}

export default function StageDocumentAttachment({
  caseRecord,
  stage,
  title = 'Supplementary Documents',
  description = 'Attach documents (clinical evaluations, quotations, itineraries, travel passes) to supplement the text provided to the patient.',
  onUpdateCase,
  showToast,
  compact = false,
}: StageDocumentAttachmentProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docName, setDocName] = useState('');
  const [docNotes, setDocNotes] = useState('');
  const [docCategory, setDocCategory] = useState(stage);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<CaseDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter documents that match this stage or category
  const attachedDocs = (caseRecord.documents || []).filter((d) => {
    const stageMatch = d.stage && d.stage.toLowerCase() === stage.toLowerCase();
    const categoryMatch = d.category && d.category.toLowerCase() === stage.toLowerCase();
    return stageMatch || categoryMatch;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!docName.trim()) {
        // Strip extension for clean editable name
        const cleanName = file.name.replace(/\.[^/.]+$/, '');
        setDocName(cleanName);
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !docName.trim()) {
      showToast('Please select a file or provide a document name.');
      return;
    }

    setUploading(true);
    try {
      let fileUrl = '';
      const fileName = docName.trim() ? (selectedFile ? `${docName.trim()}.${selectedFile.name.split('.').pop()}` : docName.trim()) : (selectedFile?.name || 'Document.pdf');
      const fileSize = selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : '1.4 MB';
      const fileType = selectedFile?.type || 'application/pdf';

      if (selectedFile) {
        // Convert to data URL for storage and instant download/preview
        fileUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
      }

      const newDoc = await saveCaseDocument({
        caseId: caseRecord.id,
        userId: caseRecord.user_id,
        name: fileName,
        fileSize,
        fileType,
        fileUrl,
        category: docCategory || stage,
        stage: stage,
        uploadedBy: 'admin',
        uploadedByName: caseRecord.coordinator_name || 'Care Coordinator',
        notes: docNotes.trim(),
      });

      // Update parent case in memory
      const existing = caseRecord.documents || [];
      const updatedDocs = [newDoc, ...existing.filter((d) => d.id !== newDoc.id)];
      onUpdateCase({
        documents: updatedDocs,
        documents_submitted: updatedDocs.length,
      });

      showToast(`Document "${fileName}" attached to ${stage}.`);
      setShowUploadModal(false);
      setSelectedFile(null);
      setDocName('');
      setDocNotes('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error attaching document.';
      showToast(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from this stage?`)) {
      return;
    }

    setDeletingId(docId);
    try {
      await deleteCaseDocument(caseRecord.id, docId);
      const existing = caseRecord.documents || [];
      const updatedDocs = existing.filter((d) => d.id !== docId);
      onUpdateCase({
        documents: updatedDocs,
        documents_submitted: updatedDocs.length,
      });
      showToast(`Document "${name}" removed.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting document.';
      showToast(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = (doc: CaseDocument) => {
    if (doc.fileUrl) {
      const a = document.createElement('a');
      a.href = doc.fileUrl;
      a.download = doc.name || 'document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      showToast('Document file is being prepared or is a reference document.');
    }
  };

  return (
    <div className={`bg-slate-50/70 border border-slate-200/80 rounded-2xl ${compact ? 'p-4' : 'p-5'} space-y-3.5`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {title}
            </h4>
            {attachedDocs.length > 0 && (
              <span className="text-[11px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                {attachedDocs.length} {attachedDocs.length === 1 ? 'file' : 'files'}
              </span>
            )}
          </div>
          {!compact && (
            <p className="text-xs text-slate-500 max-w-xl">
              {description}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setDocCategory(stage);
            setShowUploadModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-blue-600 border border-blue-200 hover:border-blue-300 font-bold text-xs rounded-xl transition-colors shadow-2xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Document</span>
        </button>
      </div>

      {/* Attached Documents List */}
      {attachedDocs.length === 0 ? (
        <div className="p-4 bg-white/70 border border-dashed border-slate-200 rounded-xl text-center space-y-1">
          <p className="text-xs font-medium text-slate-500">
            No supplementary documents attached to this stage yet.
          </p>
          <p className="text-[11px] text-slate-400">
            Click <strong className="text-blue-600 font-semibold">&ldquo;Add Document&rdquo;</strong> to attach quotations, diagnostic scans, brochures, or itineraries.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {attachedDocs.map((doc) => (
            <div
              key={doc.id}
              className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col justify-between space-y-2 hover:border-slate-300 transition-colors shadow-2xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-slate-900 truncate" title={doc.name}>
                      {doc.name}
                    </h5>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                      {doc.fileSize && <span>{doc.fileSize}</span>}
                      <span>•</span>
                      <span>{new Date(doc.createdAt || doc.date || Date.now()).toLocaleDateString()}</span>
                      {doc.uploadedBy === 'admin' && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                            Care Team
                          </span>
                        </>
                      )}
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
                  <button
                    type="button"
                    disabled={deletingId === doc.id}
                    onClick={() => handleDelete(doc.id, doc.name)}
                    title="Delete Document"
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {deletingId === doc.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Optional Supplementary Note */}
              {doc.notes && (
                <div className="p-2 bg-slate-50 rounded-lg text-[11px] text-slate-600 border border-slate-100 leading-relaxed">
                  <span className="font-semibold text-slate-700">Note: </span>
                  {doc.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODAL: ADD DOCUMENT */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Add Supplementary Document
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Attaching to <strong className="text-slate-700 font-semibold">{stage}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4 pt-1">
              {/* File Dropzone */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  Select File <span className="text-red-500">*</span>
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/70 hover:bg-blue-50/30 rounded-xl p-5 text-center cursor-pointer transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip"
                  />
                  <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  {selectedFile ? (
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-blue-700 truncate max-w-xs mx-auto">
                        {selectedFile.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Click to change
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-slate-700">
                        Click or drag document to upload
                      </p>
                      <p className="text-[11px] text-slate-400">
                        PDF, DOCX, PNG, JPG (up to 25MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Document Title */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  Document Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder={`e.g. ${stage} Package / Evaluation Report`}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
              </div>

              {/* Supplementary Notes */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  Supplementary Note for Patient (Optional)
                </label>
                <textarea
                  rows={3}
                  value={docNotes}
                  onChange={(e) => setDocNotes(e.target.value)}
                  placeholder="Explain what this document contains or next steps for the patient to review..."
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || (!selectedFile && !docName.trim())}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Attaching Document...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Attach Document</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DOCUMENT PREVIEW */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                <div className="truncate">
                  <h3 className="font-bold text-slate-900 text-sm truncate">
                    {previewDoc.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {previewDoc.category || stage} • Attached by {previewDoc.uploadedByName || 'Coordinator'}
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
                  <FileText className="w-12 h-12 text-blue-500 mx-auto" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{previewDoc.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {previewDoc.notes || 'Document verified and attached for patient care.'}
                    </p>
                  </div>
                  {previewDoc.fileUrl && (
                    <button
                      type="button"
                      onClick={() => handleDownload(previewDoc)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download File</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {previewDoc.notes && (
              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-slate-700">
                <span className="font-bold text-blue-900">Coordinator Notes: </span>
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
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
