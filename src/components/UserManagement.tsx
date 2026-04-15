import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { 
  db, 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc,
  deleteDoc,
  handleFirestoreError, 
  OperationType 
} from '../firebase';
import { UserProfile } from '../types';
import { Loader2, Shield, User as UserIcon, Edit2, Check, X, Trash2 } from 'lucide-react';
import { Input } from './ui/input';

export function UserManagement() {
  const [users, setUsers] = React.useState<UserProfile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const userList = snapshot.docs.map(doc => doc.data() as UserProfile);
      setUsers(userList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    return () => unsubscribe();
  }, []);

  const handleRoleChange = async (uid: string, newRole: string) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { role: newRole });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const handleUpdateName = async (uid: string) => {
    if (!editName.trim()) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { name: editName });
      setEditingId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (!window.confirm('Tem certeza que deseja remover este usuário do sistema? Esta ação não pode ser desfeita.')) return;
    
    try {
      const userRef = doc(db, 'users', uid);
      await deleteDoc(userRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${uid}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Gestão de Usuários</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Nível de Acesso</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.uid}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <UserIcon size={14} />
                        </div>
                        {editingId === user.uid ? (
                          <div className="flex items-center gap-1">
                            <Input 
                              value={editName} 
                              onChange={(e) => setEditName(e.target.value)}
                              className="h-8 text-xs w-[150px]"
                              autoFocus
                            />
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleUpdateName(user.uid)} disabled={isSaving}>
                              {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={14} />}
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => setEditingId(null)} disabled={isSaving}>
                              <X size={14} />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group/name">
                            <span className="truncate max-w-[150px]">{user.name}</span>
                            <button 
                              onClick={() => {
                                setEditingId(user.uid);
                                setEditName(user.name);
                              }}
                              className="opacity-0 group-hover/name:opacity-100 transition-opacity text-muted-foreground hover:text-blue-600"
                            >
                              <Edit2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.role === 'admin' && <Shield size={14} className="text-blue-600" />}
                        <span className="capitalize">{user.role.replace('_', ' ')}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Select 
                          defaultValue={user.role} 
                          onValueChange={(value) => handleRoleChange(user.uid, value)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Alterar Cargo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="gestor">Gestor</SelectItem>
                            <SelectItem value="operador">Operador</SelectItem>
                            <SelectItem value="tecnico_manutencao">Técnico de Manutenção</SelectItem>
                            <SelectItem value="administrativo">Administrativo</SelectItem>
                            <SelectItem value="enfermagem">Enfermagem</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-muted-foreground hover:text-red-600"
                          onClick={() => handleDeleteUser(user.uid)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
