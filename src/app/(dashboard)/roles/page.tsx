'use client';

import { useEffect, useState, useCallback } from 'react';
import { rolesService } from '@/services';
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
  Pagination,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import type { AppRole, PermissionGroup, PageMeta } from '@/types';

const emptyForm = { name: '', description: '', permissionKeys: [] as string[] };

export default function RolesPage() {
  const toast = useToast();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [page, setPage] = useState(1);
  const [catalog, setCatalog] = useState<PermissionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AppRole | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await rolesService.getPage({ page });
      setRoles(res.data);
      setMeta(res.meta);
    } catch {
      toast.error('No se pudieron cargar los roles');
    } finally {
      setLoading(false);
    }
  }, [page, toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    rolesService
      .listPermissions()
      .then(setCatalog)
      .catch(() => setCatalog([]));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (role: AppRole) => {
    setEditing(role);
    setForm({
      name: role.name,
      description: role.description ?? '',
      permissionKeys: [...role.permissionKeys],
    });
    setShowModal(true);
  };

  const togglePerm = (key: string) => {
    setForm((f) => ({
      ...f,
      permissionKeys: f.permissionKeys.includes(key)
        ? f.permissionKeys.filter((k) => k !== key)
        : [...f.permissionKeys, key],
    }));
  };

  const toggleGroup = (group: PermissionGroup) => {
    const keys = group.permissions.map((p) => p.key);
    const allOn = keys.every((k) => form.permissionKeys.includes(k));
    setForm((f) => ({
      ...f,
      permissionKeys: allOn
        ? f.permissionKeys.filter((k) => !keys.includes(k))
        : [...new Set([...f.permissionKeys, ...keys])],
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await rolesService.update(editing.id, {
          name: form.name,
          description: form.description,
          permissionKeys: form.permissionKeys,
        });
        toast.success('Rol actualizado');
      } else {
        await rolesService.create(form);
        toast.success('Rol creado');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar el rol');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await rolesService.delete(deleteId);
      toast.success('Rol eliminado');
      setDeleteId(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo eliminar');
    } finally {
      setDeleting(false);
    }
  };

  const allKeys = catalog.flatMap((g) => g.permissions.map((p) => p.key));
  const totalPerms = allKeys.length;

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
          <h1 className="text-xl lg:text-2xl font-bold text-accent-900">Roles y permisos</h1>
          <p className="text-sm lg:text-base text-accent-500">
            Define roles y qué puede hacer cada uno
          </p>
        </div>
        <Button onClick={openCreate} className="w-full sm:w-auto">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo rol
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-accent-900">
            {meta?.total ?? roles.length} roles
          </h2>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-accent-200">
            {roles.map((role) => (
              <div
                key={role.id}
                className="flex items-center justify-between gap-3 p-4 hover:bg-accent-50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-accent-900 truncate">{role.name}</span>
                    {role.isSystem && <Badge variant="default">Sistema</Badge>}
                    <span className="text-xs text-accent-400">
                      {role.userCount} usuario(s)
                    </span>
                  </div>
                  <p className="text-sm text-accent-500 mt-0.5">
                    {role.permissionKeys.length} permiso(s)
                    {role.description ? ` · ${role.description}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => openEdit(role)}>
                    Editar
                  </Button>
                  {!role.isSystem && (
                    <Button size="sm" variant="ghost" onClick={() => setDeleteId(role.id)}>
                      <svg className="w-4 h-4 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {meta && roles.length > 0 && (
        <Pagination meta={meta} onPageChange={setPage} />
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? `Editar rol: ${editing.name}` : 'Nuevo rol'}
        subtitle={
          editing?.isSystem
            ? 'Rol del sistema · solo puedes ajustar sus permisos'
            : 'Define el nombre y los permisos que tendrá este rol'
        }
        size="2xl"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        }
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="role-form"
              loading={saving}
              disabled={!form.name.trim()}
            >
              {editing ? 'Guardar cambios' : 'Crear rol'}
            </Button>
          </>
        }
      >
        <form id="role-form" onSubmit={handleSave} className="space-y-6">
          <section className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold tracking-wider uppercase text-accent-500">
                Identidad
              </h3>
              <p className="text-xs text-accent-400 mt-0.5">
                Cómo se identifica el rol
              </p>
            </div>
            <Input
              id="name"
              label="Nombre del rol"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej. Supervisor"
              required
              disabled={!!editing?.isSystem}
            />
            <Textarea
              id="description"
              label="Descripción (opcional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Qué responsabilidades tiene quien lleva este rol"
              rows={3}
            />
          </section>

          <div className="h-px bg-accent-100" />

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-semibold tracking-wider uppercase text-accent-500">
                  Permisos
                </h3>
                <p className="text-xs text-accent-400 mt-0.5">
                  Acciones que podrá realizar quien tenga este rol
                </p>
              </div>
              <span className="text-xs text-accent-500 shrink-0">
                <span className="font-semibold text-primary-700">
                  {form.permissionKeys.length}
                </span>{' '}
                de {totalPerms}
              </span>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({ ...f, permissionKeys: [...allKeys] }))
                }
                className="px-2.5 py-1 text-xs font-medium rounded-lg border border-primary-200 text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors"
              >
                Seleccionar todo
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, permissionKeys: [] }))}
                className="px-2.5 py-1 text-xs font-medium rounded-lg border border-accent-200 text-accent-600 bg-white hover:bg-accent-50 transition-colors"
              >
                Limpiar
              </button>
            </div>

            <div className="space-y-3 max-h-[44dvh] overflow-y-auto pr-1 -mr-1">
              {catalog.map((group) => {
                const keys = group.permissions.map((p) => p.key);
                const sel = keys.filter((k) =>
                  form.permissionKeys.includes(k),
                ).length;
                const allOn = sel === keys.length && keys.length > 0;
                return (
                  <div
                    key={group.group}
                    className="border border-accent-200 rounded-xl overflow-hidden"
                  >
                    <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-accent-50 border-b border-accent-200">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-semibold text-accent-800 truncate">
                          {group.group}
                        </span>
                        <span
                          className={cn(
                            'text-[11px] font-medium px-1.5 py-0.5 rounded-full border',
                            sel > 0
                              ? 'bg-primary-50 border-primary-200 text-primary-700'
                              : 'bg-white border-accent-200 text-accent-500',
                          )}
                        >
                          {sel}/{keys.length}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleGroup(group)}
                        className="text-xs font-medium text-primary-600 hover:text-primary-700 shrink-0"
                      >
                        {allOn ? 'Quitar todos' : 'Seleccionar todos'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2">
                      {group.permissions.map((perm) => {
                        const checked = form.permissionKeys.includes(perm.key);
                        return (
                          <button
                            key={perm.key}
                            type="button"
                            onClick={() => togglePerm(perm.key)}
                            className={cn(
                              'flex items-start gap-3 text-left px-4 py-2.5 border-b border-accent-100 transition-colors',
                              checked
                                ? 'bg-primary-50/60 hover:bg-primary-50'
                                : 'hover:bg-accent-50',
                            )}
                          >
                            <span
                              className={cn(
                                'mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors',
                                checked
                                  ? 'bg-primary-600 border-primary-600'
                                  : 'bg-white border-accent-300',
                              )}
                            >
                              {checked && (
                                <svg
                                  className="w-3.5 h-3.5 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </span>
                            <span className="text-sm text-accent-700 leading-snug">
                              {perm.description}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar rol"
        message="¿Eliminar este rol? No podrás si tiene usuarios asignados."
        confirmText="Eliminar"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
