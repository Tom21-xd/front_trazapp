'use client';

import { useEffect, useState, useCallback } from 'react';
import { usersService, rolesService } from '@/services';
import { Button, Card, CardHeader, CardContent, Badge, Avatar, Modal, Input, Select, Pagination, useToast } from '@/components/ui';
import { formatDateTime } from '@/lib/utils';
import type { User, PageMeta, AppRole } from '@/types';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', appRoleId: '' });
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const toast = useToast();

  useEffect(() => {
    rolesService
      .getAll()
      .then(setRoles)
      .catch(() => setRoles([]));
  }, []);

  const handleAssignRole = async (userId: string, roleId: string) => {
    try {
      await rolesService.assignToUser(userId, roleId || null);
      toast.success('Rol actualizado');
      loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo asignar el rol');
    }
  };

  const loadUsers = useCallback(async () => {
    try {
      const res = await usersService.getPage({ page });
      setUsers(res.data);
      setMeta(res.meta);
    } catch {
      toast.error('No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  }, [page, toast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { appRoleId, ...rest } = formData;
      await usersService.create({
        ...rest,
        ...(appRoleId ? { appRoleId } : {}),
      });
      setShowModal(false);
      setFormData({ name: '', email: '', password: '', phone: '', appRoleId: '' });
      toast.success('Usuario creado');
      loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo crear el usuario');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      if (user.isActive) {
        await usersService.deactivate(user.id);
      } else {
        await usersService.activate(user.id);
      }
      loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo actualizar el usuario');
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
          <h1 className="text-xl lg:text-2xl font-bold text-accent-900">Usuarios</h1>
          <p className="text-sm lg:text-base text-accent-500">Administra los usuarios del sistema</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="w-full sm:w-auto">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo usuario
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-accent-900">{meta?.total ?? users.length} usuarios</h2>
        </CardHeader>
        <CardContent className="p-0">
          {/* Móvil: tarjetas */}
          <div className="md:hidden divide-y divide-accent-200">
            {users.map((user) => (
              <div key={user.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={user.name} size="sm" />
                    <div className="min-w-0">
                      <p className="font-medium text-accent-900 truncate">{user.name}</p>
                      <p className="text-xs text-accent-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <Badge variant={user.isActive ? 'success' : 'danger'}>
                    {user.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <Select
                  value={user.appRole?.id ?? ''}
                  onChange={(e) => handleAssignRole(user.id, e.target.value)}
                  placeholder="Sin rol"
                  options={[
                    { value: '', label: 'Sin rol' },
                    ...roles.map((r) => ({ value: r.id, label: r.name })),
                  ]}
                />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-accent-500 truncate">
                    Último acceso:{' '}
                    {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Nunca'}
                  </span>
                  <Button
                    size="sm"
                    variant={user.isActive ? 'danger' : 'primary'}
                    onClick={() => handleToggleActive(user)}
                  >
                    {user.isActive ? 'Desactivar' : 'Activar'}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Escritorio: tabla */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-accent-50 border-b border-accent-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-accent-500 uppercase">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-accent-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-accent-500 uppercase">Rol</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-accent-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-accent-500 uppercase">Último acceso</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-accent-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-accent-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-accent-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} size="sm" />
                        <span className="font-medium text-accent-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-accent-600">{user.email}</td>
                    <td className="px-6 py-4 min-w-48">
                      <Select
                        value={user.appRole?.id ?? ''}
                        onChange={(e) => handleAssignRole(user.id, e.target.value)}
                        placeholder="Sin rol"
                        options={[
                          { value: '', label: 'Sin rol' },
                          ...roles.map((r) => ({ value: r.id, label: r.name })),
                        ]}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={user.isActive ? 'success' : 'danger'}>
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-accent-500">
                      {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Nunca'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        size="sm"
                        variant={user.isActive ? 'danger' : 'primary'}
                        onClick={() => handleToggleActive(user)}
                      >
                        {user.isActive ? 'Desactivar' : 'Activar'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {meta && <Pagination meta={meta} onPageChange={setPage} />}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nuevo usuario"
        subtitle="Crea una cuenta y asígnale un rol del sistema"
        size="2xl"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        }
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="new-user-form"
              loading={saving}
              disabled={
                !formData.name.trim() ||
                !formData.email.trim() ||
                !formData.password ||
                formData.password.length < 6
              }
            >
              Crear usuario
            </Button>
          </>
        }
      >
        <form id="new-user-form" onSubmit={handleCreate} className="space-y-6">
          <section className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold tracking-wider uppercase text-accent-500">
                Identidad
              </h3>
              <p className="text-xs text-accent-400 mt-0.5">Cómo se identifica la persona</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="name"
                label="Nombre completo"
                placeholder="Ej. Juan Pérez"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                id="phone"
                type="tel"
                label="Teléfono (opcional)"
                placeholder="Ej. +57 300 000 0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </section>

          <div className="h-px bg-accent-100" />

          <section className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold tracking-wider uppercase text-accent-500">
                Acceso
              </h3>
              <p className="text-xs text-accent-400 mt-0.5">Credenciales y rol asignado</p>
            </div>
            <Input
              id="email"
              type="email"
              label="Correo electrónico"
              placeholder="usuario@trazapp.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="password"
                type="password"
                label="Contraseña"
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                minLength={6}
                required
              />
              <Select
                id="appRoleId"
                label="Rol"
                value={formData.appRoleId}
                onChange={(e) => setFormData({ ...formData, appRoleId: e.target.value })}
                placeholder="Sin rol"
                options={[
                  { value: '', label: 'Sin rol' },
                  ...roles.map((r) => ({ value: r.id, label: r.name })),
                ]}
              />
            </div>
          </section>
        </form>
      </Modal>
    </div>
  );
}
