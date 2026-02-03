'use client';

import { useEffect, useState } from 'react';
import { stagesService } from '@/services';
import { Button, Card, CardContent, Modal, Input, Textarea, ConfirmModal, useToast } from '@/components/ui';
import type { Stage } from '@/types';

export default function StagesPage() {
  const toast = useToast();
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', order: 0, color: '#00923f' });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; stageId: string | null }>({
    open: false,
    stageId: null,
  });
  const [deleting, setDeleting] = useState(false);

  const loadStages = async () => {
    try {
      const data = await stagesService.getAll();
      setStages(data.sort((a, b) => a.order - b.order));
    } catch {
      toast.error('Error al cargar las etapas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStages();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await stagesService.create({ ...formData, order: stages.length + 1 });
      setShowModal(false);
      setFormData({ name: '', description: '', order: 0, color: '#00923f' });
      toast.success('Etapa creada correctamente');
      loadStages();
    } catch {
      toast.error('Error al crear la etapa');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.stageId) return;
    setDeleting(true);
    try {
      await stagesService.delete(deleteConfirm.stageId);
      setDeleteConfirm({ open: false, stageId: null });
      toast.success('Etapa eliminada correctamente');
      loadStages();
    } catch {
      toast.error('Error al eliminar la etapa');
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
          <h1 className="text-xl lg:text-2xl font-bold text-accent-900">Etapas</h1>
          <p className="text-sm lg:text-base text-accent-500">Configura las etapas del flujo de trabajo</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="w-full sm:w-auto">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva etapa
        </Button>
      </div>

      {stages.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <svg className="w-16 h-16 text-accent-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <h3 className="text-lg font-medium text-accent-900 mb-1">Sin etapas</h3>
            <p className="text-accent-500">Crea etapas para organizar el flujo de trabajo</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {stages.map((stage, index) => (
            <Card key={stage.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shrink-0"
                      style={{ backgroundColor: stage.color || '#00923f' }}
                    >
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-accent-900 truncate">{stage.name}</h3>
                      <p className="text-sm text-accent-500 truncate">{stage.description || 'Sin descripción'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="color"
                      value={stage.color || '#00923f'}
                      onChange={async (e) => {
                        await stagesService.update(stage.id, { color: e.target.value });
                        loadStages();
                      }}
                      className="w-8 h-8 rounded cursor-pointer"
                      title="Cambiar color"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteConfirm({ open: true, stageId: stage.id })}
                    >
                      <svg className="w-4 h-4 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nueva etapa" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            id="name"
            label="Nombre"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: En progreso"
            required
          />
          <Textarea
            id="description"
            label="Descripción (opcional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe esta etapa..."
            rows={2}
          />
          <div>
            <label className="block text-sm font-medium text-accent-700 mb-1">Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <span className="text-sm text-accent-500">{formData.color}</span>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              Crear etapa
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, stageId: null })}
        onConfirm={handleDelete}
        title="Eliminar etapa"
        message="¿Estás seguro de eliminar esta etapa? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
