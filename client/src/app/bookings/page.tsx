'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Plus,
  AlertTriangle,
  Building,
  CreditCard,
  FileSpreadsheet,
  User,
  ArrowRight,
  RotateCcw,
  Clock,
  XCircle,
  ShieldAlert,
} from 'lucide-react';

interface BookingItem {
  id: string;
  code: string;
  customerName: string;
  phone: string;
  assetType: 'UNIT' | 'PLOT';
  assetCode: string;
  costSheetCode: string;
  agreementValue: number;
  collectedAmount: number;
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  registrationStatus: string;
  bookingDate: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([
    {
      id: 'bk-1',
      code: 'BK-2026-0847',
      customerName: 'Amit Sharma',
      phone: '+91 98204 45120',
      assetType: 'PLOT',
      assetCode: 'Plot B-03 (Green Hills)',
      costSheetCode: 'CS-2026-0847 (v2)',
      agreementValue: 3425000,
      collectedAmount: 500000,
      status: 'CONFIRMED',
      registrationStatus: 'AGREEMENT_PENDING',
      bookingDate: '2026-09-29',
    },
    {
      id: 'bk-2',
      code: 'BK-2026-0792',
      customerName: 'Rohan Mehta',
      phone: '+91 98112 55667',
      assetType: 'UNIT',
      assetCode: 'Unit A-1102 (Park Ave)',
      costSheetCode: 'CS-2026-0792 (v1)',
      agreementValue: 8200000,
      collectedAmount: 8200000,
      status: 'COMPLETED',
      registrationStatus: 'POSSESSION_HANDOVER',
      bookingDate: '2026-08-15',
    },
    {
      id: 'bk-3',
      code: 'BK-2026-0610',
      customerName: 'Sanjay Gupta',
      phone: '+91 97234 11223',
      assetType: 'PLOT',
      assetCode: 'Plot B-05 (Green Hills)',
      costSheetCode: 'CS-2026-0610 (v1)',
      agreementValue: 4200000,
      collectedAmount: 200000,
      status: 'CANCELLED',
      registrationStatus: 'VOIDED',
      bookingDate: '2026-07-20',
    },
  ]);

  const [isStepperOpen, setIsStepperOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Stepper Form Data
  const [stepperCustomer, setStepperCustomer] = useState('Rahul Patil');
  const [stepperPhone, setStepperPhone] = useState('+91 98234 56789');
  const [stepperPan, setStepperPan] = useState('ABCDE1234F');
  const [stepperAsset, setStepperAsset] = useState('Plot B-01 (Green Hills)');
  const [stepperCostSheet, setStepperCostSheet] = useState('CS-2026-0950 (v1)');
  const [stepperPaymentPlan, setStepperPaymentPlan] = useState('Standard 3-Stage Milestone');
  const [stepperTokenAmount, setStepperTokenAmount] = useState('200000');
  const [stepperPaymentRef, setStepperPaymentRef] = useState('NEFT-HDFC-9823412');

  // Cancellation Modal State
  const [cancellingBooking, setCancellingBooking] = useState<BookingItem | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const handleStepSubmit = () => {
    if (currentStep < 6) {
      setCurrentStep((s) => s + 1);
    } else {
      // Finalize booking
      const newBooking: BookingItem = {
        id: `bk-${Date.now()}`,
        code: `BK-2026-0${Math.floor(Math.random() * 900 + 100)}`,
        customerName: stepperCustomer,
        phone: stepperPhone,
        assetType: 'PLOT',
        assetCode: stepperAsset,
        costSheetCode: stepperCostSheet,
        agreementValue: 3500000,
        collectedAmount: Number(stepperTokenAmount),
        status: 'CONFIRMED',
        registrationStatus: 'AGREEMENT_PENDING',
        bookingDate: 'Today',
      };

      setBookings([newBooking, ...bookings]);
      setIsStepperOpen(false);
      setCurrentStep(1);
    }
  };

  const handleConfirmCancellation = () => {
    if (!cancellingBooking) return;

    setBookings((prev) =>
      prev.map((b) =>
        b.id === cancellingBooking.id ? { ...b, status: 'CANCELLED', registrationStatus: 'VOIDED' } : b
      )
    );
    setCancellingBooking(null);
    setCancelReason('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div className="h1" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CheckCircle2 size={26} color="var(--accent-primary)" />
            Bookings &amp; Deal Closures
          </div>
          <p className="subtitle" style={{ marginTop: '4px' }}>
            Authoritative deal state machine · 6-Step transactional creation · Cascading cancellation integrity
          </p>
        </div>

        <button
          onClick={() => {
            setCurrentStep(1);
            setIsStepperOpen(true);
          }}
          className="btn btn-primary"
          style={{ display: 'flex', gap: '8px' }}
        >
          <Plus size={16} />
          <span>Create New Booking (6-Step)</span>
        </button>
      </div>

      {/* Bookings Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: '#f8fafc' }}>
              <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>BOOKING ID</th>
              <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>PRIMARY BUYER</th>
              <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>ASSIGNED ASSET</th>
              <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>AGREEMENT VALUE</th>
              <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>COLLECTION PROGRESS</th>
              <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>STATUS</th>
              <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em', textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => {
              const collectionPct = Math.min(
                Math.round((booking.collectedAmount / booking.agreementValue) * 100),
                100
              );
              return (
                <tr
                  key={booking.id}
                  style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '16px 18px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                      {booking.code}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Date: {booking.bookingDate}
                    </div>
                  </td>

                  <td style={{ padding: '16px 18px' }}>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{booking.customerName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{booking.phone}</div>
                  </td>

                  <td style={{ padding: '16px 18px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {booking.assetCode}
                  </td>

                  <td style={{ padding: '16px 18px', fontSize: '0.9375rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                    ₹{(booking.agreementValue / 100000).toFixed(2)} Lakhs
                  </td>

                  <td style={{ padding: '16px 18px', width: '220px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>₹{(booking.collectedAmount / 100000).toFixed(2)} L</span>
                      <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>{collectionPct}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${collectionPct}%`, height: '100%', background: 'var(--color-success)' }} />
                    </div>
                  </td>

                  <td style={{ padding: '16px 18px' }}>
                    <span
                      className={`badge ${
                        booking.status === 'CONFIRMED'
                          ? 'badge-success'
                          : booking.status === 'COMPLETED'
                          ? 'badge-purple'
                          : booking.status === 'CANCELLED'
                          ? 'badge-danger'
                          : 'badge-warning'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </td>

                  <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                    {booking.status === 'CONFIRMED' && (
                      <button
                        onClick={() => setCancellingBooking(booking)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--color-danger)' }}
                      >
                        Cancel Booking
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 6-Step Booking Stepper Wizard Modal */}
      {isStepperOpen && (
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
            style={{ width: '100%', maxWidth: '640px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px', background: '#ffffff', boxShadow: 'var(--shadow-lg)' }}
          >
            {/* Stepper Progress Bar */}
            <div className="stepper-nav">
              {[
                '1. Customer',
                '2. Asset',
                '3. Cost Sheet',
                '4. Commercial',
                '5. Payment',
                '6. Confirmation',
              ].map((stepLabel, idx) => {
                const stepNum = idx + 1;
                const isActive = currentStep === stepNum;
                const isCompleted = currentStep > stepNum;
                return (
                  <div
                    key={stepLabel}
                    className={`stepper-step ${isActive ? 'active' : isCompleted ? 'completed' : ''}`}
                  >
                    <div className="step-num">{isCompleted ? '✓' : stepNum}</div>
                    <span>{stepLabel}</span>
                  </div>
                );
              })}
            </div>

            {/* Step 1: Customer */}
            {currentStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="h2" style={{ fontSize: '1.15rem' }}>Step 1: Customer Identity &amp; KYC</div>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', display: 'block' }}>Primary Applicant Full Name</label>
                  <input type="text" value={stepperCustomer} onChange={(e) => setStepperCustomer(e.target.value)} className="input-field" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', display: 'block' }}>Contact Phone</label>
                    <input type="tel" value={stepperPhone} onChange={(e) => setStepperPhone(e.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', display: 'block' }}>PAN Number</label>
                    <input type="text" value={stepperPan} onChange={(e) => setStepperPan(e.target.value)} className="input-field" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Inventory Asset */}
            {currentStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="h2" style={{ fontSize: '1.15rem' }}>Step 2: Inventory Asset Assignment (Unit XOR Plot)</div>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', display: 'block' }}>Select Target Asset</label>
                  <select value={stepperAsset} onChange={(e) => setStepperAsset(e.target.value)} className="input-field">
                    <option value="Plot B-01 (Green Hills)">Plot B-01 (Green Hills) — AVAILABLE</option>
                    <option value="Plot B-03 (Green Hills)">Plot B-03 (Green Hills) — ON_HOLD (held by you)</option>
                    <option value="Unit A-1201 (Park Ave)">Unit A-1201 (Park Ave) — AVAILABLE</option>
                  </select>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '4px' }}>
                    ✓ Precondition verified: Asset is within authorized developer project and available.
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Cost Sheet */}
            {currentStep === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="h2" style={{ fontSize: '1.15rem' }}>Step 3: Bind Issued Cost Sheet</div>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', display: 'block' }}>Active Issued Cost Sheet</label>
                  <select value={stepperCostSheet} onChange={(e) => setStepperCostSheet(e.target.value)} className="input-field">
                    <option value="CS-2026-0847 (v2)">CS-2026-0847 (v2) — ₹34.25 Lakhs (ISSUED)</option>
                    <option value="CS-2026-0950 (v1)">CS-2026-0950 (v1) — ₹50.40 Lakhs (ISSUED)</option>
                  </select>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Pricing rules, PLC, and discounts snapshot automatically into the immutable deal contract.
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Commercial Plan */}
            {currentStep === 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="h2" style={{ fontSize: '1.15rem' }}>Step 4: Milestone Payment Schedule</div>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', display: 'block' }}>Payment Plan</label>
                  <select value={stepperPaymentPlan} onChange={(e) => setStepperPaymentPlan(e.target.value)} className="input-field">
                    <option value="Standard 3-Stage Milestone">Standard 3-Stage Milestone (Token 10% → Agreement 40% → Registration 50%)</option>
                    <option value="Construction Linked CLP">Construction Linked Plan (CLP) — 10 Slab Schedule</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 5: Token Payment */}
            {currentStep === 5 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="h2" style={{ fontSize: '1.15rem' }}>Step 5: Record Token Payment Deposit</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', display: 'block' }}>Token Amount (₹)</label>
                    <input type="number" value={stepperTokenAmount} onChange={(e) => setStepperTokenAmount(e.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', display: 'block' }}>Banking Reference</label>
                    <input type="text" value={stepperPaymentRef} onChange={(e) => setStepperPaymentRef(e.target.value)} className="input-field" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Confirmation Review */}
            {currentStep === 6 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="h2" style={{ fontSize: '1.15rem' }}>Step 6: Authoritative Confirmation Review</div>
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div>Buyer: <strong style={{ color: 'var(--text-primary)' }}>{stepperCustomer}</strong> ({stepperPhone})</div>
                  <div>Asset: <strong style={{ color: 'var(--text-primary)' }}>{stepperAsset}</strong></div>
                  <div>Cost Sheet: <strong style={{ color: 'var(--text-primary)' }}>{stepperCostSheet}</strong></div>
                  <div>Initial Token: <strong style={{ color: 'var(--color-success)' }}>₹{Number(stepperTokenAmount).toLocaleString()}</strong> (Ref: {stepperPaymentRef})</div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>
                  ✓ Committing will atomically consume the inventory hold, transition unit to BOOKED, and set Lead to WON.
                </div>
              </div>
            )}

            {/* Stepper Footer Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={() => (currentStep > 1 ? setCurrentStep((s) => s - 1) : setIsStepperOpen(false))}
                className="btn btn-secondary"
              >
                {currentStep === 1 ? 'Cancel' : 'Previous Step'}
              </button>
              <button onClick={handleStepSubmit} className="btn btn-primary">
                {currentStep === 6 ? 'Commit & Issue Booking' : 'Proceed to Next Step'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cascading Cancellation Dialog */}
      {cancellingBooking && (
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
            style={{ width: '100%', maxWidth: '500px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px', background: '#ffffff', boxShadow: 'var(--shadow-lg)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldAlert size={24} color="var(--color-danger)" />
              <div className="h2" style={{ fontSize: '1.2rem', color: 'var(--color-danger)' }}>
                Confirm Booking Cancellation
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Cancelling <strong>{cancellingBooking.code}</strong> triggers cascading domain events per <code>ARCHITECTURE.md §16.2</code>:
            </p>

            <ul style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '18px' }}>
              <li>Inventory asset resets immediately from <code>BOOKED</code> to <code>AVAILABLE</code>.</li>
              <li>Future payment milestones are marked <code>VOIDED</code>.</li>
              <li>Lead lifecycle stage transitions from <code>WON</code> to <code>CANCELLED</code> and status becomes <code>CLOSED</code>.</li>
              <li>Compensating refund record is initialized in the financial ledger.</li>
            </ul>

            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', display: 'block' }}>
                Reason for Cancellation (Audit Log Requirement)
              </label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="State the customer reason or financing failure..."
                className="input-field"
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button onClick={() => setCancellingBooking(null)} className="btn btn-secondary">
                Abort
              </button>
              <button
                onClick={handleConfirmCancellation}
                disabled={!cancelReason}
                className="btn btn-danger"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
