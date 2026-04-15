import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar as CalendarIcon, Plus, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { MaintenanceTask } from '../types';
import { 
  db, 
  auth, 
  collection, 
  addDoc, 
  updateDoc,
  doc,
  onSnapshot, 
  query, 
  orderBy, 
  handleFirestoreError, 
  OperationType 
} from '../firebase';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from './ui/textarea';
import { Camera, Edit2, Image as ImageIcon, X } from 'lucide-react';

export function Maintenance() {
  const [tasks, setTasks] = React.useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<MaintenanceTask | null>(null);

  // Form state
  const [formData, setFormData] = React.useState({
    type: 'Preventiva',
    date: new Date().toISOString().split('T')[0],
    description: '',
    machineId: 'mri-01',
    status: 'Pendente',
    observations: '',
    imageUrl: ''
  });

  React.useEffect(() => {
    const q = query(collection(db, 'maintenance'), orderBy('date', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newTasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MaintenanceTask[];
      setTasks(newTasks);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'maintenance');
    });

    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setFormData({
      type: 'Preventiva',
      date: new Date().toISOString().split('T')[0],
      description: '',
      machineId: 'mri-01',
      status: 'Pendente',
      observations: '',
      imageUrl: ''
    });
    setEditingTask(null);
  };

  const handleEdit = (task: MaintenanceTask) => {
    setEditingTask(task);
    setFormData({
      type: task.type,
      date: task.date,
      description: task.description,
      machineId: task.machineId,
      status: task.status,
      observations: task.observations || '',
      imageUrl: task.imageUrl || ''
    });
    setOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, we would upload to Firebase Storage
      // For this demo, we'll use a local object URL or a placeholder
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setIsSubmitting(true);
    try {
      if (editingTask) {
        const taskRef = doc(db, 'maintenance', editingTask.id);
        await updateDoc(taskRef, {
          ...formData,
          authorUid: auth.currentUser.uid
        });
      } else {
        const newTask = {
          ...formData,
          authorUid: auth.currentUser.uid
        };
        await addDoc(collection(db, 'maintenance'), newTask);
      }
      
      setOpen(false);
      resetForm();
    } catch (error) {
      handleFirestoreError(error, editingTask ? OperationType.UPDATE : OperationType.CREATE, 'maintenance');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Agenda de Manutenções</h2>
        
        <Dialog open={open} onOpenChange={(val) => {
          setOpen(val);
          if (!val) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={16} /> Agendar Manutenção
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingTask ? 'Editar Manutenção' : 'Agendar Manutenção'}</DialogTitle>
                <DialogDescription>
                  Preencha os dados da atividade de manutenção e anexe a ordem de serviço.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(v) => setFormData({...formData, type: v as any})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Preventiva">Preventiva</SelectItem>
                        <SelectItem value="Corretiva">Corretiva</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(v) => setFormData({...formData, status: v as any})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                        <SelectItem value="Concluída">Concluída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="desc">Descrição da Atividade</Label>
                  <Input
                    id="desc"
                    placeholder="Ex: Troca de filtros, Manutenção do Chiller..."
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="obs">Observações Técnicas</Label>
                  <Textarea
                    id="obs"
                    placeholder="Detalhes adicionais sobre a execução..."
                    value={formData.observations}
                    onChange={(e) => setFormData({...formData, observations: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ordem de Serviço / Imagem</Label>
                  <div className="flex flex-col gap-4">
                    {formData.imageUrl ? (
                      <div className="relative rounded-lg overflow-hidden border aspect-video bg-muted group">
                        <img 
                          src={formData.imageUrl} 
                          alt="Ordem de Serviço" 
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                        <Button 
                          type="button"
                          variant="destructive" 
                          size="icon" 
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setFormData({...formData, imageUrl: ''})}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-accent border-border transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Camera className="w-8 h-8 mb-3 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground font-semibold">Clique para anexar imagem</p>
                            <p className="text-xs text-muted-foreground/70">PNG, JPG ou PDF</p>
                          </div>
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingTask ? 'Salvar Alterações' : 'Agendar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        <Card className="md:col-span-8">
          <CardHeader>
            <CardTitle>Próximas Atividades e Histórico</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">Nenhuma manutenção agendada.</p>
                ) : (
                  tasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-4 p-4 rounded-xl border bg-card hover:shadow-md transition-all group">
                      <div className={`p-2 rounded-lg shrink-0 ${
                        task.status === 'Concluída' ? 'bg-green-500/10 text-green-600' : 'bg-blue-500/10 text-blue-600'
                      }`}>
                        {task.status === 'Concluída' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold truncate pr-2">{task.description}</h4>
                          <Badge variant={task.type === 'Preventiva' ? 'default' : 'secondary'}>
                            {task.type}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarIcon size={14} /> {new Date(task.date).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="flex items-center gap-1">
                            <AlertCircle size={14} /> {task.status}
                          </span>
                          {task.imageUrl && (
                            <span className="flex items-center gap-1 text-blue-600 font-medium">
                              <ImageIcon size={14} /> Anexo
                            </span>
                          )}
                        </div>
                        {task.observations && (
                          <p className="mt-2 text-sm bg-muted/50 p-2 rounded border-l-4 border-muted-foreground/30 italic line-clamp-2">
                            "{task.observations}"
                          </p>
                        )}
                        {task.imageUrl && (
                          <div className="mt-3 rounded-lg overflow-hidden border max-w-xs">
                             <img 
                              src={task.imageUrl} 
                              alt="OS" 
                              className="w-full h-24 object-cover hover:scale-105 transition-transform cursor-pointer"
                              onClick={() => handleEdit(task)}
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleEdit(task)}
                      >
                        <Edit2 size={16} />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="md:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumo Mensal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Preventivas Realizadas</span>
                <span className="font-bold">{tasks.filter(t => t.type === 'Preventiva' && t.status === 'Concluída').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Corretivas Realizadas</span>
                <span className="font-bold text-amber-600">{tasks.filter(t => t.type === 'Corretiva' && t.status === 'Concluída').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Taxa de Disponibilidade</span>
                <span className="font-bold text-green-600">98.5%</span>
              </div>
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-2">Próxima Preventiva Geral:</p>
                <div className="flex items-center gap-2 text-blue-600 font-semibold">
                  <CalendarIcon size={16} />
                  {tasks.find(t => t.status === 'Pendente')?.date || 'Nenhuma agendada'}
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

