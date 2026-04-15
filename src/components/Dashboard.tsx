import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { 
  Thermometer, 
  Gauge, 
  Droplets, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  TrendingUp,
  Calendar as CalendarIcon,
  Search,
  ChevronRight,
  Paperclip,
  Trash2,
  Camera,
  X
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  db, 
  auth,
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  where,
  addDoc,
  deleteDoc,
  doc,
  handleFirestoreError, 
  OperationType 
} from '../firebase';
import { MonitoringLog, MaintenanceTask, CalendarNote } from '../types';
import { Calendar } from './ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { cn } from '../lib/utils';

export function Dashboard() {
  const [latestLog, setLatestLog] = React.useState<MonitoringLog | null>(null);
  const [history, setHistory] = React.useState<MonitoringLog[]>([]);
  const [upcomingMaintenance, setUpcomingMaintenance] = React.useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  // Calendar interaction state
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());
  const [dayLogs, setDayLogs] = React.useState<MonitoringLog[]>([]);
  const [dayTasks, setDayTasks] = React.useState<MaintenanceTask[]>([]);
  const [dayNotes, setDayNotes] = React.useState<CalendarNote[]>([]);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

  // Note form state
  const [noteContent, setNoteContent] = React.useState('');
  const [noteImage, setNoteImage] = React.useState('');
  const [isMaintenance, setIsMaintenance] = React.useState(false);
  const [isSubmittingNote, setIsSubmittingNote] = React.useState(false);
  const [allNotes, setAllNotes] = React.useState<CalendarNote[]>([]);

  React.useEffect(() => {
    // Latest monitoring log
    const qLatest = query(collection(db, 'monitoring'), orderBy('timestamp', 'desc'), limit(1));
    const unsubLatest = onSnapshot(qLatest, (snapshot) => {
      if (!snapshot.empty) {
        setLatestLog({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as MonitoringLog);
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'monitoring'));

    // History for chart
    const qHistory = query(collection(db, 'monitoring'), orderBy('timestamp', 'desc'), limit(20));
    const unsubHistory = onSnapshot(qHistory, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).reverse() as MonitoringLog[];
      setHistory(logs);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'monitoring'));

    // Upcoming maintenance
    const qMaint = query(collection(db, 'maintenance'), orderBy('date', 'asc'), limit(5));
    const unsubMaint = onSnapshot(qMaint, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MaintenanceTask[];
      setUpcomingMaintenance(tasks.filter(t => t.status === 'Pendente'));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'maintenance'));

    // Fetch all notes for calendar indicators
    const qAllNotes = query(collection(db, 'calendar_notes'), orderBy('date', 'asc'));
    const unsubAllNotes = onSnapshot(qAllNotes, (snapshot) => {
      const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CalendarNote[];
      setAllNotes(notes);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'calendar_notes'));

    return () => {
      unsubLatest();
      unsubHistory();
      unsubMaint();
      unsubAllNotes();
    };
  }, []);

  // Fetch data for selected date
  React.useEffect(() => {
    if (!selectedDate) return;

    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const startIso = startOfDay.toISOString();
    const endIso = endOfDay.toISOString();

    // Query logs for the day
    const qLogs = query(
      collection(db, 'monitoring'), 
      where('timestamp', '>=', startIso),
      where('timestamp', '<=', endIso),
      orderBy('timestamp', 'asc')
    );

    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MonitoringLog[];
      setDayLogs(logs);
    });

    // Query tasks for the day
    const qTasks = query(
      collection(db, 'maintenance'),
      where('date', '>=', startIso),
      where('date', '<=', endIso)
    );

    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MaintenanceTask[];
      setDayTasks(tasks);
    });

    // Query notes for the day
    const dateStr = selectedDate.toISOString().split('T')[0];
    const qNotes = query(
      collection(db, 'calendar_notes'),
      where('date', '==', dateStr),
      orderBy('timestamp', 'desc')
    );

    const unsubNotes = onSnapshot(qNotes, (snapshot) => {
      const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CalendarNote[];
      setDayNotes(notes);
    });

    return () => {
      unsubLogs();
      unsubTasks();
      unsubNotes();
    };
  }, [selectedDate]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNoteImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !selectedDate || !noteContent.trim()) return;

    setIsSubmittingNote(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const newNote = {
        date: dateStr,
        content: noteContent,
        imageUrl: noteImage,
        isMaintenance: isMaintenance,
        authorName: auth.currentUser.displayName || auth.currentUser.email || 'Usuário',
        authorUid: auth.currentUser.uid,
        timestamp: new Date().toISOString()
      };

      await addDoc(collection(db, 'calendar_notes'), newNote);
      setNoteContent('');
      setNoteImage('');
      setIsMaintenance(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'calendar_notes');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteDoc(doc(db, 'calendar_notes', noteId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `calendar_notes/${noteId}`);
    }
  };

  const combinedUpcoming = [
    ...upcomingMaintenance.map(m => ({ 
      id: m.id, 
      date: m.date, 
      description: m.description, 
      type: m.type,
      isTask: true 
    })),
    ...allNotes
      .filter(n => n.isMaintenance && n.date >= new Date().toISOString().split('T')[0])
      .map(n => ({ 
        id: n.id, 
        date: n.date, 
        description: n.content, 
        type: 'Nota de Manutenção', 
        isTask: false 
      }))
  ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Sistema Online: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hélio / Pressão</CardTitle>
              <Droplets className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{latestLog?.heliumLevel.toFixed(1) || '--'}% / {latestLog?.heliumPressure.toFixed(1) || '--'} PSI</div>
              <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                <CheckCircle2 size={12} /> Sistema Criogênico OK
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Temp. Salas (Téc/Exame)</CardTitle>
              <Thermometer className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{latestLog?.tempTechnicalRoom.toFixed(1) || '--'}° / {latestLog?.tempExamRoom.toFixed(1) || '--'}°</div>
              <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                <CheckCircle2 size={12} /> Climatização Estável
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-l-4 border-l-cyan-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Water (Flow/Temp)</CardTitle>
              <Gauge className="h-4 w-4 text-cyan-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{latestLog?.waterFlow.toFixed(1) || '--'} L/m / {latestLog?.waterTemp.toFixed(1) || '--'}°</div>
              <p className="text-xs text-blue-500 flex items-center gap-1 mt-1">
                <Clock size={12} /> Chiller em operação
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pressão Compressor</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{latestLog?.compressorPressure.toFixed(1) || '--'} PSI</div>
              <p className="text-xs text-muted-foreground mt-1">
                Status: {latestLog && latestLog.compressorPressure > 1.5 ? 'Normal' : 'Verificar'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Tendência de Hélio e Temperaturas</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="colorHelium" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis 
                    dataKey="timestamp" 
                    stroke="var(--muted-foreground)" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  />
                  <YAxis 
                    stroke="var(--muted-foreground)" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '8px', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                    labelFormatter={(val) => new Date(val).toLocaleString()}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="heliumLevel" 
                    name="Nível Hélio (%)"
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorHelium)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="tempExamRoom" 
                    name="Temp. Exame (°C)"
                    stroke="#ef4444" 
                    strokeWidth={2}
                    fill="transparent"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Próximas Atividades</CardTitle>
              <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <CalendarIcon className="h-4 w-4 text-blue-600" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px] h-[600px] flex flex-col">
                  <DialogHeader>
                    <DialogTitle>Calendário de Atividades e Histórico</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-1 gap-6 overflow-hidden py-4">
                    <div className="w-[300px] border rounded-lg p-2 bg-muted/30">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className="rounded-md"
                        modifiers={{
                          hasNote: (date) => allNotes.some(n => n.date === date.toISOString().split('T')[0] && !n.isMaintenance),
                          hasMaintenance: (date) => allNotes.some(n => n.date === date.toISOString().split('T')[0] && n.isMaintenance),
                        }}
                        modifiersClassNames={{
                          hasNote: "after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-blue-500 after:rounded-full",
                          hasMaintenance: "after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-amber-500 after:rounded-full",
                        }}
                      />
                    </div>
                    <div className="flex-1 flex flex-col min-w-0">
                      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <Search size={18} className="text-blue-600" />
                        Dados de {selectedDate?.toLocaleDateString('pt-BR')}
                      </h3>
                      
                      <ScrollArea className="flex-1 pr-4">
                        <div className="space-y-6">
                          {/* Maintenance Section */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Manutenções</h4>
                            {dayTasks.length === 0 ? (
                              <p className="text-sm text-muted-foreground italic">Nenhuma manutenção registrada.</p>
                            ) : (
                              dayTasks.map(task => (
                                <div key={task.id} className="p-3 rounded-lg border bg-card shadow-sm flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium">{task.description}</p>
                                    <p className="text-xs text-muted-foreground">{task.type}</p>
                                  </div>
                                  <Badge variant={task.status === 'Concluída' ? 'default' : 'secondary'}>
                                    {task.status}
                                  </Badge>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Monitoring Section */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Logs de Monitoramento</h4>
                            {dayLogs.length === 0 ? (
                              <p className="text-sm text-muted-foreground italic">Nenhum log registrado.</p>
                            ) : (
                              <div className="space-y-2">
                                {dayLogs.map(log => (
                                  <div key={log.id} className="p-3 rounded-lg border bg-blue-500/5 text-xs grid grid-cols-2 gap-2">
                                    <div className="col-span-2 font-bold text-blue-600 border-b pb-1 mb-1">
                                      {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                                    </div>
                                    <p><span className="text-muted-foreground">Hélio:</span> {log.heliumLevel}%</p>
                                    <p><span className="text-muted-foreground">P. Hélio:</span> {log.heliumPressure} PSI</p>
                                    <p><span className="text-muted-foreground">T. Téc:</span> {log.tempTechnicalRoom}°</p>
                                    <p><span className="text-muted-foreground">T. Exame:</span> {log.tempExamRoom}°</p>
                                    <p><span className="text-muted-foreground">W. Flow:</span> {log.waterFlow}</p>
                                    <p><span className="text-muted-foreground">P. Comp:</span> {log.compressorPressure} PSI</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Notes Section */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Observações e Anexos</h4>
                            </div>
                            
                            {/* Add Note Form */}
                            <form onSubmit={handleAddNote} className="space-y-3 p-3 rounded-lg border bg-muted/20">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label htmlFor="note-content" className="text-xs">Nova Observação</Label>
                                  <div className="flex items-center gap-2">
                                    <input 
                                      type="checkbox" 
                                      id="is-maintenance" 
                                      checked={isMaintenance}
                                      onChange={(e) => setIsMaintenance(e.target.checked)}
                                      className="h-3 w-3 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                                    />
                                    <Label htmlFor="is-maintenance" className="text-[10px] cursor-pointer">Manutenção</Label>
                                  </div>
                                </div>
                                <Textarea 
                                  id="note-content"
                                  placeholder="Digite aqui sua observação para este dia..."
                                  value={noteContent}
                                  onChange={(e) => setNoteContent(e.target.value)}
                                  className="min-h-[80px] text-sm"
                                />
                              </div>
                              
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <label className="cursor-pointer p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-blue-600" title="Anexar Imagem">
                                    <Paperclip size={18} />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                  </label>
                                  {noteImage && (
                                    <div className="relative h-10 w-10 rounded border overflow-hidden group">
                                      <img src={noteImage} alt="Preview" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                                      <button 
                                        type="button"
                                        onClick={() => setNoteImage('')}
                                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <X size={12} className="text-white" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <Button type="submit" size="sm" disabled={isSubmittingNote || !noteContent.trim()}>
                                  {isSubmittingNote ? <Loader2 size={14} className="animate-spin" /> : 'Salvar'}
                                </Button>
                              </div>
                            </form>

                            <Separator />

                            {/* Notes List */}
                            <div className="space-y-3">
                              {dayNotes.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic">Nenhuma observação registrada para este dia.</p>
                              ) : (
                                dayNotes.map(note => (
                                  <div key={note.id} className="p-3 rounded-lg border bg-card shadow-sm space-y-2 group">
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                                          {note.authorName.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <p className="text-xs font-bold">{note.authorName}</p>
                                            {note.isMaintenance && (
                                              <Badge variant="outline" className="text-[8px] h-3 px-1 bg-amber-500/10 text-amber-600 border-amber-200">
                                                Manutenção
                                              </Badge>
                                            )}
                                          </div>
                                          <p className="text-[10px] text-muted-foreground">{new Date(note.timestamp).toLocaleTimeString('pt-BR')}</p>
                                        </div>
                                      </div>
                                      {(auth.currentUser?.uid === note.authorUid) && (
                                        <button 
                                          type="button"
                                          onClick={() => handleDeleteNote(note.id)}
                                          className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      )}
                                    </div>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{note.content}</p>
                                    {note.imageUrl && (
                                      <div className="mt-2 rounded-md overflow-hidden border max-w-[200px]">
                                        <img 
                                          src={note.imageUrl} 
                                          alt="Anexo" 
                                          className="w-full h-auto object-cover cursor-pointer hover:scale-105 transition-transform"
                                          onClick={() => window.open(note.imageUrl, '_blank')}
                                          referrerPolicy="no-referrer"
                                        />
                                      </div>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {combinedUpcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma atividade pendente.</p>
              ) : (
                combinedUpcoming.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center gap-4 p-3 rounded-lg border bg-muted/30 hover:bg-accent transition-colors cursor-pointer group"
                    onClick={() => {
                      setSelectedDate(new Date(item.date));
                      setIsCalendarOpen(true);
                    }}
                  >
                    <div className={cn(
                      "p-2 rounded-full",
                      item.type === 'Preventiva' ? 'bg-blue-500/10 text-blue-600' : 
                      item.type === 'Corretiva' ? 'bg-rose-500/10 text-rose-600' :
                      'bg-amber-500/10 text-amber-600'
                    )}>
                      <CalendarIcon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.description}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] text-muted-foreground">{new Date(item.date).toLocaleDateString('pt-BR')}</p>
                        <Badge variant="outline" className="text-[8px] h-3 px-1 opacity-70">
                          {item.type}
                        </Badge>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
