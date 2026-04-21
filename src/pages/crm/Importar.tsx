import { useState, useRef } from 'react';
import { useCRM } from '../../contexts/CRMContext';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface ImportRecord {
  name: string;
  date: string;
  records: string;
  status: 'Concluída' | 'Erro' | 'Processando';
}

const CRMImportar = () => {
  const { addLead } = useCRM();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [recentImports, setRecentImports] = useState<ImportRecord[]>([
    { name: 'clientes_abril.csv', date: '20 Abr 2026', records: '142 registros', status: 'Concluída' },
    { name: 'leads_web.xlsx', date: '18 Abr 2026', records: '89 registros', status: 'Concluída' },
    { name: 'parceiros.csv', date: '15 Abr 2026', records: '37 registros', status: 'Concluída' },
  ]);

  const mapRecordToLead = (data: any) => {
    // Basic mapping logic trying to match common column names
    const findValue = (keys: string[]) => {
      const foundKey = Object.keys(data).find(k => 
        keys.some(key => k.toLowerCase().includes(key.toLowerCase()))
      );
      return foundKey ? String(data[foundKey]) : '';
    };

    return {
      name: findValue(['nome', 'name', 'cliente', 'full name']),
      email: findValue(['email', 'e-mail', 'mail']),
      whatsapp: findValue(['whatsapp', 'telefone', 'phone', 'celular', 'contato']),
      niche: findValue(['niche', 'nicho', 'segmento', 'área', 'area']),
      value: findValue(['valor', 'value', 'preco', 'price', 'investimento']),
      stage: 'Novos Leads',
      firstContact: new Date().toISOString().split('T')[0],
      closingDate: '',
      followUpReminder: '',
      address: findValue(['endereco', 'address', 'cidade', 'city']),
      gmnReviews: '0',
      gmnStars: '0',
      notes: 'Importado via planilha.',
      instagram: findValue(['instagram', 'ig', 'social'])
    };
  };

  const processData = (results: any[]) => {
    let count = 0;
    results.forEach(row => {
      const lead = mapRecordToLead(row);
      if (lead.name) {
        addLead(lead);
        count++;
      }
    });

    const newImport: ImportRecord = {
      name: fileInputRef.current?.files?.[0].name || 'Arquivo importado',
      date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
      records: `${count} registros`,
      status: 'Concluída'
    };

    setRecentImports(prev => [newImport, ...prev]);
    setNotification({ 
      type: 'success', 
      message: `Sucesso! ${count} leads foram importados e já estão disponíveis no seu Pipeline.` 
    });
    setIsUploading(false);
    
    // Clear notification after 5 seconds
    setTimeout(() => setNotification(null), 5000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setNotification(null);

    const reader = new FileReader();

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processData(results.data);
        },
        error: (err) => {
          setNotification({ type: 'error', message: 'Erro ao processar CSV: ' + err.message });
          setIsUploading(false);
        }
      });
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          processData(data);
        } catch (err) {
          setNotification({ type: 'error', message: 'Erro ao processar Excel: ' + (err as Error).message });
          setIsUploading(false);
        }
      };
      reader.readAsBinaryString(file);
    } else {
      setNotification({ type: 'error', message: 'Formato de arquivo não suportado. Use CSV, XLSX ou XLS.' });
      setIsUploading(false);
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-black tracking-tight mb-1">Importar</h1>
          <p className="text-neutral-500 text-sm">Importe leads e contatos para o CRM.</p>
        </div>
      </div>

      {notification && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
          notification.type === 'success' ? 'bg-emerald-50 border border-emerald-100 text-emerald-800' : 'bg-red-50 border border-red-100 text-red-800'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <p className="text-sm font-bold">{notification.message}</p>
        </div>
      )}

      <div className="max-w-2xl space-y-8">
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          accept=".csv,.xlsx,.xls"
          onChange={handleFileUpload}
        />
        
        <div 
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`bg-white border-2 border-dashed rounded-2xl p-16 text-center transition-all cursor-pointer group shadow-sm ${
            isUploading ? 'border-neutral-200 cursor-not-allowed' : 'border-neutral-300 hover:border-black hover:shadow-md'
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-12 h-12 text-black animate-spin mb-4" />
              <h3 className="text-black font-black text-lg mb-1">Processando arquivo...</h3>
              <p className="text-neutral-400 text-sm font-bold uppercase tracking-widest">Aguarde enquanto importamos seus dados</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-black transition-all group-hover:scale-110 group-hover:rotate-3">
                <Upload className="w-6 h-6 text-neutral-400 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-black font-black text-xl mb-2">Arraste ou clique para selecionar</h3>
              <p className="text-neutral-400 text-sm font-bold">CSV, XLSX, XLS — máximo 10MB</p>
              <div className="mt-8 flex justify-center gap-4">
                <span className="px-4 py-2 bg-neutral-50 rounded-lg text-[10px] font-black text-neutral-400 uppercase tracking-widest border border-neutral-100">Excel</span>
                <span className="px-4 py-2 bg-neutral-50 rounded-lg text-[10px] font-black text-neutral-400 uppercase tracking-widest border border-neutral-100">CSV</span>
              </div>
            </>
          )}
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-8 py-5 border-b border-neutral-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-50 flex items-center justify-center">
              <FileText size={16} className="text-black" />
            </div>
            <h3 className="text-[11px] font-black text-black uppercase tracking-widest">Importações Recentes</h3>
          </div>
          <div className="divide-y divide-neutral-100">
            {recentImports.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between px-8 py-5 hover:bg-neutral-50 transition-colors group">
                <div>
                  <p className="text-sm font-black text-black group-hover:underline cursor-pointer">{item.name}</p>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">
                    {item.date} · <span className="text-neutral-500">{item.records}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    item.status === 'Concluída' ? 'bg-emerald-500' : 'bg-neutral-300'
                  }`} />
                  <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CRMImportar;
