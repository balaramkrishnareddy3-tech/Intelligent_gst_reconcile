import type { InvoiceItem } from '@/types/gst';

type GenericNode = {
  id: string;
  name: string;
  entityType: string;
  color: string;
  data?: Record<string, unknown>;
  riskLevel?: string;
  invoiceId?: string;
  companyId?: string;
  vendorId?: string;
};

type GenericLink = {
  id: string;
  source: string | { id: string };
  target: string | { id: string };
  relationship: string;
  isRiskPath?: boolean;
};

interface NodeInsightPanelProps {
  selectedNode: GenericNode;
  nodes: GenericNode[];
  links: GenericLink[];
  invoices: InvoiceItem[];
  onSelectNode: (node: GenericNode) => void;
}

const idOf = (value: string | { id: string }) => (typeof value === 'string' ? value : value.id);

const money = (value?: number) => `₹${(value || 0).toLocaleString('en-IN')}`;

const textValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'number') return value.toLocaleString('en-IN');
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

export default function NodeInsightPanel({
  selectedNode,
  nodes,
  links,
  invoices,
  onSelectNode,
}: NodeInsightPanelProps) {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const selectedId = selectedNode.id;

  const connections = links
    .filter((link) => idOf(link.source) === selectedId || idOf(link.target) === selectedId)
    .map((link) => {
      const sourceId = idOf(link.source);
      const targetId = idOf(link.target);
      const outgoing = sourceId === selectedId;
      const otherId = outgoing ? targetId : sourceId;
      return {
        ...link,
        direction: outgoing ? 'Outgoing' : 'Incoming',
        otherId,
        otherNode: nodeMap.get(otherId),
      };
    });

  const relatedInvoice = selectedNode.invoiceId
    ? invoices.find(
        (invoice) =>
          invoice.id === selectedNode.invoiceId || invoice.invoiceNumber === selectedNode.invoiceId
      )
    : undefined;

  const data = selectedNode.data || {};
  const vendorGstin = textValue(data.gstin || data.ctin);
  const vendorId = textValue(data.vendorId || selectedNode.vendorId);
  const vendorInvoices =
    selectedNode.entityType === 'VENDOR'
      ? invoices.filter(
          (invoice) =>
            invoice.vendorGstin === vendorGstin ||
            invoice.vendorId === vendorId ||
            invoice.vendorName === selectedNode.name
        )
      : [];

  const details: { label: string; value: string }[] = (() => {
    switch (selectedNode.entityType) {
      case 'COMPANY':
        return [
          { label: 'Entity Type', value: 'Company / Buyer Node' },
          { label: 'GSTIN', value: textValue(data.gstin) },
          { label: 'Role', value: textValue(data.role || 'Buyer / ITC claimant') },
          { label: 'Connected Suppliers', value: String(connections.filter((c) => c.relationship === 'PURCHASED_FROM').length) },
          { label: 'Visible Graph Connections', value: String(connections.length) },
        ];
      case 'VENDOR':
        return [
          { label: 'Entity Type', value: 'Supplier / Counterparty Node' },
          { label: 'GSTIN', value: vendorGstin },
          { label: 'Vendor ID', value: vendorId },
          { label: 'Invoice Count', value: String(vendorInvoices.length) },
          { label: 'Matched Invoices', value: String(vendorInvoices.filter((i) => i.status === 'MATCHED').length) },
          { label: 'Risk Exposure', value: money(vendorInvoices.reduce((sum, i) => sum + i.itcRiskAmount, 0)) },
        ];
      case 'INVOICE':
        return [
          { label: 'Invoice Number', value: relatedInvoice?.invoiceNumber || textValue(data.invoiceNumber) },
          { label: 'Invoice Date', value: relatedInvoice?.invoiceDate || textValue(data.date) },
          { label: 'Vendor', value: relatedInvoice?.vendorName || textValue(data.vendor) },
          { label: 'Reconciliation Status', value: relatedInvoice?.status || textValue(data.status) },
          { label: 'Invoice Value', value: relatedInvoice ? money(relatedInvoice.companyRecord.totalValue) : textValue(data.totalValue) },
          { label: 'ITC at Risk', value: relatedInvoice ? money(relatedInvoice.itcRiskAmount) : '—' },
        ];
      case 'PURCHASE_RECORD':
        return [
          { label: 'Record Type', value: 'Company Purchase Register' },
          { label: 'Linked Invoice', value: relatedInvoice?.invoiceNumber || selectedNode.invoiceId || '—' },
          { label: 'Taxable Value', value: relatedInvoice ? money(relatedInvoice.companyRecord.taxableValue) : textValue(data.taxableValue) },
          { label: 'CGST', value: relatedInvoice ? money(relatedInvoice.companyRecord.cgst) : textValue(data.cgst) },
          { label: 'SGST', value: relatedInvoice ? money(relatedInvoice.companyRecord.sgst) : textValue(data.sgst) },
          { label: 'IGST', value: relatedInvoice ? money(relatedInvoice.companyRecord.igst) : textValue(data.igst) },
          { label: 'Total GST', value: relatedInvoice ? money(relatedInvoice.companyRecord.totalGst) : textValue(data.totalGst) },
        ];
      case 'GST_RECORD':
        return [
          { label: 'Record Type', value: 'GSTR-2B Portal Record' },
          { label: 'Linked Invoice', value: relatedInvoice?.invoiceNumber || selectedNode.invoiceId || '—' },
          { label: 'Taxable Value', value: relatedInvoice?.gstRecord ? money(relatedInvoice.gstRecord.taxableValue) : textValue(data.taxableValue) },
          { label: 'Total GST', value: relatedInvoice?.gstRecord ? money(relatedInvoice.gstRecord.totalGst) : textValue(data.totalGst) },
          { label: 'Return Period', value: relatedInvoice?.gstRecord?.returnPeriod || textValue(data.returnPeriod) },
          { label: 'ITC Availability', value: relatedInvoice?.gstRecord?.itcAvailable ? 'Available' : textValue(data.portalItc || data.itcAvailable) },
        ];
      case 'GSTIN':
        return [
          { label: 'Identifier Type', value: 'GSTIN Registration Node' },
          { label: 'GSTIN', value: textValue(data.gstin || selectedNode.name) },
          { label: 'State Code', value: textValue(data.state || data.stateCode || selectedNode.name.slice(0, 2)) },
          { label: 'Connected Entities', value: String(connections.length) },
        ];
      case 'MISMATCH':
        return [
          { label: 'Mismatch Status', value: relatedInvoice?.status || textValue(data.status) },
          { label: 'Tax Difference', value: relatedInvoice ? money(relatedInvoice.taxDifference) : textValue(data.taxDifference || data.variance) },
          { label: 'Taxable Difference', value: relatedInvoice ? money(relatedInvoice.taxableDifference) : textValue(data.taxableDifference) },
          { label: 'Fields', value: relatedInvoice?.mismatchFields.join(', ') || textValue(data.fields) },
          { label: 'Explanation', value: relatedInvoice?.mismatchExplanation || textValue(data.explanation) },
        ];
      case 'ITC':
        return [
          { label: 'ITC Claimed', value: relatedInvoice ? money(relatedInvoice.companyRecord.totalGst) : textValue(data.claimed || data.totalClaimed) },
          { label: 'ITC at Risk', value: relatedInvoice ? money(relatedInvoice.itcRiskAmount) : textValue(data.atRisk || data.itcAtRisk) },
          { label: 'Risk Impact', value: textValue(data.impact || 'Input Tax Credit eligibility impact') },
        ];
      case 'RISK':
        return [
          { label: 'Risk Level', value: relatedInvoice?.riskLevel || textValue(data.level) },
          { label: 'Exposure', value: relatedInvoice ? money(relatedInvoice.itcRiskAmount) : textValue(data.exposure) },
          { label: 'Recommended Action', value: relatedInvoice?.recommendedAction || textValue(data.action || data.enforcement) },
        ];
      case 'AUDIT_EVENT':
        return [
          { label: 'Audit Action', value: textValue(data.action) },
          { label: 'Result', value: textValue(data.result) },
          { label: 'Actor', value: textValue(data.actor) },
          { label: 'Timestamp', value: textValue(data.timestamp) },
          { label: 'Explanation', value: textValue(data.explanation) },
        ];
      default:
        return Object.entries(data).map(([label, value]) => ({ label, value: textValue(value) }));
    }
  })();

  const incomingCount = connections.filter((c) => c.direction === 'Incoming').length;
  const outgoingCount = connections.filter((c) => c.direction === 'Outgoing').length;
  const riskPathCount = connections.filter((c) => c.isRiskPath).length;

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-sky-100 bg-white p-3 text-xs shadow-xs">
        <div className="mb-2 flex items-center justify-between border-b border-sky-100 pb-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Specific Node Details
          </p>
          <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">
            {selectedNode.entityType}
          </span>
        </div>
        <div className="space-y-1.5">
          {details.map((item) => (
            <div key={item.label} className="grid grid-cols-[95px_1fr] gap-2 border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
              <span className="text-slate-500">{item.label}</span>
              <span className="break-words text-right font-semibold text-slate-800">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3 text-xs shadow-xs">
        <div className="mb-2 flex items-center justify-between border-b border-indigo-100 pb-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Connections
          </p>
          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-indigo-700">
            {connections.length} total
          </span>
        </div>

        <div className="mb-2 grid grid-cols-3 gap-1.5 text-center text-[10px] font-bold">
          <div className="rounded-lg bg-white px-2 py-1 text-slate-600">In {incomingCount}</div>
          <div className="rounded-lg bg-white px-2 py-1 text-slate-600">Out {outgoingCount}</div>
          <div className="rounded-lg bg-white px-2 py-1 text-rose-600">Risk {riskPathCount}</div>
        </div>

        <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
          {connections.length === 0 ? (
            <p className="rounded-lg bg-white p-2 text-center text-[11px] text-slate-400">
              No visible connections under the current filters.
            </p>
          ) : (
            connections.map((conn) => (
              <button
                key={conn.id}
                onClick={() => conn.otherNode && onSelectNode(conn.otherNode)}
                className="w-full rounded-lg border border-indigo-100 bg-white p-2 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] font-bold text-indigo-700">
                    {conn.direction === 'Outgoing' ? 'OUT' : 'IN'} · {conn.relationship}
                  </span>
                  {conn.isRiskPath && (
                    <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-black text-rose-700">
                      RISK PATH
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: conn.otherNode?.color || '#94a3b8' }}
                  />
                  <span className="truncate text-[11px] font-semibold text-slate-800">
                    {conn.otherNode?.name || conn.otherId}
                  </span>
                </div>
                <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                  {conn.otherNode?.entityType || 'UNKNOWN'} · click to inspect connected node
                </p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}