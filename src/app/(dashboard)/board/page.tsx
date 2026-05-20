'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { activitiesService, stagesService, projectsService, stageChangesService, usersService } from '@/services';
import { useAuthContext } from '@/store/AuthContext';
import { Badge, Select, Button, Modal, Input, Textarea, useToast } from '@/components/ui';
import { priorityColors, cn } from '@/lib/utils';
import { Priority, type Activity, type Stage, type Project, type User } from '@/types';

interface DragState {
  activityId: string;
  fromStageId: string;
}

export default function KanbanBoardPage() {
  const toast = useToast();
  const { can, canAny } = useAuthContext();
  const canMove = can('activity:update');
  const canCreate = can('activity:create');
  const canManageStages = canAny([
    'stage:create',
    'stage:update',
    'stage:reorder',
    'stage:delete',
  ]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const canAssign = can('activity:assign');
  const [loading, setLoading] = useState(true);
  const [filterProjectId, setFilterProjectId] = useState('');
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dropTargetStage, setDropTargetStage] = useState<string | null>(null);

  // Modal state for new activity
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState('');
  const [activityForm, setActivityForm] = useState<{
    title: string;
    description: string;
    priority: Priority;
    projectId: string;
    assignedUserIds: string[];
  }>({
    title: '',
    description: '',
    priority: Priority.MEDIA,
    projectId: '',
    assignedUserIds: [],
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
    if (canAssign) {
      try {
        const usersData = await usersService.getAll();
        setUsers(usersData.filter((u) => u.isActive));
      } catch {
        // sin permiso de ver usuarios: simplemente no se ofrece el picker
      }
    }
  }, [toast, canAssign]);

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

    if (canMove) {
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
      assignedUserIds: [],
    });
    setShowActivityModal(true);
  };

  const toggleAssignee = (userId: string) => {
    setActivityForm((f) => ({
      ...f,
      assignedUserIds: f.assignedUserIds.includes(userId)
        ? f.assignedUserIds.filter((id) => id !== userId)
        : [...f.assignedUserIds, userId],
    }));
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityForm.projectId) {
      toast.error('Selecciona un proyecto');
      return;
    }
    setSaving(true);
    try {
      const { assignedUserIds, ...rest } = activityForm;
      await activitiesService.create({
        ...rest,
        currentStageId: selectedStageId,
        ...(assignedUserIds.length > 0 ? { assignedUserIds } : {}),
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
            {canMove
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
                  {stageActivities.map((activity) => {
                    const users =
                      activity.assignedUsers ||
                      activity.assignments?.map((a) => a.user).filter(Boolean) ||
                      [];
                    return (
                      <Link
                        key={activity.id}
                        href={`/activities/${activity.id}`}
                        draggable
                        onDragStart={() => handleDragStart(activity.id, stage.id)}
                        onDragEnd={handleDragEnd}
                        onClick={(e) => {
                          if (dragState) e.preventDefault();
                        }}
                        className={`block bg-white p-3 rounded-lg shadow-sm border border-accent-200 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-primary-300 transition-all ${
                          dragState?.activityId === activity.id ? 'opacity-50 scale-95' : ''
                        }`}
                      >
                        <p className="font-medium text-sm text-accent-900 mb-1 line-clamp-2">
                          {activity.title}
                        </p>
                        {activity.description && (
                          <p className="text-xs text-accent-500 line-clamp-2 mb-2">
                            {activity.description}
                          </p>
                        )}
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
                        {users.length > 0 ? (
                          <div className="flex items-center gap-1 mt-2">
                            {users.slice(0, 3).map(
                              (user) =>
                                user && (
                                  <div
                                    key={user.id}
                                    title={user.name}
                                    className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs flex items-center justify-center font-medium ring-2 ring-white"
                                  >
                                    {user.name.charAt(0).toUpperCase()}
                                  </div>
                                ),
                            )}
                            {users.length > 3 && (
                              <span className="text-xs text-accent-500 ml-1">
                                +{users.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 mt-2 text-xs text-accent-400">
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
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            <span>Sin asignar</span>
                          </div>
                        )}
                      </Link>
                    );
                  })}

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
                  {canCreate && (
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
              {canManageStages && (
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
        subtitle="Crea una actividad y asígnale proyecto, etapa y prioridad"
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
              form="new-activity-form"
              loading={saving}
              disabled={!activityForm.title.trim() || !activityForm.projectId}
            >
              Crear actividad
            </Button>
          </>
        }
      >
        <form id="new-activity-form" onSubmit={handleCreateActivity} className="space-y-6">
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
              <p className="text-xs text-accent-400 mt-0.5">A qué proyecto pertenece y su urgencia</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                id="project"
                label="Proyecto"
                placeholder="Selecciona un proyecto"
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
          </section>

          {canAssign && users.length > 0 && (
            <>
              <div className="h-px bg-accent-100" />
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-semibold tracking-wider uppercase text-accent-500">
                      Asignados
                    </h3>
                    <p className="text-xs text-accent-400 mt-0.5">
                      Quién es responsable de ejecutar esta actividad
                    </p>
                  </div>
                  <span className="text-xs text-accent-500 shrink-0">
                    <span className="font-semibold text-primary-700">
                      {activityForm.assignedUserIds.length}
                    </span>
                    {' · '}
                    {users.length}
                  </span>
                </div>
                <div className="max-h-48 overflow-y-auto border border-accent-200 rounded-xl divide-y divide-accent-100">
                  {users.map((u) => {
                    const checked = activityForm.assignedUserIds.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggleAssignee(u.id)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors',
                          checked ? 'bg-primary-50/60 hover:bg-primary-50' : 'hover:bg-accent-50',
                        )}
                      >
                        <span
                          className={cn(
                            'w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors',
                            checked ? 'bg-primary-600 border-primary-600' : 'bg-white border-accent-300',
                          )}
                        >
                          {checked && (
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 text-xs flex items-center justify-center font-medium shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-accent-900 truncate">{u.name}</p>
                          <p className="text-xs text-accent-500 truncate">{u.email}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            </>
          )}
        </form>
      </Modal>
    </div>
  );
}
