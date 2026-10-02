'use client';

import React, { useState } from 'react';
import { LeadCard, LeadItem } from './LeadCard';
import { Filter, Search, Sparkles } from 'lucide-react';

interface KanbanPipelineProps {
  leads: LeadItem[];
  onSelectLead: (lead: LeadItem) => void;
  onStageChange: (leadId: string, newStage: string) => Promise<void>;
}

// §10.1 & §39.2: Columns are lifecycleStage ONLY
const LIFECYCLE_STAGES = [
  { id: 'NEW', title: 'New Leads', color: '#6366f1' },
  { id: 'CONTACTED', title: 'Contacted', color: '#06b6d4' },
  { id: 'QUALIFIED', title: 'Qualified', color: '#3b82f6' },
  { id: 'SITE_VISIT', title: 'Site Visit', color: '#a855f7' },
  { id: 'NEGOTIATION', title: 'Negotiation', color: '#f59e0b' },
  { id: 'BOOKING', title: 'Booking', color: '#ec4899' },
  { id: 'WON', title: 'Won Deals', color: '#10b981' },
  { id: 'CANCELLED', title: 'Cancelled', color: '#64748b' },
  { id: 'LOST', title: 'Lost', color: '#ef4444' },
];

export function KanbanPipeline({ leads, onSelectLead, onStageChange }: KanbanPipelineProps) {
  const [filterTemp, setFilterTemp] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter leads based on client search & temperature
  const filteredLeads = leads.filter((lead) => {
    const matchesTemp = filterTemp === 'ALL' || lead.temperature === filterTemp;
    const matchesSearch =
      searchQuery === '' ||
      lead.customer?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.customer?.phone?.includes(searchQuery);
    return matchesTemp && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      {/* Controls Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          background: 'var(--bg-card)',
          padding: '12px 20px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, maxWidth: '400px' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search leads in pipeline..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field"
            style={{ height: '36px', fontSize: '0.8125rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            <Filter size={14} />
            <span>Temperature:</span>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {['ALL', 'HOT', 'WARM', 'COLD'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterTemp(t)}
                className={`btn btn-sm ${filterTemp === t ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 9-Column Kanban Board */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          overflowX: 'auto',
          paddingBottom: '20px',
          minHeight: 'calc(100vh - 220px)',
        }}
      >
        {LIFECYCLE_STAGES.map((col) => {
          const colLeads = filteredLeads.filter((l) => l.lifecycleStage === col.id);

          return (
            <div
              key={col.id}
              style={{
                flex: '0 0 310px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '100%',
              }}
            >
              {/* Column Header */}
              <div
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: col.color,
                    }}
                  />
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    {col.title}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: '#f1f5f9',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {colLeads.length}
                </span>
              </div>

              {/* Cards Container */}
              <div
                style={{
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  overflowY: 'auto',
                  flex: 1,
                }}
              >
                {colLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onClick={() => onSelectLead(lead)}
                  />
                ))}

                {colLeads.length === 0 && (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '36px 12px',
                      color: 'var(--text-muted)',
                      fontSize: '0.8125rem',
                      fontStyle: 'italic',
                    }}
                  >
                    No leads in this stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
