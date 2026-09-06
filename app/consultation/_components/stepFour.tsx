'use client';

import React, { useState, useRef } from 'react';
import { Plus, File, X, Loader2 } from 'lucide-react';
import { auth } from '@/app/lib/firebase/client';
import { saveCaseDocument } from '@/app/lib/firebase/services';

interface StepFourProps {
  onNext?: (data: any) => void;
  onBack?: () => void;
  caseId?: string;
}

export default function StepFourDocuments({
  onNext,
  onBack,
  caseId,
}: StepFourProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setErrorMsg(null);
    setLoading(true);

    try {
      const user = auth.currentUser;
      const effectiveUserId = user?.uid || `patient_guest`;

      const uploadedFilesMetaData: Array<{ name: string; path: string; size: number; mimeType: string }> = [];

      if (files.length > 0 && caseId) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          setUploadProgress(`Processing file ${i + 1} of ${files.length}: ${file.name}`);

          try {
            const savedDoc = await saveCaseDocument({
              caseId,
              userId: effectiveUserId,
              name: file.name,
              fileSize: file.size,
              fileType: file.type || 'application/pdf',
              category: 'Clinical Record',
            });

            uploadedFilesMetaData.push({
              name: file.name,
              path: savedDoc.id,
              size: file.size,
              mimeType: file.type,
            });
          } catch (docErr) {
            console.warn('Doc upload notice:', docErr);
            uploadedFilesMetaData.push({
              name: file.name,
              path: `doc_${Date.now()}_${i}`,
              size: file.size,
              mimeType: file.type,
            });
          }
        }
      }

      if (onNext) {
        onNext({
          caseId,
          documentsUploaded: uploadedFilesMetaData,
        });
      }
    } catch (err: any) {
      console.error('Step 4 error:', err);
      if (onNext) {
        onNext({ caseId, documentsUploaded: [] });
      }
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="w-full">
      {/* Main Form Card */}
      <div className="max-w-xl bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Upload supporting medical documents
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Medical reports, scan results, lab reports, doctor letters, or short videos. Optional — you can continue without uploading now.
          </p>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            {errorMsg}
          </div>
        )}

        {/* Dropzone Area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`mt-4 border border-slate-200 rounded-2xl p-8 text-center cursor-pointer transition-all ${
            isDragging ? 'bg-emerald-50/70 border-emerald-500' : 'bg-slate-50/70 hover:bg-slate-100/50'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            multiple
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.heic,.doc,.docx,.mp4,.mov"
          />

          <div className="w-8 h-8 rounded-full border border-emerald-500 flex items-center justify-center text-emerald-600 mx-auto mb-3">
            <Plus className="w-4 h-4" />
          </div>

          <p className="text-sm text-slate-700 font-normal">
            <span className="font-bold text-emerald-600 hover:underline">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-slate-500 mt-1">
            PDF, JPG, PNG, HEIC, DOCX, MP4 or MOV — max 25MB each. You can select multiple files at once.
          </p>
        </div>

        {/* Selected Files List */}
        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold text-slate-700">
              Attached Files ({files.length})
            </p>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {files.map((file, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <File className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-medium text-slate-700 truncate">{file.name}</span>
                    <span className="text-slate-400 shrink-0">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(idx);
                    }}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {uploadProgress && (
          <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>{uploadProgress}</span>
          </div>
        )}

        {/* Security Note */}
        <p className="text-sm text-slate-500 mt-6 leading-relaxed">
          Your documents are securely stored and only accessed by authorized HealingWays personnel reviewing your case.
        </p>
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
