import { MessageSquare, ExternalLink } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';

const issues = [
  { id: 'ISS-045', subject: 'Invoice INV-1243 not found in buyer books', buyer: 'Acme Corp India', created: '2025-11-28', status: 'warning' as const, statusLabel: 'Open' },
  { id: 'ISS-044', subject: 'Amount discrepancy on INV-1245', buyer: 'Bharat Electronics', created: '2025-11-25', status: 'info' as const, statusLabel: 'In Progress' },
  { id: 'ISS-043', subject: 'GSTIN correction needed for INV-1231', buyer: 'Hindustan Motors', created: '2025-11-20', status: 'warning' as const, statusLabel: 'Open' },
  { id: 'ISS-042', subject: 'Duplicate invoice flagged INV-1220', buyer: 'Acme Corp India', created: '2025-11-15', status: 'success' as const, statusLabel: 'Resolved' },
  { id: 'ISS-041', subject: 'Missing HSN code on INV-1198', buyer: 'Acme Corp India', created: '2025-11-10', status: 'success' as const, statusLabel: 'Resolved' },
];

export default function Issues() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Buyer Inquiries & Dispute Tickets"
        subtitle="Track and resolve counterparty discrepancies directly with enterprise buyers"
        icon={<MessageSquare className="h-6 w-6 text-white" />}
        actions={
          <Button size="sm" onClick={() => alert('New inquiry ticket modal')}>
            + Create New Ticket
          </Button>
        }
      />

      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-sky-100 bg-sky-50/50 text-slate-600">
                <th className="py-3 px-4 font-bold">Ticket ID</th>
                <th className="py-3 px-4 font-bold">Dispute Subject</th>
                <th className="py-3 px-4 font-bold">Buyer Account</th>
                <th className="py-3 px-4 font-bold">Logged Date</th>
                <th className="py-3 px-4 font-bold">Resolution Status</th>
                <th className="py-3 px-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100/60">
              {issues.map((issue) => (
                <tr key={issue.id} className="hover:bg-sky-50/60">
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">{issue.id}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{issue.subject}</td>
                  <td className="py-3.5 px-4 text-slate-700">{issue.buyer}</td>
                  <td className="py-3.5 px-4 text-slate-500">{issue.created}</td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={issue.status} label={issue.statusLabel} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Button variant="secondary" size="sm">
                      View Thread <ExternalLink className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
