'use client';

import React, { useState } from 'react';
import { uploadAttachmentAction, UploadActionResult } from '@/server/actions/upload.actions';
import { AttachmentStage } from '@prisma/client';

interface FileUploaderProps {
  ticketId?: string;
  stage?: AttachmentStage;
  onUploaded: (result: UploadActionResult) => void;
  allowedTypesHint?: string;
}

export function FileUploader({
  ticketId = 'drafts',
  stage = AttachmentStage.EXECUCAO,
  onUploaded,
  allowedTypesHint = 'Imagens (JPG, PNG, WebP) ou Documentos (PDF) até 15MB',
}: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadActionResult | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('ticketId', ticketId);
      formData.append('stage', stage);

      const res = await uploadAttachmentAction(formData);

      if (!res.success) {
        setError(res.error);
        return;
      }

      setUploadedFile(res.data);
      onUploaded(res.data);
    } catch {
      setError('Falha de conexão ao enviar o arquivo.');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      {uploadedFile ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 truncate max-w-xs">
                {uploadedFile.fileName}
              </div>
              <div className="text-[11px] text-slate-500">
                {(uploadedFile.fileSize / 1024).toFixed(1)} KB • Comprovante anexado
              </div>
            </div>
          </div>

          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
            Pronto para Homologação
          </span>
        </div>
      ) : (
        <div>
          <label className="relative flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-[#2563EB] rounded-2xl p-6 bg-slate-50/50 hover:bg-white transition cursor-pointer group">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center mb-2 group-hover:scale-105 transition">
              {isUploading ? (
                <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              )}
            </div>

            <span className="text-xs font-bold text-slate-800 text-center">
              {isUploading ? 'Enviando comprovante para o storage...' : 'Clique para selecionar o comprovante'}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 text-center">
              {allowedTypesHint}
            </span>

            <input
              type="file"
              disabled={isUploading}
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </label>

          {error && (
            <p className="mt-2 text-xs font-semibold text-rose-600">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
