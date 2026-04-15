import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Plus, Download, Filter, Loader2 } from 'lucide-react';
import { MonitoringLog } from '../types';
import { 
  db, 
  auth, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
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

export function Monitoring() {
  const [logs, setLogs] = React.useState<MonitoringLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  // Form state
  const [formData, setFormData] = React.useState({
    heliumLevel: '',
    heliumPressure: '',
    tempTechnicalRoom: '',
    tempExamRoom: '',
    humidityTechnicalRoom: '',
    humidityExamRoom: '',
    waterFlow: '',
    waterTemp: '',
    compressorPressure: '',
    machineId: 'mri-01'
  });

  React.useEffect(() => {
    const q = query(collection(db, 'monitoring'), orderBy('timestamp', 'desc'), limit(50));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newLogs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MonitoringLog[];
      setLogs(newLogs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'monitoring');
    });

    return () => unsubscribe();
  }, []);

  const [showConfig, setShowConfig] = React.useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setIsSubmitting(true);
    try {
      const newLog = {
        timestamp: new Date().toISOString(),
        heliumLevel: parseFloat(formData.heliumLevel),
        heliumPressure: parseFloat(formData.heliumPressure),
        tempTechnicalRoom: parseFloat(formData.tempTechnicalRoom),
        tempExamRoom: parseFloat(formData.tempExamRoom),
        humidityTechnicalRoom: parseFloat(formData.humidityTechnicalRoom),
        humidityExamRoom: parseFloat(formData.humidityExamRoom),
        waterFlow: parseFloat(formData.waterFlow),
        waterTemp: parseFloat(formData.waterTemp),
        compressorPressure: parseFloat(formData.compressorPressure),
        machineId: formData.machineId,
        authorUid: auth.currentUser.uid
      };

      await addDoc(collection(db, 'monitoring'), newLog);
      setOpen(false);
      setFormData({ 
        heliumLevel: '', 
        heliumPressure: '', 
        tempTechnicalRoom: '', 
        tempExamRoom: '', 
        humidityTechnicalRoom: '',
        humidityExamRoom: '',
        waterFlow: '', 
        waterTemp: '', 
        compressorPressure: '', 
        machineId: 'mri-01' 
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'monitoring');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Monitoramento Técnico</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => setShowConfig(!showConfig)}
          >
            {showConfig ? 'Esconder Ajustes' : 'Mostrar Ajustes'}
          </Button>
          <Button variant="outline" className="gap-2">
            <Download size={16} /> Exportar
          </Button>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus size={16} /> Novo Registro
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Novo Registro Manual</DialogTitle>
                  <DialogDescription>
                    Insira os dados técnicos lidos no painel do equipamento e salas.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="heliumLevel">Nível de Hélio (%)</Label>
                      <Input
                        id="heliumLevel"
                        type="number"
                        step="0.1"
                        required
                        value={formData.heliumLevel}
                        onChange={(e) => setFormData({...formData, heliumLevel: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="heliumPressure">Pressão Hélio (PSI)</Label>
                      <Input
                        id="heliumPressure"
                        type="number"
                        step="0.1"
                        required
                        value={formData.heliumPressure}
                        onChange={(e) => setFormData({...formData, heliumPressure: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tempTech">Temp. Sala Técnica (°C)</Label>
                      <Input
                        id="tempTech"
                        type="number"
                        step="0.1"
                        required
                        value={formData.tempTechnicalRoom}
                        onChange={(e) => setFormData({...formData, tempTechnicalRoom: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tempExam">Temp. Sala Exame (°C)</Label>
                      <Input
                        id="tempExam"
                        type="number"
                        step="0.1"
                        required
                        value={formData.tempExamRoom}
                        onChange={(e) => setFormData({...formData, tempExamRoom: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="humidityTech">Umidade Sala Técnica (%)</Label>
                      <Input
                        id="humidityTech"
                        type="number"
                        step="0.1"
                        required
                        value={formData.humidityTechnicalRoom}
                        onChange={(e) => setFormData({...formData, humidityTechnicalRoom: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="humidityExam">Umidade Sala Exame (%)</Label>
                      <Input
                        id="humidityExam"
                        type="number"
                        step="0.1"
                        required
                        value={formData.humidityExamRoom}
                        onChange={(e) => setFormData({...formData, humidityExamRoom: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="waterFlow">Water Flow (L/min)</Label>
                      <Input
                        id="waterFlow"
                        type="number"
                        step="0.1"
                        required
                        value={formData.waterFlow}
                        onChange={(e) => setFormData({...formData, waterFlow: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="waterTemp">Water Temp (°C)</Label>
                      <Input
                        id="waterTemp"
                        type="number"
                        step="0.1"
                        required
                        value={formData.waterTemp}
                        onChange={(e) => setFormData({...formData, waterTemp: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="compPressure">Pressão Compressor (PSI)</Label>
                    <Input
                      id="compPressure"
                      type="number"
                      step="0.1"
                      required
                      value={formData.compressorPressure}
                      onChange={(e) => setFormData({...formData, compressorPressure: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Registro
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Histórico de Leituras</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Filtrar por data..."
                  className="pl-8 w-[250px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Data/Hora</TableHead>
                    <TableHead>Hélio (%)</TableHead>
                    <TableHead>P. Hélio (PSI)</TableHead>
                    <TableHead>T. Técnica</TableHead>
                    <TableHead>T. Exame</TableHead>
                    <TableHead>U. Técnica</TableHead>
                    <TableHead>U. Exame</TableHead>
                    <TableHead>W. Flow</TableHead>
                    <TableHead>W. Temp</TableHead>
                    <TableHead>P. Comp (PSI)</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        Nenhum registro encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          {new Date(log.timestamp).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>{log.heliumLevel?.toFixed(1)}%</TableCell>
                        <TableCell>{log.heliumPressure?.toFixed(1)}</TableCell>
                        <TableCell>{log.tempTechnicalRoom?.toFixed(1)}°</TableCell>
                        <TableCell>{log.tempExamRoom?.toFixed(1)}°</TableCell>
                        <TableCell>{log.humidityTechnicalRoom?.toFixed(1)}%</TableCell>
                        <TableCell>{log.humidityExamRoom?.toFixed(1)}%</TableCell>
                        <TableCell>{log.waterFlow?.toFixed(1)}</TableCell>
                        <TableCell>{log.waterTemp?.toFixed(1)}°</TableCell>
                        <TableCell>{log.compressorPressure?.toFixed(1)}</TableCell>
                        <TableCell className="text-right">
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-500/10 text-green-600">
                            OK
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {showConfig && (
        <div className="grid gap-4 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card>
            <CardHeader>
              <CardTitle>Configurar Alertas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Temp. Máxima (°C)</Label>
                  <Input type="number" defaultValue={22} />
                </div>
                <div className="space-y-2">
                  <Label>Temp. Mínima (°C)</Label>
                  <Input type="number" defaultValue={16} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pressão Máxima (PSI)</Label>
                  <Input type="number" defaultValue={26} />
                </div>
                <div className="space-y-2">
                  <Label>Hélio Crítico (%)</Label>
                  <Input type="number" defaultValue={40} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Umidade Máx. (%)</Label>
                  <Input type="number" defaultValue={60} />
                </div>
                <div className="space-y-2">
                  <Label>Umidade Mín. (%)</Label>
                  <Input type="number" defaultValue={30} />
                </div>
              </div>
              <Button className="w-full">Salvar Configurações</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Observações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea 
                className="w-full min-h-[150px] p-3 rounded-md border bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Adicione observações técnicas sobre o comportamento do equipamento..."
              />
              <Button className="mt-2 w-full" variant="secondary">Adicionar Nota</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

