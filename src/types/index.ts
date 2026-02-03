// Enums
export enum Role {
  ADMIN = 'ADMIN',
  EMPLEADO = 'EMPLEADO',
}

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

// Base interfaces
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: Role;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
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
  comments?: Comment[];
  tags?: Tag[];
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

export interface Comment {
  id: string;
  content: string;
  userId: string;
  user?: User;
  activityId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  _count?: { projects: number; activities: number };
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
  role?: Role;
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
