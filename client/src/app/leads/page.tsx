'use client';

import React, { useState, useEffect } from 'react';
import { KanbanPipeline } from '../../components/leads/KanbanPipeline';
import { LeadCard, LeadItem } from '../../components/leads/LeadCard';
import { LeadDetailDrawer } from '../../components/leads/LeadDetailDrawer';
import { CostSheetModal } from '../../components/pricing/CostSheetModal';
import { UserPlus, RefreshCw } from 'lucide-react';
import { api } from '../../lib/api';

// Initial demo/reference pipeline data conforming to the 5 independent dimensions (§10.1)
const INITIAL_DEMO_LEADS: LeadItem[] = [
  {
    id: 'lead_001',
    lifecycleStage: 'NEW',
    status: 'ACTIVE',
    temperature: 'HOT',
    disposition: 'INTERESTED',
    score: 85,
    lifecycleCycle: 1,
    slaBreachedAt: null,
    firstResponseDueAt: new Date(Date.now() + 60000).toISOString(),
    customer: {
      fullName: 'Vikram Malhotra',
      phone: '+91 98201 12345',
      email: 'vikram.m@example.com',
    },
    project: { name: 'Acme Sky Villas' },
    assignedTo: { user: { fullName: 'Aarav Sharma' } },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'lead_002',
    lifecycleStage: 'CONTACTED',
    status: 'CALLBACK_PENDING',
    temperature: 'WARM',
    disposition: 'CALL_BACK_REQUESTED',
    score: 65,
    lifecycleCycle: 1,
    slaBreachedAt: null,
    firstResponseDueAt: null,
    customer: {
      fullName: 'Pooja Sundaram',
      phone: '+91 98334 56789',
      email: 'pooja.s@example.com',
    },
    project: { name: 'Acme Heights Tower 2' },
    assignedTo: { user: { fullName: 'Priya Patel' } },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'lead_003',
    lifecycleStage: 'SITE_VISIT',
    status: 'ACTIVE',
    temperature: 'HOT',
    disposition: 'SITE_VISIT_SCHEDULED',
    score: 92,
    lifecycleCycle: 2, // Re-engaged cycle (§10.3)
    slaBreachedAt: null,
    firstResponseDueAt: null,
    customer: {
      fullName: 'Rajesh Kulkarni',
      phone: '+91 98112 99887',
      email: 'rajesh.k@example.com',
    },
    project: { name: 'Acme Green Meadows' },
    assignedTo: { user: { fullName: 'Aarav Sharma' } },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'lead_004',
    lifecycleStage: 'NEGOTIATION',
    status: 'ACTIVE',
    temperature: 'WARM',
    disposition: 'BUDGET_MISMATCH',
    score: 74,
    lifecycleCycle: 1,
    slaBreachedAt: null,
    firstResponseDueAt: null,
    customer: {
      fullName: 'Dr. Neha Deshmukh',
      phone: '+91 97665 44321',
      email: 'neha.d@example.com',
    },
    project: { name: 'Acme Sky Villas' },
    assignedTo: { user: { fullName: 'Priya Patel' } },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'lead_005',
    lifecycleStage: 'WON',
    status: 'ACTIVE',
    temperature: 'HOT',
    disposition: 'INTERESTED',
    score: 98,
    lifecycleCycle: 1,
    slaBreachedAt: null,
    firstResponseDueAt: null,
    customer: {
      fullName: 'Ananya Singhania',
      phone: '+91 99200 88776',
      email: 'ananya.s@example.com',
    },
    project: { name: 'Acme Sky Villas' },
    assignedTo: { user: { fullName: 'Aarav Sharma' } },
    createdAt: new Date().toISOString(),
  },
];

export default function LeadsPipelinePage() {
  const [leads, setLeads] = useState<LeadItem[]>(INITIAL_DEMO_LEADS);
  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCostSheetOpen, setIsCostSheetOpen] = useState(false);
  const [activeCostSheetLeadId, setActiveCostSheetLeadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await api.request<{ leads: any[] }>('/api/v1/leads');
      if (res?.leads && res.leads.length > 0) {
        setLeads(res.leads);
      }
    } catch {
      // Retain demo leads if backend database has no leads yet
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleSelectLead = (lead: LeadItem) => {
    setSelectedLead(lead);
    setIsDrawerOpen(true);
  };

  const handleStageChange = async (leadId: string, newStage: string) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, lifecycleStage: newStage as any } : l))
    );
  };

  const handleOpenCostSheet = (leadId: string) => {
    setActiveCostSheetLeadId(leadId);
    setIsCostSheetOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="h1">5-Dimensional Lead Pipeline</div>
          <div className="subtitle">
            Columns represent commercial <strong>lifecycleStage</strong> only (§39.2). Operational status,
            temperature, SLA, and disposition render as card attributes.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchLeads} className="btn btn-secondary btn-sm" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <KanbanPipeline
        leads={leads}
        onSelectLead={handleSelectLead}
        onStageChange={handleStageChange}
      />

      {/* 360° Lead Detail Drawer */}
      <LeadDetailDrawer
        lead={selectedLead}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onLeadUpdated={fetchLeads}
        onOpenHoldModal={(leadId) => alert(`Redirecting to Hold Matrix for Lead ${leadId}`)}
        onOpenCostSheetModal={handleOpenCostSheet}
      />

      {/* Interactive Cost Sheet Modal */}
      <CostSheetModal
        leadId={activeCostSheetLeadId}
        isOpen={isCostSheetOpen}
        onClose={() => setIsCostSheetOpen(false)}
        onGenerated={fetchLeads}
      />
    </div>
  );
}
