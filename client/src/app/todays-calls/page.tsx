'use client';

import React, { useState } from 'react';
import {
  PhoneCall,
  Search,
  Filter,
  ArrowUpDown,
  Clock,
  Building,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useCall } from '../../lib/callContext';

interface CallRow {
  id: string;
  name: string;
  phone: string;
  project: string;
  source: string;
  temperature: 'HOT' | 'WARM' | 'COLD';
  slaState: 'WITHIN_SLA' | 'DUE_SOON' | 'BREACHED';
  slaCountdown: string;
  lastInteraction: string;
  scheduledSlot: string;
  disposition: string;
}

export default function TodaysCallsPage() {
  const { startCall } = useCall();

  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [slaFilter, setSlaFilter] = useState('ALL');

  const callsData: CallRow[] = [
    {
      id: 'tc-1',
      name: 'Amit Sharma',
      phone: '+91 98204 45120',
      project: 'Park Avenue Towers',
      source: 'Meta Luxury Campaign',
      temperature: 'HOT',
      slaState: 'DUE_SOON',
      slaCountdown: '14 mins',
      lastInteraction: 'Web Inquiry 28 Sep',
      scheduledSlot: '11:30 AM',
      disposition: 'INTERESTED',
    },
    {
      id: 'tc-2',
      name: 'Priya Patel',
      phone: '+91 87541 98321',
      project: 'Green Hills Township',
      source: 'Google Search Ads',
      temperature: 'HOT',
      slaState: 'BREACHED',
      slaCountdown: 'Breached (22m)',
      lastInteraction: 'WhatsApp brochure request',
      scheduledSlot: 'Immediate',
      disposition: 'INTERESTED',
    },
    {
      id: 'tc-3',
      name: 'Vikram Malhotra',
      phone: '+91 99102 67451',
      project: 'Green Hills Township',
      source: 'Channel Partner (Apex Realty)',
      temperature: 'WARM',
      slaState: 'WITHIN_SLA',
      slaCountdown: '2h 15m',
      lastInteraction: 'Callback requested',
      scheduledSlot: '12:00 PM',
      disposition: 'CALLBACK_REQUESTED',
    },
    {
      id: 'tc-4',
      name: 'Ananya Deshmukh',
      phone: '+91 94231 11890',
      project: 'Park Avenue Towers',
      source: 'Meta Luxury Campaign',
      temperature: 'WARM',
      slaState: 'WITHIN_SLA',
      slaCountdown: '3h 00m',
      lastInteraction: 'Virtual Tour Viewed',
      scheduledSlot: '01:30 PM',
      disposition: 'INTERESTED',
    },
    {
      id: 'tc-5',
      name: 'Suresh Raina',
      phone: '+91 91300 44211',
      project: 'Green Hills Township',
      source: 'Direct Site Walk-in',
      temperature: 'COLD',
      slaState: 'WITHIN_SLA',
      slaCountdown: '4h 30m',
      lastInteraction: 'Pricing brochure given',
      scheduledSlot: '03:00 PM',
      disposition: 'BUDGET_ISSUE',
    },
    {
      id: 'tc-6',
      name: 'Rohan Verma',
      phone: '+91 97665 43210',
      project: 'Park Avenue Towers',
      source: 'Meta Ads Pune',
      temperature: 'HOT',
      slaState: 'WITHIN_SLA',
      slaCountdown: '45 mins',
      lastInteraction: 'Requested floor plan Tower B',
      scheduledSlot: '04:00 PM',
      disposition: 'INTERESTED',
    },
  ];

  const filteredCalls = callsData.filter((call) => {
    const matchesSearch =
      call.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.phone.includes(searchTerm) ||
      call.project.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProject = projectFilter === 'ALL' || call.project === projectFilter;
    const matchesSla = slaFilter === 'ALL' || call.slaState === slaFilter;

    return matchesSearch && matchesProject && matchesSla;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Title & Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div className="h1" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <PhoneCall size={26} color="var(--accent-primary)" />
            Today's Calls Workspace
          </div>
          <p className="subtitle" style={{ marginTop: '4px' }}>
            Direct execution queue for scheduled callbacks, discovery calls, and urgent SLA turnarounds
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div
            className="glass-panel"
            style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <Clock size={16} color="var(--color-warning)" />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Due Today: <strong style={{ color: 'var(--text-primary)' }}>{callsData.length} Calls</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '16px 20px',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search
            size={16}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by prospect name, phone number, or project..."
            className="input-field"
            style={{ paddingLeft: '38px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Project:</span>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="input-field"
            style={{ width: 'auto' }}
          >
            <option value="ALL">All Projects</option>
            <option value="Park Avenue Towers">Park Avenue Towers</option>
            <option value="Green Hills Township">Green Hills Township</option>
          </select>

          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginLeft: '8px' }}>SLA Urgency:</span>
          <select
            value={slaFilter}
            onChange={(e) => setSlaFilter(e.target.value)}
            className="input-field"
            style={{ width: 'auto' }}
          >
            <option value="ALL">All States</option>
            <option value="BREACHED">Breached</option>
            <option value="DUE_SOON">Due Soon (&lt; 30m)</option>
            <option value="WITHIN_SLA">Within SLA</option>
          </select>
        </div>
      </div>

      {/* Calls Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--border-subtle)',
                background: '#f8fafc',
              }}
            >
              <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                PROSPECT NAME
              </th>
              <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                TARGET PROJECT
              </th>
              <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                INTENT
              </th>
              <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                SLA STATUS
              </th>
              <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                SCHEDULED SLOT
              </th>
              <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                LAST DISPOSITION
              </th>
              <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em', textAlign: 'right' }}>
                INSTANT ACTION
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredCalls.map((call) => (
              <tr
                key={call.id}
                style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '16px 18px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{call.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {call.phone} · {call.source}
                  </div>
                </td>

                <td style={{ padding: '16px 18px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {call.project}
                </td>

                <td style={{ padding: '16px 18px' }}>
                  <span
                    className={`badge ${
                      call.temperature === 'HOT'
                        ? 'badge-danger'
                        : call.temperature === 'WARM'
                        ? 'badge-warning'
                        : 'badge-info'
                    }`}
                  >
                    {call.temperature}
                  </span>
                </td>

                <td style={{ padding: '16px 18px' }}>
                  <span
                    style={{
                      fontSize: '0.8125rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      color:
                        call.slaState === 'BREACHED'
                          ? 'var(--color-danger)'
                          : call.slaState === 'DUE_SOON'
                          ? 'var(--color-warning)'
                          : 'var(--color-success)',
                    }}
                  >
                    ● {call.slaCountdown}
                  </span>
                </td>

                <td style={{ padding: '16px 18px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {call.scheduledSlot}
                </td>

                <td style={{ padding: '16px 18px' }}>
                  <span className="badge badge-muted">{call.disposition}</span>
                </td>

                <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '8px' }}>
                    <button
                      onClick={() =>
                        startCall({
                          leadId: call.id,
                          leadName: call.name,
                          phone: call.phone,
                          project: call.project,
                        })
                      }
                      className="btn btn-primary btn-sm"
                      style={{ padding: '8px 16px', display: 'inline-flex', gap: '6px' }}
                    >
                      <PhoneCall size={14} />
                      <span>DIAL</span>
                    </button>
                    <a
                      href={`/leads?drawer=${call.id}`}
                      className="btn btn-secondary btn-sm"
                      title="Inspect full lead drawer"
                      style={{ textDecoration: 'none' }}
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
