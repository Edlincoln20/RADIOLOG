import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Moon, Sun, Monitor, Bell, Shield, User, Loader2, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { UserProfile } from '../types';
import { db, doc, updateDoc, handleFirestoreError, OperationType } from '../firebase';
import { Input } from './ui/input';

interface SettingsProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  profile: UserProfile | null;
  onProfileUpdate: (profile: UserProfile) => void;
}

export function Settings({ isDarkMode, toggleDarkMode, profile, onProfileUpdate }: SettingsProps) {
  const [isEditingProfile, setIsEditingProfile] = React.useState(false);
  const [newName, setNewName] = React.useState(profile?.name || '');
  const [isSaving, setIsSaving] = React.useState(false);

  const handleUpdateName = async () => {
    if (!profile || !newName.trim() || newName === profile.name) {
      setIsEditingProfile(false);
      return;
    }

    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, { name: newName });
      onProfileUpdate({ ...profile, name: newName });
      setIsEditingProfile(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.uid}`);
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'gestor': return 'Gestor';
      case 'operador': return 'Operador';
      case 'tecnico_manutencao': return 'Técnico Manutenção';
      default: return 'Usuário';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
        <p className="text-muted-foreground">Gerencie as preferências do seu aplicativo e conta.</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Aparência</CardTitle>
            <CardDescription>Personalize como o RadioLog aparece para você.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label>Tema</Label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => isDarkMode && toggleDarkMode()}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                    !isDarkMode ? "border-blue-600 bg-blue-50/50 dark:bg-blue-900/20" : "border-transparent bg-muted hover:bg-accent"
                  )}
                >
                  <Sun className={cn("size-6", !isDarkMode ? "text-blue-600" : "text-muted-foreground")} />
                  <span className="text-xs font-medium">Claro</span>
                </button>
                <button
                  onClick={() => !isDarkMode && toggleDarkMode()}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                    isDarkMode ? "border-blue-600 bg-blue-50/50 dark:bg-blue-900/20" : "border-transparent bg-muted hover:bg-accent"
                  )}
                >
                  <Moon className={cn("size-6", isDarkMode ? "text-blue-600" : "text-muted-foreground")} />
                  <span className="text-xs font-medium">Escuro</span>
                </button>
                <button
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-transparent bg-muted hover:bg-accent opacity-50 cursor-not-allowed"
                >
                  <Monitor className="size-6 text-muted-foreground" />
                  <span className="text-xs font-medium">Sistema</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notificações</CardTitle>
            <CardDescription>Configure como você deseja receber alertas técnicos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Alertas de Hélio Crítico</p>
                <p className="text-xs text-muted-foreground">Receba notificações quando o nível de hélio estiver abaixo de 40%.</p>
              </div>
              <div className="size-5 rounded-full bg-blue-600" />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Alertas de Temperatura</p>
                <p className="text-xs text-muted-foreground">Notificar quando a sala técnica exceder 22°C.</p>
              </div>
              <div className="size-5 rounded-full bg-blue-600" />
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                <User size={20} />
              </div>
              <div>
                <CardTitle className="text-lg">Perfil</CardTitle>
                <CardDescription>Dados da sua conta</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditingProfile ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="name" className="text-xs">Nome de Exibição</Label>
                    <Input 
                      id="name" 
                      value={newName} 
                      onChange={(e) => setNewName(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1" 
                      onClick={handleUpdateName}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 size={14} className="animate-spin mr-2" /> : <Check size={14} className="mr-2" />}
                      Salvar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        setIsEditingProfile(false);
                        setNewName(profile?.name || '');
                      }}
                      disabled={isSaving}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{profile?.name}</p>
                    <p className="text-xs text-muted-foreground">{profile?.email}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => setIsEditingProfile(true)}
                  >
                    Editar Perfil
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600">
                <Shield size={20} />
              </div>
              <div>
                <CardTitle className="text-lg">Segurança</CardTitle>
                <CardDescription>Acesso e permissões</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Nível de Acesso</p>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {getRoleLabel(profile?.role)}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Sua conta é autenticada via Google. Para alterar sua senha ou configurações de segurança da conta, acesse as configurações da sua Conta Google.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer">
                  Gerenciar Conta Google
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
