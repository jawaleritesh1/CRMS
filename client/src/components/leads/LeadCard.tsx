'use client';

import React from 'react';
import { Phone, Clock, Flame, ShieldAlert, CheckCircle2, User } from 'lucide-react';

export interface LeadItem {
  id: string;
  lifecycleStage: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'SITE_VISIT' | 'NEGOTIATION' | 'BOOKING' | 'WON' | 'CANCELLED' | 'LOST';
  status: 'ACTIVE' | 'INACTIVE' | 'CALLBACK_PENDING' | 'DISQUALIFIED';
  temperature: 'COLD' | 'WARM' | 'HOT';
  slaState?: 'WITHIN_SLA' | 'DUE_SOON' | 'BREACHED' | 'RESOLVED';
  disposition: string | null;
  score: number;
  lifecycleCycle: number;
  slaBreachedAt: string | null;
  firstResponseDueAt: string | null;
  customer: {
    fullName: string;
    phone: string;
    email?: string | null;
  };
  project?: {
    name: string;
  } | null;
  assignedTo?: {
    user: {
      fullName: string;
    };
  } | null;
  createdAt: string;
}

interface LeadCardProps {
  lead: LeadItem;
  onClick: () => void;
}

export function LeadCard({ lead, onClick }: LeadCardProps) {
  // Determine SLA state
  const isSlaBreached = Boolean(lead.slaBreachedAt);
  const slaColor = isSlaBreached ? 'var(--color-danger)' : 'var(--color-success)';

  // Temperature color
  const tempColors: Record<string, { bg: string; text: string; icon: string }> = {
    HOT: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', icon: '#ef4444' },
    WARM: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', icon: '#f59e0b' },
    COLD: { bg: 'rgba(6, 182, 212, 0.15)', text: '#06b6d4', icon: '#06b6d4' },
  };
  const tempConfig = tempColors[lead.temperature] || tempColors.WARM;

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '14px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-focus)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.background = 'var(--bg-card-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.background = 'var(--bg-card)';
      }}
    >
      {/* Top Header: Customer Name & Temperature Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
            {lead.customer?.fullName || 'Anonymous Lead'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {lead.project?.name || 'All Projects'}
          </div>
        </div>

        {/* Temperature Badge */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: 'var(--radius-full)',
            background: tempConfig.bg,
            color: tempConfig.text,
          }}
        >
          <Flame size={12} color={tempConfig.icon} />
          {lead.temperature}
        </span>
      </div>

      {/* Middle Row: Phone & Assigned Agent */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Phone size={12} color="var(--accent-primary)" />
          <span>{lead.customer?.phone}</span>
        </div>
        {lead.assignedTo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <User size={12} color="var(--text-muted)" />
            <span>{lead.assignedTo.user?.fullName}</span>
          </div>
        )}
      </div>

      {/* Dimension Badges (§39.2: Dimension 2 Status, Dimension 4 SLA, Dimension 5 Disposition) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingTop: '4px' }}>
        {/* Dimension 2: Operational Status */}
        <span
          style={{
            fontSize: '0.6875rem',
            padding: '2px 6px',
            borderRadius: 'var(--radius-sm)',
            background: '#f1f5f9',
            color: 'var(--text-secondary)',
            fontWeight: 600,
          }}
        >
          Status: {lead.status}
        </span>

        {/* Dimension 4: SLA State */}
        <span
          style={{
            fontSize: '0.6875rem',
            padding: '2px 6px',
            borderRadius: 'var(--radius-sm)',
            background: isSlaBreached ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
            color: slaColor,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
          }}
        >
          <Clock size={10} />
          {isSlaBreached ? 'SLA BREACHED' : 'WITHIN SLA'}
        </span>

        {/* Dimension 5: Disposition */}
        {lead.disposition && (
          <span
            style={{
              fontSize: '0.6875rem',
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-purple-bg)',
              color: 'var(--color-purple)',
              fontWeight: 600,
            }}
          >
            {lead.disposition}
          </span>
        )}

        {/* Re-engagement Cycle indicator (§10.3) */}
        {lead.lifecycleCycle > 1 && (
          <span
            style={{
              fontSize: '0.6875rem',
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(99, 102, 241, 0.15)',
              color: 'var(--accent-primary)',
              fontWeight: 700,
            }}
          >
            Cycle #{lead.lifecycleCycle}
          </span>
        )}
      </div>

      {/* Score Progress Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '2px' }}>
        <div
          style={{
            flex: 1,
            height: '4px',
            background: '#e2e8f0',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(lead.score || 50, 100)}%`,
              background: 'linear-gradient(90deg, #6366f1, #10b981)',
              borderRadius: 'var(--radius-full)',
            }}
          />
        </div>
        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          Score: {lead.score || 50}
        </span>
      </div>
    </div>
  );
}
