'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { projectsService, activitiesService, stagesService } from '@/services';
import { useAuthContext } from '@/store/AuthContext';
import { Button, Card, CardHeader, CardContent, Badge, Modal, Input, Textarea, Select, ConfirmModal, useToast } from '@/components/ui';
import { statusColors, priorityColors, formatDate } from '@/lib/utils';
import { Priority, type Project, type Activity, type Stage, type ProjectStats } from '@/types';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const { can } = useAuthContext();
  const [project, setProject] = useState<Project | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activityForm, setActivityForm] = useState({
    title: '',
    description: '',
    priority: Priority.MEDIA,
    currentStageId: '',
  });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const projectId = params.id as string;

  const loadData = useCallback(async () => {
    try {
      const [projectData, activitiesData, stagesData, statsData] = await Promise.all([
        projectsService.getById(projectId),
        activitiesService.getAll({ projectId }),
        stagesService.getAll(),
        projectsService.getStats(projectId),
      ]);
      setProject(projectData);
      setActivities(activitiesData);
      setStages(stagesData);
      setStats(statsData);
      if (stagesData.length > 0) {
        setActivityForm((f) =>
          f.currentStageId ? f : { ...f, currentStageId: stagesData[0].id },
        );
      }
    } catch {
      toast.error('Error al cargar el proyecto');
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await activitiesService.create({ ...activityForm, projectId });
      setShowActivityModal(false);
      setActivityForm({ title: '', description: '', priority: Priority.MEDIA, currentStageId: stages[0]?.id || '' });
      toast.success('Actividad creada correctamente');
      loadData();
    } catch {
      toast.error('Error al crear la actividad');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await projectsService.delete(projectId);
      toast.success('Proyecto eliminado correctamente');
      router.push('/projects');
    } catch {
      toast.error('Error al eliminar el proyecto');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 text-accent-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-lg font-semibold text-accent-900 mb-2">Proyecto no encontrado</h2>
        <Link href="/projects" className="text-primary-600 hover:text-primary-700 font-medium">
          Volver a proyectos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm text-accent-500 mb-2 flex-wrap">
            <Link href="/projects" className="hover:text-primary-600">Proyectos</Link>
            <span>/</span>
            <span className="truncate">{project.name}</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-accent-900">{project.name}</h1>
          <p className="text-sm lg:text-base text-accent-500 mt-1">{project.description}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Badge className={statusColors[project.status]}>{project.status.replace('_', ' ')}</Badge>
          {can('project:delete') && (
            <Button variant="danger" size="sm" onClick={() => setDeleteConfirm(true)}>
              Eliminar
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
          <Card>
            <CardContent className="p-3 lg:p-4 text-center">
              <p className="text-xl lg:text-2xl font-bold text-accent-900">{stats.totalActivities}</p>
              <p className="text-xs lg:text-sm text-accent-500">Total actividades</p>
            </CardContent>
          </Card>
          {Object.entries(stats.activitiesByPriority || {}).map(([priority, count]) => (
            <Card key={priority}>
              <CardContent className="p-3 lg:p-4 text-center">
                <p className="text-xl lg:text-2xl font-bold text-accent-900">{count}</p>
                <p className="text-xs lg:text-sm text-accent-500">{priority}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Activities by Stage (Kanban-like) */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-accent-900">Actividades</h2>
            {can('activity:create') && (
              <Button size="sm" onClick={() => setShowActivityModal(true)} className="w-full sm:w-auto">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nueva actividad
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <div className="flex gap-3 lg:gap-4 p-3 lg:p-4 min-w-max">
            {stages.map((stage) => {
              const stageActivities = activities.filter((a) => a.currentStageId === stage.id);
              return (
                <div key={stage.id} className="w-64 lg:w-72 shrink-0">
                  <div
                    className="px-3 py-2 rounded-t-lg font-medium text-sm flex items-center justify-between"
                    style={{ backgroundColor: stage.color || '#e5e5e5' }}
                  >
                    <span className="truncate">{stage.name}</span>
                    <span className="bg-white/50 px-2 py-0.5 rounded text-xs ml-2">{stageActivities.length}</span>
                  </div>
                  <div className="bg-accent-50 rounded-b-lg p-2 min-h-[200px] space-y-2">
                    {stageActivities.map((activity) => (
                      <Link key={activity.id} href={`/activities/${activity.id}`}>
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-accent-200 hover:shadow-md transition-shadow">
                          <p className="font-medium text-sm text-accent-900 mb-2 line-clamp-2">{activity.title}</p>
                          <div className="flex items-center justify-between gap-2">
                            <Badge className={priorityColors[activity.priority]}>{activity.priority}</Badge>
                            {activity.dueDate && (
                              <span className="text-xs text-accent-500 truncate">{formatDate(activity.dueDate)}</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                    {stageActivities.length === 0 && (
                      <p className="text-center text-sm text-accent-400 py-8">Sin actividades</p>
                    )}
                  </div>
                </div>
              );
            })}
            {stages.length === 0 && (
              <div className="w-full py-8 text-center">
                <p className="text-accent-500">No hay etapas configuradas</p>
                <Link href="/stages" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  Configurar etapas
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        title="Nueva actividad"
        subtitle="Agrega una actividad dentro de este proyecto"
        size="2xl"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        }
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setShowActivityModal(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="project-new-activity-form"
              loading={saving}
              disabled={!activityForm.title.trim()}
            >
              Crear actividad
            </Button>
          </>
        }
      >
        <form
          id="project-new-activity-form"
          onSubmit={handleCreateActivity}
          className="space-y-6"
        >
          <section className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold tracking-wider uppercase text-accent-500">
                Información general
              </h3>
              <p className="text-xs text-accent-400 mt-0.5">Qué hay que hacer</p>
            </div>
            <Input
              id="title"
              label="Título"
              placeholder="Ej. Revisar planos de la obra"
              value={activityForm.title}
              onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
              required
            />
            <Textarea
              id="description"
              label="Descripción"
              placeholder="Contexto, criterios de aceptación o pasos a seguir"
              value={activityForm.description}
              onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
              rows={4}
            />
          </section>

          <div className="h-px bg-accent-100" />

          <section className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold tracking-wider uppercase text-accent-500">
                Clasificación
              </h3>
              <p className="text-xs text-accent-400 mt-0.5">Etapa inicial y urgencia</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                id="stage"
                label="Etapa"
                value={activityForm.currentStageId}
                onChange={(e) => setActivityForm({ ...activityForm, currentStageId: e.target.value })}
                options={stages.map((s) => ({ value: s.id, label: s.name }))}
              />
              <Select
                id="priority"
                label="Prioridad"
                value={activityForm.priority}
                onChange={(e) => setActivityForm({ ...activityForm, priority: e.target.value as Priority })}
                options={[
                  { value: 'BAJA', label: 'Baja' },
                  { value: 'MEDIA', label: 'Media' },
                  { value: 'ALTA', label: 'Alta' },
                  { value: 'URGENTE', label: 'Urgente' },
                ]}
              />
            </div>
          </section>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Eliminar proyecto"
        message="¿Estás seguro de eliminar este proyecto? Se eliminarán también todas las actividades asociadas. Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
