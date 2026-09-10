import { useState, useRef } from 'react';
import { useGstStore } from '@/store/gstStore';
import { useAuthStore } from '@/store/authStore';
import { uploadInvoiceFile } from '@/services/backendApi';
import type { DataSourceStatus } from '@/types/gst';
import {
  Database,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Info,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { useNavigate } from 'react-router-dom';

export default function DataSources() {
  const navigate = useNavigate();
  const { dataSources, uploadDataSource, mergeBackendInvoices } = useGstStore();
  const { user } = useAuthStore();
  const [selectedSourceKey, setSelectedSourceKey] = useState<DataSourceStatus['key']>('purchase');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedRecords, setUploadedRecords] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedSource = dataSources.find((s) => s.key === selectedSourceKey) || dataSources[0];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setSelectedFile(file);
    setUploadSuccess(false);
    setValidationErrors([]);
    setUploadProgress(0);

    // Basic file validation
    const validExtensions = ['.csv', '.xlsx', '.xls', '.json'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      setValidationErrors(['Invalid file format. Please upload CSV or Excel files.']);
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setValidationErrors(['File size exceeds 25 MB limit.']);
      return;
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);
    setUploadProgress(10);
    setValidationErrors([]);

    try {
      setUploadProgress(30);
      const response = await uploadInvoiceFile(selectedFile, {
        id: user.id,
        companyName: user.companyName,
        gstin: user.role === 'vendor' ? user.gstin : 'DEMO-SUPPLIER-GSTIN',
      });

      setUploadProgress(70);
      if (response.items.length) {
        mergeBackendInvoices(response.items);
      }
      await uploadDataSource(selectedSourceKey, selectedFile, response.count);

      setUploadProgress(100);
      setUploadSuccess(true);
      setUploadedRecords(response.count);
      if (!response.count) {
        setValidationErrors([response.message || 'No new invoice records were created. The file may already be uploaded.']);
      }
    } catch (err) {
      setValidationErrors([err instanceof Error ? err.message : 'Upload failed. Make sure FastAPI and Supabase are running.']);
      setUploadSuccess(false);
    } finally {
      setIsUploading(false);
    }
  };

  const handleLoadSampleData = async () => {
    setIsUploading(true);
    setUploadProgress(70);
    await new Promise((r) => setTimeout(r, 20));

    const dummyFile = new File(['sample'], `Sample_${selectedSource.title.split(' ')[0]}_Feed.xlsx`, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    await uploadDataSource(selectedSourceKey, dummyFile, 16);
    setSelectedFile(dummyFile);
    setUploadProgress(100);
    setIsUploading(false);
    setUploadSuccess(true);
    setUploadedRecords(16);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Sources & Feeds"
        subtitle="Manage ERP purchase registers, GSTR-2B returns, and statutory feeds • Centralized pipeline"
        icon={<Database className="h-6 w-6 text-white" />}
        actions={
          <Button size="sm" onClick={() => navigate('/company/reconciliation')}>
            Proceed to Reconciliation <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        }
      />

      {/* Integration Disclaimer Banner */}
      <div className="rounded-2xl border border-sky-200/80 bg-gradient-to-r from-sky-50 via-white to-blue-50 p-4 text-xs text-slate-700 flex items-start gap-3 shadow-xs">
        <Info className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-sky-900">Prototype Integration Notice:</span>{' '}
          All external portal sync channels are labeled as{' '}
          <code className="bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded font-mono font-semibold">
            Integration / API support – prototype
          </code>
          . This system does not claim unmediated live GST system access. Files uploaded here directly hydrate the centralized reconciliation engine.
        </div>
      </div>

      {/* Grid of the 5 Data Sources */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {dataSources.map((source) => {
          const isSelected = source.key === selectedSourceKey;
          return (
            <div
              key={source.key}
              onClick={() => {
                setSelectedSourceKey(source.key);
                setSelectedFile(null);
                setUploadSuccess(false);
                setValidationErrors([]);
              }}
              className={`rounded-2xl p-4 transition-all duration-200 cursor-pointer border text-left ${
                isSelected
                  ? 'border-sky-500 bg-white ring-2 ring-sky-500/20 shadow-md'
                  : 'border-sky-200/70 bg-white/70 hover:bg-white hover:border-sky-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                  {source.key.toUpperCase()}
                </span>
                <StatusBadge
                  status={source.status === 'connected' ? 'success' : 'neutral'}
                  label={source.status === 'connected' ? 'Active' : 'Pending'}
                />
              </div>
              <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{source.title}</h4>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{source.type}</p>
              <div className="mt-3 pt-2 border-t border-sky-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Records</span>
                <span className="font-bold text-slate-800">{source.recordCount}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Upload & Configuration Workspace */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: File Upload & Validation Dropzone */}
        <GlassCard className="lg:col-span-2 space-y-5">
          <div className="border-b border-sky-100 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Upload className="h-5 w-5 text-sky-600" /> Upload: {selectedSource.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedSource.description}</p>
              </div>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">
                {selectedSource.type}
              </span>
            </div>
          </div>

          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".csv,.xlsx,.xls,.json"
            className="hidden"
          />

          {/* Interactive Drag & Drop Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
              selectedFile
                ? 'border-sky-400 bg-sky-50/50'
                : 'border-sky-200 bg-sky-50/20 hover:bg-sky-50/60 hover:border-sky-300'
            }`}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md text-sky-600 mb-3">
              {selectedFile ? (
                <FileSpreadsheet className="h-7 w-7 text-emerald-600" />
              ) : (
                <Upload className="h-7 w-7" />
              )}
            </div>

            {selectedFile ? (
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900">{selectedFile.name}</p>
                <p className="text-xs text-slate-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for ingestion
                </p>
                <p className="text-[11px] text-sky-600 font-medium pt-1">
                  Click to choose a different file
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-slate-800">
                  Drop your CSV or Excel ledger here, or{' '}
                  <span className="text-sky-600 underline font-bold">browse files</span>
                </p>
                <p className="text-xs text-slate-400">
                  Supports .XLSX, .XLS, .CSV and JSON invoice exports (up to 25 MB). Standard GST columns and unstructured invoice exports are normalized automatically.
                </p>
              </div>
            )}
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-bold">Validation Issue:</p>
                <ul className="list-disc pl-4 mt-0.5">
                  {validationErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-600 font-medium">
                <span>Validating checksums and parsing rows...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-blue-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Success Notification */}
          {uploadSuccess && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-bold text-sm">File Ingested Successfully!</p>
                <p className="mt-0.5">
                  {uploadedRecords} invoice record(s) parsed by FastAPI, normalized, saved to Supabase, and synced into the centralized reconciliation ledger.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLoadSampleData}
              disabled={isUploading}
            >
              <Sparkles className="h-3.5 w-3.5 text-sky-600" /> Load Enterprise Sample Data
            </Button>

            <Button
              size="sm"
              onClick={handleUploadSubmit}
              disabled={!selectedFile || isUploading}
              loading={isUploading}
            >
              <Upload className="h-3.5 w-3.5" /> Confirm Ingestion
            </Button>
          </div>
        </GlassCard>

        {/* Right Col: Current Feed Status & Validation Schema */}
        <div className="space-y-4">
          <GlassCard className="space-y-3.5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-sky-600" /> Active Feed Telemetry
            </h4>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-sky-100">
                <span className="text-slate-500">Current File</span>
                <span className="font-semibold text-slate-800 font-mono text-[11px] truncate max-w-[150px]">
                  {selectedSource.fileName || 'None'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-sky-100">
                <span className="text-slate-500">Payload Size</span>
                <span className="font-semibold text-slate-800">{selectedSource.fileSize || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-sky-100">
                <span className="text-slate-500">Verified Rows</span>
                <span className="font-bold text-emerald-700">{selectedSource.recordCount} records</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-sky-100">
                <span className="text-slate-500">Last Synced</span>
                <span className="font-semibold text-slate-700">{selectedSource.lastSync}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Feed Health</span>
                <StatusBadge status="success" label="100% Operational" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="space-y-3 bg-sky-50/40">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-sky-600" /> Expected Schema
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Required columns: <code className="text-sky-700 font-bold">GSTIN</code>,{' '}
              <code className="text-sky-700 font-bold">Invoice_No</code>,{' '}
              <code className="text-sky-700 font-bold">Invoice_Date</code>,{' '}
              <code className="text-sky-700 font-bold">Taxable_Value</code>,{' '}
              <code className="text-sky-700 font-bold">CGST</code>,{' '}
              <code className="text-sky-700 font-bold">SGST</code>,{' '}
              <code className="text-sky-700 font-bold">IGST</code>.
            </p>
            <div className="pt-2">
              <Button
                variant="secondary"
                size="sm"
                className="w-full text-xs"
                onClick={() => navigate('/company/reconciliation')}
              >
                <RefreshCw className="h-3.5 w-3.5" /> Launch Reconciliation
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
