'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { projectsService } from '@/services';
import { useAuthContext } from '@/store/AuthContext';
import { Button, Card, CardContent, Badge, Modal, Input, Textarea, Select } from '@/components/ui';
import { statusColors, formatDate } from '@/lib/utils';
import type { Project, ProjectStatus } from '@/types';

export default function ProjectsPage() {
  const { isAdmin } = useAuthContext();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', status: 'EN_PROGRESO' as ProjectStatus });
  const [saving, setSaving] = useState(false);

  const loadProjects = async () => {
    try {
      const data = await projectsService.getAll();
      setProjects(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await projectsService.create(formData);
      setShowModal(false);
      setFormData({ name: '', description: '', status: 'EN_PROGRESO' });
      loadProjects();
    } catch (error) {
      console.error('Error:', error);
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
        {isAdmin && (
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nuevo proyecto" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            id="name"
            label="Nombre del proyecto"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Textarea
            id="description"
            label="Descripción"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
          <Select
            id="status"
            label="Estado"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
            options={[
              { value: 'EN_PROGRESO', label: 'En progreso' },
              { value: 'PAUSADO', label: 'Pausado' },
              { value: 'COMPLETADO', label: 'Completado' },
              { value: 'CANCELADO', label: 'Cancelado' },
            ]}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              Crear proyecto
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
