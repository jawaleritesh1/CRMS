'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, CheckCircle, AlertOctagon, History, Shield, ArrowDownRight } from 'lucide-react';
import { api } from '../../lib/api';

export default function ReportsPage() {
  const [funnelData, setFunnelData] = useState({
    totalLeads: 412,
    siteVisitsDone: 128,
    grossWon: 34,
    cancelledWon: 4,
    netWon: 30,
    grossValue: '₹42,50,00,000',
    netValue: '₹37,50,00,000',
    conversionRate: '7.3%',
  });

  const [financials, setFinancials] = useState({
    totalAgreementValue: '₹37,50,00,000',
    totalInvoiced: '₹12,80,00,000',
    totalCollected: '₹11,40,00,000',
    totalRefunded: '₹45,00,000',
    overdueAmount: '₹95,00,000',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <div className="h1">Executive Funnel & Financial Audit Reporting</div>
        <div className="subtitle">
          Authoritative reporting with strict separation of Gross Won from Net Won (§33.1) and append-only financial reconciliation.
        </div>
      </div>

      {/* Funnel Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Total Ingested Leads
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
            {funnelData.totalLeads}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', marginTop: '4px' }}>
            Multi-channel attribution
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Site Visits Completed
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
            {funnelData.siteVisitsDone}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-info)', marginTop: '4px' }}>
            31.0% visit conversion
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Gross Bookings (WON)
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-success)', marginTop: '6px' }}>
            {funnelData.grossWon} Deals
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {funnelData.grossValue}
          </div>
        </div>

        <div
          className="glass-panel"
          style={{
            padding: '20px',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), transparent)',
          }}
        >
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-success)', fontWeight: 700 }}>
            Net Converted Deals (§33.1)
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
            {funnelData.netWon} Deals
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {funnelData.cancelledWon} cancellations deducted ({funnelData.netValue})
          </div>
        </div>
      </div>

      {/* Financial Milestone Reconciliation */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp size={20} color="var(--accent-primary)" />
            <span className="h2">Financial Ledger & Milestone Collections (§17)</span>
          </div>
          <span className="badge badge-info">Append-Only Immutability Guaranteed</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div style={{ padding: '16px', background: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Invoiced Milestone Value</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
              {financials.totalInvoiced}
            </div>
          </div>

          <div style={{ padding: '16px', background: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>Cleared Collections</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-success)', marginTop: '4px' }}>
              {financials.totalCollected}
            </div>
          </div>

          <div style={{ padding: '16px', background: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)' }}>Compensating Refunds Issued</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-danger)', marginTop: '4px' }}>
              {financials.totalRefunded}
            </div>
          </div>
        </div>
      </div>

      {/* Immutable Audit Trail Section */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <History size={20} color="var(--accent-primary)" />
          <span className="h2">Compliance & Tenancy Audit Log (§32)</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem' }}>
          {[
            {
              time: '10 mins ago',
              action: 'INVENTORY_HOLD_CREATED',
              actor: 'Aarav Sharma (CSE)',
              entity: 'Unit #402',
              org: 'Acme Realty',
            },
            {
              time: '45 mins ago',
              action: 'COST_SHEET_ISSUED',
              actor: 'Priya Patel (Manager)',
              entity: 'Lead #lead_004',
              org: 'Acme Realty',
            },
            {
              time: '2 hours ago',
              action: 'PAYMENT_SETTLED',
              actor: 'System Webhook (Razorpay)',
              entity: 'Payment #pay_8842',
              org: 'Acme Realty',
            },
          ].map((entry, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: '#f8fafc',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                  {entry.action}
                </span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{entry.entity}</span>
                <span style={{ color: 'var(--text-muted)' }}>by {entry.actor}</span>
              </div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{entry.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
