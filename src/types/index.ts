export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  weeklyHours: number;
  avatar?: string;
  ra?: string;
  cargo?: string;
  recessStartDate?: string; // YYYY-MM-DD
  onRecess?: boolean;
}

export interface TimeEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  entry1: string | null;
  exit1: string | null;
  entry2: string | null;
  exit2: string | null;
  totalHours: number;
  justification?: string; // required if > 6h10min
  notes?: string;
}

export interface HourBalance {
  userId: string;
  month: string; // YYYY-MM
  expectedHours: number;
  workedHours: number;
  balance: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert';
  createdAt: string;
  read: boolean;
  targetUserId?: string;
}

export interface Justification {
  id: string;
  userId: string;
  date: string;
  type: 'atestado' | 'compensado';
  description?: string;
  attachmentName?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: string;
  performedBy: string;
}
