'use client';

import { useEffect, useState, useCallback } from 'react';
import { usersService } from '@/services';
import { Button, Card, CardHeader, CardContent, Badge, Avatar, Modal, Input, Select, Pagination, useToast } from '@/components/ui';
import { formatDateTime } from '@/lib/utils';
import { Role, type User, type PageMeta } from '@/types';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', role: Role.EMPLEADO });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

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
      await usersService.create(formData);
      setShowModal(false);
      setFormData({ name: '', email: '', password: '', phone: '', role: Role.EMPLEADO });
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-190">
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
                    <td className="px-6 py-4">
                      <Badge variant={user.role === 'ADMIN' ? 'primary' : 'default'}>{user.role}</Badge>
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nuevo usuario" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            id="name"
            label="Nombre completo"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            id="email"
            type="email"
            label="Correo electrónico"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <Input
            id="password"
            type="password"
            label="Contraseña"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            minLength={6}
            required
          />
          <Input
            id="phone"
            type="tel"
            label="Teléfono (opcional)"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Select
            id="role"
            label="Rol"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
            options={[
              { value: 'EMPLEADO', label: 'Empleado' },
              { value: 'ADMIN', label: 'Administrador' },
            ]}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              Crear usuario
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
