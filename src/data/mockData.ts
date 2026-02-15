import { TimeEntry, HourBalance, Notification, User } from '@/types';

export const mockUsers: User[] = [
  { id: '1', name: 'Maria Silva', email: 'maria@empresa.com', role: 'user', department: 'Desenvolvimento', weeklyHours: 30 },
  { id: '3', name: 'João Santos', email: 'joao@empresa.com', role: 'user', department: 'Design', weeklyHours: 30 },
  { id: '4', name: 'Ana Oliveira', email: 'ana@empresa.com', role: 'user', department: 'Marketing', weeklyHours: 20 },
  { id: '5', name: 'Carlos Pereira', email: 'carlos@empresa.com', role: 'user', department: 'Desenvolvimento', weeklyHours: 30 },
  { id: '6', name: 'Beatriz Costa', email: 'beatriz@empresa.com', role: 'user', department: 'Financeiro', weeklyHours: 20 },
];

export const mockTimeEntries: TimeEntry[] = [
  { id: '1', userId: '1', date: '2026-02-13', entry1: '08:15', exit1: '12:10', entry2: '13:05', exit2: '17:20', totalHours: 8.17, status: 'approved', approvedBy: '2', approvedAt: '2026-02-13' },
  { id: '2', userId: '1', date: '2026-02-14', entry1: '07:45', exit1: '11:50', entry2: '12:40', exit2: '16:30', totalHours: 7.92, status: 'approved', approvedBy: '2', approvedAt: '2026-02-14' },
  { id: '3', userId: '1', date: '2026-02-15', entry1: '08:10', exit1: '12:05', entry2: null, exit2: null, totalHours: 3.92, status: 'pending' },
  { id: '4', userId: '3', date: '2026-02-13', entry1: '09:10', exit1: '12:30', entry2: '13:15', exit2: '17:45', totalHours: 7.83, status: 'pending' },
  { id: '5', userId: '3', date: '2026-02-14', entry1: '08:30', exit1: '12:15', entry2: '13:10', exit2: '17:20', totalHours: 7.92, status: 'pending' },
  { id: '6', userId: '4', date: '2026-02-13', entry1: '08:05', exit1: '12:20', entry2: null, exit2: null, totalHours: 4.25, status: 'approved', approvedBy: '2', approvedAt: '2026-02-13' },
  { id: '7', userId: '5', date: '2026-02-14', entry1: '07:50', exit1: '12:10', entry2: '13:05', exit2: '17:15', totalHours: 8.5, status: 'rejected', notes: 'Horário inconsistente' },
];

export const mockBalances: HourBalance[] = [
  { userId: '1', month: '2026-02', expectedHours: 120, workedHours: 112.5, balance: -7.5 },
  { userId: '3', month: '2026-02', expectedHours: 120, workedHours: 125.3, balance: 5.3 },
  { userId: '4', month: '2026-02', expectedHours: 80, workedHours: 78.2, balance: -1.8 },
  { userId: '5', month: '2026-02', expectedHours: 120, workedHours: 118.0, balance: -2.0 },
  { userId: '6', month: '2026-02', expectedHours: 80, workedHours: 82.5, balance: 2.5 },
];

export const mockNotifications: Notification[] = [
  { id: '1', title: 'Lembrete de Ponto', message: 'Não esqueça de registrar seu ponto hoje.', type: 'info', createdAt: '2026-02-15T08:00:00', read: false },
  { id: '2', title: 'Ponto Rejeitado', message: 'Seu registro do dia 14/02 foi rejeitado. Verifique os horários.', type: 'warning', createdAt: '2026-02-14T18:00:00', read: false },
  { id: '3', title: 'Nova Regra', message: 'A partir de março, horários fechados não serão aceitos.', type: 'alert', createdAt: '2026-02-12T10:00:00', read: true },
];
