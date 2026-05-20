'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { filesService } from '@/services';
import { useToast } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { FileAttachment } from '@/types';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageMime(mime: string) {
  return mime.startsWith('image/');
}

/** Carga la URL blob de un archivo protegido y la libera al desmontar. */
function useObjectUrl(fileId: string | null, enabled: boolean) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(() => !!fileId && enabled);

  useEffect(() => {
    if (!fileId || !enabled) return;
    let active = true;
    let created: string | null = null;
    filesService
      .getObjectUrl(fileId)
      .then((u) => {
        if (!active) {
          URL.revokeObjectURL(u);
          return;
        }
        created = u;
        setUrl(u);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      if (created) URL.revokeObjectURL(created);
    };
  }, [fileId, enabled]);

  return { url, loading };
}

function ImageThumb({
  file,
  onOpen,
}: {
  file: FileAttachment;
  onOpen: () => void;
}) {
  const { url, loading } = useObjectUrl(file.id, true);

  return (
    <button
      type="button"
      onClick={onOpen}
      title={`${file.originalName} (${formatBytes(file.size)})`}
      className="group relative w-24 h-24 rounded-lg overflow-hidden border border-accent-200 bg-accent-50 hover:border-primary-400 transition-colors"
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={file.originalName}
          className="w-full h-full object-cover"
        />
      )}
      <span className="absolute inset-x-0 bottom-0 px-1.5 py-1 bg-gradient-to-t from-black/70 to-transparent text-[10px] text-white truncate text-left opacity-0 group-hover:opacity-100 transition-opacity">
        {file.originalName}
      </span>
    </button>
  );
}

function DownloadChip({ file }: { file: FileAttachment }) {
  const { error } = useToast();
  const [busy, setBusy] = useState(false);

  const handleDownload = async () => {
    setBusy(true);
    try {
      await filesService.download(file.id, file.originalName);
    } catch {
      error('No se pudo descargar el archivo');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={busy}
      title={`Descargar ${file.originalName}`}
      className="inline-flex items-center gap-2 max-w-full px-3 py-1.5 bg-accent-50 hover:bg-accent-100 border border-accent-200 rounded-lg text-xs text-accent-700 transition-colors disabled:opacity-50"
    >
      <svg className="w-4 h-4 shrink-0 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
      </svg>
      <span className="truncate">{file.originalName}</span>
      <span className="text-accent-400 shrink-0">{formatBytes(file.size)}</span>
    </button>
  );
}

function Lightbox({
  file,
  onClose,
}: {
  file: FileAttachment;
  onClose: () => void;
}) {
  const { url, loading } = useObjectUrl(file.id, true);
  const { error } = useToast();
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await filesService.download(file.id, file.originalName);
    } catch {
      error('No se pudo descargar');
    } finally {
      setDownloading(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pt-safe pb-safe">
      <div
        className="absolute inset-0 bg-black/90"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative max-w-5xl w-full max-h-[90dvh] flex flex-col">
        <div className="flex items-center justify-between gap-3 mb-3 text-white">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{file.originalName}</p>
            <p className="text-xs text-white/70">{formatBytes(file.size)}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              title="Descargar"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Descargar
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Cerrar"
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Cerrar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0 flex items-center justify-center">
          {loading && (
            <div className="w-8 h-8 border-4 border-white/40 border-t-white rounded-full animate-spin" />
          )}
          {url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={file.originalName}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function AttachmentList({ files }: { files?: FileAttachment[] }) {
  const [preview, setPreview] = useState<FileAttachment | null>(null);

  if (!files || files.length === 0) return null;

  const images = files.filter((f) => isImageMime(f.mimeType));
  const others = files.filter((f) => !isImageMime(f.mimeType));

  return (
    <>
      {images.length > 0 && (
        <div className={cn('flex flex-wrap gap-2', others.length > 0 ? 'mt-2' : 'mt-2')}>
          {images.map((file) => (
            <ImageThumb
              key={file.id}
              file={file}
              onOpen={() => setPreview(file)}
            />
          ))}
        </div>
      )}
      {others.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {others.map((file) => (
            <DownloadChip key={file.id} file={file} />
          ))}
        </div>
      )}
      {preview && (
        <Lightbox file={preview} onClose={() => setPreview(null)} />
      )}
    </>
  );
}
