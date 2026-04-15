export type MaintenanceType = 'Preventiva' | 'Corretiva';
export type MaintenanceStatus = 'Pendente' | 'Concluída';

export interface MonitoringLog {
  id: string;
  timestamp: string;
  heliumLevel: number;
  heliumPressure: number;
  tempTechnicalRoom: number;
  tempExamRoom: number;
  humidityTechnicalRoom: number;
  humidityExamRoom: number;
  waterFlow: number;
  waterTemp: number;
  compressorPressure: number;
  machineId: string;
  authorUid?: string;
}

export interface MaintenanceTask {
  id: string;
  type: MaintenanceType;
  date: string;
  description: string;
  status: MaintenanceStatus;
  machineId: string;
  observations?: string;
  imageUrl?: string;
}

export interface Report {
  id: string;
  date: string;
  author: string;
  title: string;
  content: string;
  machineId: string;
}

export interface Machine {
  id: string;
  name: string;
  model: string;
  location: string;
}

export type UserRole = 'admin' | 'gestor' | 'operador' | 'tecnico_manutencao' | 'administrativo' | 'enfermagem';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface CalendarNote {
  id: string;
  date: string;
  content: string;
  imageUrl?: string;
  authorName: string;
  authorUid: string;
  timestamp: string;
  isMaintenance?: boolean;
}
