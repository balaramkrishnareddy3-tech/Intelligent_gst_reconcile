import { useEffect, useRef, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import * as d3 from 'd3';
import { useGstStore } from '@/store/gstStore';
import type { InvoiceItem } from '@/types/gst';
import {
  Network,
  Search,
  Filter,
  Sparkles,
  Zap,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import NodeInsightPanel from '@/components/graph/NodeInsightPanel';

// Graph Entity Types
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

export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  entityType: GraphEntityType;
  color: string;
  radius: number;
  data: any;
  riskLevel?: string;
  invoiceId?: string;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  relationship: string;
  isRiskPath?: boolean;
}

export default function TransactionGraph() {
  const [searchParams] = useSearchParams();
  const focusParam = searchParams.get('focus');
  const navigate = useNavigate();

  const { invoices } = useGstStore();
  const svgRef = useRef<SVGSVGElement | null>(null);

  // States
  const [searchQuery, setSearchQuery] = useState(focusParam || '');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
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

  // Build Graph Data from Centralized Invoices Store
  const { nodes, links } = useMemo(() => {
    const nodeList: GraphNode[] = [];
    const linkList: GraphLink[] = [];
    const nodeMap = new Set<string>();

    const addNode = (node: GraphNode) => {
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

    // 1. Root Company Node
    const companyId = 'COMP-ACME';
    addNode({
      id: companyId,
      name: 'Acme Corp India Pvt Ltd',
      entityType: 'COMPANY',
      color: entityColors.COMPANY,
      radius: 28,
      data: {
        gstin: '27AABCU9603R1ZM',
        role: 'Claimant / Buyer',
        location: 'Mumbai, Maharashtra',
      },
    });

    // 2. Loop through Invoices
    invoices.forEach((inv: InvoiceItem) => {
      // Vendor Node
      const vendorId = `VEND-${inv.vendorGstin}`;
      addNode({
        id: vendorId,
        name: inv.vendorName,
        entityType: 'VENDOR',
        color: entityColors.VENDOR,
        radius: 22,
        data: {
          gstin: inv.vendorGstin,
          name: inv.vendorName,
          vendorId: inv.vendorId,
        },
      });

      // Relationship: COMPANY --PURCHASED_FROM--> VENDOR
      addLink(companyId, vendorId, 'PURCHASED_FROM', inv.status !== 'MATCHED');

      // Vendor GSTIN Node
      const gstinId = `GSTIN-${inv.vendorGstin}`;
      addNode({
        id: gstinId,
        name: inv.vendorGstin,
        entityType: 'GSTIN',
        color: entityColors.GSTIN,
        radius: 14,
        data: { gstin: inv.vendorGstin, state: inv.vendorGstin.substring(0, 2) },
      });
      addLink(vendorId, gstinId, 'REGISTERED_AS');

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
          totalValue: inv.companyRecord.totalValue,
        },
      });

      // Relationship: VENDOR --ISSUED--> INVOICE
      addLink(vendorId, invNodeId, 'ISSUED', inv.status !== 'MATCHED');

      // Purchase Record Node
      const prNodeId = `PR-${inv.invoiceNumber}`;
      addNode({
        id: prNodeId,
        name: `Ledger: ₹${inv.companyRecord.taxableValue.toLocaleString('en-IN')}`,
        entityType: 'PURCHASE_RECORD',
        color: entityColors.PURCHASE_RECORD,
        radius: 16,
        invoiceId: inv.id,
        data: inv.companyRecord,
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
          data: inv.gstRecord,
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

      // If Mismatch / Missing / Risk exists
      if (inv.status !== 'MATCHED') {
        // Mismatch Node
        const mismatchId = `MISMATCH-${inv.invoiceNumber}`;
        addNode({
          id: mismatchId,
          name: `${inv.status}: ₹${inv.taxDifference.toLocaleString('en-IN')}`,
          entityType: 'MISMATCH',
          color: entityColors.MISMATCH,
          radius: 17,
          riskLevel: inv.riskLevel,
          invoiceId: inv.id,
          data: {
            variance: inv.taxDifference,
            explanation: inv.mismatchExplanation,
            fields: inv.mismatchFields,
          },
        });
        addLink(prNodeId, mismatchId, 'GENERATES_MISMATCH', true);

        // ITC Node
        const itcId = `ITC-${inv.invoiceNumber}`;
        addNode({
          id: itcId,
          name: `ITC Exposed: ₹${inv.itcRiskAmount.toLocaleString('en-IN')}`,
          entityType: 'ITC',
          color: entityColors.ITC,
          radius: 15,
          invoiceId: inv.id,
          data: {
            claimed: inv.companyRecord.totalGst,
            atRisk: inv.itcRiskAmount,
          },
        });
        // Relationship: MISMATCH --AFFECTS--> ITC
        addLink(mismatchId, itcId, 'AFFECTS', true);

        // Risk Node
        const riskId = `RISK-${inv.invoiceNumber}`;
        addNode({
          id: riskId,
          name: `${inv.riskLevel} Risk: ₹${inv.itcRiskAmount.toLocaleString('en-IN')}`,
          entityType: 'RISK',
          color: entityColors.RISK,
          radius: 17,
          riskLevel: inv.riskLevel,
          invoiceId: inv.id,
          data: {
            level: inv.riskLevel,
            action: inv.recommendedAction,
          },
        });
        // Relationship: MISMATCH --GENERATES--> RISK
        addLink(mismatchId, riskId, 'GENERATES', true);

        // Audit Event Node
        if (inv.auditEvents.length > 0) {
          const firstAudit = inv.auditEvents[0];
          const auditId = `AUDIT-${firstAudit.id}`;
          addNode({
            id: auditId,
            name: `${firstAudit.action}`,
            entityType: 'AUDIT_EVENT',
            color: entityColors.AUDIT_EVENT,
            radius: 14,
            invoiceId: inv.id,
            data: firstAudit,
          });
          // Relationship: INVOICE --GENERATES--> AUDIT EVENT
          addLink(invNodeId, auditId, 'GENERATES', true);
        }
      }
    });

    return { nodes: nodeList, links: linkList };
  }, [invoices]);

  // Filtered nodes & links
  const { filteredNodes, filteredLinks } = useMemo(() => {
    let n = [...nodes];

    // Invoice focus mode: show only the selected invoice and its own connected chain.
    if (focusedInvoiceNumber) {
      const focusedInvoice = invoices.find((invoice) => invoice.invoiceNumber === focusedInvoiceNumber);
      if (!focusedInvoice) return { filteredNodes: [], filteredLinks: [] };

      const invoiceNodeId = `INV-${focusedInvoice.invoiceNumber}`;
      const visibleIds = new Set<string>([
        'COMP-ACME',
        `VEND-${focusedInvoice.vendorGstin}`,
        `GSTIN-${focusedInvoice.vendorGstin}`,
        invoiceNodeId,
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

    // Filter by entity type
    if (selectedEntityType !== 'ALL') {
      n = n.filter((node) => node.entityType === selectedEntityType || node.entityType === 'COMPANY');
    }

    // Filter by vendor
    if (selectedVendorFilter !== 'ALL') {
      const targetVendor = invoices.find((i) => i.vendorName === selectedVendorFilter);
      if (targetVendor) {
        n = n.filter((node) => {
          if (node.entityType === 'COMPANY') return true;
          if (node.id.includes(targetVendor.vendorGstin) || node.invoiceId === targetVendor.id)
            return true;
          return false;
        });
      }
    }

    // Filter by risk level
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
    selectedEntityType,
    selectedVendorFilter,
    selectedRiskFilter,
    searchQuery,
    invoices,
    focusedInvoiceNumber,
  ]);

  // Set default selection if focus param was provided
  useEffect(() => {
    if (focusParam) {
      const target = nodes.find(
        (n) => n.name.includes(focusParam) || n.id.includes(focusParam)
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

  // D3 Interactive Force Graph Rendering
  useEffect(() => {
    if (!svgRef.current) return;

    const width = svgRef.current.clientWidth || 900;
    const height = 580;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous

    svg.attr('viewBox', [0, 0, width, height]);

    // Container for zooming & panning
    const g = svg.append('g').attr('class', 'graph-container');

    // Zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Arrowhead marker definitions for directed graph
    const defs = svg.append('defs');

    // Standard arrow
    defs
      .append('marker')
      .attr('id', 'arrow-standard')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#94a3b8');

    // Risk Path glowing arrow
    defs
      .append('marker')
      .attr('id', 'arrow-risk')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#ef4444');

    // Clone data for D3 mutation
    const simulationNodes = filteredNodes.map((d) => ({ ...d }));
    const simulationLinks = filteredLinks.map((d) => ({ ...d }));

    // Create D3 Force Simulation
    const simulation = d3
      .forceSimulation<GraphNode>(simulationNodes)
      .force(
        'link',
        d3
          .forceLink<GraphNode, GraphLink>(simulationLinks)
          .id((d) => d.id)
          .distance(90)
      )
      .force('charge', d3.forceManyBody().strength(-240))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => d.radius + 18));

    // Draw Links
    const linkTouchesSelected = (d: GraphLink) => {
      if (!selectedNode) return false;
      const sourceId = typeof d.source === 'object' ? (d.source as GraphNode).id : d.source;
      const targetId = typeof d.target === 'object' ? (d.target as GraphNode).id : d.target;
      return sourceId === selectedNode.id || targetId === selectedNode.id;
    };

    const connectedNodeIds = new Set<string>();
    if (selectedNode) {
      simulationLinks.forEach((d) => {
        const sourceId = typeof d.source === 'object' ? (d.source as GraphNode).id : d.source;
        const targetId = typeof d.target === 'object' ? (d.target as GraphNode).id : d.target;
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
        return 1.2;
      })
      .attr('stroke-dasharray', (d) => (d.relationship === 'MISMATCHED_WITH' ? '4,4' : 'none'))
      .attr('marker-end', (d) =>
        isRiskPathActive && d.isRiskPath ? 'url(#arrow-risk)' : 'url(#arrow-standard)'
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
    const drag = (simulation: d3.Simulation<GraphNode, undefined>) => {
      function dragstarted(event: any, d: GraphNode) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(event: any, d: GraphNode) {
        d.fx = event.x;
        d.fy = event.y;
      }

      function dragended(event: any, d: GraphNode) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }

      return d3
        .drag<SVGGElement, GraphNode>()
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

    // Node Outer Ring / Glow on Risk / Highlight
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
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))');

    // Node Text Label
    node
      .append('text')
      .attr('dy', (d) => d.radius + 12)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .attr('fill', '#1e293b')
      .style('pointer-events', 'none')
      .text((d) => (d.name.length > 20 ? d.name.substring(0, 18) + '...' : d.name));

    // Node Subtitle Label (Entity Type)
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

  // Unique vendors for filter dropdown
  const uniqueVendors = useMemo(() => {
    return Array.from(new Set(invoices.map((i) => i.vendorName)));
  }, [invoices]);

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

  const handleTraceRelationship = () => {
    if (selectedNode) {
      setTracedNodeId(selectedNode.id);
      setIsRiskPathActive(false);
    } else {
      // Pick first invoice node
      const firstInv = nodes.find((n) => n.entityType === 'INVOICE');
      if (firstInv) {
        setSelectedNode(firstInv);
        setTracedNodeId(firstInv.id);
      }
    }
  };

  const handleTraceRiskPath = () => {
    setIsRiskPathActive(true);
    setTracedNodeId(null);
    // Find highest risk invoice to select in details panel
    const highRiskNode = nodes.find((n) => n.entityType === 'MISMATCH' || n.entityType === 'RISK');
    if (highRiskNode) {
      setSelectedNode(highRiskNode);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Transaction Knowledge Graph"
        subtitle="Multi-entity relational graph generated directly from reconciliation ledger"
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
          </div>
        }
      />

      {/* Graph Filter & Search Ribbon */}
      <GlassCard className="p-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Invoice, Vendor, GSTIN, Risk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-sky-200 bg-white py-2 pl-9 pr-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Entity Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              value={selectedEntityType}
              onChange={(e) => setSelectedEntityType(e.target.value)}
              className="w-full rounded-xl border border-sky-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 focus:border-sky-500 focus:outline-none"
            >
              <option value="ALL">All Entity Types (10 Types)</option>
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
              <option value="ALL">All Counterparties</option>
              {uniqueVendors.map((v) => (
                <option key={v} value={v}>
                  {v}
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

        {/* Direct invoice lookup: focuses graph on the chosen invoice and its connection chain */}
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
              showing invoice, vendor, purchase record, GST record, mismatch, ITC, risk and audit connections.
            </div>
          )}
        </div>
      </GlassCard>

      {/* Main Graph Viewport & Slide-over Details Drawer */}
      <div className="relative rounded-2xl border border-sky-200/80 bg-gradient-to-br from-[#f8fafc] via-white to-[#edf4fb] shadow-sm overflow-hidden h-[600px] flex">
        {/* SVG Canvas */}
        <div className="flex-1 h-full relative">
          <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Canvas Controls Overlay (Bottom-left) */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-white/90 backdrop-blur-md p-1.5 rounded-xl border border-sky-200/80 shadow-md">
            <span className="text-[11px] font-bold text-slate-600 px-2">
              {filteredNodes.length} Nodes • {filteredLinks.length} Links
            </span>
            <div className="h-4 w-px bg-slate-200" />
            <button
              onClick={() => {
                if (svgRef.current) {
                  d3.select(svgRef.current).transition().call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 1.2);
                }
              }}
              className="p-1 rounded hover:bg-sky-100 text-slate-600"
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
              className="p-1 rounded hover:bg-sky-100 text-slate-600"
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
              className="p-1 rounded hover:bg-sky-100 text-slate-600"
              title="Reset View"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>

          {/* Active Risk Path Indicator */}
          {isRiskPathActive && (
            <div className="absolute top-4 left-4 bg-rose-50/90 border border-rose-200 text-rose-800 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm animate-pulse">
              <Zap className="h-4 w-4 text-rose-600" />
              Risk Path Active: Company → Vendor → Invoice → PR → GST → Mismatch → ITC → Risk → Audit
            </div>
          )}

          {focusedInvoiceInfo && (
            <div className="absolute right-4 top-4 w-[340px] max-w-[calc(100%-2rem)] rounded-2xl border border-sky-200 bg-white/95 p-4 text-xs shadow-xl shadow-slate-900/10 backdrop-blur-md">
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

        {/* Right-Side Node Details Panel */}
        {selectedNode && (
          <div className="w-80 border-l border-sky-200 bg-white/95 backdrop-blur-md p-5 flex flex-col justify-between overflow-y-auto shadow-lg z-10 animate-in slide-in-from-right duration-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-sky-100 pb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: selectedNode.color }}
                  />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {selectedNode.entityType} Entity
                  </span>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 break-words">
                  {selectedNode.name}
                </h3>
                <p className="font-mono text-xs text-sky-700 mt-0.5">{selectedNode.id}</p>
              </div>

              {/* Entity Specific Attributes */}
              <div className="space-y-2 text-xs">
                <div className="rounded-xl bg-sky-50/50 p-3 space-y-2 border border-sky-100">
                  <p className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
                    Entity Properties
                  </p>
                  {selectedNode.data &&
                    Object.entries(selectedNode.data).map(([key, val]) => {
                      if (typeof val === 'object') return null;
                      return (
                        <div key={key} className="flex justify-between py-1 border-b border-sky-100/60">
                          <span className="text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <span className="font-semibold text-slate-800 text-right truncate max-w-[140px]">
                            {String(val)}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {selectedNode.riskLevel && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                  <span className="font-bold flex items-center gap-1">
                    <ShieldAlert className="h-3.5 w-3.5 text-rose-600" /> Assessed Risk Level:
                  </span>
                  <p className="font-semibold mt-0.5">{selectedNode.riskLevel} Statutory Disallowance</p>
                </div>
              )}

              <NodeInsightPanel
                selectedNode={selectedNode}
                nodes={filteredNodes}
                links={filteredLinks}
                invoices={invoices}
                onSelectNode={(node) => setSelectedNode(node as GraphNode)}
              />
            </div>

            {/* Panel CTAs */}
            <div className="pt-4 border-t border-sky-100 space-y-2">
              {selectedNode.invoiceId && (
                <Button
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => navigate(`/company/invoice/${selectedNode.invoiceId}`)}
                >
                  Investigate Invoice <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}

              {selectedNode.entityType === 'VENDOR' && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full text-xs"
                  onClick={() =>
                    navigate(
                      `/company/vendor-risk/${selectedNode.data?.vendorId || selectedNode.id}`
                    )
                  }
                >
                  View Vendor Profile
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend Ribbon */}
      <GlassCard className="p-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-slate-500 font-semibold">Entity Legend:</span>
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
