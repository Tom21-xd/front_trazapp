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
import { priorityColors, formatDateTime } from '@/lib/utils';
import type { Activity, Stage, Comment, FileAttachment } from '@/types';

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

export default function ActivityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAdmin } = useAuthContext();
  const toast = useToast();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStageChangeModal, setShowStageChangeModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [stageChangeForm, setStageChangeForm] = useState({ toStageId: '', description: '' });
  const [newComment, setNewComment] = useState('');
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  const activityId = params.id as string;

  const loadData = async () => {
    try {
      const [activityData, stagesData, commentsData] = await Promise.all([
        activitiesService.getById(activityId),
        stagesService.getAll(),
        commentsService.getByActivity(activityId),
      ]);
      setActivity(activityData);
      setStages(stagesData);
      setComments(commentsData);
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

      // Subir adjuntos (si los hay) ligados al comentario recién creado
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-sm text-accent-500 mb-2">
            <Link href="/activities" className="hover:text-primary-600">
              Actividades
            </Link>
            <span>/</span>
            <span className="truncate max-w-[60vw] sm:max-w-xs">{activity.title}</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-accent-900 wrap-break-word">
            {activity.title}
          </h1>
          {activity.description && (
            <p className="text-accent-500 mt-1 wrap-break-word">{activity.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Badge className={priorityColors[activity.priority]}>{activity.priority}</Badge>
          {isAdmin && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Eliminar
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stage */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="text-lg font-semibold text-accent-900">Etapa actual</h2>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowStageChangeModal(true)}
                >
                  Solicitar cambio
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div
                className="inline-flex items-center px-4 py-2 rounded-lg font-medium"
                style={{ backgroundColor: activity.currentStage?.color || '#e5e5e5' }}
              >
                {activity.currentStage?.name}
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
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
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <p className="text-xs text-accent-500 uppercase font-semibold mb-1">Proyecto</p>
                <Link
                  href={`/projects/${activity.projectId}`}
                  className="text-primary-600 hover:text-primary-700 font-medium wrap-break-word"
                >
                  {activity.project?.name}
                </Link>
              </div>
              {activity.dueDate && (
                <div>
                  <p className="text-xs text-accent-500 uppercase font-semibold mb-1">
                    Fecha límite
                  </p>
                  <p className="text-accent-900">{formatDateTime(activity.dueDate)}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-accent-500 uppercase font-semibold mb-1">Asignados</p>
                {assignedUsers.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {assignedUsers.map((a) => (
                      <div key={a.id} className="flex items-center gap-2">
                        <Avatar name={a.user?.name || 'U'} size="sm" />
                        <span className="text-sm text-accent-700">{a.user?.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-accent-500">Sin asignar</p>
                )}
              </div>
              {activity.tags && activity.tags.length > 0 && (
                <div>
                  <p className="text-xs text-accent-500 uppercase font-semibold mb-1">
                    Etiquetas
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {activity.tags.map((tag) => (
                      <Badge key={tag.id} style={{ backgroundColor: tag.color || '#e5e5e5' }}>
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={showStageChangeModal}
        onClose={() => setShowStageChangeModal(false)}
        title="Solicitar cambio de etapa"
        size="lg"
      >
        <form onSubmit={handleStageChangeRequest} className="space-y-4">
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
          <Textarea
            id="description"
            label="Justificación"
            value={stageChangeForm.description}
            onChange={(e) =>
              setStageChangeForm({ ...stageChangeForm, description: e.target.value })
            }
            placeholder="Explica por qué solicitas este cambio..."
            rows={4}
            required
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowStageChangeModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              Enviar solicitud
            </Button>
          </div>
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
