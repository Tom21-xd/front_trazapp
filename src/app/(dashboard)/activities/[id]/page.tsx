'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  activitiesService,
  stagesService,
  stageChangesService,
  commentsService,
  filesService,
  usersService,
  tagsService,
} from '@/services';
import { useAuthContext } from '@/store/AuthContext';
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  Badge,
  Avatar,
  Input,
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
import { Priority } from '@/types';
import { AttachmentList } from '@/components/AttachmentList';
import type {
  Activity,
  ActivityEvent,
  ActivityEventType,
  Stage,
  Comment,
  User,
  Tag,
} from '@/types';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value).replace(/"/g, '""');
  return `"${s}"`;
}

function eventsToCsv(activityTitle: string, events: ActivityEvent[]): string {
  const headers = [
    'Fecha',
    'Tipo',
    'Actor',
    'Objetivo',
    'Etapa origen',
    'Etapa destino',
    'Solicitud',
    'Detalle',
  ];
  // BOM (﻿) para que Excel detecte UTF-8 correctamente con tildes
  const lines = ['﻿' + headers.map(csvCell).join(',')];
  // Cronológico: del más antiguo al más reciente
  const ordered = [...events].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  for (const ev of ordered) {
    let detail = ev.note ?? '';
    if (ev.type === 'COMMENT_ADDED' || ev.type === 'COMMENT_EDITED') {
      detail = ev.comment?.content ?? detail;
    } else if (ev.type === 'FILE_UPLOADED') {
      detail = ev.file?.originalName ?? detail;
    }
    lines.push(
      [
        new Date(ev.createdAt).toISOString(),
        ev.type,
        ev.actor?.name ?? '',
        ev.targetUser?.name ?? '',
        ev.fromStage?.name ?? '',
        ev.toStage?.name ?? '',
        ev.stageChangeRequest?.id ?? '',
        detail,
      ]
        .map(csvCell)
        .join(','),
    );
  }
  // Cabecera de contexto al inicio
  const header = `# Trazabilidad de actividad: ${activityTitle.replace(/[\r\n]+/g, ' ')}`;
  return [header, '', ...lines].join('\n');
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
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
  STAGE_CHANGE_CANCELLED: {
    color: 'text-accent-600',
    bg: 'bg-accent-100',
    ring: 'ring-accent-200',
    verb: 'canceló la solicitud',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
  COMMENT_EDITED: {
    color: 'text-violet-700',
    bg: 'bg-violet-50',
    ring: 'ring-violet-200',
    verb: 'editó un comentario',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  COMMENT_DELETED: {
    color: 'text-red-700',
    bg: 'bg-red-50',
    ring: 'ring-red-200',
    verb: 'eliminó un comentario',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a2 2 0 012-2h2a2 2 0 012 2v3" />
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
  FILE_DELETED: {
    color: 'text-red-700',
    bg: 'bg-red-50',
    ring: 'ring-red-200',
    verb: 'eliminó un archivo',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a2 2 0 012-2h2a2 2 0 012 2v3" />
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
    case 'COMMENT_EDITED': {
      const snippet = ev.comment?.content ?? ev.note ?? '';
      body = snippet ? (
        <span className="text-accent-700">
          «{snippet.length > 140 ? `${snippet.slice(0, 140)}…` : snippet}»
        </span>
      ) : null;
      break;
    }
    case 'COMMENT_DELETED':
      body = ev.note ? (
        <span className="text-accent-500 italic line-through">
          «{ev.note.length > 140 ? `${ev.note.slice(0, 140)}…` : ev.note}»
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
    case 'FILE_DELETED':
      body = ev.note ? (
        <span className="text-accent-700 line-through truncate max-w-xs inline-block align-bottom">
          {ev.note}
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

type TimelineFilter = 'all' | 'stage' | 'people' | 'discussion' | 'changes';

const FILTER_MATCH: Record<TimelineFilter, (t: ActivityEventType) => boolean> = {
  all: () => true,
  stage: (t) =>
    t === 'STAGE_CHANGED' ||
    t === 'STAGE_CHANGE_REQUESTED' ||
    t === 'STAGE_CHANGE_APPROVED' ||
    t === 'STAGE_CHANGE_REJECTED' ||
    t === 'STAGE_CHANGE_CANCELLED',
  people: (t) => t === 'ASSIGNED' || t === 'UNASSIGNED',
  discussion: (t) =>
    t === 'COMMENT_ADDED' || t === 'COMMENT_EDITED' || t === 'COMMENT_DELETED',
  changes: (t) =>
    t === 'CREATED' ||
    t === 'UPDATED' ||
    t === 'FILE_UPLOADED' ||
    t === 'FILE_DELETED',
};

const FILTER_LABELS: Record<TimelineFilter, string> = {
  all: 'Todo',
  stage: 'Etapas',
  people: 'Asignaciones',
  discussion: 'Comentarios',
  changes: 'Cambios y archivos',
};

function Timeline({ events }: { events: ActivityEvent[] }) {
  const [filter, setFilter] = useState<TimelineFilter>('all');

  const filtered = events.filter((e) => FILTER_MATCH[filter](e.type));
  const filterKeys = Object.keys(FILTER_LABELS) as TimelineFilter[];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {filterKeys.map((key) => {
          const count =
            key === 'all'
              ? events.length
              : events.filter((e) => FILTER_MATCH[key](e.type)).length;
          const active = filter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                active
                  ? 'bg-primary-600 text-white'
                  : 'bg-accent-100 text-accent-700 hover:bg-accent-200',
              )}
            >
              {FILTER_LABELS[key]}
              <span
                className={cn(
                  'inline-flex items-center justify-center text-[10px] font-semibold px-1.5 rounded-full min-w-5',
                  active ? 'bg-white/25 text-white' : 'bg-white text-accent-600',
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-accent-500 py-4">
          {events.length === 0
            ? 'Aún no hay eventos registrados.'
            : 'No hay eventos de este tipo.'}
        </p>
      ) : (
        <ol className="space-y-0 relative">
          {filtered.map((ev) => (
            <EventLine key={ev.id} ev={ev} />
          ))}
        </ol>
      )}
    </div>
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
  stageChangeRequests?: ActivityStageChangeRequest[];
};

interface ActivityStageChangeRequest {
  id: string;
  status: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'CANCELADO';
  description: string;
  reviewComment?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  fromStage?: { id: string; name: string; color?: string | null } | null;
  toStage?: { id: string; name: string; color?: string | null } | null;
  requestedBy?: { id: string; name: string; email: string; avatar?: string } | null;
  reviewedBy?: { id: string; name: string; email: string } | null;
}

export default function ActivityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, can } = useAuthContext();
  const toast = useToast();
  const [activity, setActivity] = useState<ActivityFull | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStageChangeModal, setShowStageChangeModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignSelection, setAssignSelection] = useState<string[]>([]);
  const [savingAssign, setSavingAssign] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<{
    title: string;
    description: string;
    priority: Priority;
    dueDate: string;
    tagIds: string[];
    dependsOnActivityIds: string[];
  }>({
    title: '',
    description: '',
    priority: Priority.MEDIA,
    dueDate: '',
    tagIds: [],
    dependsOnActivityIds: [],
  });
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [siblingActivities, setSiblingActivities] = useState<
    { id: string; title: string }[]
  >([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [stageChangeForm, setStageChangeForm] = useState({ toStageId: '', description: '' });
  const [reviewingRequestId, setReviewingRequestId] = useState<string | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'APROBADO' | 'RECHAZADO'>('APROBADO');
  const [reviewComment, setReviewComment] = useState('');
  const [savingReview, setSavingReview] = useState(false);
  const [cancelRequestId, setCancelRequestId] = useState<string | null>(null);
  const [cancellingRequest, setCancellingRequest] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [savingCommentEdit, setSavingCommentEdit] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const [deletingComment, setDeletingComment] = useState(false);
  const [uploadingActivityFiles, setUploadingActivityFiles] = useState(false);
  const [saving, setSaving] = useState(false);

  const canAssign = can('activity:assign');
  const activityId = params.id as string;
  const heroSentinelRef = useRef<HTMLDivElement | null>(null);
  const [heroOffscreen, setHeroOffscreen] = useState(false);

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

  useEffect(() => {
    if (!canAssign) return;
    usersService
      .getAll()
      .then((data) => setAllUsers(data.filter((u) => u.isActive)))
      .catch(() => setAllUsers([]));
  }, [canAssign]);

  useEffect(() => {
    if (!can('activity:update')) return;
    tagsService
      .getAll()
      .then(setAllTags)
      .catch(() => setAllTags([]));
  }, [can]);

  useEffect(() => {
    if (!can('activity:update')) return;
    if (!activity?.projectId) return;
    activitiesService
      .getAll({ projectId: activity.projectId })
      .then((list) =>
        setSiblingActivities(
          list
            .filter((a) => a.id !== activity.id)
            .map((a) => ({ id: a.id, title: a.title })),
        ),
      )
      .catch(() => setSiblingActivities([]));
  }, [activity?.projectId, activity?.id, can]);

  useEffect(() => {
    const sentinel = heroSentinelRef.current;
    if (!sentinel) return;
    const obs = new IntersectionObserver(
      ([entry]) => setHeroOffscreen(!entry.isIntersecting),
      { rootMargin: '0px', threshold: 0 },
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [activity]);

  const openAssignModal = () => {
    const current =
      activity?.assignments?.map((a) => a.userId).filter(Boolean) ??
      activity?.assignedUsers?.map((u) => u.id) ??
      [];
    setAssignSelection(current as string[]);
    setShowAssignModal(true);
  };

  const toggleAssignSelection = (userId: string) => {
    setAssignSelection((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleSaveAssignments = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAssign(true);
    try {
      await activitiesService.assign(activityId, assignSelection);
      toast.success('Asignaciones actualizadas');
      setShowAssignModal(false);
      await loadData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'No se pudieron guardar los cambios',
      );
    } finally {
      setSavingAssign(false);
    }
  };

  const openEditModal = () => {
    if (!activity) return;
    setEditForm({
      title: activity.title,
      description: activity.description ?? '',
      priority: activity.priority,
      dueDate: activity.dueDate
        ? new Date(activity.dueDate).toISOString().slice(0, 16)
        : '',
      tagIds: (activity.tags ?? []).map((t) => t.id),
      dependsOnActivityIds: (activity.dependsOn ?? [])
        .map((d) => d.requiredActivity?.id)
        .filter((id): id is string => !!id),
    });
    setShowEditModal(true);
  };

  const toggleEditTag = (tagId: string) => {
    setEditForm((f) => ({
      ...f,
      tagIds: f.tagIds.includes(tagId)
        ? f.tagIds.filter((id) => id !== tagId)
        : [...f.tagIds, tagId],
    }));
  };

  const toggleEditDependency = (activityIdRef: string) => {
    setEditForm((f) => ({
      ...f,
      dependsOnActivityIds: f.dependsOnActivityIds.includes(activityIdRef)
        ? f.dependsOnActivityIds.filter((id) => id !== activityIdRef)
        : [...f.dependsOnActivityIds, activityIdRef],
    }));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.title.trim()) return;
    setSavingEdit(true);
    try {
      await activitiesService.update(activityId, {
        title: editForm.title.trim(),
        description: editForm.description.trim() || undefined,
        priority: editForm.priority,
        dueDate: editForm.dueDate
          ? new Date(editForm.dueDate).toISOString()
          : undefined,
        tagIds: editForm.tagIds,
        dependsOnActivityIds: editForm.dependsOnActivityIds,
      });
      toast.success('Actividad actualizada');
      setShowEditModal(false);
      await loadData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'No se pudo guardar la actividad',
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const handleQuickUnassign = async (userId: string) => {
    try {
      await activitiesService.unassign(activityId, userId);
      toast.success('Usuario retirado');
      await loadData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'No se pudo retirar al usuario',
      );
    }
  };

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

  const startReview = (
    requestId: string,
    decision: 'APROBADO' | 'RECHAZADO',
  ) => {
    setReviewingRequestId(requestId);
    setReviewDecision(decision);
    setReviewComment('');
  };

  const cancelReview = () => {
    setReviewingRequestId(null);
    setReviewComment('');
  };

  const handleCancelRequest = async () => {
    if (!cancelRequestId) return;
    setCancellingRequest(true);
    try {
      await stageChangesService.cancel(cancelRequestId);
      toast.success('Solicitud cancelada');
      setCancelRequestId(null);
      await loadData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'No se pudo cancelar la solicitud',
      );
    } finally {
      setCancellingRequest(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingRequestId) return;
    setSavingReview(true);
    try {
      await stageChangesService.review(reviewingRequestId, {
        status: reviewDecision,
        reviewComment: reviewComment.trim() || undefined,
      });
      toast.success(
        reviewDecision === 'APROBADO'
          ? 'Solicitud aprobada'
          : 'Solicitud rechazada',
      );
      cancelReview();
      await loadData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'No se pudo procesar la solicitud',
      );
    } finally {
      setSavingReview(false);
    }
  };

  const startEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentContent(comment.content);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentContent('');
  };

  const handleSaveEditComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCommentId || !editingCommentContent.trim()) return;
    setSavingCommentEdit(true);
    try {
      await commentsService.update(editingCommentId, editingCommentContent.trim());
      toast.success('Comentario actualizado');
      setEditingCommentId(null);
      setEditingCommentContent('');
      await loadData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'No se pudo guardar el comentario',
      );
    } finally {
      setSavingCommentEdit(false);
    }
  };

  const handleDeleteComment = async () => {
    if (!deleteCommentId) return;
    setDeletingComment(true);
    try {
      await commentsService.delete(deleteCommentId);
      toast.success('Comentario eliminado');
      setDeleteCommentId(null);
      await loadData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'No se pudo eliminar el comentario',
      );
    } finally {
      setDeletingComment(false);
    }
  };

  const canEditComment = (c: Comment) =>
    c.userId === user?.id
      ? can('comment:update:own') || can('comment:update:any')
      : can('comment:update:any');

  const canDeleteComment = (c: Comment) =>
    c.userId === user?.id
      ? can('comment:delete:own') || can('comment:delete:any')
      : can('comment:delete:any');

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
      {/* Sticky compact bar (visible al scrollear más allá del hero) */}
      <div
        className={cn(
          'fixed top-0 left-0 right-0 z-30 transition-all duration-200',
          heroOffscreen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-4 pointer-events-none',
        )}
      >
        <div className="bg-white/95 backdrop-blur-sm border-b border-accent-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-2.5 flex items-center gap-3">
            <StageChip stage={activity.currentStage} />
            <h2 className="text-sm font-semibold text-accent-900 truncate flex-1 min-w-0">
              {activity.title}
            </h2>
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              {can('stagechange:create') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowStageChangeModal(true)}
                >
                  Solicitar cambio
                </Button>
              )}
              {can('activity:update') && (
                <Button size="sm" variant="ghost" onClick={openEditModal}>
                  Editar
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* HERO */}
      <div
        className="bg-white border border-accent-200 rounded-2xl shadow-sm overflow-hidden border-l-4"
        style={{ borderLeftColor: activity.currentStage?.color || '#9CA3AF' }}
      >
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
            {can('activity:update') && (
              <Button variant="outline" size="sm" onClick={openEditModal}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar
              </Button>
            )}
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

      {/* Centinela: cuando se sale de viewport, la barra sticky aparece */}
      <div ref={heroSentinelRef} aria-hidden className="h-px -mt-px" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
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
              {comments.map((comment) => {
                const isEditing = editingCommentId === comment.id;
                const edited =
                  new Date(comment.updatedAt).getTime() -
                    new Date(comment.createdAt).getTime() >
                  2000;
                return (
                  <div key={comment.id} className="flex gap-3 group">
                    <Avatar name={comment.user?.name || 'U'} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-accent-900">
                          {comment.user?.name}
                        </span>
                        <span
                          className="text-xs text-accent-400"
                          title={formatDateTime(comment.createdAt)}
                        >
                          {relativeTime(comment.createdAt)}
                        </span>
                        {edited && (
                          <span
                            className="text-xs text-accent-400 italic"
                            title={`Editado: ${formatDateTime(comment.updatedAt)}`}
                          >
                            (editado)
                          </span>
                        )}
                        {!isEditing && (
                          <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {canEditComment(comment) && (
                              <button
                                type="button"
                                onClick={() => startEditComment(comment)}
                                title="Editar"
                                className="text-accent-400 hover:text-primary-600 p-1"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            )}
                            {canDeleteComment(comment) && (
                              <button
                                type="button"
                                onClick={() => setDeleteCommentId(comment.id)}
                                title="Eliminar"
                                className="text-accent-400 hover:text-red-600 p-1"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a2 2 0 012-2h2a2 2 0 012 2v3" />
                                </svg>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      {isEditing ? (
                        <form
                          onSubmit={handleSaveEditComment}
                          className="space-y-2"
                        >
                          <Textarea
                            value={editingCommentContent}
                            onChange={(e) =>
                              setEditingCommentContent(e.target.value)
                            }
                            rows={3}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button
                              type="submit"
                              size="sm"
                              loading={savingCommentEdit}
                              disabled={!editingCommentContent.trim()}
                            >
                              Guardar
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={cancelEditComment}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <p className="text-sm text-accent-700 whitespace-pre-wrap wrap-break-word">
                          {comment.content}
                        </p>
                      )}
                      {!isEditing && <AttachmentList files={comment.files} />}
                    </div>
                  </div>
                );
              })}

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

          {/* Solicitudes de cambio de etapa */}
          {(activity.stageChangeRequests?.length ?? 0) > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-accent-900">
                  Solicitudes de cambio ({activity.stageChangeRequests?.length})
                </h2>
              </CardHeader>
              <CardContent className="space-y-3">
                {activity.stageChangeRequests?.map((req) => {
                  const statusStyle =
                    req.status === 'PENDIENTE'
                      ? 'bg-yellow-100 text-yellow-800 ring-yellow-200'
                      : req.status === 'APROBADO'
                        ? 'bg-green-100 text-green-800 ring-green-200'
                        : req.status === 'CANCELADO'
                          ? 'bg-accent-200 text-accent-700 ring-accent-300'
                          : 'bg-red-100 text-red-800 ring-red-200';
                  const isReviewing = reviewingRequestId === req.id;
                  const canReview =
                    req.status === 'PENDIENTE' && can('stagechange:review');
                  const canCancel =
                    req.status === 'PENDIENTE' &&
                    (req.requestedBy?.id === user?.id ||
                      can('stagechange:manage:any'));
                  return (
                    <div
                      key={req.id}
                      className="border border-accent-200 rounded-xl p-4 space-y-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ring-1 ring-inset',
                            statusStyle,
                          )}
                        >
                          {req.status}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <StageChip stage={req.fromStage} />
                          <svg className="w-3 h-3 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <StageChip stage={req.toStage} />
                        </span>
                        <span
                          className="text-xs text-accent-500 ml-auto"
                          title={formatDateTime(req.createdAt)}
                        >
                          {relativeTime(req.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <Avatar name={req.requestedBy?.name || 'U'} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm">
                            <span className="font-medium text-accent-900">
                              {req.requestedBy?.name ?? 'Usuario'}
                            </span>{' '}
                            <span className="text-accent-500">solicitó</span>
                          </p>
                          <p className="text-sm text-accent-700 whitespace-pre-wrap wrap-break-word mt-0.5">
                            {req.description}
                          </p>
                        </div>
                      </div>

                      {req.reviewedBy && (
                        <div className="flex items-start gap-2.5 pl-4 border-l-2 border-accent-100">
                          <Avatar name={req.reviewedBy.name} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm">
                              <span className="font-medium text-accent-900">
                                {req.reviewedBy.name}
                              </span>{' '}
                              <span className="text-accent-500">
                                {req.status === 'APROBADO' ? 'aprobó' : 'rechazó'}
                                {req.reviewedAt && (
                                  <>
                                    {' '}·{' '}
                                    <span title={formatDateTime(req.reviewedAt)}>
                                      {relativeTime(req.reviewedAt)}
                                    </span>
                                  </>
                                )}
                              </span>
                            </p>
                            {req.reviewComment && (
                              <p className="text-sm text-accent-700 whitespace-pre-wrap mt-0.5">
                                {req.reviewComment}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {!isReviewing && (canReview || canCancel) && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {canReview && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => startReview(req.id, 'APROBADO')}
                              >
                                Aprobar
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => startReview(req.id, 'RECHAZADO')}
                              >
                                Rechazar
                              </Button>
                            </>
                          )}
                          {canCancel && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setCancelRequestId(req.id)}
                            >
                              Cancelar solicitud
                            </Button>
                          )}
                        </div>
                      )}

                      {canReview && isReviewing && (
                        <form
                          onSubmit={handleSubmitReview}
                          className="pt-2 border-t border-accent-100 space-y-2"
                        >
                          <p className="text-xs text-accent-500">
                            {reviewDecision === 'APROBADO'
                              ? 'La actividad se moverá a la nueva etapa.'
                              : 'La actividad permanecerá en su etapa actual.'}
                          </p>
                          <Textarea
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="Comentario (opcional)"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button
                              type="submit"
                              size="sm"
                              variant={
                                reviewDecision === 'APROBADO' ? 'primary' : 'danger'
                              }
                              loading={savingReview}
                            >
                              {reviewDecision === 'APROBADO'
                                ? 'Confirmar aprobación'
                                : 'Confirmar rechazo'}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={cancelReview}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </form>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

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
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-accent-900">
                    Trazabilidad
                  </h2>
                  <p className="text-xs text-accent-500 mt-0.5">
                    Quién hizo qué y cuándo. Útil cuando una actividad cambia
                    de manos.
                  </p>
                </div>
                {events.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const safeTitle = activity.title
                        .replace(/[^a-z0-9-_]+/gi, '-')
                        .replace(/^-+|-+$/g, '')
                        .slice(0, 60) || 'actividad';
                      downloadCsv(
                        `trazabilidad-${safeTitle}.csv`,
                        eventsToCsv(activity.title, events),
                      );
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-accent-700 bg-accent-50 hover:bg-accent-100 border border-accent-200 rounded-lg transition-colors shrink-0"
                    title="Descargar CSV con todos los eventos"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Exportar CSV
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Timeline events={events} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 order-1 lg:order-2">
          <Card>
            <CardContent className="p-0 divide-y divide-accent-100">
              {/* Asignados */}
              <div className="p-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <p className="text-xs font-semibold tracking-wider uppercase text-accent-500">
                    Asignados ({assignedUsers.length})
                  </p>
                  {canAssign && (
                    <button
                      type="button"
                      onClick={openAssignModal}
                      className="text-xs font-medium text-primary-600 hover:text-primary-700"
                    >
                      Gestionar
                    </button>
                  )}
                </div>
                {assignedUsers.length > 0 ? (
                  <div className="space-y-2">
                    {assignedUsers.map((a) => (
                      <div
                        key={a.id}
                        className="group flex items-center gap-2.5 min-w-0"
                      >
                        <Avatar name={a.user?.name || 'U'} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-accent-900 truncate">
                            {a.user?.name}
                          </p>
                          <p className="text-xs text-accent-500 truncate">
                            {a.user?.email}
                          </p>
                        </div>
                        {canAssign && a.user?.id && (
                          <button
                            type="button"
                            onClick={() => handleQuickUnassign(a.user!.id)}
                            title="Retirar"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-accent-400 hover:text-red-600 p-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
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

      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Gestionar asignados"
        subtitle="Marca quién es responsable. Los cambios se registran en la trazabilidad."
        size="lg"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-5.13a4 4 0 11-8 0 4 4 0 018 0zM21 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        }
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setShowAssignModal(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="assign-form"
              loading={savingAssign}
            >
              Guardar
            </Button>
          </>
        }
      >
        <form id="assign-form" onSubmit={handleSaveAssignments} className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-accent-500">
              <span className="font-semibold text-primary-700">
                {assignSelection.length}
              </span>{' '}
              de {allUsers.length} seleccionado{assignSelection.length === 1 ? '' : 's'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAssignSelection(allUsers.map((u) => u.id))}
                className="text-xs font-medium text-primary-700 hover:text-primary-800"
              >
                Seleccionar todo
              </button>
              <button
                type="button"
                onClick={() => setAssignSelection([])}
                className="text-xs font-medium text-accent-500 hover:text-accent-700"
              >
                Limpiar
              </button>
            </div>
          </div>
          {allUsers.length === 0 ? (
            <div className="p-6 text-center text-sm text-accent-500 border border-dashed border-accent-200 rounded-xl">
              No hay usuarios disponibles
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto border border-accent-200 rounded-xl divide-y divide-accent-100">
              {allUsers.map((u) => {
                const checked = assignSelection.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleAssignSelection(u.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                      checked
                        ? 'bg-primary-50/60 hover:bg-primary-50'
                        : 'hover:bg-accent-50',
                    )}
                  >
                    <span
                      className={cn(
                        'w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors',
                        checked
                          ? 'bg-primary-600 border-primary-600'
                          : 'bg-white border-accent-300',
                      )}
                    >
                      {checked && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <Avatar name={u.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-accent-900 truncate">
                        {u.name}
                      </p>
                      <p className="text-xs text-accent-500 truncate">{u.email}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </form>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar actividad"
        subtitle="Los cambios quedan registrados en la trazabilidad"
        size="2xl"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        }
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="edit-activity-form"
              loading={savingEdit}
              disabled={!editForm.title.trim()}
            >
              Guardar cambios
            </Button>
          </>
        }
      >
        <form
          id="edit-activity-form"
          onSubmit={handleSaveEdit}
          className="space-y-6"
        >
          <section className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold tracking-wider uppercase text-accent-500">
                Información general
              </h3>
              <p className="text-xs text-accent-400 mt-0.5">
                Qué hay que hacer
              </p>
            </div>
            <Input
              id="edit-title"
              label="Título"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              required
            />
            <Textarea
              id="edit-description"
              label="Descripción"
              placeholder="Contexto, criterios de aceptación o pasos a seguir"
              value={editForm.description}
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
              rows={5}
            />
          </section>

          <div className="h-px bg-accent-100" />

          <section className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold tracking-wider uppercase text-accent-500">
                Planificación
              </h3>
              <p className="text-xs text-accent-400 mt-0.5">Urgencia y fecha límite</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                id="edit-priority"
                label="Prioridad"
                value={editForm.priority}
                onChange={(e) =>
                  setEditForm({ ...editForm, priority: e.target.value as Priority })
                }
                options={[
                  { value: 'BAJA', label: 'Baja' },
                  { value: 'MEDIA', label: 'Media' },
                  { value: 'ALTA', label: 'Alta' },
                  { value: 'URGENTE', label: 'Urgente' },
                ]}
              />
              <div className="w-full">
                <label
                  htmlFor="edit-due"
                  className="block text-sm font-medium text-accent-700 mb-1"
                >
                  Fecha límite
                </label>
                <input
                  id="edit-due"
                  type="datetime-local"
                  value={editForm.dueDate}
                  onChange={(e) =>
                    setEditForm({ ...editForm, dueDate: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-accent-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                />
              </div>
            </div>
          </section>

          {allTags.length > 0 && (
            <>
              <div className="h-px bg-accent-100" />
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-semibold tracking-wider uppercase text-accent-500">
                      Etiquetas
                    </h3>
                    <p className="text-xs text-accent-400 mt-0.5">
                      Clasifica la actividad para encontrarla rápido
                    </p>
                  </div>
                  <span className="text-xs text-accent-500 shrink-0">
                    <span className="font-semibold text-primary-700">
                      {editForm.tagIds.length}
                    </span>{' '}
                    de {allTags.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => {
                    const selected = editForm.tagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleEditTag(tag.id)}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm border transition-all',
                          selected
                            ? 'border-transparent text-white shadow-sm'
                            : 'border-accent-200 bg-white text-accent-700 hover:bg-accent-50',
                        )}
                        style={
                          selected
                            ? { backgroundColor: tag.color || '#9CA3AF' }
                            : undefined
                        }
                      >
                        {selected && (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        <span
                          className={cn(
                            'inline-block w-2 h-2 rounded-full',
                            selected && 'opacity-0',
                          )}
                          style={
                            selected
                              ? undefined
                              : { backgroundColor: tag.color || '#9CA3AF' }
                          }
                        />
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </section>
            </>
          )}

          {siblingActivities.length > 0 && (
            <>
              <div className="h-px bg-accent-100" />
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-semibold tracking-wider uppercase text-accent-500">
                      Depende de
                    </h3>
                    <p className="text-xs text-accent-400 mt-0.5">
                      Actividades del proyecto que deben completarse primero
                    </p>
                  </div>
                  <span className="text-xs text-accent-500 shrink-0">
                    <span className="font-semibold text-primary-700">
                      {editForm.dependsOnActivityIds.length}
                    </span>{' '}
                    de {siblingActivities.length}
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto border border-accent-200 rounded-xl divide-y divide-accent-100">
                  {siblingActivities.map((sib) => {
                    const checked = editForm.dependsOnActivityIds.includes(sib.id);
                    return (
                      <button
                        key={sib.id}
                        type="button"
                        onClick={() => toggleEditDependency(sib.id)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                          checked
                            ? 'bg-primary-50/60 hover:bg-primary-50'
                            : 'hover:bg-accent-50',
                        )}
                      >
                        <span
                          className={cn(
                            'w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors',
                            checked
                              ? 'bg-primary-600 border-primary-600'
                              : 'bg-white border-accent-300',
                          )}
                        >
                          {checked && (
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        <svg className="w-4 h-4 text-accent-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        <span className="text-sm text-accent-900 truncate flex-1 min-w-0">
                          {sib.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            </>
          )}
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

      <ConfirmModal
        isOpen={!!cancelRequestId}
        onClose={() => setCancelRequestId(null)}
        onConfirm={handleCancelRequest}
        title="Cancelar solicitud"
        message="La solicitud quedará en estado CANCELADO y no se podrá reabrir. ¿Confirmas?"
        confirmText="Cancelar solicitud"
        cancelText="Volver"
        variant="danger"
        loading={cancellingRequest}
      />

      <ConfirmModal
        isOpen={!!deleteCommentId}
        onClose={() => setDeleteCommentId(null)}
        onConfirm={handleDeleteComment}
        title="Eliminar comentario"
        message="Esta acción no se puede deshacer. ¿Eliminar el comentario?"
        confirmText="Eliminar"
        variant="danger"
        loading={deletingComment}
      />
    </div>
  );
}
