'use client';

import React, { useState } from 'react';
import {
  X,
  Phone,
  MessageSquare,
  Building2,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  Flame,
  Shield,
  History,
} from 'lucide-react';
import { LeadItem } from './LeadCard';
import { api } from '../../lib/api';
import { useCall } from '../../lib/callContext';

interface LeadDetailDrawerProps {
  lead: LeadItem | null;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdated: () => void;
  onOpenHoldModal: (leadId: string) => void;
  onOpenCostSheetModal: (leadId: string) => void;
}

export function LeadDetailDrawer({
  lead,
  isOpen,
  onClose,
  onLeadUpdated,
  onOpenHoldModal,
  onOpenCostSheetModal,
}: LeadDetailDrawerProps) {
  if (!isOpen || !lead) return null;

  const { startCall } = useCall();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable dimensions state
  const [stage, setStage] = useState(lead.lifecycleStage);
  const [status, setStatus] = useState(lead.status);
  const [temperature, setTemperature] = useState(lead.temperature);
  const [disposition, setDisposition] = useState(lead.disposition || 'INTERESTED');

  const handleUpdateStage = async (newStage: string) => {
    try {
      setSaving(true);
      setError(null);
      await api.request(`/api/v1/leads/${lead.id}/stage`, {
        method: 'PATCH',
        body: JSON.stringify({
          stage: newStage,
          reason: 'Manual stage update from LeadDetailDrawer',
        }),
      });
      setStage(newStage as any);
      onLeadUpdated();
    } catch (err: any) {
      setError(err.message || 'Stage transition failed');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      setSaving(true);
      setError(null);
      await api.request(`/api/v1/leads/${lead.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: newStatus,
          reason: 'Status updated from drawer',
        }),
      });
      setStatus(newStatus as any);
      onLeadUpdated();
    } catch (err: any) {
      setError(err.message || 'Status update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTemperature = async (newTemp: string) => {
    try {
      setSaving(true);
      setError(null);
      await api.request(`/api/v1/leads/${lead.id}/temperature`, {
        method: 'PATCH',
        body: JSON.stringify({
          temperature: newTemp,
          reason: 'Temperature updated from drawer',
        }),
      });
      setTemperature(newTemp as any);
      onLeadUpdated();
    } catch (err: any) {
      setError(err.message || 'Temperature update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateDisposition = async (newDisp: string) => {
    try {
      setSaving(true);
      setError(null);
      await api.request(`/api/v1/leads/${lead.id}/disposition`, {
        method: 'PATCH',
        body: JSON.stringify({
          disposition: newDisp,
          reason: 'Disposition updated from drawer',
        }),
      });
      setDisposition(newDisp);
      onLeadUpdated();
    } catch (err: any) {
      setError(err.message || 'Disposition update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '560px',
          maxWidth: '100%',
          height: '100%',
          backgroundColor: 'var(--bg-secondary)',
          borderLeft: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeIn 0.2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-card)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="h2">{lead.customer?.fullName}</span>
              {lead.lifecycleCycle > 1 && (
                <span className="badge badge-purple">Cycle #{lead.lifecycleCycle}</span>
              )}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {lead.customer?.phone} • {lead.customer?.email || 'No email provided'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Scrollable Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-danger-bg)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--color-danger)',
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Next Action Command Card (UI.md v2 §8 & §13.3) */}
          <div className="next-action-card">
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                IMMEDIATE NEXT ACTION
              </div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                Discovery Call: Review requirement &amp; schedule site visit
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Due Today · Response SLA: {lead.slaState || 'WITHIN_SLA'}
              </div>
            </div>

            <button
              onClick={() =>
                startCall({
                  leadId: lead.id,
                  leadName: lead.customer?.fullName || 'Prospect',
                  phone: lead.customer?.phone || '',
                  project: lead.project?.name || 'Park Avenue Towers',
                })
              }
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', gap: '6px', padding: '8px 14px' }}
            >
              <Phone size={14} />
              <span>Dial Now</span>
            </button>
          </div>

          {/* §39.2 ARCHITECTURAL MANDATE: The Five Distinct Dimensions */}
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              The 5 Independent Lead Dimensions (§10.1)
            </div>

            {/* Dimension 1: Lifecycle Stage */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                1. Commercial Journey (Lifecycle Stage)
              </label>
              <select
                value={stage}
                onChange={(e) => handleUpdateStage(e.target.value)}
                disabled={saving}
                className="input-field"
                style={{ cursor: 'pointer' }}
              >
                {['NEW', 'CONTACTED', 'QUALIFIED', 'SITE_VISIT', 'NEGOTIATION', 'BOOKING', 'WON', 'CANCELLED', 'LOST'].map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Dimension 2: Operational Status */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                2. Operational Condition (Status)
              </label>
              <select
                value={status}
                onChange={(e) => handleUpdateStatus(e.target.value)}
                disabled={saving}
                className="input-field"
                style={{ cursor: 'pointer' }}
              >
                {['ACTIVE', 'INACTIVE', 'CALLBACK_PENDING', 'DISQUALIFIED'].map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Dimension 3: Temperature */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                3. Buyer Intent (Temperature)
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['COLD', 'WARM', 'HOT'].map((temp) => (
                  <button
                    key={temp}
                    type="button"
                    onClick={() => handleUpdateTemperature(temp)}
                    disabled={saving}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: temperature === temp ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      backgroundColor: temperature === temp ? 'var(--accent-primary-glow)' : 'var(--bg-input)',
                      color: temperature === temp ? '#fff' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                    }}
                  >
                    <Flame size={14} color={temp === 'HOT' ? '#ef4444' : temp === 'WARM' ? '#f59e0b' : '#06b6d4'} />
                    {temp}
                  </button>
                ))}
              </div>
            </div>

            {/* Dimension 4: SLA State */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                4. First Response SLA Window (120s timer)
              </label>
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'var(--bg-input)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.8125rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={16} color={lead.slaBreachedAt ? 'var(--color-danger)' : 'var(--color-success)'} />
                  <span style={{ fontWeight: 700, color: lead.slaBreachedAt ? 'var(--color-danger)' : 'var(--color-success)' }}>
                    {lead.slaBreachedAt ? 'SLA BREACHED' : 'WITHIN SLA'}
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {lead.slaBreachedAt ? 'Breach Recorded' : '120s response SLA'}
                </span>
              </div>
            </div>

            {/* Dimension 5: Opportunity Disposition */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                5. Commercial Assessment (Lead Disposition)
              </label>
              <select
                value={disposition}
                onChange={(e) => handleUpdateDisposition(e.target.value)}
                disabled={saving}
                className="input-field"
                style={{ cursor: 'pointer' }}
              >
                {[
                  'INTERESTED',
                  'CALLBACK_REQUESTED',
                  'NOT_INTERESTED',
                  'NO_RESPONSE',
                  'WRONG_NUMBER',
                  'INVALID_LEAD',
                  'DUPLICATE',
                  'BUDGET_ISSUE',
                  'LOCATION_ISSUE',
                  'PRODUCT_MISMATCH',
                  'COMPETITOR',
                  'FUTURE_REQUIREMENT',
                  'RENTAL_REQUIREMENT',
                  'INVESTMENT_REQUIREMENT',
                  'PURCHASED',
                  'LOST_TO_COMPETITOR',
                  'OTHER',
                ].map((disp) => (
                  <option key={disp} value={disp}>
                    {disp}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 360° Timeline */}
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
              <History size={16} color="var(--accent-primary)" />
              <span>360° Activity Timeline</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)', marginTop: '6px' }} />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Lead Created via Meta Lead Ads</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Attributed to Acme Digital Campaign</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-success)', marginTop: '6px' }} />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Assigned to Senior CSE</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>SLA 120s timer initiated</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Actions Bar (§39.2: [Call], [WhatsApp], [Hold Unit], [Cost Sheet]) */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-card)',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '10px',
          }}
        >
          <button
            onClick={() =>
              startCall({
                leadId: lead.id,
                leadName: lead.customer?.fullName || 'Prospect',
                phone: lead.customer?.phone || '',
                project: lead.project?.name || 'Park Avenue Towers',
              })
            }
            className="btn btn-secondary btn-sm"
            style={{ width: '100%' }}
          >
            <Phone size={14} color="var(--color-success)" />
            <span>Call</span>
          </button>

          <button
            onClick={() => alert(`Opening WhatsApp Cloud API chat with ${lead.customer?.phone}`)}
            className="btn btn-secondary btn-sm"
            style={{ width: '100%' }}
          >
            <MessageSquare size={14} color="var(--color-info)" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={() => onOpenHoldModal(lead.id)}
            className="btn btn-secondary btn-sm"
            style={{ width: '100%' }}
          >
            <Building2 size={14} color="var(--color-warning)" />
            <span>Hold Unit</span>
          </button>

          <button
            onClick={() => onOpenCostSheetModal(lead.id)}
            className="btn btn-primary btn-sm"
            style={{ width: '100%' }}
          >
            <FileSpreadsheet size={14} />
            <span>Cost Sheet</span>
          </button>
        </div>
      </div>
    </div>
  );
}
