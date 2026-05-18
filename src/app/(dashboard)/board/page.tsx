'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { activitiesService, stagesService, projectsService, stageChangesService } from '@/services';
import { useAuthContext } from '@/store/AuthContext';
import { Badge, Select, Button, Modal, Input, Textarea, useToast } from '@/components/ui';
import { priorityColors } from '@/lib/utils';
import { Priority, type Activity, type Stage, type Project } from '@/types';

interface DragState {
  activityId: string;
  fromStageId: string;
}

export default function KanbanBoardPage() {
  const toast = useToast();
  const { isAdmin } = useAuthContext();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProjectId, setFilterProjectId] = useState('');
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dropTargetStage, setDropTargetStage] = useState<string | null>(null);

  // Modal state for new activity
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState('');
  const [activityForm, setActivityForm] = useState({
    title: '',
    description: '',
    priority: Priority.MEDIA,
    projectId: '',
  });
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [stagesData, projectsData] = await Promise.all([
        stagesService.getAll(),
        projectsService.getAll(),
      ]);
      setStages(stagesData);
      setProjects(projectsData);
    } catch {
      toast.error('Error al cargar datos');
    }
  }, [toast]);

  const loadActivities = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (filterProjectId) params.projectId = filterProjectId;
      const data = await activitiesService.getAll(params);
      setActivities(data);
    } catch {
      toast.error('Error al cargar actividades');
    } finally {
      setLoading(false);
    }
  }, [filterProjectId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  // Drag handlers
  const handleDragStart = (activityId: string, fromStageId: string) => {
    setDragState({ activityId, fromStageId });
  };

  const handleDragEnd = () => {
    setDragState(null);
    setDropTargetStage(null);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDropTargetStage(stageId);
  };

  const handleDragLeave = () => {
    setDropTargetStage(null);
  };

  const handleDrop = async (e: React.DragEvent, toStageId: string) => {
    e.preventDefault();
    setDropTargetStage(null);

    if (!dragState || dragState.fromStageId === toStageId) {
      setDragState(null);
      return;
    }

    const { activityId } = dragState;
    setDragState(null);

    if (isAdmin) {
      // Admin: mueve directo (con update optimista + revert si falla)
      setActivities((prev) =>
        prev.map((a) =>
          a.id === activityId ? { ...a, currentStageId: toStageId } : a,
        ),
      );
      try {
        await activitiesService.changeStage(activityId, toStageId);
        toast.success('Actividad movida correctamente');
      } catch (err) {
        loadActivities();
        toast.error(
          err instanceof Error ? err.message : 'Error al mover la actividad',
        );
      }
      return;
    }

    // Empleado: NO mueve directo. Crea una solicitud de cambio de etapa
    // que el administrador debe aprobar (regla de negocio).
    try {
      await stageChangesService.create({
        activityId,
        toStageId,
        description: 'Solicitud de cambio de etapa desde el tablero',
      });
      toast.success(
        'Solicitud de cambio enviada. Un administrador debe aprobarla.',
      );
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'No se pudo enviar la solicitud de cambio',
      );
    }
  };

  // Create activity handlers
  const openCreateModal = (stageId: string) => {
    setSelectedStageId(stageId);
    setActivityForm({
      title: '',
      description: '',
      priority: Priority.MEDIA,
      projectId: filterProjectId || (projects[0]?.id || ''),
    });
    setShowActivityModal(true);
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityForm.projectId) {
      toast.error('Selecciona un proyecto');
      return;
    }
    setSaving(true);
    try {
      await activitiesService.create({
        ...activityForm,
        currentStageId: selectedStageId,
      });
      setShowActivityModal(false);
      toast.success('Actividad creada');
      loadActivities();
    } catch {
      toast.error('Error al crear actividad');
    } finally {
      setSaving(false);
    }
  };

  const getActivitiesByStage = (stageId: string) =>
    activities.filter((a) => a.currentStageId === stageId);

  if (loading && activities.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-accent-900">Tablero Kanban</h1>
          <p className="text-sm text-accent-500">
            {isAdmin
              ? 'Arrastra las actividades entre etapas'
              : 'Arrastra una actividad asignada para solicitar su cambio de etapa'}
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select
            id="filterProject"
            value={filterProjectId}
            onChange={(e) => setFilterProjectId(e.target.value)}
            options={[
              { value: '', label: 'Todos los proyectos' },
              ...projects.map((p) => ({ value: p.id, label: p.name })),
            ]}
            className="w-full sm:w-48"
          />
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-3 lg:gap-4 min-w-max h-full">
          {stages.map((stage) => {
            const stageActivities = getActivitiesByStage(stage.id);
            const isDropTarget = dropTargetStage === stage.id;

            return (
              <div
                key={stage.id}
                className="w-72 lg:w-80 flex flex-col shrink-0"
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                {/* Stage Header */}
                <div
                  className="px-3 py-2.5 rounded-t-lg font-medium text-sm flex items-center justify-between"
                  style={{ backgroundColor: stage.color || '#e5e5e5' }}
                >
                  <span className="truncate text-white drop-shadow-sm">{stage.name}</span>
                  <span className="bg-white/30 px-2 py-0.5 rounded text-xs text-white ml-2">
                    {stageActivities.length}
                  </span>
                </div>

                {/* Stage Content */}
                <div
                  className={`flex-1 bg-accent-100 rounded-b-lg p-2 min-h-[300px] space-y-2 transition-colors ${
                    isDropTarget ? 'bg-primary-100 ring-2 ring-primary-400' : ''
                  }`}
                >
                  {stageActivities.map((activity) => (
                    <div
                      key={activity.id}
                      draggable
                      onDragStart={() => handleDragStart(activity.id, stage.id)}
                      onDragEnd={handleDragEnd}
                      className={`bg-white p-3 rounded-lg shadow-sm border border-accent-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${
                        dragState?.activityId === activity.id ? 'opacity-50 scale-95' : ''
                      }`}
                    >
                      <Link
                        href={`/activities/${activity.id}`}
                        onClick={(e) => {
                          if (dragState) e.preventDefault();
                        }}
                      >
                        <p className="font-medium text-sm text-accent-900 mb-2 line-clamp-2 hover:text-primary-600">
                          {activity.title}
                        </p>
                      </Link>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <Badge className={priorityColors[activity.priority]} size="sm">
                          {activity.priority}
                        </Badge>
                        {activity.project && (
                          <span className="text-xs text-accent-500 truncate max-w-[100px]">
                            {activity.project.name}
                          </span>
                        )}
                      </div>
                      {(() => {
                        const users = activity.assignedUsers || activity.assignments?.map(a => a.user).filter(Boolean) || [];
                        if (users.length === 0) return null;
                        return (
                          <div className="flex items-center gap-1 mt-2">
                            {users.slice(0, 3).map((user) => user && (
                              <div
                                key={user.id}
                                title={user.name}
                                className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs flex items-center justify-center font-medium"
                              >
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                            ))}
                            {users.length > 3 && (
                              <span className="text-xs text-accent-500">
                                +{users.length - 3}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  ))}

                  {stageActivities.length === 0 && !isDropTarget && (
                    <p className="text-center text-sm text-accent-400 py-8">
                      Sin actividades
                    </p>
                  )}

                  {isDropTarget && (
                    <div className="border-2 border-dashed border-primary-400 rounded-lg p-4 text-center text-primary-600 text-sm">
                      Soltar aquí
                    </div>
                  )}

                  {/* Add Activity Button */}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => openCreateModal(stage.id)}
                      className="w-full p-2 text-sm text-accent-500 hover:text-accent-700 hover:bg-white/50 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Añadir tarea
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {stages.length === 0 && (
            <div className="w-full py-12 text-center">
              <svg className="w-16 h-16 text-accent-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <p className="text-accent-500 mb-2">No hay etapas configuradas</p>
              {isAdmin && (
                <Link href="/stages" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  Configurar etapas
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Activity Modal */}
      <Modal
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        title="Nueva actividad"
        size="lg"
      >
        <form onSubmit={handleCreateActivity} className="space-y-4">
          <Input
            id="title"
            label="Título"
            value={activityForm.title}
            onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
            required
          />
          <Textarea
            id="description"
            label="Descripción"
            value={activityForm.description}
            onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
            rows={3}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              id="project"
              label="Proyecto"
              value={activityForm.projectId}
              onChange={(e) => setActivityForm({ ...activityForm, projectId: e.target.value })}
              options={projects.map((p) => ({ value: p.id, label: p.name }))}
              required
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
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setShowActivityModal(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button type="submit" loading={saving} className="w-full sm:w-auto">
              Crear actividad
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
