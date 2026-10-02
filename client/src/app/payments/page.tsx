'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  RotateCcw,
  Search,
} from 'lucide-react';

interface PaymentRecord {
  id: string;
  referenceId: string;
  bookingCode: string;
  customerName: string;
  amount: number;
  type: 'TOKEN' | 'MILESTONE' | 'REFUND';
  method: 'NEFT' | 'RTGS' | 'UPI' | 'CHEQUE' | 'GATEWAY';
  status: 'SUCCEEDED' | 'PROCESSING' | 'REFUNDED';
  reversalOfPaymentId?: string;
  timestamp: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([
    {
      id: 'pay-1',
      referenceId: 'PAY-2026-9041',
      bookingCode: 'BK-2026-0847',
      customerName: 'Amit Sharma',
      amount: 500000,
      type: 'TOKEN',
      method: 'NEFT',
      status: 'SUCCEEDED',
      timestamp: '2026-09-29 11:42',
    },
    {
      id: 'pay-2',
      referenceId: 'PAY-2026-8812',
      bookingCode: 'BK-2026-0792',
      customerName: 'Rohan Mehta',
      amount: 3200000,
      type: 'MILESTONE',
      method: 'RTGS',
      status: 'SUCCEEDED',
      timestamp: '2026-09-27 16:10',
    },
    {
      id: 'pay-3',
      referenceId: 'PAY-2026-7240',
      bookingCode: 'BK-2026-0610',
      customerName: 'Sanjay Gupta',
      amount: -200000,
      type: 'REFUND',
      method: 'NEFT',
      status: 'REFUNDED',
      reversalOfPaymentId: 'PAY-2026-7100',
      timestamp: '2026-09-26 14:00',
    },
    {
      id: 'pay-4',
      referenceId: 'PAY-2026-7100',
      bookingCode: 'BK-2026-0610',
      customerName: 'Sanjay Gupta',
      amount: 200000,
      type: 'TOKEN',
      method: 'UPI',
      status: 'SUCCEEDED',
      timestamp: '2026-07-20 10:30',
    },
  ]);

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [targetRefundPayment, setTargetRefundPayment] = useState<PaymentRecord | null>(null);

  // Record Form
  const [recBooking, setRecBooking] = useState('BK-2026-0847 (Amit Sharma)');
  const [recAmount, setRecAmount] = useState('1000000');
  const [recType, setRecType] = useState<'TOKEN' | 'MILESTONE'>('MILESTONE');
  const [recMethod, setRecMethod] = useState<'NEFT' | 'UPI' | 'CHEQUE'>('NEFT');
  const [recRef, setRecRef] = useState('HDFC-TRX-994120');

  // Refund Form
  const [refundReason, setRefundReason] = useState('Booking cancelled by buyer');

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const newPay: PaymentRecord = {
      id: `pay-${Date.now()}`,
      referenceId: `PAY-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
      bookingCode: recBooking.split(' ')[0],
      customerName: recBooking.split('(')[1]?.replace(')', '') || 'Customer',
      amount: Number(recAmount),
      type: recType,
      method: recMethod,
      status: 'SUCCEEDED',
      timestamp: 'Just now',
    };
    setPayments([newPay, ...payments]);
    setIsRecordModalOpen(false);
  };

  const handleIssueCompensatingRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRefundPayment) return;

    // Per ARCHITECTURE §17.4: a refund is a new compensating record
    const compensatingPay: PaymentRecord = {
      id: `pay-${Date.now()}`,
      referenceId: `REF-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
      bookingCode: targetRefundPayment.bookingCode,
      customerName: targetRefundPayment.customerName,
      amount: -targetRefundPayment.amount,
      type: 'REFUND',
      method: 'NEFT',
      status: 'REFUNDED',
      reversalOfPaymentId: targetRefundPayment.referenceId,
      timestamp: 'Just now',
    };

    setPayments([compensatingPay, ...payments]);
    setIsRefundModalOpen(false);
    setTargetRefundPayment(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div className="h1" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CreditCard size={26} color="var(--accent-primary)" />
            Payments &amp; Financial Ledger
          </div>
          <p className="subtitle" style={{ marginTop: '4px' }}>
            Append-only financial audit trail · Immutable settled records · Compensating refund architecture
          </p>
        </div>

        <button
          onClick={() => setIsRecordModalOpen(true)}
          className="btn btn-primary"
          style={{ display: 'flex', gap: '8px' }}
        >
          <Plus size={16} />
          <span>Record New Collection</span>
        </button>
      </div>

      {/* KPI Metric Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>NET SETTLED COLLECTIONS</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-success)', marginTop: '4px' }}>
            ₹37.0 Lakhs
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-success)', marginTop: '2px' }}>100% reconciled</div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>COLLECTION AT RISK</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-warning)', marginTop: '4px' }}>
            ₹8.5 Lakhs
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-warning)', marginTop: '2px' }}>Milestone due &lt; 7 days</div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>TOTAL REFUNDS ISSUED</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-danger)', marginTop: '4px' }}>
            ₹2.0 Lakhs
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>1 Compensating entry</div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>AUDIT TRAIL COMPLIANCE</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>
            100%
          </div>
          <div style={{ fontSize: '0.7rem', color: '#38bdf8', marginTop: '2px' }}>Immutable ledger</div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: '#f8fafc' }}>
              <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>REFERENCE ID</th>
              <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>BOOKING</th>
              <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>CUSTOMER</th>
              <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>AMOUNT (₹)</th>
              <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>TYPE</th>
              <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>METHOD</th>
              <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>TIMESTAMP</th>
              <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em', textAlign: 'right' }}>REVERSAL</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => {
              const isNegative = p.amount < 0;
              return (
                <tr
                  key={p.id}
                  style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '16px 18px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                      {p.referenceId}
                    </div>
                    {p.reversalOfPaymentId && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-danger)' }}>
                        Compensating for: {p.reversalOfPaymentId}
                      </div>
                    )}
                  </td>

                  <td style={{ padding: '16px 18px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {p.bookingCode}
                  </td>

                  <td style={{ padding: '16px 18px', fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {p.customerName}
                  </td>

                  <td
                    style={{
                      padding: '16px 18px',
                      fontSize: '0.9375rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      color: isNegative ? 'var(--color-danger)' : 'var(--color-success)',
                    }}
                  >
                    {isNegative ? '-' : '+'}₹{Math.abs(p.amount).toLocaleString()}
                  </td>

                  <td style={{ padding: '16px 18px' }}>
                    <span
                      className={`badge ${
                        p.type === 'TOKEN'
                          ? 'badge-info'
                          : p.type === 'MILESTONE'
                          ? 'badge-success'
                          : 'badge-danger'
                      }`}
                    >
                      {p.type}
                    </span>
                  </td>

                  <td style={{ padding: '16px 18px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    {p.method}
                  </td>

                  <td style={{ padding: '16px 18px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    {p.timestamp}
                  </td>

                  <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                    {p.type !== 'REFUND' && p.status === 'SUCCEEDED' && (
                      <button
                        onClick={() => {
                          setTargetRefundPayment(p);
                          setIsRefundModalOpen(true);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', color: 'var(--color-danger)' }}
                      >
                        Refund / Compensate
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Record Collection Modal */}
      {isRecordModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            zIndex: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            className="glass-panel"
            style={{ width: '100%', maxWidth: '480px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#ffffff', boxShadow: 'var(--shadow-lg)' }}
          >
            <div className="h2" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CreditCard size={20} color="var(--accent-primary)" />
              Record Incoming Payment
            </div>

            <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', display: 'block' }}>Target Booking</label>
                <select value={recBooking} onChange={(e) => setRecBooking(e.target.value)} className="input-field">
                  <option value="BK-2026-0847 (Amit Sharma)">BK-2026-0847 (Amit Sharma) — ₹29.25L Balance</option>
                  <option value="BK-2026-0792 (Rohan Mehta)">BK-2026-0792 (Rohan Mehta) — Settle Full</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', display: 'block' }}>Amount (₹)</label>
                  <input type="number" value={recAmount} onChange={(e) => setRecAmount(e.target.value)} className="input-field" required />
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', display: 'block' }}>Type</label>
                  <select value={recType} onChange={(e) => setRecType(e.target.value as any)} className="input-field">
                    <option value="MILESTONE">Milestone</option>
                    <option value="TOKEN">Token Advance</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', display: 'block' }}>Payment Method</label>
                  <select value={recMethod} onChange={(e) => setRecMethod(e.target.value as any)} className="input-field">
                    <option value="NEFT">NEFT / RTGS</option>
                    <option value="UPI">UPI Transfer</option>
                    <option value="CHEQUE">Bank Cheque</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', display: 'block' }}>Reference #</label>
                  <input type="text" value={recRef} onChange={(e) => setRecRef(e.target.value)} className="input-field" required />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsRecordModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Commit Payment to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Compensating Refund Creation Modal */}
      {isRefundModalOpen && targetRefundPayment && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            zIndex: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            className="glass-panel"
            style={{ width: '100%', maxWidth: '480px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#ffffff', boxShadow: 'var(--shadow-lg)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <RotateCcw size={22} color="var(--color-danger)" />
              <div className="h2" style={{ fontSize: '1.2rem', color: 'var(--color-danger)' }}>
                Issue Compensating Refund
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Per <code>ARCHITECTURE.md §17.4</code>, settled payment <strong>{targetRefundPayment.referenceId}</strong> will remain untouched in the ledger. A new compensating negative record will be posted.
            </p>

            <form onSubmit={handleIssueCompensatingRefund} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', display: 'block' }}>Refund Amount</label>
                <input
                  type="text"
                  value={`₹${targetRefundPayment.amount.toLocaleString()}`}
                  disabled
                  className="input-field"
                  style={{ opacity: 0.8 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', display: 'block' }}>Reason for Refund</label>
                <textarea
                  rows={2}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setIsRefundModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger">
                  Authorize Compensating Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
