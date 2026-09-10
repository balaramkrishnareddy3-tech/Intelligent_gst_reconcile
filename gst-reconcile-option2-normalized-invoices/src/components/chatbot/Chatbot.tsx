import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X, Send, Bot, Trash2, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useGstStore } from '@/store/gstStore';
import { cn } from '@/utils/cn';

interface ChatAction {
  label: string;
  to: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  actions?: ChatAction[];
  time: string;
}

const CHAT_KEY = 'gst_reconcile_chat_v1';

const nowTime = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export default function Chatbot() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { getStats, getVendorsSummary, getAuditTrail, getReconciliationBatches } = useGstStore();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = localStorage.getItem(CHAT_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ChatMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      /* ignore */
    }
    return [
      {
        id: uid(),
        role: 'bot',
        time: nowTime(),
        text:
          'Hello! I am the GST Reconcile Assistant. I can answer questions about your reconciliation, ITC risk, mismatches, vendors, GSTR-2B rules — or take you directly to any module. How can I help?',
      },
    ];
  });

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_KEY, JSON.stringify(messages.slice(-60)));
    } catch {
      /* ignore */
    }
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing, open]);

  const role = user?.role ?? null;

  const pathsForRole: Record<string, string> =
    role === 'admin'
      ? {
          dashboard: '/admin/dashboard',
          company: '/admin/companies',
          vendor: '/admin/vendors',
          invoice: '/admin/invoices',
          reconciliation: '/admin/reconciliation',
          mismatch: '/admin/mismatches',
          itc: '/admin/itc-risk',
          graph: '/admin/transaction-graph',
          audit: '/admin/audit-trail',
          report: '/admin/reports',
          settings: '/admin/settings',
          data: '/admin/dashboard',
        }
      : role === 'vendor'
      ? {
          dashboard: '/vendor/dashboard',
          invoice: '/vendor/invoices',
          mismatch: '/vendor/mismatches',
          compliance: '/vendor/compliance',
          issue: '/vendor/issues',
          report: '/vendor/reports',
          settings: '/vendor/settings',
          reconciliation: '/vendor/dashboard',
          itc: '/vendor/compliance',
          vendor: '/vendor/dashboard',
          graph: '/vendor/dashboard',
          audit: '/vendor/dashboard',
          data: '/vendor/dashboard',
          company: '/vendor/dashboard',
        }
      : {
          dashboard: '/company/dashboard',
          data: '/company/data-sources',
          reconciliation: '/company/reconciliation',
          results: '/company/reconciliation/results',
          mismatch: '/company/mismatches',
          itc: '/company/itc-risk',
          vendor: '/company/vendor-risk',
          graph: '/company/transaction-graph',
          audit: '/company/audit-trail',
          report: '/company/reports',
          settings: '/company/settings',
          invoice: '/company/reconciliation/results',
          company: '/company/dashboard',
        };

  const detectTopic = (q: string): string | null => {
    if (q.includes('mismatch') || q.includes('discrepan')) return 'mismatch';
    if (q.includes('itc') || q.includes('credit')) return 'itc';
    if (q.includes('reconcil')) return q.includes('result') ? 'results' : 'reconciliation';
    if (q.includes('vendor') || q.includes('supplier')) return 'vendor';
    if (q.includes('invoice')) return 'invoice';
    if (q.includes('audit')) return 'audit';
    if (q.includes('report')) return 'report';
    if (q.includes('graph')) return 'graph';
    if (q.includes('data source') || q.includes('upload')) return 'data';
    if (q.includes('compan') || q.includes('tenant')) return 'company';
    if (q.includes('compliance')) return 'compliance';
    if (q.includes('setting')) return 'settings';
    if (q.includes('dashboard') || q.includes('home')) return 'dashboard';
    return null;
  };

  const generateReply = (raw: string): { text: string; actions?: ChatAction[] } => {
    const q = raw.toLowerCase().trim();
    const stats = getStats();
    const vendors = getVendorsSummary();
    const batches = getReconciliationBatches();
    const auditEvents = getAuditTrail();

    const fmt = (n: number) => n.toLocaleString('en-IN');
    const inr = (n: number) =>
      n >= 10000000
        ? `₹${(n / 10000000).toFixed(2)} Cr`
        : n >= 100000
        ? `₹${(n / 100000).toFixed(2)} L`
        : `₹${fmt(n)}`;

    // Greetings
    if (/^(hi|hello|hey|namaste|good (morning|afternoon|evening))\b/.test(q)) {
      return {
        text: `Hello${user ? `, ${user.name.split(' ')[0]}` : ''}! I'm your GST Reconcile assistant. Ask me about mismatches, ITC risk, vendors, GSTR-2B rules, or say "take me to reports" and I'll navigate you there.`,
      };
    }

    // Capabilities
    if (q.includes('help') || q.includes('what can you do') || q.includes('capabilities')) {
      return {
        text: 'I can: (1) report live reconciliation, mismatch & ITC statistics, (2) explain GSTR-2B / GSTR-1 / GSTIN rules, (3) summarize vendor risk, (4) navigate you to any module (e.g. "open ITC risk"), and (5) guide you through the 20-step reconciliation engine.',
        actions: [
          { label: 'Live Mismatches', to: pathsForRole.mismatch },
          { label: 'ITC Risk', to: pathsForRole.itc },
        ],
      };
    }

    // Demo credentials
    if (q.includes('credential') || q.includes('password') || q.includes('demo login') || q.includes('login id')) {
      return {
        text: 'Demo credentials → Company: company@demo.com / company123 • Vendor: vendor@demo.com / vendor123 • Admin: admin@demo.com / admin123.',
        actions: [
          { label: 'Company Login', to: '/login/company' },
          { label: 'Vendor Login', to: '/login/vendor' },
          { label: 'Admin Login', to: '/login/admin' },
        ],
      };
    }

    // Navigation intent
    const navIntent =
      q.includes('go to') ||
      q.includes('open ') ||
      q.includes('take me') ||
      q.includes('navigate') ||
      q.includes('show me the');
    if (navIntent) {
      const topic = detectTopic(q);
      if (topic && pathsForRole[topic]) {
        const to = pathsForRole[topic];
        navigate(to);
        return { text: `Navigating you to the ${topic} module now.` };
      }
      return {
        text: 'I can take you to: Dashboard, Data Sources, Reconciliation, Mismatches, ITC Risk, Vendors, Transaction Graph, Audit Trail, Reports or Settings. Which one?',
      };
    }

    // Mismatches
    if (q.includes('mismatch') || q.includes('discrepan')) {
      const openIssues =
        stats.mismatchCount + stats.missingCount + stats.duplicateCount + stats.highRiskCount;
      return {
        text: `You have ${openIssues} open discrepancies: ${stats.mismatchCount} value mismatches, ${stats.missingCount} missing in GSTR-2B, ${stats.duplicateCount} duplicates and ${stats.highRiskCount} high-risk flags. Total variance exposure is ${inr(stats.itcAtRisk)}.`,
        actions: [{ label: 'Open Mismatch Workbench', to: pathsForRole.mismatch }],
      };
    }

    // ITC
    if (q.includes('itc') || q.includes('input tax credit') || q.includes('credit')) {
      const pct = stats.totalItc > 0 ? ((stats.itcAtRisk / stats.totalItc) * 100).toFixed(1) : '0';
      return {
        text: `Total ITC claimed: ${inr(stats.totalItc)}. Safe to claim: ${inr(stats.safeItc)} (${(100 - Number(pct)).toFixed(1)}%). At risk under Sec 16(2)(aa): ${inr(stats.itcAtRisk)} (${pct}%).`,
        actions: [{ label: 'Open ITC Risk Monitor', to: pathsForRole.itc }],
      };
    }

    // Reconciliation
    if (q.includes('reconcil')) {
      const last = batches[0];
      return {
        text: `The engine runs 20 statutory steps: ingest → validate → normalize GSTIN/invoice/date → compare taxable, CGST, SGST, IGST → detect missing/duplicate → classify → risk score → audit → graph. Latest batch ${last ? `${last.id} (${last.status}, ${last.matchRate}% match)` : 'not run yet'}.`,
        actions: [
          { label: 'Run / Monitor Reconciliation', to: pathsForRole.reconciliation },
          { label: 'View Results', to: pathsForRole.results ?? pathsForRole.reconciliation },
        ],
      };
    }

    // Vendors
    if (q.includes('vendor') || q.includes('supplier')) {
      const risky = vendors.filter((v) => v.riskLevel === 'HIGH' || v.riskLevel === 'CRITICAL');
      const worst = [...vendors].sort((a, b) => a.complianceScore - b.complianceScore)[0];
      return {
        text: `Tracking ${vendors.length} suppliers. ${risky.length} are high/critical risk${
          worst ? ` — weakest: ${worst.name} (compliance ${worst.complianceScore}/100)` : ''
        }.`,
        actions: [{ label: 'Open Vendor Registry', to: pathsForRole.vendor }],
      };
    }

    // Invoices
    if (q.includes('invoice')) {
      return {
        text: `The ledger holds ${fmt(stats.totalInvoices)} inward invoices: ${fmt(stats.matchedCount)} matched, ${fmt(stats.mismatchCount)} mismatched, ${fmt(stats.missingCount)} missing, ${fmt(stats.duplicateCount)} duplicated.`,
        actions: [{ label: 'Open Invoice Registry', to: pathsForRole.invoice }],
      };
    }

    // GSTR explanations
    if (q.includes('gstr-2b') || q.includes('2b')) {
      return {
        text: 'GSTR-2B is the auto-drafted monthly ITC statement generated from your suppliers\' GSTR-1 filings. ITC can only be claimed for invoices appearing in GSTR-2B (Sec 16(2)(aa)). Our engine matches your purchase register against it line-by-line.',
      };
    }
    if (q.includes('gstr-1') || q.includes('gstr-3b') || q.includes('3b')) {
      return {
        text: 'GSTR-1 reports outward supplies (sales) while GSTR-3B is the monthly summary return where ITC is actually claimed. Mismatches between GSTR-1 and your buyer\'s books create the discrepancies we track.',
      };
    }
    if (q.includes('gstin')) {
      return {
        text: 'A GSTIN is a 15-character ID: 2-digit state code + 10-digit PAN + 1 entity code + Z + 1 checksum character. Our engine normalizes GSTINs before matching to avoid false mismatches.',
      };
    }

    // Audit
    if (q.includes('audit')) {
      return {
        text: `${fmt(auditEvents.length)} immutable audit events are logged with SHA-256 integrity hashes — ingestions, normalizations, comparisons, resolutions and admin stamps.`,
        actions: [{ label: 'Open Audit Trail', to: pathsForRole.audit }],
      };
    }

    // Reports
    if (q.includes('report')) {
      return {
        text: 'Six executive reports are available: Reconciliation Summary, ITC Exposure Ledger, Supplier Compliance Sheet, Pipeline Telemetry, Tenant Financial Overview and System Audit Log — all exportable to CSV/Excel and printable to PDF.',
        actions: [{ label: 'Open Reports', to: pathsForRole.report }],
      };
    }

    // Graph
    if (q.includes('graph')) {
      return {
        text: 'The Transaction Knowledge Graph links Company → Vendor → Invoice → Purchase Record → GST Record → Mismatch → ITC → Risk → Audit Event in an interactive D3 force simulation with risk-path tracing.',
        actions: [{ label: 'Launch Knowledge Graph', to: pathsForRole.graph }],
      };
    }

    // Overall stats
    if (q.includes('stat') || q.includes('summary') || q.includes('overview')) {
      return {
        text: `Live overview: ${fmt(stats.totalInvoices)} invoices • ${stats.healthRate}% matched • ${stats.mismatchCount} mismatched • ${stats.missingCount} missing • ITC ${inr(stats.totalItc)} (${inr(stats.itcAtRisk)} at risk) • ${vendors.length} vendors tracked.`,
        actions: [{ label: 'Open Dashboard', to: pathsForRole.dashboard }],
      };
    }

    // Thanks
    if (q.includes('thank') || q.includes('thanks')) {
      return { text: 'You\'re welcome! Ask me anything else about your GST reconciliation.' };
    }

    // Fallback
    return {
      text: 'I didn\'t catch that. Try asking: "how many mismatches?", "what is my ITC at risk?", "explain GSTR-2B", "which vendors are risky?", or "take me to reports".',
    };
  };

  const sendMessage = (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || typing) return;

    const userMsg: ChatMessage = { id: uid(), role: 'user', text, time: nowTime() };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setTyping(true);

    window.setTimeout(() => {
      const reply = generateReply(text);
      setMessages((m) => [...m, { id: uid(), role: 'bot', text: reply.text, actions: reply.actions, time: nowTime() }]);
      setTyping(false);
    }, 420);
  };

  const quickChips = [
    'How many mismatches?',
    'What is my ITC at risk?',
    'Which vendors are risky?',
    'Explain GSTR-2B',
    'Take me to reports',
  ];

  const clearChat = () => {
    setMessages([
      {
        id: uid(),
        role: 'bot',
        time: nowTime(),
        text: 'Chat cleared. How can I help you with GST reconciliation today?',
      },
    ]);
  };

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close assistant' : 'Open assistant'}
        className={cn(
          'fixed bottom-6 right-6 z-[70] flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all duration-200 hover:scale-105',
          open
            ? 'bg-slate-800 text-white shadow-slate-900/40'
            : 'bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-cyan-500/40'
        )}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-4 z-[70] flex h-[560px] max-h-[calc(100vh-8rem)] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl shadow-slate-900/25 backdrop-blur-xl sm:right-6">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-slate-200 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">GST Reconcile Assistant</p>
              <p className="flex items-center gap-1.5 text-[10px] font-medium text-cyan-100">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Online • Live data engine{role ? ` • ${role.toUpperCase()} session` : ''}
              </p>
            </div>
            <button
              onClick={clearChat}
              title="Clear conversation"
              className="rounded-lg p-1.5 text-cyan-100 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn('flex flex-col', m.role === 'user' ? 'items-end' : 'items-start')}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm',
                    m.role === 'user'
                      ? 'rounded-br-sm bg-gradient-to-br from-cyan-600 to-blue-600 text-white'
                      : 'rounded-bl-sm border border-slate-200 bg-slate-50 text-slate-700'
                  )}
                >
                  {m.text}
                  {m.actions && m.actions.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {m.actions.map((a) => (
                        <button
                          key={a.to + a.label}
                          onClick={() => {
                            navigate(a.to);
                            setOpen(false);
                          }}
                          className={cn(
                            'rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all',
                            m.role === 'user'
                              ? 'bg-white/15 text-white hover:bg-white/25'
                              : 'border border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100'
                          )}
                        >
                          {a.label} →
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span className="mt-1 text-[9px] text-slate-400">{m.time}</span>
              </div>
            ))}

            {typing && (
              <div className="flex items-end gap-2">
                <div className="rounded-2xl rounded-bl-sm border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:120ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:240ms]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick chips */}
          <div className="flex gap-1.5 overflow-x-auto border-t border-slate-200 bg-slate-50/80 px-3 py-2">
            {quickChips.map((c) => (
              <button
                key={c}
                onClick={() => sendMessage(c)}
                className="whitespace-nowrap rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 transition-colors hover:border-cyan-300 hover:text-cyan-700"
              >
                {c}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-slate-200 bg-white px-3 py-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') sendMessage();
              }}
              placeholder="Ask about ITC, mismatches, vendors…"
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || typing}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/30 transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>

          <p className="flex items-center justify-center gap-1 border-t border-slate-100 bg-slate-50 py-1.5 text-[9px] text-slate-400">
            <Sparkles className="h-2.5 w-2.5" />
            Answers generated from your live reconciliation dataset
          </p>
        </div>
      )}
    </>
  );
}
