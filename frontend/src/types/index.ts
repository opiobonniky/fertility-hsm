// ── Roles ──────────────────────────────────────────────────────
export type Role =
  | "ADMIN"
  | "CONSULTANT"
  | "SPECIALIST"
  | "NURSE"
  | "EMBRYOLOGIST"
  | "COUNSELLOR"
  | "SONOGRAPHER"
  | "LAB_TECH"
  | "BILLING"
  | "RECEPTIONIST"
  | "VIEWER";

export const ROLES: Record<Role, string> = {
  ADMIN: "System Admin",
  CONSULTANT: "Consultant Doctor",
  SPECIALIST: "Fertility Specialist",
  NURSE: "Nurse",
  EMBRYOLOGIST: "Embryologist",
  COUNSELLOR: "Counsellor",
  SONOGRAPHER: "Sonographer",
  LAB_TECH: "Lab Technician",
  BILLING: "Billing Officer",
  RECEPTIONIST: "Receptionist",
  VIEWER: "Viewer (Read-Only)",
};

// ── User ───────────────────────────────────────────────────────
export interface User {
  id: string;
  staffCode: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  roleId: string;
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  staffCode: string;
  password: string;
}

export interface CreateUserRequest {
  staffCode: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleId: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

// ── API ────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

// ── Patient ────────────────────────────────────────────────────
export interface Patient {
  id: string;
  mrn: string;
  oldMrn?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality?: string;
  nationalId?: string;
  gender: "MALE" | "FEMALE";
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  occupation?: string;
  company?: string;
  hearUsFrom?: string;
  branch?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Cycle ──────────────────────────────────────────────────────
export type CycleStatus =
  | "UNDER_STIMULATION"
  | "OPU_SCHEDULED"
  | "OPU_COMPLETED"
  | "ET_SCHEDULED"
  | "ET_COMPLETED"
  | "PREGNANCY_TEST"
  | "PREGNANCY_CONFIRMED"
  | "CYCLE_CANCELLED"
  | "CYCLE_COMPLETED";

export type ARTType = "ICSI" | "IVF" | "IUI" | "FET" | "NATURAL";

export interface Cycle {
  id: string;
  coupleId: string;
  cycleNumber: number;
  artType: ARTType;
  status: CycleStatus;
  treatingPhysicianId?: string;
  createdAt: string;
}

// ── Appointment ────────────────────────────────────────────────
export type AppointmentStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface Appointment {
  id: string;
  patientId: string;
  physicianId?: string;
  service: string;
  clinicId?: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes?: string;
}

// ── Task ───────────────────────────────────────────────────────
export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigneeId: string;
  dueDate?: string;
  createdAt: string;
}

// ── Prescription ────────────────────────────────────────────────
export type PrescriptionStatus = "ACTIVE" | "COMPLETED" | "DISCONTINUED" | "CANCELLED";
export type MedicationRoute = "ORAL" | "INJECTION" | "TOPICAL" | "SUBLINGUAL" | "RECTAL" | "INHALATION" | "OTHER";
export type MedicationFrequency = "ONCE_DAILY" | "TWICE_DAILY" | "THREE_TIMES_DAILY" | "FOUR_TIMES_DAILY" | "EVERY_OTHER_DAY" | "WEEKLY" | "ONCE" | "AS_DIRECTED" | "OTHER";

export interface Prescription {
  id: string;
  patientId: string;
  cycleId?: string;
  medicationName: string;
  medicationRoute: MedicationRoute;
  dosage: string;
  frequency: MedicationFrequency;
  frequencyDetail?: string;
  duration?: string;
  startDate: string;
  endDate?: string;
  refills: number;
  refillsUsed: number;
  notes?: string;
  instructions?: string;
  diagnosis?: string;
  sideEffects?: string;
  status: PrescriptionStatus;
  prescribedBy?: { id: string; firstName: string; lastName: string; staffCode?: string; role?: { name: string; label: string } };
  cycle?: { id: string; cycleNumber: number; artType: string };
  createdAt: string;
  updatedAt: string;
}

export interface ClinicalTimeline {
  prescriptions: Prescription[];
  investigations: any[];
  cycles: any[];
  appointments: any[];
}

// ── Invoice ────────────────────────────────────────────────────
export type InvoiceStatus = "DRAFT" | "SENT" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELLED";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: InvoiceStatus;
  createdAt: string;
}
