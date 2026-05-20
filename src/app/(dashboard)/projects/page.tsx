'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { projectsService, projectTypesService } from '@/services';
import { useAuthContext } from '@/store/AuthContext';
import { Button, Card, CardContent, Badge, Modal, Input, Textarea, Select, Pagination, useToast } from '@/components/ui';
import { statusColors, formatDate } from '@/lib/utils';
import { ProjectStatus, type Project, type PageMeta, type ProjectType } from '@/types';

export default function ProjectsPage() {
  const { can } = useAuthContext();
  const [projects, setProjects] = useState<Project[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', status: ProjectStatus.EN_PROGRESO, projectTypeId: '' });
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    projectTypesService
      .getAll()
      .then(setProjectTypes)
      .catch(() => setProjectTypes([]));
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      const res = await projectsService.getPage({ page });
      setProjects(res.data);
      setMeta(res.meta);
    } catch {
      toast.error('No se pudieron cargar los proyectos');
    } finally {
      setLoading(false);
    }
  }, [page, toast]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { projectTypeId, ...rest } = formData;
      await projectsService.create({
        ...rest,
        ...(projectTypeId ? { projectTypeId } : {}),
      });
      setShowModal(false);
      setFormData({ name: '', description: '', status: ProjectStatus.EN_PROGRESO, projectTypeId: '' });
      toast.success('Proyecto creado');
      loadProjects();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo crear el proyecto');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-accent-900">Proyectos</h1>
          <p className="text-sm lg:text-base text-accent-500">Gestiona todos los proyectos</p>
        </div>
        {can('project:create') && (
          <Button onClick={() => setShowModal(true)} className="w-full sm:w-auto">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo proyecto
          </Button>
        )}
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <svg className="w-16 h-16 text-accent-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-accent-900 mb-1">No hay proyectos</h3>
            <p className="text-accent-500">Crea tu primer proyecto para comenzar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card hover className="h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                    <Badge className={statusColors[project.status]}>{project.status.replace('_', ' ')}</Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-accent-900 mb-2">{project.name}</h3>
                  <p className="text-sm text-accent-500 line-clamp-2 mb-4">{project.description || 'Sin descripción'}</p>
                  <div className="flex items-center gap-4 text-xs text-accent-400">
                    <span>{project.activities?.length || 0} actividades</span>
                    {project.startDate && <span>{formatDate(project.startDate)}</span>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {meta && projects.length > 0 && (
        <Pagination meta={meta} onPageChange={setPage} />
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nuevo proyecto"
        subtitle="Define la información básica para iniciar el seguimiento"
        size="2xl"
        icon={
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
        }
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowModal(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="new-project-form"
              loading={saving}
              disabled={!formData.name.trim()}
            >
              Crear proyecto
            </Button>
          </>
        }
      >
        <form
          id="new-project-form"
          onSubmit={handleCreate}
          className="space-y-6"
        >
          <section className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold tracking-wider uppercase text-accent-500">
                Información general
              </h3>
              <p className="text-xs text-accent-400 mt-0.5">
                Datos descriptivos del proyecto
              </p>
            </div>
            <Input
              id="name"
              label="Nombre del proyecto"
              placeholder="Ej. Pavimentación calle 12"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
            <Textarea
              id="description"
              label="Descripción"
              placeholder="Objetivo, alcance y consideraciones del proyecto"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
            />
          </section>

          <div className="h-px bg-accent-100" />

          <section className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold tracking-wider uppercase text-accent-500">
                Clasificación
              </h3>
              <p className="text-xs text-accent-400 mt-0.5">
                Estado inicial y tipo de proyecto
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                id="status"
                label="Estado"
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as ProjectStatus,
                  })
                }
                options={[
                  { value: 'EN_PROGRESO', label: 'En progreso' },
                  { value: 'PAUSADO', label: 'Pausado' },
                  { value: 'COMPLETADO', label: 'Completado' },
                  { value: 'CANCELADO', label: 'Cancelado' },
                ]}
              />
              <Select
                id="projectType"
                label="Tipo de proyecto"
                value={formData.projectTypeId}
                onChange={(e) =>
                  setFormData({ ...formData, projectTypeId: e.target.value })
                }
                placeholder="Sin tipo"
                options={[
                  { value: '', label: 'Sin tipo' },
                  ...projectTypes.map((t) => ({
                    value: t.id,
                    label: t.name,
                  })),
                ]}
              />
            </div>
          </section>
        </form>
      </Modal>
    </div>
  );
}
