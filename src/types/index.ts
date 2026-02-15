export type UserRole = 'user' | 'admin';

export type PointStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  weeklyHours: number;
  avatar?: string;
}

export interface TimeEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  entry1: string | null; // decimal format e.g. "07:15"
  exit1: string | null;
  entry2: string | null;
  exit2: string | null;
  totalHours: number;
  status: PointStatus;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
}

export interface HourBalance {
  userId: string;
  month: string; // YYYY-MM
  expectedHours: number;
  workedHours: number;
  balance: number; // positive or negative
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert';
  createdAt: string;
  read: boolean;
  targetUserId?: string; // null = all users
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: string;
  performedBy: string;
}
