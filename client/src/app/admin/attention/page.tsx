'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  ShieldAlert,
  Users,
  Building,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Flame,
  CreditCard,
} from 'lucide-react';
import Link from 'next/link';

interface ExceptionItem {
  id: string;
  category: 'SLA_BREACH' | 'UNASSIGNED_LEAD' | 'OVERDUE_FOLLOWUP' | 'INVENTORY_HOLD_EXPIRED' | 'RECONCILIATION_DISCREPANCY';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  targetEntity: string;
  responsibleTeam: string;
  timestamp: string;
  actionLabel: string;
  actionHref: string;
}

export default function AdminAttentionCenterPage() {
  const [exceptions, setExceptions] = useState<ExceptionItem[]>([
    {
      id: 'ex-1',
      category: 'SLA_BREACH',
      severity: 'CRITICAL',
      title: '4 Leads Breached First-Response SLA Window',
      description: 'Incoming Meta Leads have remained without an initial qualifying call for > 30 minutes.',
      targetEntity: 'Lead #LD-102 (Priya Patel) + 3 others',
      responsibleTeam: 'West Zone Telecallers',
      timestamp: '14 mins ago',
      actionLabel: 'Reassign to Backup Telecaller',
      actionHref: '/my-day',
    },
    {
      id: 'ex-2',
      category: 'UNASSIGNED_LEAD',
      severity: 'CRITICAL',
      title: '2 Unassigned Meta Leads in Staging Buffer',
      description: 'Round-robin distribution paused due to agent shift changeover.',
      targetEntity: 'Lead #LD-109, #LD-110',
      responsibleTeam: 'Central Lead Operations',
      timestamp: '25 mins ago',
      actionLabel: 'Trigger Instant Assignment',
      actionHref: '/leads',
    },
    {
      id: 'ex-3',
      category: 'RECONCILIATION_DISCREPANCY',
      severity: 'CRITICAL',
      title: 'Payment Gateway vs Bank Settlement Discrepancy',
      description: 'Razorpay webhook reported ₹2,00,000 captured for BK-2026-0847 but HDFC settlement pending.',
      targetEntity: 'Booking BK-2026-0847',
      responsibleTeam: 'Finance & Treasury',
      timestamp: '1 hour ago',
      actionLabel: 'Open Financial Reconciliation',
      actionHref: '/payments',
    },
    {
      id: 'ex-4',
      category: 'OVERDUE_FOLLOWUP',
      severity: 'WARNING',
      title: '7 Overdue Callbacks in Sales Pipeline',
      description: 'Scheduled callbacks elapsed without recorded disposition notes.',
      targetEntity: 'West Team Pipeline',
      responsibleTeam: 'West Zone Sales Team',
      timestamp: '2 hours ago',
      actionLabel: 'Review Overdue Queue',
      actionHref: '/follow-ups',
    },
    {
      id: 'ex-5',
      category: 'INVENTORY_HOLD_EXPIRED',
      severity: 'WARNING',
      title: '2 Unit Holds Reached Expiration (60m lock)',
      description: 'Unit A-1402 and Plot B-02 expired without active booking submission. Ready for release to public pool.',
      targetEntity: 'Unit A-1402, Plot B-02',
      responsibleTeam: 'Inventory Arbitration',
      timestamp: '30 mins ago',
      actionLabel: 'Audit & Release to Available',
      actionHref: '/inventory',
    },
  ]);

  const [resolvedIds, setResolvedIds] = useState<string[]>([]);

  const handleResolve = (id: string) => {
    setResolvedIds((prev) => [...prev, id]);
  };

  const activeExceptions = exceptions.filter((e) => !resolvedIds.includes(e.id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div className="h1" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={26} color="var(--color-danger)" />
            Admin "Attention Required" Command Center
          </div>
          <p className="subtitle" style={{ marginTop: '4px' }}>
            Operational command center · Real-time exception resolution · SLA and financial reconciliation audits
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: activeExceptions.length > 0 ? 'var(--color-danger)' : 'var(--color-success)',
              boxShadow: activeExceptions.length > 0 ? '0 0 8px var(--color-danger)' : '0 0 8px var(--color-success)',
            }}
          />
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {activeExceptions.length} Operational Exceptions Active
          </span>
        </div>
      </div>

      {/* Exception Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {activeExceptions.length === 0 ? (
          <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
            <CheckCircle2 size={44} color="var(--color-success)" style={{ margin: '0 auto 12px auto' }} />
            <div className="h2">Zero Operational Exceptions Active</div>
            <div className="subtitle" style={{ marginTop: '4px' }}>
              All SLAs are compliant, leads assigned, and financial reconciliation matched.
            </div>
          </div>
        ) : (
          activeExceptions.map((item) => (
            <div
              key={item.id}
              className={`attention-card ${item.severity === 'CRITICAL' ? 'critical' : 'warning'}`}
            >
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flex: 1 }}>
                <div style={{ marginTop: '2px' }}>
                  {item.severity === 'CRITICAL' ? (
                    <ShieldAlert size={22} color="var(--color-danger)" />
                  ) : (
                    <Clock size={22} color="var(--color-warning)" />
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {item.title}
                    </span>
                    <span
                      className={`badge ${
                        item.severity === 'CRITICAL' ? 'badge-danger' : 'badge-warning'
                      }`}
                    >
                      {item.severity}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Detected {item.timestamp}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {item.description}
                  </p>

                  <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    <span>Target: <strong style={{ color: 'var(--text-primary)' }}>{item.targetEntity}</strong></span>
                    <span>Team: <strong style={{ color: 'var(--text-primary)' }}>{item.responsibleTeam}</strong></span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Link
                  href={item.actionHref}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', gap: '6px', whiteSpace: 'nowrap' }}
                >
                  <span>{item.actionLabel}</span>
                  <ArrowRight size={14} />
                </Link>

                <button
                  onClick={() => handleResolve(item.id)}
                  className="btn btn-secondary btn-sm"
                  title="Mark Resolved"
                >
                  <CheckCircle2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
