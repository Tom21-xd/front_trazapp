// Enums
export enum Priority {
  BAJA = 'BAJA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
  URGENTE = 'URGENTE',
}

export enum ProjectStatus {
  EN_PROGRESO = 'EN_PROGRESO',
  PAUSADO = 'PAUSADO',
  COMPLETADO = 'COMPLETADO',
  CANCELADO = 'CANCELADO',
}

export enum StageChangeStatus {
  PENDIENTE = 'PENDIENTE',
  APROBADO = 'APROBADO',
  RECHAZADO = 'RECHAZADO',
}

// Paginación (envelope uniforme de todos los listados)
export interface PageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

// Base interfaces
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  // RBAC granular
  permissions?: string[];
  appRoleId?: string | null;
  appRoleName?: string | null;
  appRole?: { id: string; name: string } | null;
}

export interface AppRole {
  id: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  userCount: number;
  permissionKeys: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PermissionGroup {
  group: string;
  permissions: { key: string; description: string }[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  projectTypeId?: string;
  projectType?: ProjectType;
  tags?: Tag[];
  activities?: Activity[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectType {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isActive?: boolean;
  _count?: { projects: number };
  createdAt?: string;
  updatedAt?: string;
}

export type NotificationType =
  | 'ACTIVIDAD_ASIGNADA'
  | 'SOLICITUD_CAMBIO_ETAPA'
  | 'CAMBIO_ETAPA_APROBADO'
  | 'CAMBIO_ETAPA_RECHAZADO'
  | 'NUEVO_COMENTARIO'
  | 'PROYECTO_ACTUALIZADO';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: { activityId?: string } | null;
  createdAt: string;
}

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'STAGE_CHANGE_REQUEST'
  | 'STAGE_CHANGE_APPROVED'
  | 'STAGE_CHANGE_REJECTED'
  | 'ASSIGNMENT_CREATED'
  | 'ASSIGNMENT_REMOVED';

export interface AuditLog {
  id: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: { id: string; name: string; email: string };
}

export interface Stage {
  id: string;
  name: string;
  description?: string;
  order: number;
  color?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  dueDate?: string;
  isActive: boolean;
  projectId: string;
  project?: Project;
  currentStageId: string;
  currentStage?: Stage;
  assignments?: ActivityAssignment[];
  assignedUsers?: User[];
  comments?: Comment[];
  tags?: Tag[];
  files?: FileAttachment[];
  dependsOn?: Activity[];
  dependedBy?: Activity[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivityAssignment {
  id: string;
  userId: string;
  user?: User;
  activityId: string;
  assignedAt: string;
}

export interface FileAttachment {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  uploadedById: string;
  activityId?: string | null;
  commentId?: string | null;
  stageChangeRequestId?: string | null;
  stageChangeCommentId?: string | null;
  url: string;
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  user?: User;
  activityId: string;
  files?: FileAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  _count?: { projects: number; activities: number };
}

// Timeline / trazabilidad
export type ActivityEventType =
  | 'CREATED'
  | 'UPDATED'
  | 'STAGE_CHANGED'
  | 'STAGE_CHANGE_REQUESTED'
  | 'STAGE_CHANGE_APPROVED'
  | 'STAGE_CHANGE_REJECTED'
  | 'ASSIGNED'
  | 'UNASSIGNED'
  | 'COMMENT_ADDED'
  | 'FILE_UPLOADED';

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  createdAt: string;
  activityId: string;
  actorId: string;
  actor?: { id: string; name: string; email: string; avatar?: string };
  targetUserId?: string | null;
  targetUser?: { id: string; name: string; email: string; avatar?: string } | null;
  fromStageId?: string | null;
  fromStage?: { id: string; name: string; color?: string } | null;
  toStageId?: string | null;
  toStage?: { id: string; name: string; color?: string } | null;
  stageChangeRequestId?: string | null;
  stageChangeRequest?: {
    id: string;
    status: StageChangeStatus;
    description: string;
    reviewComment?: string;
  } | null;
  commentId?: string | null;
  comment?: { id: string; content: string } | null;
  fileId?: string | null;
  file?: { id: string; originalName: string; mimeType: string; size: number } | null;
  note?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface StageChangeRequest {
  id: string;
  description: string;
  status: StageChangeStatus;
  reviewComment?: string;
  reviewedAt?: string;
  activityId: string;
  activity?: Activity;
  fromStageId: string;
  fromStage?: Stage;
  toStageId: string;
  toStage?: Stage;
  requestedById: string;
  requestedBy?: User;
  reviewedById?: string;
  reviewedBy?: User;
  createdAt: string;
  updatedAt: string;
}

// Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// DTOs
export interface CreateProjectDto {
  name: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: string;
  endDate?: string;
  projectTypeId?: string;
  tagIds?: string[];
}

export interface CreateActivityDto {
  title: string;
  description?: string;
  priority?: Priority;
  dueDate?: string;
  projectId: string;
  currentStageId: string;
  assignedUserIds?: string[];
  tagIds?: string[];
}

export interface CreateStageDto {
  name: string;
  description?: string;
  order: number;
  color?: string;
}

export interface CreateTagDto {
  name: string;
  color?: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  phone?: string;
  appRoleId?: string;
}

export interface ReviewStageChangeDto {
  status: 'APROBADO' | 'RECHAZADO';
  reviewComment?: string;
}

export interface ProjectStats {
  projectId: string;
  projectName: string;
  projectStatus: ProjectStatus;
  totalActivities: number;
  activitiesByStage: Record<string, number>;
  activitiesByPriority: Record<Priority, number>;
}
