import api from '@/lib/api';
import type { FileAttachment } from '@/types';

type FileTarget = {
  activityId?: string;
  commentId?: string;
  stageChangeRequestId?: string;
  stageChangeCommentId?: string;
};

export const filesService = {
  /** Sube un archivo y lo adjunta al destino indicado. */
  upload: (file: File, target: FileTarget): Promise<FileAttachment> => {
    const form = new FormData();
    form.append('file', file);
    Object.entries(target).forEach(([k, v]) => {
      if (v) form.append(k, v);
    });
    return api.upload<FileAttachment>('/files', form);
  },

  /** Descarga (o previsualiza) un archivo protegido como object URL. */
  getObjectUrl: async (id: string): Promise<string> => {
    const blob = await api.getBlob(`/files/${id}`);
    return URL.createObjectURL(blob);
  },

  /** Fuerza la descarga del archivo con su nombre original. */
  download: async (id: string, fileName: string): Promise<void> => {
    const blob = await api.getBlob(`/files/${id}?download=true`);
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  },

  remove: (id: string): Promise<void> => api.delete(`/files/${id}`),
};
