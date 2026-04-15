import { Machine } from './types';

export const MACHINES: Machine[] = [
  { id: 'mri-01', name: 'Ressonância 01', model: 'Siemens Magnetom', location: 'Sala A' },
  { id: 'mri-02', name: 'Ressonância 02', model: 'GE Signa', location: 'Sala B' },
];

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { id: 'monitoring', label: 'Monitoramento', icon: 'Activity' },
  { id: 'maintenance', label: 'Manutenções', icon: 'Calendar' },
  { id: 'reports', label: 'Relatórios', icon: 'FileText' },
];
