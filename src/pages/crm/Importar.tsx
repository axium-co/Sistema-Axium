import { useState, useRef } from 'react';
import { useCRM } from '../../contexts/CRMContext';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Table, X, ArrowRight, ArrowLeft, Columns, Users, Check, ChevronDown, Settings2 } from 'lucide-react';

interface ImportRecord {
  name: string;
  date: string;
  records: string;
  status: 'Concluida' | 'Erro' | 'Processando';
}

type ImportStep = 'upload' | 'columns' | 'leads';

interface ColumnInfo {
  originalName: string;
  detectedType: string;
  selected: boolean;
  mappedTo: string;
}

interface CRMImportarState {
  fileName: string;
  data: any[];
  columns: ColumnInfo[];
}

const CRMImportar = () => {
  const { addLead } = useCRM();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [step, setStep] = useState<ImportStep>('upload');
  const [importState, setImportState] = useState<CRMImportarState | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [recentImports, setRecentImports] = useState<ImportRecord[]>([
    { name: 'clientes_abril.csv', date: '20 Abr 2026', records: '142 registros', status: 'Concluida' },
    { name: 'leads_web.xlsx', date: '18 Abr 2026', records: '89 registros', status: 'Concluida' },
    { name: 'parceiros.csv', date: '15 Abr 2026', records: '37 registros', status: 'Concluida' },
  ]);

  const COLUMN_TYPE_KEYWORDS: Record<string, string[]> = {
    name: ['nome', 'name', 'cliente', 'full name', 'nome completo', 'razao social'],
    email: ['email', 'e-mail', 'mail', 'e_mail'],
    whatsapp: ['whatsapp', 'telefone', 'phone', 'celular', 'contato', 'tel', 'zap', 'numero'],
    niche: ['niche', 'nicho', 'segmento', 'area', 'categoria', 'setor'],
    value: ['valor', 'value', 'preco', 'price', 'investimento', 'ticket', 'faturamento'],
    address: ['endereco', 'address', 'cidade', 'city', 'estado', 'uf', 'cep', 'pais'],
    instagram: ['instagram', 'ig', 'insta', 'social', 'midia social'],
    stage: ['etapa', 'stage', 'status', 'fase', 'pipeline'],
    origin: ['origem', 'origin', 'fonte', 'source', 'canal'],
    notes: ['notas', 'notes', 'observacoes', 'obs', 'comentarios', 'descricao'],
  };

  const detectColumnType = (colName: string): string => {
    const lower = colName.toLowerCase().trim();
    for (const [type, keywords] of Object.entries(COLUMN_TYPE_KEYWORDS)) {
      if (keywords.some(kw => lower.includes(kw))) {
        return type;
      }
    }
    return 'unknown';
  };

  const mapRecordToLead = (data: any, columns: ColumnInfo[]) => {
    const selectedCols = columns.filter(c => c.selected);
    const getValue = (mappedType: string) => {
      const col = selectedCols.find(c => c.mappedTo === mappedType);
      if (!col) return '';
      return String(data[col.originalName] || '');
    };

    const getAnyValue = (keys: string[]) => {
      for (const key of keys) {
        const col = selectedCols.find(c => c.mappedTo === key);
        if (col && data[col.originalName]) return String(data[col.originalName]);
      }
      const foundKey = Object.keys(data).find(k =>
        keys.some(key => k.toLowerCase().includes(key.toLowerCase()))
      );
      return foundKey ? String(data[foundKey]) : '';
    };

    return {
      name: getValue('name') || getAnyValue(['nome', 'name', 'cliente', 'full name']),
      email: getValue('email') || getAnyValue(['email', 'e-mail', 'mail']),
      whatsapp: getValue('whatsapp') || getAnyValue(['whatsapp', 'telefone', 'phone', 'celular']),
      niche: getValue('niche') || getAnyValue(['niche', 'nicho', 'segmento']),
      value: getValue('value') || getAnyValue(['valor', 'value', 'preco']),
      stage: getValue('stage') || 'Novos Leads',
      origin: getValue('origin') || getAnyValue(['origem', 'source', 'canal']),
      firstContact: new Date().toISOString().split('T')[0],
      closingDate: '',
      followUpReminder: '',
      address: getValue('address') || getAnyValue(['endereco', 'address', 'cidade']),
      gmnReviews: '0',
      gmnStars: '0',
      notes: getValue('notes') || 'Importado via planilha.',
      instagram: getValue('instagram') || getAnyValue(['instagram', 'ig', 'social']),
    };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      setNotification({ type: 'error', message: 'Nenhum arquivo selecionado.' });
      return;
    }

    const fileName = file.name;

    setIsUploading(true);
    setNotification(null);

    const reader = new FileReader();

    if (fileName.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const rawColumns = results.data.length > 0 ? Object.keys(results.data[0]) : [];
            const columns: ColumnInfo[] = rawColumns.map(name => ({
              originalName: name,
              detectedType: detectColumnType(name),
              selected: true,
              mappedTo: detectColumnType(name),
            }));
            const allIndices = new Set(results.data.map((_, i) => i));
            setImportState({ fileName, data: results.data, columns });
            setSelectedRows(allIndices);
            setStep('columns');
          } catch {
            setNotification({ type: 'error', message: 'Erro ao processar CSV: arquivo pode estar corrompido.' });
          }
          setIsUploading(false);
        },
        error: (err) => {
          setNotification({ type: 'error', message: 'Erro ao processar CSV: ' + err.message });
          setIsUploading(false);
        }
      });
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          if (!bstr) throw new Error('Arquivo nao pode ser lido.');
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          const rawColumns = data.length > 0 ? Object.keys(data[0]) : [];
          const columns: ColumnInfo[] = rawColumns.map(name => ({
            originalName: name,
            detectedType: detectColumnType(name),
            selected: true,
            mappedTo: detectColumnType(name),
          }));
          const allIndices = new Set(data.map((_, i) => i));
          setImportState({ fileName, data, columns });
          setSelectedRows(allIndices);
          setStep('columns');
        } catch {
          setNotification({ type: 'error', message: 'Erro ao processar Excel: arquivo pode estar corrompido.' });
        }
        setIsUploading(false);
      };
      reader.readAsBinaryString(file);
    } else {
      setNotification({ type: 'error', message: 'Formato nao suportado. Use CSV, XLSX ou XLS.' });
      setIsUploading(false);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleColumn = (index: number) => {
    if (!importState) return;
    const newCols = [...importState.columns];
    newCols[index].selected = !newCols[index].selected;
    setImportState({ ...importState, columns: newCols });
  };

  const selectAllColumns = () => {
    if (!importState) return;
    setImportState({
      ...importState,
      columns: importState.columns.map(c => ({ ...c, selected: true })),
    });
  };

  const deselectAllColumns = () => {
    if (!importState) return;
    setImportState({
      ...importState,
      columns: importState.columns.map(c => ({ ...c, selected: false })),
    });
  };

  const updateColumnMapping = (index: number, mappedTo: string) => {
    if (!importState) return;
    const newCols = [...importState.columns];
    newCols[index].mappedTo = mappedTo;
    setImportState({ ...importState, columns: newCols });
  };

  const proceedToLeads = () => {
    if (!importState) return;
    const hasSelected = importState.columns.some(c => c.selected);
    if (!hasSelected) {
      setNotification({ type: 'error', message: 'Selecione pelo menos uma coluna para continuar.' });
      return;
    }
    setStep('leads');
  };

  const toggleRow = (index: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  const selectAllRows = () => {
    const allIndices = new Set(importState?.data.map((_, i) => i) ?? []);
    setSelectedRows(allIndices);
  };

  const deselectAllRows = () => {
    setSelectedRows(new Set());
  };

  const confirmImport = () => {
    if (!importState) return;

    setIsImporting(true);
    let count = 0;

    const sortedRows = Array.from(selectedRows).sort((a, b) => a - b);
    sortedRows.forEach(rowIndex => {
      const row = importState.data[rowIndex];
      if (!row) return;
      const lead = mapRecordToLead(row, importState.columns);
      if (lead.name) {
        addLead(lead);
        count++;
      }
    });

    const newImport: ImportRecord = {
      name: importState.fileName,
      date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
      records: `${count} registros`,
      status: 'Concluida'
    };

    setRecentImports(prev => [newImport, ...prev]);
    setNotification({
      type: 'success',
      message: `Sucesso! ${count} leads importados com ${importState.columns.filter(c => c.selected).length} colunas selecionadas.`
    });
    setImportState(null);
    setSelectedRows(new Set());
    setStep('upload');
    setIsImporting(false);
    setTimeout(() => setNotification(null), 5000);
  };

  const cancelImport = () => {
    setImportState(null);
    setSelectedRows(new Set());
    setStep('upload');
    setNotification(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const goBack = () => {
    if (step === 'leads') setStep('columns');
    else if (step === 'columns') cancelImport();
  };

  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      name: 'Nome',
      email: 'Email',
      whatsapp: 'Telefone',
      niche: 'Nicho',
      value: 'Valor',
      address: 'Endereco',
      instagram: 'Instagram',
      stage: 'Etapa',
      origin: 'Origem',
      notes: 'Notas',
    };
    return labels[type] || 'Outro';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'name': return <Users size={12} />;
      case 'email': return '@';
      case 'whatsapp': return '';
      case 'value': return 'R$';
      case 'address': return '';
      case 'instagram': return 'IG';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen p-2 md:p-8">
      <div className="mb-4 md:mb-8 flex flex-col md:flex-row justify-between items-start md:items-start gap-3 md:gap-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-black tracking-tight mb-1">Importar</h1>
          <p className="text-neutral-500 text-xs md:text-sm">Importe leads e contatos para o CRM.</p>
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

      {step !== 'upload' && (
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={goBack}
            className="flex items-center gap-2 px-4 py-2 border border-neutral-200 rounded-lg text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-colors"
          >
            <ArrowLeft size={16} /> Voltar
          </button>
          <div className="flex items-center gap-2 text-sm">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
              step === 'upload' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'
            }`}>
              <Upload size={12} /> 1. Upload
            </div>
            <span className="text-neutral-300">→</span>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
              step === 'columns' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'
            }`}>
              <Columns size={12} /> 2. Colunas
            </div>
            <span className="text-neutral-300">→</span>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
              step === 'leads' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'
            }`}>
              <Users size={12} /> 3. Leads
            </div>
          </div>
        </div>
      )}

      {step === 'columns' && importState && (
        <div className="max-w-5xl">
          <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm mb-6">
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Columns size={16} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-black">Selecionar Colunas</h3>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">
                    {importState.fileName} · {importState.columns.length} colunas detectadas
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={selectAllColumns} className="px-3 py-1.5 text-xs font-bold text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">
                  Selecionar Todas
                </button>
                <button onClick={deselectAllColumns} className="px-3 py-1.5 text-xs font-bold text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">
                  Desselecionar Todas
                </button>
              </div>
            </div>

            <div className="divide-y divide-neutral-100">
              {importState.columns.map((col, index) => (
                <div
                  key={index}
                  className={`px-6 py-4 flex items-center gap-4 transition-colors ${
                    col.selected ? 'bg-white' : 'bg-neutral-50 opacity-60'
                  } hover:bg-neutral-50`}
                >
                  <button
                    onClick={() => toggleColumn(index)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 ${
                      col.selected
                        ? 'bg-black border-black text-white'
                        : 'border-neutral-300 hover:border-neutral-400'
                    }`}
                  >
                    {col.selected && <Check size={12} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-black truncate">{col.originalName}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      col.detectedType !== 'unknown'
                        ? 'bg-blue-50 text-blue-700 border border-blue-100'
                        : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                    }`}>
                      {getTypeIcon(col.detectedType)}
                      {getTypeLabel(col.detectedType)}
                    </span>
                    <div className="flex items-center gap-1">
                      <Settings2 size={12} className="text-neutral-400" />
                      <select
                        value={col.mappedTo}
                        onChange={(e) => updateColumnMapping(index, e.target.value)}
                        className="text-xs border border-neutral-200 rounded-lg px-2 py-1 outline-none focus:border-black bg-white"
                      >
                        <option value="unknown">Nao mapear</option>
                        <option value="name">Nome</option>
                        <option value="email">Email</option>
                        <option value="whatsapp">Telefone</option>
                        <option value="niche">Nicho</option>
                        <option value="value">Valor</option>
                        <option value="address">Endereco</option>
                        <option value="instagram">Instagram</option>
                        <option value="stage">Etapa</option>
                        <option value="origin">Origem</option>
                        <option value="notes">Notas</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={cancelImport} className="flex-1 py-4 rounded-xl font-black text-sm uppercase tracking-widest border border-neutral-200 text-neutral-500 hover:bg-neutral-50 transition-colors">
              Cancelar
            </button>
            <button onClick={proceedToLeads} className="flex-[2] py-4 rounded-xl font-black text-sm uppercase tracking-widest bg-black text-white hover:brightness-90 transition-all flex items-center justify-center gap-2">
              Proximo: Selecionar Leads <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {step === 'leads' && importState && (
        <div className="max-w-6xl">
          <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm mb-6">
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Users size={16} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-black">Selecionar Leads</h3>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">
                    {selectedRows.size} de {importState.data.length} leads selecionados · {importState.columns.filter(c => c.selected).length} colunas
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={selectAllRows} className="px-3 py-1.5 text-xs font-bold text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">
                  Selecionar Todos
                </button>
                <button onClick={deselectAllRows} className="px-3 py-1.5 text-xs font-bold text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">
                  Desselecionar Todos
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50">
                    <th className="w-10 px-3 py-3">
                      <button
                        onClick={() => selectedRows.size === importState.data.length ? deselectAllRows() : selectAllRows()}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          selectedRows.size === importState.data.length
                            ? 'bg-black border-black text-white'
                            : 'border-neutral-300 hover:border-neutral-400'
                        }`}
                      >
                        {selectedRows.size === importState.data.length && <Check size={12} />}
                      </button>
                    </th>
                    {importState.columns.filter(c => c.selected).map((col, i) => (
                      <th key={i} className="text-left px-3 py-3 font-black text-neutral-400 uppercase tracking-widest whitespace-nowrap">
                        {col.originalName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {importState.data.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className={`border-b border-neutral-50 transition-colors cursor-pointer ${
                        selectedRows.has(rowIndex) ? 'bg-emerald-50/50 hover:bg-emerald-50' : 'hover:bg-neutral-50'
                      }`}
                      onClick={() => toggleRow(rowIndex)}
                    >
                      <td className="px-3 py-2.5">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          selectedRows.has(rowIndex)
                            ? 'bg-black border-black text-white'
                            : 'border-neutral-300'
                        }`}>
                          {selectedRows.has(rowIndex) && <Check size={12} />}
                        </div>
                      </td>
                      {importState.columns.filter(c => c.selected).map((col, colIndex) => (
                        <td key={colIndex} className="px-3 py-2.5 font-medium text-black whitespace-nowrap">
                          {row[col.originalName] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={goBack} className="flex-1 py-4 rounded-xl font-black text-sm uppercase tracking-widest border border-neutral-200 text-neutral-500 hover:bg-neutral-50 transition-colors">
              Voltar as Colunas
            </button>
            <button onClick={confirmImport} disabled={isImporting || selectedRows.size === 0} className="flex-[2] py-4 rounded-xl font-black text-sm uppercase tracking-widest bg-black text-white hover:brightness-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {isImporting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
              Importar {selectedRows.size} Leads
            </button>
          </div>
        </div>
      )}

      {step === 'upload' && (
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
                <p className="text-neutral-400 text-sm font-bold">CSV, XLSX, XLS — maximo 10MB</p>
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
              <h3 className="text-[11px] font-black text-black uppercase tracking-widest">Importacoes Recentes</h3>
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
                      item.status === 'Concluida' ? 'bg-emerald-500' : 'bg-neutral-300'
                    }`} />
                    <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMImportar;
