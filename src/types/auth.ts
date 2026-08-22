export interface LoginAuditLog {
  id: string;
  userId?: string | null;
  email: string;
  role: string;
  status: 'SUCCESS' | 'FAILED' | 'LOGOUT' | 'REGISTERED';
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface DatabaseStatus {
  connected: boolean;
  type: 'Supabase Database' | 'Supabase PostgreSQL';
  totalUsers: number;
  totalLogs: number;
}
