
export interface User {
  id: string;
  username: string;
  name: string;
  email?: string;
  role: 'admin' | 'operator';
  status: 'active' | 'suspended';
  lastLogin: string;
  profileImage?: string;
  mustChangePassword?: boolean;
  password?: string;
}

export interface OperationalMetric {
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: string;
}

export interface SystemIncident {
  id: string;
  _id?: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved' | 'monitoring';
  timestamp: string;
  affectedServices?: string[];
  rootCause?: string;
  resolutionSteps?: string[];
}

export interface OperationLog {
  timestamp: string;
  service: string;
  event: string;
  details: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  isRead: boolean;
  category: string;
}
