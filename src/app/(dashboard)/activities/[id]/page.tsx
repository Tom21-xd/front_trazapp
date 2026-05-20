'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  activitiesService,
  stagesService,
  stageChangesService,
  commentsService,
  filesService,
} from '@/services';
import { useAuthContext } from '@/store/AuthContext';
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  Badge,
  Avatar,
  Modal,
  Textarea,
  Select,
  useToast,
  ConfirmModal,
} from '@/components/ui';
import {
  priorityColors,
  formatDateTime,
  relativeTime,
  cn,
} from '@/lib/utils';
import type {
  Activity,
  ActivityEvent,
  ActivityEventType,
  Stage,
  Comment,
  FileAttachment,
} from '@/types';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentList({ files }: { files?: FileAttachment[] }) {
  const { error } = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  if (!files || files.length === 0) return null;

  const handleDownload = async (file: FileAttachment) => {
    setBusy(file.id);
    try {
      await filesService.download(file.id, file.originalName);
    } catch {
      error('No se pudo descargar el archivo');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {files.map((file) => (
        <button
          key={file.id}
          type="button"
          onClick={() => handleDownload(file)}
          disabled={busy === file.id}
          title={`Descargar ${file.originalName}`}
          className="inline-flex items-center gap-2 max-w-full px-3 py-1.5 bg-accent-50 hover:bg-accent-100 border border-accent-200 rounded-lg text-xs text-accent-700 transition-colors disabled:opacity-50"
        >
          <svg className="w-4 h-4 shrink-0 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          <span className="truncate">{file.originalName}</span>
          <span className="text-accent-400 shrink-0">{formatBytes(file.size)}</span>
        </button>
      ))}
    </div>
  );
}

// === Timeline ===

const EVENT_META: Record<
  ActivityEventType,
  { color: string; bg: string; ring: string; icon: React.ReactNode; verb: string }
> = {
  CREATED: {
    color: 'text-primary-700',
    bg: 'bg-primary-100',
    ring: 'ring-primary-200',
    verb: 'creó la actividad',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  UPDATED: {
    color: 'text-accent-700',
    bg: 'bg-accent-100',
    ring: 'ring-accent-200',
    verb: 'actualizó la actividad',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  STAGE_CHANGED: {
    color: 'text-blue-700',
    bg: 'bg-blue-100',
    ring: 'ring-blue-200',
    verb: 'movió la actividad',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
      </svg>
    ),
  },
  STAGE_CHANGE_REQUESTED: {
    color: 'text-yellow-700',
    bg: 'bg-yellow-100',
    ring: 'ring-yellow-200',
    verb: 'solicitó cambio de etapa',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  STAGE_CHANGE_APPROVED: {
    color: 'text-green-700',
    bg: 'bg-green-100',
    ring: 'ring-green-200',
    verb: 'aprobó el cambio de etapa',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  STAGE_CHANGE_REJECTED: {
    color: 'text-red-700',
    bg: 'bg-red-100',
    ring: 'ring-red-200',
    verb: 'rechazó el cambio de etapa',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  ASSIGNED: {
    color: 'text-primary-700',
    bg: 'bg-primary-100',
    ring: 'ring-primary-200',
    verb: 'asignó a',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3M9 19a4 4 0 100-8 4 4 0 000 8zm0 0c-2.21 0-4 1.79-4 4h8c0-2.21-1.79-4-4-4z" />
      </svg>
    ),
  },
  UNASSIGNED: {
    color: 'text-accent-700',
    bg: 'bg-accent-100',
    ring: 'ring-accent-200',
    verb: 'retiró a',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6m12 0a8 8 0 11-16 0 8 8 0 0116 0z" />
      </svg>
    ),
  },
  COMMENT_ADDED: {
    color: 'text-violet-700',
    bg: 'bg-violet-100',
    ring: 'ring-violet-200',
    verb: 'comentó',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  FILE_UPLOADED: {
    color: 'text-amber-700',
    bg: 'bg-amber-100',
    ring: 'ring-amber-200',
    verb: 'subió un archivo',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
      </svg>
    ),
  },
};

function StageChip({
  stage,
}: {
  stage?: { id: string; name: string; color?: string | null } | null;
}) {
  if (!stage) return null;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white"
      style={{ backgroundColor: stage.color || '#9CA3AF' }}
    >
      {stage.name}
    </span>
  );
}

function EventLine({ ev }: { ev: ActivityEvent }) {
  const meta = EVENT_META[ev.type];
  const actorName = ev.actor?.name || 'Sistema';

  let body: React.ReactNode = null;
  switch (ev.type) {
    case 'STAGE_CHANGED':
    case 'STAGE_CHANGE_REQUESTED':
    case 'STAGE_CHANGE_APPROVED':
    case 'STAGE_CHANGE_REJECTED':
      body = (
        <span className="inline-flex items-center gap-1.5 flex-wrap">
          <StageChip stage={ev.fromStage} />
          <svg className="w-3 h-3 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <StageChip stage={ev.toStage} />
        </span>
      );
      break;
    case 'ASSIGNED':
    case 'UNASSIGNED':
      body = ev.targetUser ? (
        <span className="inline-flex items-center gap-2">
          <Avatar name={ev.targetUser.name} size="sm" />
          <span className="font-medium text-accent-900">{ev.targetUser.name}</span>
        </span>
      ) : null;
      break;
    case 'COMMENT_ADDED':
      body = ev.comment?.content ? (
        <span className="text-accent-700">
          «{ev.comment.content.length > 140
            ? `${ev.comment.content.slice(0, 140)}…`
            : ev.comment.content}»
        </span>
      ) : null;
      break;
    case 'FILE_UPLOADED':
      body = ev.file ? (
        <span className="inline-flex items-center gap-2 text-accent-700">
          <span className="font-medium text-accent-900 truncate max-w-xs">
            {ev.file.originalName}
          </span>
          <span className="text-xs text-accent-500">{formatBytes(ev.file.size)}</span>
        </span>
      ) : null;
      break;
    default:
      body = ev.note ? <span className="text-accent-700">{ev.note}</span> : null;
  }

  return (
    <li className="relative pl-10 pb-5 last:pb-0">
      {/* Línea vertical */}
      <span className="absolute left-3 top-7 bottom-0 w-px bg-accent-200" aria-hidden />
      {/* Icono */}
      <span
        className={cn(
          'absolute left-0 top-0 w-7 h-7 rounded-full ring-4 flex items-center justify-center',
          meta.bg,
          meta.color,
          meta.ring,
        )}
      >
        {meta.icon}
      </span>
      {/* Contenido */}
      <div className="space-y-0.5">
        <p className="text-sm text-accent-700 leading-snug">
          <span className="font-semibold text-accent-900">{actorName}</span>{' '}
          <span>{meta.verb}</span>
          {body && <> {body}</>}
        </p>
        {ev.type === 'STAGE_CHANGE_REQUESTED' && ev.note && (
          <p className="text-xs text-accent-500 italic">«{ev.note}»</p>
        )}
        {(ev.type === 'STAGE_CHANGE_APPROVED' || ev.type === 'STAGE_CHANGE_REJECTED') &&
          ev.note && (
            <p className="text-xs text-accent-500 italic">
              Comentario del revisor: «{ev.note}»
            </p>
          )}
        <p
          className="text-xs text-accent-400"
          title={formatDateTime(ev.createdAt)}
        >
          {relativeTime(ev.createdAt)} · {formatDateTime(ev.createdAt)}
        </p>
      </div>
    </li>
  );
}

function Timeline({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-accent-500 py-4">
        Aún no hay eventos registrados.
      </p>
    );
  }
  return (
    <ol className="space-y-0 relative">
      {events.map((ev) => (
        <EventLine key={ev.id} ev={ev} />
      ))}
    </ol>
  );
}

// === Page ===

interface DependencyRef {
  id: string;
  requiredActivity?: { id: string; title: string; currentStage?: Stage } | null;
  dependentActivity?: { id: string; title: string } | null;
}

interface StageHistoryEntry {
  id: string;
  enteredAt: string;
  exitedAt?: string | null;
  notes?: string | null;
  stage?: Stage | null;
}

type ActivityFull = Omit<Activity, 'dependsOn' | 'dependedBy'> & {
  stageHistory?: StageHistoryEntry[];
  dependsOn?: DependencyRef[];
  dependedBy?: DependencyRef[];
};

export default function ActivityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, can } = useAuthContext();
  const toast = useToast();
  const [activity, setActivity] = useState<ActivityFull | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStageChangeModal, setShowStageChangeModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [stageChangeForm, setStageChangeForm] = useState({ toStageId: '', description: '' });
  const [newComment, setNewComment] = useState('');
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const [uploadingActivityFiles, setUploadingActivityFiles] = useState(false);
  const [saving, setSaving] = useState(false);

  const activityId = params.id as string;

  const loadData = async () => {
    try {
      const [activityData, stagesData, commentsData, eventsData] = await Promise.all([
        activitiesService.getById(activityId),
        stagesService.getAll(),
        commentsService.getByActivity(activityId),
        activitiesService.getEvents(activityId).catch(() => [] as ActivityEvent[]),
      ]);
      setActivity(activityData as ActivityFull);
      setStages(stagesData);
      setComments(commentsData);
      setEvents(eventsData);
    } catch {
      toast.error('No se pudieron cargar los datos de la actividad');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId]);

  const handleStageChangeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await stageChangesService.create({
        activityId,
        toStageId: stageChangeForm.toStageId,
        description: stageChangeForm.description,
      });
      setShowStageChangeModal(false);
      setStageChangeForm({ toStageId: '', description: '' });
      toast.success('Solicitud de cambio de etapa enviada correctamente');
      await loadData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'No se pudo enviar la solicitud',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSaving(true);
    try {
      const created = await commentsService.create({
        content: newComment,
        activityId,
      });

      if (commentFiles.length > 0) {
        const results = await Promise.allSettled(
          commentFiles.map((f) =>
            filesService.upload(f, { commentId: created.id }),
          ),
        );
        const failed = results.filter((r) => r.status === 'rejected').length;
        if (failed > 0) {
          toast.warning(
            `Comentario creado, pero ${failed} archivo(s) no se pudieron subir`,
          );
        }
      }

      setNewComment('');
      setCommentFiles([]);
      await loadData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'No se pudo crear el comentario',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleActivityFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingActivityFiles(true);
    try {
      const results = await Promise.allSettled(
        Array.from(files).map((f) => filesService.upload(f, { activityId })),
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      const ok = results.length - failed;
      if (ok > 0) toast.success(`${ok} archivo(s) subido(s)`);
      if (failed > 0) toast.error(`${failed} archivo(s) no se pudieron subir`);
      await loadData();
    } finally {
      setUploadingActivityFiles(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      await filesService.remove(fileId);
      toast.success('Archivo eliminado');
      await loadData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'No se pudo eliminar el archivo',
      );
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await activitiesService.delete(activityId);
      toast.success('Actividad eliminada');
      router.push('/activities');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'No se pudo eliminar la actividad',
      );
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!activity) {
    return <div className="text-center py-12">Actividad no encontrada</div>;
  }

  const availableStages = stages.filter((s) => s.id !== activity.currentStageId);
  const assignedUsers =
    activity.assignments && activity.assignments.length > 0
      ? activity.assignments.map((a) => ({ id: a.id, user: a.user }))
      : (activity.assignedUsers || []).map((u) => ({ id: u.id, user: u }));

  // Archivos adjuntos directamente a la actividad (no a comentarios/solicitudes)
  const activityFiles = (activity.files || []).filter(
    (f) => f.activityId === activity.id,
  );

  const dependsOn = activity.dependsOn ?? [];
  const dependedBy = activity.dependedBy ?? [];

  const sortedStages = [...stages].sort((a, b) => a.order - b.order);
  const currentStageIndex = sortedStages.findIndex(
    (s) => s.id === activity.currentStageId,
  );

  // Derivar actor de creación y última actualización de los eventos
  const sortedEvents = [...events].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const createdEvent = sortedEvents.find((e) => e.type === 'CREATED');
  const lastEvent = sortedEvents[sortedEvents.length - 1];

  return (
    <div className="space-y-6">
      {/* HERO */}
      <div className="bg-white border border-accent-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Top bar: breadcrumb + acciones */}
        <div className="flex items-center justify-between gap-3 px-6 pt-4 pb-2">
          <nav className="flex items-center gap-1.5 text-xs text-accent-500 min-w-0">
            <Link href="/activities" className="hover:text-primary-600">
              Actividades
            </Link>
            <svg className="w-3 h-3 text-accent-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {activity.project && (
              <>
                <Link
                  href={`/projects/${activity.projectId}`}
                  className="hover:text-primary-600 truncate max-w-[12rem]"
                >
                  {activity.project.name}
                </Link>
                <svg className="w-3 h-3 text-accent-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
            <span className="text-accent-700 truncate">{activity.title}</span>
          </nav>
          <div className="flex items-center gap-2 shrink-0">
            {can('activity:delete') && (
              <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                Eliminar
              </Button>
            )}
          </div>
        </div>

        {/* Title + meta */}
        <div className="px-6 pb-5">
          <h1 className="text-2xl lg:text-3xl font-bold text-accent-900 wrap-break-word leading-tight">
            {activity.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-sm text-accent-600">
            <Badge className={priorityColors[activity.priority]} size="sm">
              {activity.priority}
            </Badge>
            {activity.dueDate && (
              <span className="inline-flex items-center gap-1.5">
                <svg className="w-4 h-4 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Vence {formatDateTime(activity.dueDate)}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <svg className="w-4 h-4 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-5.13a4 4 0 11-8 0 4 4 0 018 0zM21 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              {assignedUsers.length === 0
                ? 'Sin asignar'
                : assignedUsers.length === 1
                  ? '1 asignado'
                  : `${assignedUsers.length} asignados`}
            </span>
            <span
              className="inline-flex items-center gap-1.5"
              title={formatDateTime(activity.createdAt)}
            >
              <svg className="w-4 h-4 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Creada {relativeTime(activity.createdAt)}
              {createdEvent?.actor && (
                <span className="text-accent-500">
                  {' '}por <span className="font-medium text-accent-700">{createdEvent.actor.name}</span>
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Stepper de etapas */}
        {sortedStages.length > 0 && (
          <div className="px-6 pb-5 pt-4 border-t border-accent-100 bg-accent-50/40">
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-xs font-semibold tracking-wider uppercase text-accent-500">
                Flujo
              </p>
              {can('stagechange:create') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowStageChangeModal(true)}
                >
                  Solicitar cambio
                </Button>
              )}
            </div>
            <ol className="flex items-stretch gap-1 overflow-x-auto pb-1">
              {sortedStages.map((s, idx) => {
                const isCurrent = s.id === activity.currentStageId;
                const isPast = idx < currentStageIndex;
                return (
                  <li
                    key={s.id}
                    className={cn(
                      'flex-1 min-w-[7rem] flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                      isCurrent
                        ? 'ring-2 ring-offset-1'
                        : isPast
                          ? 'bg-white border border-accent-200'
                          : 'bg-white border border-dashed border-accent-200 opacity-70',
                    )}
                    style={
                      isCurrent
                        ? {
                            backgroundColor: s.color || '#9CA3AF',
                            color: '#fff',
                          }
                        : undefined
                    }
                  >
                    <span
                      className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0',
                        isCurrent
                          ? 'bg-white/30 text-white'
                          : isPast
                            ? 'bg-primary-100 text-primary-700'
                            : 'bg-accent-100 text-accent-500',
                      )}
                    >
                      {isPast ? (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        idx + 1
                      )}
                    </span>
                    <span className="font-medium truncate">{s.name}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Descripción */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-accent-900">Descripción</h2>
            </CardHeader>
            <CardContent>
              {activity.description ? (
                <p className="text-accent-800 whitespace-pre-wrap wrap-break-word leading-relaxed">
                  {activity.description}
                </p>
              ) : (
                <div className="border-2 border-dashed border-accent-200 rounded-lg p-6 text-center">
                  <svg className="w-8 h-8 text-accent-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm text-accent-500">
                    Sin descripción. Agrega contexto, criterios o pasos para que
                    cualquier persona que reciba la actividad pueda continuarla.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comentarios */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-accent-900">
                Comentarios ({comments.length})
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              {comments.length === 0 && (
                <p className="text-sm text-accent-500">Aún no hay comentarios.</p>
              )}
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar name={comment.user?.name || 'U'} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-accent-900">
                        {comment.user?.name}
                      </span>
                      <span className="text-xs text-accent-400">
                        {formatDateTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-accent-700 whitespace-pre-wrap wrap-break-word">
                      {comment.content}
                    </p>
                    <AttachmentList files={comment.files} />
                  </div>
                </div>
              ))}

              {can('comment:create') && (
                <form
                  onSubmit={handleAddComment}
                  className="flex gap-3 pt-4 border-t border-accent-200"
                >
                  <Avatar name={user?.name || 'U'} size="sm" />
                  <div className="flex-1 min-w-0">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Escribe un comentario..."
                      rows={2}
                    />

                    {commentFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {commentFiles.map((f, i) => (
                          <span
                            key={`${f.name}-${i}`}
                            className="inline-flex items-center gap-2 px-2.5 py-1 bg-primary-50 border border-primary-200 rounded-lg text-xs text-primary-700"
                          >
                            <span className="truncate max-w-40">{f.name}</span>
                            <button
                              type="button"
                              aria-label={`Quitar ${f.name}`}
                              onClick={() =>
                                setCommentFiles((prev) =>
                                  prev.filter((_, idx) => idx !== i),
                                )
                              }
                              className="text-primary-500 hover:text-primary-800"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2">
                      {can('file:upload') ? (
                        <label className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-accent-600 bg-accent-50 hover:bg-accent-100 border border-accent-200 rounded-lg cursor-pointer transition-colors w-fit">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          Adjuntar
                          <input
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              const list = e.target.files;
                              if (list) setCommentFiles((prev) => [...prev, ...Array.from(list)]);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      ) : (
                        <span />
                      )}
                      <Button
                        type="submit"
                        size="sm"
                        loading={saving}
                        disabled={!newComment.trim()}
                      >
                        Comentar
                      </Button>
                    </div>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Adjuntos directos */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-accent-900">
                  Adjuntos ({activityFiles.length})
                </h2>
                {can('file:upload') && (
                  <label
                    className={cn(
                      'inline-flex items-center gap-2 px-3 py-1.5 text-sm text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg cursor-pointer transition-colors',
                      uploadingActivityFiles && 'opacity-60 pointer-events-none',
                    )}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Subir archivo
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        handleActivityFileUpload(e.target.files);
                        e.target.value = '';
                      }}
                    />
                  </label>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {activityFiles.length === 0 ? (
                <p className="text-sm text-accent-500">
                  Sin archivos adjuntos. Sube documentos, evidencias o planos que
                  acompañen esta actividad.
                </p>
              ) : (
                <ul className="divide-y divide-accent-100">
                  {activityFiles.map((file) => (
                    <li key={file.id} className="py-2 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-accent-50 flex items-center justify-center text-accent-500 shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <button
                        type="button"
                        onClick={() => filesService.download(file.id, file.originalName)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="text-sm font-medium text-accent-900 truncate hover:text-primary-700">
                          {file.originalName}
                        </p>
                        <p className="text-xs text-accent-500">
                          {formatBytes(file.size)} · {relativeTime(file.createdAt)}
                        </p>
                      </button>
                      {(file.uploadedById === user?.id
                        ? can('file:delete:own') || can('file:delete:any')
                        : can('file:delete:any')) && (
                        <button
                          type="button"
                          onClick={() => handleDeleteFile(file.id)}
                          className="text-accent-400 hover:text-red-600 p-1"
                          title="Eliminar archivo"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a2 2 0 012-2h2a2 2 0 012 2v3" />
                          </svg>
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Trazabilidad */}
          <Card>
            <CardHeader>
              <div>
                <h2 className="text-lg font-semibold text-accent-900">
                  Trazabilidad
                </h2>
                <p className="text-xs text-accent-500 mt-0.5">
                  Quién hizo qué y cuándo. Útil cuando una actividad cambia de
                  manos.
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <Timeline events={events} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-0 divide-y divide-accent-100">
              {/* Asignados */}
              <div className="p-4">
                <p className="text-xs font-semibold tracking-wider uppercase text-accent-500 mb-3">
                  Asignados ({assignedUsers.length})
                </p>
                {assignedUsers.length > 0 ? (
                  <div className="space-y-2">
                    {assignedUsers.map((a) => (
                      <div key={a.id} className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={a.user?.name || 'U'} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-accent-900 truncate">
                            {a.user?.name}
                          </p>
                          <p className="text-xs text-accent-500 truncate">
                            {a.user?.email}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-accent-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Sin asignar
                  </div>
                )}
              </div>

              {/* Etiquetas */}
              {activity.tags && activity.tags.length > 0 && (
                <div className="p-4">
                  <p className="text-xs font-semibold tracking-wider uppercase text-accent-500 mb-3">
                    Etiquetas
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {activity.tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        size="sm"
                        style={{
                          backgroundColor: tag.color || '#9CA3AF',
                          color: '#fff',
                        }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Dependencias */}
              {(dependsOn.length > 0 || dependedBy.length > 0) && (
                <div className="p-4 space-y-3">
                  <p className="text-xs font-semibold tracking-wider uppercase text-accent-500">
                    Dependencias
                  </p>
                  {dependsOn.length > 0 && (
                    <div>
                      <p className="text-xs text-accent-500 mb-1">Depende de</p>
                      <ul className="space-y-1">
                        {dependsOn.map((d) =>
                          d.requiredActivity ? (
                            <li key={d.id}>
                              <Link
                                href={`/activities/${d.requiredActivity.id}`}
                                className="inline-flex items-center gap-1.5 text-sm text-primary-700 hover:text-primary-800 truncate"
                              >
                                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                <span className="truncate">{d.requiredActivity.title}</span>
                              </Link>
                            </li>
                          ) : null,
                        )}
                      </ul>
                    </div>
                  )}
                  {dependedBy.length > 0 && (
                    <div>
                      <p className="text-xs text-accent-500 mb-1">Bloquea a</p>
                      <ul className="space-y-1">
                        {dependedBy.map((d) =>
                          d.dependentActivity ? (
                            <li key={d.id}>
                              <Link
                                href={`/activities/${d.dependentActivity.id}`}
                                className="inline-flex items-center gap-1.5 text-sm text-primary-700 hover:text-primary-800 truncate"
                              >
                                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                <span className="truncate">{d.dependentActivity.title}</span>
                              </Link>
                            </li>
                          ) : null,
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Metadatos */}
              <div className="p-4 space-y-3">
                <p className="text-xs font-semibold tracking-wider uppercase text-accent-500">
                  Trazabilidad rápida
                </p>
                <div className="flex items-start gap-2.5">
                  {createdEvent?.actor ? (
                    <Avatar name={createdEvent.actor.name} size="sm" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-accent-100" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-accent-500">Creada</p>
                    <p className="text-sm text-accent-900 truncate">
                      {createdEvent?.actor?.name ?? 'Sistema'}
                    </p>
                    <p
                      className="text-xs text-accent-500"
                      title={formatDateTime(activity.createdAt)}
                    >
                      {relativeTime(activity.createdAt)}
                    </p>
                  </div>
                </div>
                {lastEvent && lastEvent.id !== createdEvent?.id && (
                  <div className="flex items-start gap-2.5">
                    {lastEvent.actor ? (
                      <Avatar name={lastEvent.actor.name} size="sm" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-accent-100" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-accent-500">Última actividad</p>
                      <p className="text-sm text-accent-900 truncate">
                        {lastEvent.actor?.name ?? 'Sistema'}
                      </p>
                      <p
                        className="text-xs text-accent-500"
                        title={formatDateTime(lastEvent.createdAt)}
                      >
                        {relativeTime(lastEvent.createdAt)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={showStageChangeModal}
        onClose={() => setShowStageChangeModal(false)}
        title="Solicitar cambio de etapa"
        subtitle="Un supervisor revisará tu solicitud antes de mover la actividad"
        size="lg"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        }
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setShowStageChangeModal(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="stage-change-request-form"
              loading={saving}
              disabled={!stageChangeForm.toStageId || !stageChangeForm.description.trim()}
            >
              Enviar solicitud
            </Button>
          </>
        }
      >
        <form
          id="stage-change-request-form"
          onSubmit={handleStageChangeRequest}
          className="space-y-6"
        >
          <section className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold tracking-wider uppercase text-accent-500">
                Destino
              </h3>
              <p className="text-xs text-accent-400 mt-0.5">
                Etapa a la que quieres mover esta actividad
              </p>
            </div>
            <Select
              id="toStage"
              label="Nueva etapa"
              value={stageChangeForm.toStageId}
              onChange={(e) =>
                setStageChangeForm({ ...stageChangeForm, toStageId: e.target.value })
              }
              options={availableStages.map((s) => ({ value: s.id, label: s.name }))}
              placeholder="Selecciona una etapa"
              required
            />
          </section>

          <div className="h-px bg-accent-100" />

          <section className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold tracking-wider uppercase text-accent-500">
                Justificación
              </h3>
              <p className="text-xs text-accent-400 mt-0.5">
                Información para que el revisor pueda decidir
              </p>
            </div>
            <Textarea
              id="description"
              label="Motivo del cambio"
              value={stageChangeForm.description}
              onChange={(e) =>
                setStageChangeForm({ ...stageChangeForm, description: e.target.value })
              }
              placeholder="Avance, evidencia o pasos completados..."
              rows={5}
              required
            />
          </section>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Eliminar actividad"
        message="Esta acción no se puede deshacer. ¿Deseas eliminar esta actividad?"
        confirmText="Eliminar"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
