'use client';

import { useEffect, useState, useCallback } from 'react';
import { tagsService } from '@/services';
import { Button, Card, CardHeader, CardContent, Badge, Modal, Input, useToast, ConfirmModal, ColorPicker } from '@/components/ui';
import type { Tag } from '@/types';

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', color: '#00923f' });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  const loadTags = useCallback(async () => {
    try {
      const data = await tagsService.getAll();
      setTags(data);
    } catch {
      toast.error('No se pudieron cargar las etiquetas');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await tagsService.create(formData);
      setShowModal(false);
      setFormData({ name: '', color: '#00923f' });
      toast.success('Etiqueta creada');
      loadTags();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo crear la etiqueta');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await tagsService.delete(deleteId);
      toast.success('Etiqueta eliminada');
      setDeleteId(null);
      loadTags();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo eliminar la etiqueta');
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
          <h1 className="text-xl lg:text-2xl font-bold text-accent-900">Etiquetas</h1>
          <p className="text-sm lg:text-base text-accent-500">Organiza proyectos y actividades con etiquetas</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="w-full sm:w-auto">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva etiqueta
        </Button>
      </div>

      {tags.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <svg className="w-16 h-16 text-accent-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <h3 className="text-lg font-medium text-accent-900 mb-1">Sin etiquetas</h3>
            <p className="text-accent-500">Crea etiquetas para categorizar tu trabajo</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-accent-900">{tags.length} etiquetas</h2>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-accent-200">
              {tags.map((tag) => (
                <div key={tag.id} className="flex items-center justify-between gap-3 p-4 hover:bg-accent-50">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Badge className="truncate max-w-[40vw]" style={{ backgroundColor: tag.color || '#00923f', color: '#fff' }}>{tag.name}</Badge>
                    <span className="text-sm text-accent-500 shrink-0 hidden sm:inline">
                      {(tag._count?.projects || 0) + (tag._count?.activities || 0)} usos
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <ColorPicker
                      value={tag.color || '#00923f'}
                      onChange={async (color) => {
                        try {
                          await tagsService.update(tag.id, { color });
                          loadTags();
                        } catch {
                          toast.error('No se pudo actualizar el color');
                        }
                      }}
                    />
                    <Button size="sm" variant="ghost" onClick={() => setDeleteId(tag.id)}>
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

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nueva etiqueta"
        subtitle="Etiquetas para clasificar actividades y proyectos"
        size="lg"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        }
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="new-tag-form"
              loading={saving}
              disabled={!formData.name.trim()}
            >
              Crear etiqueta
            </Button>
          </>
        }
      >
        <form id="new-tag-form" onSubmit={handleCreate} className="space-y-6">
          <section className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold tracking-wider uppercase text-accent-500">
                Información
              </h3>
              <p className="text-xs text-accent-400 mt-0.5">Nombre y color que la identifican</p>
            </div>
            <Input
              id="name"
              label="Nombre"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej. Urgente"
              required
            />
            <div>
              <span className="block text-sm font-medium text-accent-700 mb-2">Color</span>
              <div className="flex items-center gap-4 flex-wrap">
                <ColorPicker
                  value={formData.color}
                  onChange={(color) => setFormData({ ...formData, color })}
                />
                <Badge style={{ backgroundColor: formData.color, color: '#fff' }}>
                  {formData.name || 'Etiqueta'}
                </Badge>
              </div>
            </div>
          </section>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar etiqueta"
        message="¿Estás seguro de eliminar esta etiqueta? Se quitará de proyectos y actividades asociados."
        confirmText="Eliminar"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
