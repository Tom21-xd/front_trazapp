'use client';

import { useEffect, useState } from 'react';
import { tagsService } from '@/services';
import { Button, Card, CardHeader, CardContent, Badge, Modal, Input } from '@/components/ui';
import type { Tag } from '@/types';

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', color: '#00923f' });
  const [saving, setSaving] = useState(false);

  const loadTags = async () => {
    try {
      const data = await tagsService.getAll();
      setTags(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await tagsService.create(formData);
      setShowModal(false);
      setFormData({ name: '', color: '#00923f' });
      loadTags();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta etiqueta?')) return;
    try {
      await tagsService.delete(id);
      loadTags();
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-accent-900">Etiquetas</h1>
          <p className="text-accent-500">Organiza proyectos y actividades con etiquetas</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
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
                <div key={tag.id} className="flex items-center justify-between p-4 hover:bg-accent-50">
                  <div className="flex items-center gap-4">
                    <Badge style={{ backgroundColor: tag.color || '#00923f', color: '#fff' }}>{tag.name}</Badge>
                    <span className="text-sm text-accent-500">
                      {(tag._count?.projects || 0) + (tag._count?.activities || 0)} usos
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={tag.color || '#00923f'}
                      onChange={async (e) => {
                        await tagsService.update(tag.id, { color: e.target.value });
                        loadTags();
                      }}
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(tag.id)}>
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nueva etiqueta" size="sm">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            id="name"
            label="Nombre"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: Frontend"
            required
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
              <Badge style={{ backgroundColor: formData.color, color: '#fff' }}>{formData.name || 'Etiqueta'}</Badge>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              Crear etiqueta
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
