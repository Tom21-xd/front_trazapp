'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { activitiesService, stagesService, stageChangesService, commentsService } from '@/services';
import { useAuthContext } from '@/store/AuthContext';
import { Button, Card, CardHeader, CardContent, Badge, Avatar, Modal, Textarea, Select } from '@/components/ui';
import { priorityColors, formatDateTime } from '@/lib/utils';
import type { Activity, Stage, Comment } from '@/types';

export default function ActivityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAdmin } = useAuthContext();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStageChangeModal, setShowStageChangeModal] = useState(false);
  const [stageChangeForm, setStageChangeForm] = useState({ toStageId: '', description: '' });
  const [newComment, setNewComment] = useState('');
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
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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
      alert('Solicitud enviada correctamente');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSaving(true);
    try {
      await commentsService.create({ content: newComment, activityId });
      setNewComment('');
      loadData();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar esta actividad?')) return;
    try {
      await activitiesService.delete(activityId);
      router.push('/activities');
    } catch (error) {
      console.error('Error:', error);
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

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-accent-500 mb-2">
            <Link href="/activities" className="hover:text-primary-600">Actividades</Link>
            <span>/</span>
            <span>{activity.title}</span>
          </div>
          <h1 className="text-2xl font-bold text-accent-900">{activity.title}</h1>
          <p className="text-accent-500 mt-1">{activity.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={priorityColors[activity.priority]}>{activity.priority}</Badge>
          {isAdmin && (
            <Button variant="danger" size="sm" onClick={handleDelete}>
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
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-accent-900">Etapa actual</h2>
                <Button size="sm" variant="outline" onClick={() => setShowStageChangeModal(true)}>
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
              <h2 className="text-lg font-semibold text-accent-900">Comentarios ({comments.length})</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar name={comment.user?.name || 'U'} size="sm" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-accent-900">{comment.user?.name}</span>
                      <span className="text-xs text-accent-400">{formatDateTime(comment.createdAt)}</span>
                    </div>
                    <p className="text-sm text-accent-700">{comment.content}</p>
                  </div>
                </div>
              ))}

              <form onSubmit={handleAddComment} className="flex gap-3 pt-4 border-t border-accent-200">
                <Avatar name={user?.name || 'U'} size="sm" />
                <div className="flex-1">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escribe un comentario..."
                    rows={2}
                  />
                  <div className="flex justify-end mt-2">
                    <Button type="submit" size="sm" loading={saving} disabled={!newComment.trim()}>
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
                <Link href={`/projects/${activity.projectId}`} className="text-primary-600 hover:text-primary-700 font-medium">
                  {activity.project?.name}
                </Link>
              </div>
              {activity.dueDate && (
                <div>
                  <p className="text-xs text-accent-500 uppercase font-semibold mb-1">Fecha límite</p>
                  <p className="text-accent-900">{formatDateTime(activity.dueDate)}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-accent-500 uppercase font-semibold mb-1">Asignados</p>
                {activity.assignments && activity.assignments.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {activity.assignments.map((assignment) => (
                      <div key={assignment.id} className="flex items-center gap-2">
                        <Avatar name={assignment.user?.name || 'U'} size="sm" />
                        <span className="text-sm text-accent-700">{assignment.user?.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-accent-500">Sin asignar</p>
                )}
              </div>
              {activity.tags && activity.tags.length > 0 && (
                <div>
                  <p className="text-xs text-accent-500 uppercase font-semibold mb-1">Etiquetas</p>
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

      <Modal isOpen={showStageChangeModal} onClose={() => setShowStageChangeModal(false)} title="Solicitar cambio de etapa" size="lg">
        <form onSubmit={handleStageChangeRequest} className="space-y-4">
          <Select
            id="toStage"
            label="Nueva etapa"
            value={stageChangeForm.toStageId}
            onChange={(e) => setStageChangeForm({ ...stageChangeForm, toStageId: e.target.value })}
            options={availableStages.map((s) => ({ value: s.id, label: s.name }))}
            placeholder="Selecciona una etapa"
            required
          />
          <Textarea
            id="description"
            label="Justificación"
            value={stageChangeForm.description}
            onChange={(e) => setStageChangeForm({ ...stageChangeForm, description: e.target.value })}
            placeholder="Explica por qué solicitas este cambio..."
            rows={4}
            required
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setShowStageChangeModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              Enviar solicitud
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
