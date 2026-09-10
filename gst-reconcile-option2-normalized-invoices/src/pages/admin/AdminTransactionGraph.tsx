import { useEffect, useRef, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import * as d3 from 'd3';
import { useAdminSafeGstStore as useGstStore } from '@/store/useAdminSafeGstStore';
import type { InvoiceItem, CompanyTenant } from '@/types/gst';
import {
  Network,
  Search,
  Sparkles,
  Zap,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  ArrowRight,
  ShieldAlert,
  Building2,
  Users,
  FileText,
  RotateCcw,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import NodeInsightPanel from '@/components/graph/NodeInsightPanel';

export type GraphEntityType =
  | 'COMPANY'
  | 'VENDOR'
  | 'INVOICE'
  | 'PURCHASE_RECORD'
  | 'GST_RECORD'
  | 'GSTIN'
  | 'MISMATCH'
  | 'ITC'
  | 'RISK'
  | 'AUDIT_EVENT';

export interface AdminGraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  entityType: GraphEntityType;
  color: string;
  radius: number;
  data: any;
  riskLevel?: string;
  invoiceId?: string;
  companyId?: string;
  vendorId?: string;
}

export interface AdminGraphLink extends d3.SimulationLinkDatum<AdminGraphNode> {
  id: string;
  source: string | AdminGraphNode;
  target: string | AdminGraphNode;
  relationship: string;
  isRiskPath?: boolean;
}

export default function AdminTransactionGraph() {
  const [searchParams] = useSearchParams();
  const focusParam = searchParams.get('focus');
  const navigate = useNavigate();

  const { invoices, companies, getVendorsSummary } = useGstStore();
  const vendors = getVendorsSummary();
  const svgRef = useRef<SVGSVGElement | null>(null);

  // States
  const [searchQuery, setSearchQuery] = useState(focusParam || '');
  const [selectedNode, setSelectedNode] = useState<AdminGraphNode | null>(null);
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('ALL');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('ALL');
  const [selectedVendorFilter, setSelectedVendorFilter] = useState<string>('ALL');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('ALL');
  const [invoiceLookup, setInvoiceLookup] = useState('');
  const [focusedInvoiceNumber, setFocusedInvoiceNumber] = useState<string | null>(null);
  const [isRiskPathActive, setIsRiskPathActive] = useState(false);
  const [tracedNodeId, setTracedNodeId] = useState<string | null>(null);

  // Entity colors mapping
  const entityColors: Record<GraphEntityType, string> = {
    COMPANY: '#0284c7', // Sky Blue
    VENDOR: '#6366f1', // Indigo
    INVOICE: '#0ea5e9', // Cyan/Sky
    PURCHASE_RECORD: '#10b981', // Emerald
    GST_RECORD: '#8b5cf6', // Violet
    GSTIN: '#64748b', // Slate
    MISMATCH: '#f59e0b', // Amber
    ITC: '#06b6d4', // Cyan
    RISK: '#ef4444', // Red
    AUDIT_EVENT: '#3b82f6', // Blue
  };

  // Build Multi-Tenant Graph Data from Centralized Store
  const { nodes, links } = useMemo(() => {
    const nodeList: AdminGraphNode[] = [];
    const linkList: AdminGraphLink[] = [];
    const nodeMap = new Set<string>();

    const addNode = (node: AdminGraphNode) => {
      if (!nodeMap.has(node.id)) {
        nodeMap.add(node.id);
        nodeList.push(node);
      }
    };

    const addLink = (
      source: string,
      target: string,
      relationship: string,
      isRiskPath = false
    ) => {
      const linkId = `${source}->${relationship}->${target}`;
      linkList.push({
        id: linkId,
        source,
        target,
        relationship,
        isRiskPath,
      });
    };

    // 1. Registered Companies Nodes (Multi-tenant roots)
    companies.forEach((comp: CompanyTenant) => {
      addNode({
        id: `COMP-${comp.id}`,
        name: comp.name,
        entityType: 'COMPANY',
        color: entityColors.COMPANY,
        radius: 28,
        companyId: comp.id,
        data: {
          id: comp.id,
          name: comp.name,
          gstin: comp.gstin,
          jurisdiction: comp.jurisdiction,
          plan: comp.plan,
          status: comp.status,
          score: `${comp.complianceScore}/100`,
        },
      });
    });

    const primaryCompanyNodeId = companies.length > 0 ? `COMP-${companies[0].id}` : 'COMP-COMP-01';

    // 2. Loop through Invoices to construct the knowledge mesh
    invoices.forEach((inv: InvoiceItem) => {
      // Find company for this invoice
      const companyId = primaryCompanyNodeId;

      // Vendor Node
      const vendorNodeId = `VEND-${inv.vendorGstin}`;
      addNode({
        id: vendorNodeId,
        name: inv.vendorName,
        entityType: 'VENDOR',
        color: entityColors.VENDOR,
        radius: 22,
        vendorId: inv.vendorId,
        data: {
          id: inv.vendorId,
          name: inv.vendorName,
          gstin: inv.vendorGstin,
        },
      });

      // Relationship: COMPANY --PURCHASED_FROM--> VENDOR
      addLink(companyId, vendorNodeId, 'PURCHASED_FROM', inv.status !== 'MATCHED');

      // Vendor GSTIN Node
      const gstinNodeId = `GSTIN-${inv.vendorGstin}`;
      addNode({
        id: gstinNodeId,
        name: inv.vendorGstin,
        entityType: 'GSTIN',
        color: entityColors.GSTIN,
        radius: 14,
        data: {
          gstin: inv.vendorGstin,
          stateCode: inv.vendorGstin.substring(0, 2),
        },
      });
      addLink(vendorNodeId, gstinNodeId, 'REGISTERED_AS');

      // Invoice Node
      const invNodeId = `INV-${inv.invoiceNumber}`;
      addNode({
        id: invNodeId,
        name: inv.invoiceNumber,
        entityType: 'INVOICE',
        color: entityColors.INVOICE,
        radius: 18,
        riskLevel: inv.riskLevel,
        invoiceId: inv.id,
        data: {
          invoiceNumber: inv.invoiceNumber,
          date: inv.invoiceDate,
          status: inv.status,
          totalValue: `₹${inv.companyRecord.totalValue.toLocaleString('en-IN')}`,
          vendor: inv.vendorName,
        },
      });

      // Relationship: VENDOR --ISSUED--> INVOICE
      addLink(vendorNodeId, invNodeId, 'ISSUED', inv.status !== 'MATCHED');

      // Purchase Record Node
      const prNodeId = `PR-${inv.invoiceNumber}`;
      addNode({
        id: prNodeId,
        name: `Ledger: ₹${inv.companyRecord.taxableValue.toLocaleString('en-IN')}`,
        entityType: 'PURCHASE_RECORD',
        color: entityColors.PURCHASE_RECORD,
        radius: 16,
        invoiceId: inv.id,
        data: {
          taxableValue: `₹${inv.companyRecord.taxableValue.toLocaleString('en-IN')}`,
          totalGst: `₹${inv.companyRecord.totalGst.toLocaleString('en-IN')}`,
          itcEligible: inv.companyRecord.itcEligible ? 'Eligible' : 'Ineligible',
        },
      });
      // Relationship: INVOICE --HAS_PURCHASE_RECORD--> PURCHASE RECORD
      addLink(invNodeId, prNodeId, 'HAS_PURCHASE_RECORD', inv.status !== 'MATCHED');

      // GST Record Node (if present)
      if (inv.gstRecord) {
        const gstNodeId = `GST-${inv.invoiceNumber}`;
        addNode({
          id: gstNodeId,
          name: `2B: ₹${inv.gstRecord.taxableValue.toLocaleString('en-IN')}`,
          entityType: 'GST_RECORD',
          color: entityColors.GST_RECORD,
          radius: 16,
          invoiceId: inv.id,
          data: {
            taxableValue: `₹${inv.gstRecord.taxableValue.toLocaleString('en-IN')}`,
            totalGst: `₹${inv.gstRecord.totalGst.toLocaleString('en-IN')}`,
            returnPeriod: inv.gstRecord.returnPeriod,
            filingDate: inv.gstRecord.filingDate,
            portalItc: inv.gstRecord.itcAvailable ? 'Available' : 'Disallowed',
          },
        });
        // Relationship: INVOICE --HAS_GST_RECORD--> GST RECORD
        addLink(invNodeId, gstNodeId, 'HAS_GST_RECORD', inv.status !== 'MATCHED');

        // Relationship: PURCHASE RECORD --COMPARED_WITH--> or --MISMATCHED_WITH--> GST RECORD
        if (inv.status === 'MATCHED') {
          addLink(prNodeId, gstNodeId, 'COMPARED_WITH');
        } else {
          addLink(prNodeId, gstNodeId, 'MISMATCHED_WITH', true);
        }
      }

      // If Mismatch / Risk Exists
      if (inv.status !== 'MATCHED') {
        // Mismatch Node
        const mismatchNodeId = `MISMATCH-${inv.invoiceNumber}`;
        addNode({
          id: mismatchNodeId,
          name: `${inv.status}: ₹${inv.taxDifference.toLocaleString('en-IN')}`,
          entityType: 'MISMATCH',
          color: entityColors.MISMATCH,
          radius: 17,
          riskLevel: inv.riskLevel,
          invoiceId: inv.id,
          data: {
            status: inv.status,
            taxDifference: `₹${inv.taxDifference.toLocaleString('en-IN')}`,
            taxableDifference: `₹${inv.taxableDifference.toLocaleString('en-IN')}`,
            explanation: inv.mismatchExplanation || 'Tax deviation detected.',
          },
        });
        addLink(prNodeId, mismatchNodeId, 'GENERATES_MISMATCH', true);

        // ITC Node
        const itcNodeId = `ITC-${inv.invoiceNumber}`;
        addNode({
          id: itcNodeId,
          name: `ITC Exposed: ₹${inv.itcRiskAmount.toLocaleString('en-IN')}`,
          entityType: 'ITC',
          color: entityColors.ITC,
          radius: 15,
          invoiceId: inv.id,
          data: {
            totalClaimed: `₹${inv.companyRecord.totalGst.toLocaleString('en-IN')}`,
            itcAtRisk: `₹${inv.itcRiskAmount.toLocaleString('en-IN')}`,
            impact: 'Section 16(2)(aa) statutory restriction',
          },
        });
        // Relationship: MISMATCH --AFFECTS--> ITC
        addLink(mismatchNodeId, itcNodeId, 'AFFECTS', true);

        // Risk Node
        const riskNodeId = `RISK-${inv.invoiceNumber}`;
        addNode({
          id: riskNodeId,
          name: `${inv.riskLevel} Risk: ₹${inv.itcRiskAmount.toLocaleString('en-IN')}`,
          entityType: 'RISK',
          color: entityColors.RISK,
          radius: 17,
          riskLevel: inv.riskLevel,
          invoiceId: inv.id,
          data: {
            level: inv.riskLevel,
            exposure: `₹${inv.itcRiskAmount.toLocaleString('en-IN')}`,
            enforcement: inv.recommendedAction,
          },
        });
        // Relationship: MISMATCH --GENERATES--> RISK
        addLink(mismatchNodeId, riskNodeId, 'GENERATES', true);

        // Audit Event Node
        if (inv.auditEvents.length > 0) {
          const firstAudit = inv.auditEvents[0];
          const auditNodeId = `AUDIT-${firstAudit.id}`;
          addNode({
            id: auditNodeId,
            name: `${firstAudit.action}`,
            entityType: 'AUDIT_EVENT',
            color: entityColors.AUDIT_EVENT,
            radius: 14,
            invoiceId: inv.id,
            data: {
              action: firstAudit.action,
              result: firstAudit.result,
              actor: firstAudit.actor,
              timestamp: firstAudit.timestamp,
              explanation: firstAudit.explanation,
            },
          });
          // Relationship: INVOICE --GENERATES--> AUDIT EVENT
          addLink(invNodeId, auditNodeId, 'GENERATES', true);
        }
      }
    });

    return { nodes: nodeList, links: linkList };
  }, [invoices, companies]);

  // Filtered nodes & links
  const { filteredNodes, filteredLinks } = useMemo(() => {
    let n = [...nodes];

    // Invoice focus mode: show only the selected invoice and its connected chain.
    if (focusedInvoiceNumber) {
      const focusedInvoice = invoices.find((invoice) => invoice.invoiceNumber === focusedInvoiceNumber);
      if (!focusedInvoice) return { filteredNodes: [], filteredLinks: [] };

      const primaryCompanyNodeId = companies.length > 0 ? `COMP-${companies[0].id}` : 'COMP-COMP-01';
      const visibleIds = new Set<string>([
        primaryCompanyNodeId,
        `VEND-${focusedInvoice.vendorGstin}`,
        `GSTIN-${focusedInvoice.vendorGstin}`,
        `INV-${focusedInvoice.invoiceNumber}`,
        `PR-${focusedInvoice.invoiceNumber}`,
        `GST-${focusedInvoice.invoiceNumber}`,
        `MISMATCH-${focusedInvoice.invoiceNumber}`,
        `ITC-${focusedInvoice.invoiceNumber}`,
        `RISK-${focusedInvoice.invoiceNumber}`,
      ]);

      nodes.forEach((node) => {
        if (node.invoiceId === focusedInvoice.id || node.invoiceId === focusedInvoice.invoiceNumber) {
          visibleIds.add(node.id);
        }
      });

      n = nodes.filter((node) => visibleIds.has(node.id));
      const l = links.filter((link) => {
        const sourceId = typeof link.source === 'object' ? (link.source as any).id : link.source;
        const targetId = typeof link.target === 'object' ? (link.target as any).id : link.target;
        return visibleIds.has(sourceId) && visibleIds.has(targetId);
      });
      return {
        filteredNodes: n,
        filteredLinks: Array.from(new Map(l.map((link) => [link.id, link])).values()),
      };
    }

    // Filter by Company
    if (selectedCompanyFilter !== 'ALL') {
      n = n.filter((node) => {
        if (node.entityType === 'COMPANY') return node.companyId === selectedCompanyFilter;
        return true;
      });
    }

    // Filter by Entity Type
    if (selectedEntityType !== 'ALL') {
      n = n.filter((node) => node.entityType === selectedEntityType || node.entityType === 'COMPANY');
    }

    // Filter by Vendor
    if (selectedVendorFilter !== 'ALL') {
      n = n.filter((node) => {
        if (node.entityType === 'COMPANY') return true;
        if (node.id.includes(selectedVendorFilter) || node.name.includes(selectedVendorFilter))
          return true;
        return false;
      });
    }

    // Filter by Risk Level
    if (selectedRiskFilter !== 'ALL') {
      n = n.filter((node) => {
        if (node.entityType === 'COMPANY') return true;
        return node.riskLevel === selectedRiskFilter;
      });
    }

    // Filter by Search Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      n = n.filter(
        (node) =>
          node.name.toLowerCase().includes(q) ||
          node.id.toLowerCase().includes(q) ||
          node.entityType.toLowerCase().includes(q)
      );
    }

    const nodeIds = new Set(n.map((node) => node.id));
    const l = links.filter((link) => {
      const sId = typeof link.source === 'object' ? (link.source as any).id : link.source;
      const tId = typeof link.target === 'object' ? (link.target as any).id : link.target;
      return nodeIds.has(sId) && nodeIds.has(tId);
    });

    return { filteredNodes: n, filteredLinks: l };
  }, [
    nodes,
    links,
    selectedCompanyFilter,
    selectedEntityType,
    selectedVendorFilter,
    selectedRiskFilter,
    searchQuery,
    focusedInvoiceNumber,
    invoices,
    companies,
  ]);

  // Handle focus param
  useEffect(() => {
    if (focusParam) {
      const target = nodes.find(
        (n) => n.name.toLowerCase().includes(focusParam.toLowerCase()) || n.id.toLowerCase().includes(focusParam.toLowerCase())
      );
      if (target) {
        setSelectedNode(target);
        if (target.entityType === 'INVOICE') {
          const invoiceNumber = target.name;
          const focusedInvoice = invoices.find((invoice) => invoice.invoiceNumber === invoiceNumber);
          setInvoiceLookup(invoiceNumber);
          setFocusedInvoiceNumber(invoiceNumber);
          setTracedNodeId(target.id);
          setIsRiskPathActive(focusedInvoice ? focusedInvoice.status !== 'MATCHED' : false);
        }
      }
    }
  }, [focusParam, nodes, invoices]);

  // D3 Interactive Force Simulation Render
  useEffect(() => {
    if (!svgRef.current) return;

    const width = svgRef.current.clientWidth || 960;
    const height = 620;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('viewBox', [0, 0, width, height]);

    // Container for zooming & panning
    const g = svg.append('g').attr('class', 'admin-graph-container');

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.25, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Arrowhead marker definitions for directed edges
    const defs = svg.append('defs');

    // Standard arrow
    defs
      .append('marker')
      .attr('id', 'admin-arrow-standard')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#94a3b8');

    // Risk Path glowing red arrow
    defs
      .append('marker')
      .attr('id', 'admin-arrow-risk')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#ef4444');

    // Simulation Data Clones
    const simulationNodes = filteredNodes.map((d) => ({ ...d }));
    const simulationLinks = filteredLinks.map((d) => ({ ...d }));

    // Force Simulation
    const simulation = d3
      .forceSimulation<AdminGraphNode>(simulationNodes)
      .force(
        'link',
        d3
          .forceLink<AdminGraphNode, AdminGraphLink>(simulationLinks)
          .id((d) => d.id)
          .distance(95)
      )
      .force('charge', d3.forceManyBody().strength(-260))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => d.radius + 20));

    // Draw Links
    const linkTouchesSelected = (d: AdminGraphLink) => {
      if (!selectedNode) return false;
      const sourceId = typeof d.source === 'object' ? (d.source as AdminGraphNode).id : d.source;
      const targetId = typeof d.target === 'object' ? (d.target as AdminGraphNode).id : d.target;
      return sourceId === selectedNode.id || targetId === selectedNode.id;
    };

    const connectedNodeIds = new Set<string>();
    if (selectedNode) {
      simulationLinks.forEach((d) => {
        const sourceId = typeof d.source === 'object' ? (d.source as AdminGraphNode).id : d.source;
        const targetId = typeof d.target === 'object' ? (d.target as AdminGraphNode).id : d.target;
        if (sourceId === selectedNode.id) connectedNodeIds.add(targetId);
        if (targetId === selectedNode.id) connectedNodeIds.add(sourceId);
      });
    }

    const link = g
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(simulationLinks)
      .enter()
      .append('line')
      .attr('stroke', (d) => {
        if (isRiskPathActive && d.isRiskPath) return '#ef4444';
        if (linkTouchesSelected(d)) return '#0284c7';
        return '#cbd5e1';
      })
      .attr('stroke-width', (d) => {
        if (isRiskPathActive && d.isRiskPath) return 2.8;
        if (linkTouchesSelected(d)) return 2.4;
        return 1.3;
      })
      .attr('stroke-dasharray', (d) => (d.relationship === 'MISMATCHED_WITH' ? '4,4' : 'none'))
      .attr('marker-end', (d) =>
        isRiskPathActive && d.isRiskPath ? 'url(#admin-arrow-risk)' : 'url(#admin-arrow-standard)'
      );

    // Link Text Labels
    const linkText = g
      .append('g')
      .attr('class', 'link-labels')
      .selectAll('text')
      .data(simulationLinks)
      .enter()
      .append('text')
      .attr('font-size', '8px')
      .attr('font-weight', '600')
      .attr('fill', (d) => {
        if (isRiskPathActive && d.isRiskPath) return '#b91c1c';
        if (linkTouchesSelected(d)) return '#0369a1';
        return '#64748b';
      })
      .attr('text-anchor', 'middle')
      .attr('dy', -3)
      .text((d) => d.relationship);

    // Drag behavior
    const drag = (sim: d3.Simulation<AdminGraphNode, undefined>) => {
      function dragstarted(event: any, d: AdminGraphNode) {
        if (!event.active) sim.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(event: any, d: AdminGraphNode) {
        d.fx = event.x;
        d.fy = event.y;
      }

      function dragended(event: any, d: AdminGraphNode) {
        if (!event.active) sim.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }

      return d3
        .drag<SVGGElement, AdminGraphNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
    };

    // Draw Nodes Group
    const node = g
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(simulationNodes)
      .enter()
      .append('g')
      .call(drag(simulation) as any)
      .on('click', (_event, d) => {
        setSelectedNode(d);
        if (d.entityType === 'INVOICE') {
          const invoiceNumber = d.name;
          const focusedInvoice = invoices.find((invoice) => invoice.invoiceNumber === invoiceNumber);
          setSelectedCompanyFilter('ALL');
          setSelectedEntityType('ALL');
          setSelectedVendorFilter('ALL');
          setSelectedRiskFilter('ALL');
          setSearchQuery('');
          setInvoiceLookup(invoiceNumber);
          setFocusedInvoiceNumber(invoiceNumber);
          setTracedNodeId(d.id);
          setIsRiskPathActive(focusedInvoice ? focusedInvoice.status !== 'MATCHED' : false);
        }
      });

    // Outer Selection / Highlight Ring
    node
      .append('circle')
      .attr('r', (d) => d.radius + 4)
      .attr('fill', 'none')
      .attr('stroke', (d) => {
        if (selectedNode?.id === d.id) return '#0284c7';
        if (connectedNodeIds.has(d.id)) return '#38bdf8';
        if (tracedNodeId === d.id) return '#f59e0b';
        if (isRiskPathActive && (d.entityType === 'RISK' || d.entityType === 'MISMATCH'))
          return '#ef4444';
        return 'transparent';
      })
      .attr('stroke-width', 2.5)
      .attr('stroke-dasharray', (d) => (selectedNode?.id === d.id ? 'none' : '3,3'));

    // Node Circle
    node
      .append('circle')
      .attr('r', (d) => d.radius)
      .attr('fill', (d) => d.color)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .style('filter', 'drop-shadow(0 2px 5px rgba(0,0,0,0.12))');

    // Node Text Label
    node
      .append('text')
      .attr('dy', (d) => d.radius + 12)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .attr('fill', '#1e293b')
      .style('pointer-events', 'none')
      .text((d) => (d.name.length > 22 ? d.name.substring(0, 20) + '...' : d.name));

    // Node Subtitle Label (Entity Class)
    node
      .append('text')
      .attr('dy', (d) => d.radius + 22)
      .attr('text-anchor', 'middle')
      .attr('font-size', '8px')
      .attr('font-weight', '600')
      .attr('fill', '#64748b')
      .style('pointer-events', 'none')
      .text((d) => d.entityType);

    // Simulation Tick Updates
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      linkText
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [filteredNodes, filteredLinks, selectedNode, isRiskPathActive, tracedNodeId, invoices]);

  const handleTraceRelationship = () => {
    if (selectedNode) {
      setTracedNodeId(selectedNode.id);
      setIsRiskPathActive(false);
    } else {
      const firstInvoice = nodes.find((n) => n.entityType === 'INVOICE');
      if (firstInvoice) {
        setSelectedNode(firstInvoice);
        setTracedNodeId(firstInvoice.id);
      }
    }
  };

  const invoiceMatches = useMemo(() => {
    const q = invoiceLookup.trim().toLowerCase();
    if (!q) return [];
    return invoices
      .filter(
        (invoice) =>
          invoice.invoiceNumber.toLowerCase().includes(q) ||
          invoice.vendorName.toLowerCase().includes(q) ||
          invoice.vendorGstin.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [invoiceLookup, invoices]);

  const focusInvoiceInGraph = (invoiceNumber: string) => {
    const invoice = invoices.find((item) => item.invoiceNumber === invoiceNumber);
    setSelectedCompanyFilter('ALL');
    setSelectedEntityType('ALL');
    setSelectedVendorFilter('ALL');
    setSelectedRiskFilter('ALL');
    setSearchQuery('');
    setInvoiceLookup(invoiceNumber);
    setFocusedInvoiceNumber(invoiceNumber);
    setIsRiskPathActive(invoice ? invoice.status !== 'MATCHED' : false);
    setTracedNodeId(`INV-${invoiceNumber}`);

    const target = nodes.find((node) => node.id === `INV-${invoiceNumber}`);
    if (target) setSelectedNode(target);
  };

  const clearInvoiceFocus = () => {
    setFocusedInvoiceNumber(null);
    setInvoiceLookup('');
    setSelectedNode(null);
    setTracedNodeId(null);
    setIsRiskPathActive(false);
  };

  const focusedInvoiceInfo = useMemo(
    () => invoices.find((invoice) => invoice.invoiceNumber === focusedInvoiceNumber),
    [focusedInvoiceNumber, invoices]
  );

  const handleTraceRiskPath = () => {
    setIsRiskPathActive(true);
    setTracedNodeId(null);
    const criticalNode = nodes.find((n) => n.entityType === 'RISK' || n.entityType === 'MISMATCH');
    if (criticalNode) setSelectedNode(criticalNode);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title="System-Wide Transaction Knowledge Graph"
        subtitle="Global relational topology spanning all client enterprises, supplier nodes, and statutory risk chains"
        icon={<Network className="h-6 w-6 text-white" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={isRiskPathActive ? 'primary' : 'secondary'}
              onClick={handleTraceRiskPath}
              className={isRiskPathActive ? 'ring-2 ring-rose-400' : ''}
            >
              <Zap className="h-3.5 w-3.5 text-rose-500 fill-current" /> Trace Risk Path
            </Button>
            <Button size="sm" variant="secondary" onClick={handleTraceRelationship}>
              <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Trace Relationship
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsRiskPathActive(false);
                setTracedNodeId(null);
                setSelectedNode(null);
                setSearchQuery('');
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
          </div>
        }
      />

      {/* Filter and Search Ribbon */}
      <GlassCard className="p-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Entity / Invoice / GSTIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-sky-200 bg-white py-2 pl-9 pr-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Client Company Filter */}
          <div>
            <select
              value={selectedCompanyFilter}
              onChange={(e) => setSelectedCompanyFilter(e.target.value)}
              className="w-full rounded-xl border border-sky-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 focus:border-sky-500 focus:outline-none"
            >
              <option value="ALL">All Client Tenants</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Entity Type Filter */}
          <div>
            <select
              value={selectedEntityType}
              onChange={(e) => setSelectedEntityType(e.target.value)}
              className="w-full rounded-xl border border-sky-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 focus:border-sky-500 focus:outline-none"
            >
              <option value="ALL">All Entity Types (10 Classes)</option>
              <option value="COMPANY">COMPANY</option>
              <option value="VENDOR">VENDOR</option>
              <option value="INVOICE">INVOICE</option>
              <option value="PURCHASE_RECORD">PURCHASE RECORD</option>
              <option value="GST_RECORD">GST RECORD</option>
              <option value="GSTIN">GSTIN</option>
              <option value="MISMATCH">MISMATCH</option>
              <option value="ITC">ITC</option>
              <option value="RISK">RISK</option>
              <option value="AUDIT_EVENT">AUDIT EVENT</option>
            </select>
          </div>

          {/* Vendor Filter */}
          <div>
            <select
              value={selectedVendorFilter}
              onChange={(e) => setSelectedVendorFilter(e.target.value)}
              className="w-full rounded-xl border border-sky-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 focus:border-sky-500 focus:outline-none"
            >
              <option value="ALL">All Suppliers</option>
              {vendors.map((v) => (
                <option key={v.gstin} value={v.gstin}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Risk Level Filter */}
          <div>
            <select
              value={selectedRiskFilter}
              onChange={(e) => setSelectedRiskFilter(e.target.value)}
              className="w-full rounded-xl border border-sky-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 focus:border-sky-500 focus:outline-none"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="CRITICAL">Critical Risk</option>
              <option value="HIGH">High Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="LOW">Low Risk</option>
            </select>
          </div>
        </div>

        {/* Direct invoice lookup: focus graph on a specific invoice and its connections */}
        <div className="mt-3 border-t border-sky-100 pt-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={invoiceLookup}
                onChange={(e) => setInvoiceLookup(e.target.value)}
                placeholder="Quick find invoice in graph (example: INV1024 or INV-2025-4822)..."
                className="w-full rounded-xl border border-sky-200 bg-white py-2 pl-9 pr-3 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:outline-none"
              />
            </div>
            {focusedInvoiceNumber ? (
              <Button variant="secondary" size="sm" onClick={clearInvoiceFocus}>
                <X className="h-3.5 w-3.5" /> Clear Invoice Focus
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={invoiceMatches.length === 0}
                onClick={() => invoiceMatches[0] && focusInvoiceInGraph(invoiceMatches[0].invoiceNumber)}
              >
                Focus Invoice <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {invoiceMatches.length > 0 && !focusedInvoiceNumber && (
            <div className="mt-2 flex flex-wrap gap-2">
              {invoiceMatches.map((invoice) => (
                <button
                  key={invoice.id}
                  onClick={() => focusInvoiceInGraph(invoice.invoiceNumber)}
                  className="rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-700 transition-colors hover:border-sky-400 hover:bg-sky-100"
                >
                  {invoice.invoiceNumber} · {invoice.vendorName}
                </button>
              ))}
            </div>
          )}

          {focusedInvoiceNumber && (
            <div className="mt-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-[11px] font-semibold text-cyan-800">
              Focus mode active for <span className="font-mono font-black">{focusedInvoiceNumber}</span>:
              showing company, vendor, purchase record, GST record, mismatch, ITC, risk and audit connections.
            </div>
          )}
        </div>
      </GlassCard>

      {/* Main Graph Viewport & Slide-over Details Drawer */}
      <div className="relative rounded-2xl border border-sky-200/80 bg-gradient-to-br from-[#f8fafc] via-white to-[#edf4fb] shadow-sm overflow-hidden h-[620px] flex">
        {/* SVG Force Canvas */}
        <div className="flex-1 h-full relative">
          <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Canvas Controls Overlay */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-white/95 backdrop-blur-md p-1.5 rounded-xl border border-sky-200/80 shadow-md">
            <span className="text-[11px] font-bold text-slate-700 px-2">
              {filteredNodes.length} Nodes • {filteredLinks.length} Edges
            </span>
            <div className="h-4 w-px bg-slate-200" />
            <button
              onClick={() => {
                if (svgRef.current) {
                  d3.select(svgRef.current).transition().call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 1.2);
                }
              }}
              className="p-1 rounded hover:bg-sky-100 text-slate-600 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                if (svgRef.current) {
                  d3.select(svgRef.current).transition().call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 0.8);
                }
              }}
              className="p-1 rounded hover:bg-sky-100 text-slate-600 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setIsRiskPathActive(false);
                setTracedNodeId(null);
                setSearchQuery('');
              }}
              className="p-1 rounded hover:bg-sky-100 text-slate-600 cursor-pointer"
              title="Reset View"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>

          {/* Active Risk Path Banner */}
          {isRiskPathActive && (
            <div className="absolute top-4 left-4 bg-rose-50/95 border border-rose-300 text-rose-900 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm animate-pulse">
              <Zap className="h-4 w-4 text-rose-600" />
              Trace Risk Path Active: Company → Vendor → Invoice → PR → GST → Mismatch → ITC → Risk → Audit
            </div>
          )}

          {focusedInvoiceInfo && (
            <div className="absolute right-4 top-4 w-[350px] max-w-[calc(100%-2rem)] rounded-2xl border border-sky-200 bg-white/95 p-4 text-xs shadow-xl shadow-slate-900/10 backdrop-blur-md">
              <div className="mb-3 flex items-center justify-between border-b border-sky-100 pb-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Focused Invoice Information
                  </p>
                  <p className="font-mono text-sm font-black text-sky-700">
                    {focusedInvoiceInfo.invoiceNumber}
                  </p>
                </div>
                <button
                  onClick={clearInvoiceFocus}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  title="Clear invoice focus"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400">Vendor</span>
                  <p className="truncate font-bold text-slate-900" title={focusedInvoiceInfo.vendorName}>
                    {focusedInvoiceInfo.vendorName}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">GSTIN</span>
                  <p className="font-mono text-[11px] font-bold text-slate-800">
                    {focusedInvoiceInfo.vendorGstin}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Taxable</span>
                  <p className="font-mono font-bold text-slate-900">
                    ₹{focusedInvoiceInfo.companyRecord.taxableValue.toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">ITC at Risk</span>
                  <p className="font-mono font-bold text-rose-600">
                    ₹{focusedInvoiceInfo.itcRiskAmount.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-black ${
                    focusedInvoiceInfo.status === 'MATCHED'
                      ? 'bg-emerald-50 text-emerald-700'
                      : focusedInvoiceInfo.status === 'MISMATCHED'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {focusedInvoiceInfo.status}
                </span>
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-black ${
                    focusedInvoiceInfo.riskLevel === 'LOW'
                      ? 'bg-emerald-50 text-emerald-700'
                      : focusedInvoiceInfo.riskLevel === 'MEDIUM'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {focusedInvoiceInfo.riskLevel} RISK
                </span>
              </div>
              {focusedInvoiceInfo.mismatchExplanation && (
                <p className="mt-2 line-clamp-3 rounded-lg bg-slate-50 p-2 text-[11px] leading-relaxed text-slate-600">
                  {focusedInvoiceInfo.mismatchExplanation}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right-Side Slide-Over Node Details Drawer */}
        {selectedNode && (
          <div className="w-84 border-l border-sky-200 bg-white/95 backdrop-blur-md p-5 flex flex-col justify-between overflow-y-auto shadow-xl z-10 animate-in slide-in-from-right duration-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-sky-100 pb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: selectedNode.color }}
                  />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {selectedNode.entityType} Entity Node
                  </span>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 break-words leading-tight">
                  {selectedNode.name}
                </h3>
                <p className="font-mono text-xs text-sky-700 mt-0.5">{selectedNode.id}</p>
              </div>

              {/* Entity Attributes Table */}
              <div className="space-y-2 text-xs">
                <div className="rounded-xl bg-sky-50/50 p-3 space-y-2 border border-sky-100">
                  <p className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
                    Node Metadata
                  </p>
                  {selectedNode.data &&
                    Object.entries(selectedNode.data).map(([key, val]) => {
                      if (typeof val === 'object') return null;
                      return (
                        <div key={key} className="flex justify-between py-1 border-b border-sky-100/60">
                          <span className="text-slate-500 capitalize">
                            {key.replace(/([A-Z])/g, ' $1')}
                          </span>
                          <span className="font-semibold text-slate-800 text-right truncate max-w-[150px]">
                            {String(val)}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {selectedNode.riskLevel && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 space-y-1">
                  <span className="font-bold flex items-center gap-1">
                    <ShieldAlert className="h-3.5 w-3.5 text-rose-600" /> Assessed Risk Rating:
                  </span>
                  <p className="font-semibold">{selectedNode.riskLevel} Statutory Disallowance</p>
                </div>
              )}

              <NodeInsightPanel
                selectedNode={selectedNode}
                nodes={filteredNodes}
                links={filteredLinks}
                invoices={invoices}
                onSelectNode={(node) => setSelectedNode(node as AdminGraphNode)}
              />
            </div>

            {/* Direct Admin Workstation Action Buttons */}
            <div className="pt-4 border-t border-sky-100 space-y-2">
              {selectedNode.invoiceId && (
                <Button
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => navigate(`/admin/invoices/${selectedNode.invoiceId}`)}
                >
                  <FileText className="h-3.5 w-3.5" /> Full Invoice Investigation <ArrowRight className="h-3 w-3" />
                </Button>
              )}

              {selectedNode.entityType === 'COMPANY' && (
                <Button
                  size="sm"
                  className="w-full text-xs"
                  onClick={() =>
                    navigate(
                      `/admin/companies/${selectedNode.companyId || selectedNode.data?.id || 'COMP-01'}`
                    )
                  }
                >
                  <Building2 className="h-3.5 w-3.5" /> Open Company Dossier
                </Button>
              )}

              {selectedNode.entityType === 'VENDOR' && (
                <Button
                  size="sm"
                  className="w-full text-xs"
                  onClick={() =>
                    navigate(
                      `/admin/vendors/${selectedNode.vendorId || selectedNode.data?.id || 'VEND-01'}`
                    )
                  }
                >
                  <Users className="h-3.5 w-3.5" /> Open Supplier Dossier
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend Ribbon */}
      <GlassCard className="p-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-slate-500 font-semibold">Entity Classes:</span>
          {(
            [
              ['COMPANY', '#0284c7'],
              ['VENDOR', '#6366f1'],
              ['INVOICE', '#0ea5e9'],
              ['PURCHASE_RECORD', '#10b981'],
              ['GST_RECORD', '#8b5cf6'],
              ['GSTIN', '#64748b'],
              ['MISMATCH', '#f59e0b'],
              ['ITC', '#06b6d4'],
              ['RISK', '#ef4444'],
              ['AUDIT_EVENT', '#3b82f6'],
            ] as const
          ).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[11px] font-medium text-slate-700">{type.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
