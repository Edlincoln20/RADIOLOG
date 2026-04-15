import React from 'react';
import { 
  LayoutDashboard, 
  Scan, 
  Calendar, 
  FileText, 
  Settings as SettingsIcon, 
  LogOut,
  Menu,
  X,
  ChevronDown,
  Sun,
  Moon,
  Users
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { MACHINES } from '../constants';
import { UserProfile } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  profile: UserProfile | null;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isDarkMode: boolean;
}

export function Sidebar({ 
  activeTab, 
  setActiveTab, 
  onLogout, 
  profile,
  isCollapsed,
  setIsCollapsed,
  isDarkMode
}: SidebarProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'monitoring', label: 'Monitoramento', icon: Scan },
    { id: 'maintenance', label: 'Manutenções', icon: Calendar },
    { id: 'reports', label: 'Relatórios', icon: FileText },
  ];

  const adminItems = [
    { id: 'users', label: 'Usuários', icon: Users },
  ];

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'gestor': return 'Gestor';
      case 'operador': return 'Operador';
      case 'tecnico_manutencao': return 'Técnico Manutenção';
      case 'administrativo': return 'Administrativo';
      case 'enfermagem': return 'Enfermagem';
      default: return 'Usuário';
    }
  };

  // Close sidebar when a tab is selected on mobile
  const handleTabSelect = (tabId: string) => {
    setActiveTab(tabId);
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden bg-slate-900/50 text-white hover:bg-slate-900 backdrop-blur-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X /> : <Menu />}
      </Button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 bg-slate-900 text-white transition-all duration-300 ease-in-out transform md:translate-x-0",
        isCollapsed ? "w-20" : "w-64",
        !isOpen && "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className={cn("p-6 flex items-center justify-between", isCollapsed && "px-4")}>
            {!isCollapsed && (
              <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <Scan className="text-blue-400" />
                  RadioLog
                </h1>
                <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">
                  Gestão de Radiologia
                </p>
              </div>
            )}
            {isCollapsed && <Scan className="text-blue-400 mx-auto size-8" />}
            
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex items-center justify-center p-1 rounded hover:bg-slate-800 text-slate-400"
            >
              <Menu size={20} />
            </button>
          </div>

          {profile && !isCollapsed && (
            <div className="px-6 py-4 border-y border-slate-800 bg-slate-800/30">
              <p className="text-sm font-bold truncate">{profile.name}</p>
              <p className="text-[10px] text-blue-400 uppercase font-bold tracking-wider">
                {getRoleLabel(profile.role)}
              </p>
            </div>
          )}

          <div className={cn("px-6 my-6", isCollapsed && "px-2")}>
            {!isCollapsed && <Label className="text-[10px] uppercase text-slate-500 font-bold mb-2 block">Equipamento Selecionado</Label>}
            <Select defaultValue={MACHINES[0].id}>
              <SelectTrigger className={cn("bg-slate-800 border-slate-700 text-white h-9", isCollapsed && "px-2")}>
                <SelectValue placeholder={isCollapsed ? "" : "Selecione"} />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                {MACHINES.map(m => (
                  <SelectItem key={m.id} value={m.id} className="hover:bg-slate-700 focus:bg-slate-700">
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <nav className="flex-1 px-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabSelect(item.id)}
                title={isCollapsed ? item.label : ""}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
                  isCollapsed && "justify-center px-0",
                  activeTab === item.id 
                    ? "bg-blue-600 text-white" 
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon size={20} />
                {!isCollapsed && item.label}
              </button>
            ))}

            {profile?.role === 'admin' && (
              <div className="pt-4 mt-4 border-t border-slate-800">
                <p className={cn("px-4 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500", isCollapsed && "text-center px-0")}>
                  {isCollapsed ? "ADM" : "Administração"}
                </p>
                {adminItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleTabSelect(item.id)}
                    title={isCollapsed ? item.label : ""}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
                      isCollapsed && "justify-center px-0",
                      activeTab === item.id 
                        ? "bg-blue-600 text-white" 
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <item.icon size={20} />
                    {!isCollapsed && item.label}
                  </button>
                ))}
              </div>
            )}
          </nav>

          <div className="p-4 border-t border-slate-800">
            <button 
              onClick={() => handleTabSelect('settings')}
              title={isCollapsed ? "Configurações" : ""}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
                isCollapsed && "justify-center px-0",
                activeTab === 'settings' 
                  ? "bg-blue-600 text-white" 
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <SettingsIcon size={20} />
              {!isCollapsed && "Configurações"}
            </button>
            <button 
              onClick={onLogout}
              title={isCollapsed ? "Sair" : ""}
              className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-900/20 transition-colors text-sm font-medium mt-1", isCollapsed && "justify-center px-0")}
            >
              <LogOut size={20} />
              {!isCollapsed && "Sair"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

