import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { FileText, Search, Plus, Calendar, User, Loader2, Trash2, Send } from 'lucide-react';
import { Report, UserProfile } from '../types';
import { 
  db, 
  auth, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  doc,
  deleteDoc,
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

interface ReportsProps {
  profile: UserProfile | null;
}

export function Reports({ profile }: ReportsProps) {
  const [reports, setReports] = React.useState<Report[]>([]);
  const [sectorObservations, setSectorObservations] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [newObservation, setNewObservation] = React.useState('');
  const [isSubmittingObs, setIsSubmittingObs] = React.useState(false);

  // Form state
  const [formData, setFormData] = React.useState({
    title: '',
    content: '',
    machineId: 'mri-01'
  });

  React.useEffect(() => {
    const qReports = query(collection(db, 'reports'), orderBy('date', 'desc'));
    const qObs = query(collection(db, 'sector_observations'), orderBy('timestamp', 'desc'));
    
    const unsubReports = onSnapshot(qReports, (snapshot) => {
      const newReports = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Report[];
      setReports(newReports);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reports');
    });

    const unsubObs = onSnapshot(qObs, (snapshot) => {
      const obs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSectorObservations(obs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'sector_observations');
    });

    return () => {
      unsubReports();
      unsubObs();
    };
  }, []);

  const handleDeleteReport = async (reportId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Tem certeza que deseja excluir este relatório?')) return;

    try {
      await deleteDoc(doc(db, 'reports', reportId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `reports/${reportId}`);
    }
  };

  const handleAddObservation = async () => {
    if (!auth.currentUser || !newObservation.trim()) return;

    setIsSubmittingObs(true);
    try {
      const obs = {
        text: newObservation,
        user: profile?.name || auth.currentUser.displayName || auth.currentUser.email || 'Usuário',
        authorUid: auth.currentUser.uid,
        timestamp: new Date().toISOString()
      };

      await addDoc(collection(db, 'sector_observations'), obs);
      setNewObservation('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'sector_observations');
    } finally {
      setIsSubmittingObs(false);
    }
  };

  const handleDeleteObservation = async (obsId: string) => {
    try {
      await deleteDoc(doc(db, 'sector_observations', obsId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `sector_observations/${obsId}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setIsSubmitting(true);
    try {
      const newReport = {
        ...formData,
        date: new Date().toISOString().split('T')[0],
        author: auth.currentUser.displayName || auth.currentUser.email || 'Usuário',
        authorUid: auth.currentUser.uid
      };

      await addDoc(collection(db, 'reports'), newReport);
      setOpen(false);
      setFormData({ title: '', content: '', machineId: 'mri-01' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reports');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Relatórios e Observações</h2>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={16} /> Novo Relatório
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Novo Relatório</DialogTitle>
                <DialogDescription>
                  Registre observações importantes ou relatórios de performance.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="content">Conteúdo</Label>
                  <textarea 
                    id="content"
                    className="w-full min-h-[150px] p-3 rounded-md border bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Publicar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Pesquisar relatórios..." className="pl-10" />
        </div>
        <Button variant="outline">Filtrar</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <Card key={report.id} className="group hover:border-blue-500 transition-colors cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <FileText size={20} />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar size={12} /> {new Date(report.date).toLocaleDateString('pt-BR')}
                    </span>
                    {(profile?.role === 'admin' || (auth.currentUser && report.authorUid === auth.currentUser.uid)) && (
                      <button 
                        onClick={(e) => handleDeleteReport(report.id, e)}
                        className="text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <CardTitle className="mt-4 text-lg leading-tight">{report.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {report.content}
                </p>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-700 pt-4 border-t">
                  <User size={14} />
                  {report.author}
                </div>
              </CardContent>
            </Card>
          ))}
          
          <button 
            onClick={() => setOpen(true)}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-8 hover:border-blue-400 hover:bg-blue-500/5 transition-all group"
          >
            <div className="p-3 rounded-full bg-muted text-muted-foreground group-hover:bg-blue-500/10 group-hover:text-blue-600 transition-colors">
              <Plus size={24} />
            </div>
            <span className="text-sm font-medium text-muted-foreground group-hover:text-blue-600">Criar novo relatório</span>
          </button>
        </div>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Observações do Setor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sectorObservations.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-4">Nenhuma observação registrada.</p>
            ) : (
              sectorObservations.map((obs) => (
                <div key={obs.id} className="flex gap-4 p-3 rounded-lg bg-muted/50 group">
                  <div className="h-8 w-8 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center text-xs font-bold">
                    {obs.user.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{obs.user}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(obs.timestamp).toLocaleTimeString('pt-BR')}
                        </span>
                      </div>
                      {(profile?.role === 'admin' || (auth.currentUser && obs.authorUid === auth.currentUser.uid)) && (
                        <button 
                          onClick={() => handleDeleteObservation(obs.id)}
                          className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{obs.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <Input 
              placeholder="Escreva uma observação..." 
              value={newObservation}
              onChange={(e) => setNewObservation(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddObservation()}
            />
            <Button 
              variant="secondary" 
              onClick={handleAddObservation}
              disabled={isSubmittingObs || !newObservation.trim()}
            >
              {isSubmittingObs ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

