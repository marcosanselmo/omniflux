'use server';

import { requireAuth } from '@/lib/auth/session';
import { storageService } from '@/lib/storage/s3-storage';
import { ActionResponse } from '@/types/auth';
import { AttachmentStage } from '@prisma/client';

// ==============================================================================
// OMNIFLUX - SERVER ACTION DE UPLOAD DE ARQUIVOS E COMPROVANTES
// ==============================================================================

export interface UploadActionResult {
  fileKey: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  publicUrl: string;
  stage: AttachmentStage;
}

export async function uploadAttachmentAction(
  formData: FormData
): Promise<ActionResponse<UploadActionResult>> {
  try {
    // 1. Validação de sessão do usuário
    await requireAuth();

    const file = formData.get('file') as File | null;
    const ticketId = formData.get('ticketId') as string | null;
    const stageRaw = (formData.get('stage') as string | null) ?? 'EXECUCAO';

    if (!file || !(file instanceof File)) {
      return {
        success: false,
        error: 'Nenhum arquivo enviado para upload.',
      };
    }

    if (!ticketId) {
      return {
        success: false,
        error: 'O identificador do ticket associado é obrigatório.',
      };
    }

    const stage = Object.values(AttachmentStage).includes(stageRaw as AttachmentStage)
      ? (stageRaw as AttachmentStage)
      : AttachmentStage.EXECUCAO;

    // 2. Converte File para Buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // 3. Envia para o StorageService desacoplado
    const uploadResult = await storageService.uploadFile({
      ticketId,
      stage,
      fileName: file.name,
      fileBuffer,
      mimeType: file.type || 'application/octet-stream',
    });

    return {
      success: true,
      data: {
        ...uploadResult,
        stage,
      },
      message: 'Arquivo enviado com sucesso.',
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro inesperado durante o processamento do upload.';
    return {
      success: false,
      error: message,
    };
  }
}
