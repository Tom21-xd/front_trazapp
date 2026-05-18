'use client';

import { useEffect, useState, useCallback } from 'react';
import { projectTypesService } from '@/services';
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  Badge,
  Modal,
  Input,
  Textarea,
  useToast,
  ConfirmModal,
  ColorPicker,
  Pagination,
} from '@/components/ui';
import type { ProjectType, PageMeta } from '@/types';

export default function ProjectTypesPage() {
  const toast = useToast();
  const [types, setTypes] = useState<ProjectType[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', color: '#00923f' });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await projectTypesService.getPage({ page });
      setTypes(res.data);
      setMeta(res.meta);
    } catch {
      toast.error('No se pudieron cargar los tipos de proyecto');
    } finally {
      setLoading(false);
    }
  }, [page, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await projectTypesService.create(form);
      setShowModal(false);
      setForm({ name: '', description: '', color: '#00923f' });
      toast.success('Tipo de proyecto creado');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo crear');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await projectTypesService.delete(deleteId);
      toast.success('Tipo eliminado');
      setDeleteId(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo eliminar');
    } finally {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-accent-900">Tipos de proyecto</h1>
          <p className="text-sm lg:text-base text-accent-500">Clasifica los proyectos por tipo</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="w-full sm:w-auto">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo tipo
        </Button>
      </div>

      {types.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-medium text-accent-900 mb-1">Sin tipos</h3>
            <p className="text-accent-500">Crea tipos para clasificar tus proyectos</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-accent-900">
              {meta?.total ?? types.length} tipos
            </h2>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-accent-200">
              {types.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-3 p-4 hover:bg-accent-50"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Badge
                      className="truncate max-w-[40vw]"
                      style={{ backgroundColor: t.color || '#00923f', color: '#fff' }}
                    >
                      {t.name}
                    </Badge>
                    <span className="text-sm text-accent-500 truncate hidden sm:inline">
                      {t.description || 'Sin descripción'}
                    </span>
                    <span className="text-xs text-accent-400 shrink-0">
                      {t._count?.projects ?? 0} proyectos
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <ColorPicker
                      value={t.color || '#00923f'}
                      onChange={async (color) => {
                        try {
                          await projectTypesService.update(t.id, { color });
                          load();
                        } catch {
                          toast.error('No se pudo actualizar el color');
                        }
                      }}
                    />
                    <Button size="sm" variant="ghost" onClick={() => setDeleteId(t.id)}>
                      <svg className="w-4 h-4 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {meta && types.length > 0 && (
        <Pagination meta={meta} onPageChange={setPage} />
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nuevo tipo de proyecto" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            id="name"
            label="Nombre"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ej: Obra pública"
            required
          />
          <Textarea
            id="description"
            label="Descripción (opcional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
          />
          <div>
            <span className="block text-sm font-medium text-accent-700 mb-1">Color</span>
            <div className="flex items-center gap-3 flex-wrap">
              <ColorPicker
                value={form.color}
                onChange={(color) => setForm({ ...form, color })}
              />
              <Badge style={{ backgroundColor: form.color, color: '#fff' }}>
                {form.name || 'Tipo'}
              </Badge>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              Crear tipo
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar tipo de proyecto"
        message="¿Eliminar este tipo? No podrás si tiene proyectos asociados."
        confirmText="Eliminar"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
