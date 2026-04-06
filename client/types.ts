
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'operator';
  status: 'active' | 'suspended';
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
  assignedTo?: string | User;
  createdAt?: string;
  updatedAt?: string;
  rca?: RCA;
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

export interface RCA {
  id: string;
  incident_id: string;
  title: string;
  category: 'Server Issue' | 'Network Issue' | 'Application Bug' | 'Human Error' | 'Third-Party Failure';
  summary: string;
  detailed_analysis: string;
  preventive_measures: string;
  status: 'Draft' | 'Submitted' | 'Approved';
  created_by: string | User;
  createdAt?: string;
  updatedAt?: string;
}
