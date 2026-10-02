'use client';

import React, { useState } from 'react';
import {
  PhoneCall,
  CheckCircle2,
  Clock,
  Calendar,
  AlertTriangle,
  Flame,
  ArrowRight,
  Filter,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useCall } from '../../lib/callContext';

interface QueueLead {
  id: string;
  name: string;
  phone: string;
  project: string;
  temperature: 'HOT' | 'WARM' | 'COLD';
  slaState: 'WITHIN_SLA' | 'DUE_SOON' | 'BREACHED';
  slaTimeLeft: string;
  requirement: string;
  budget: string;
  lastInteraction: string;
  nextAction: string;
  scheduledTime: string;
}

export default function TelecallerMyDayPage() {
  const { startCall } = useCall();

  const [selectedLeadId, setSelectedLeadId] = useState<string>('ld-101');
  const [filterTemp, setFilterTemp] = useState<string>('ALL');

  const leadsQueue: QueueLead[] = [
    {
      id: 'ld-101',
      name: 'Amit Sharma',
      phone: '+91 98204 45120',
      project: 'Park Avenue Towers',
      temperature: 'HOT',
      slaState: 'DUE_SOON',
      slaTimeLeft: '14m remaining',
      requirement: '2 BHK Luxury Apartment / Tower A higher floor',
      budget: '₹75 Lakhs - ₹90 Lakhs',
      lastInteraction: 'Inbound Webform 28 Sep: Inquired about ready-to-move inventory.',
      nextAction: 'First Discovery Call: Establish financing pre-approval & site visit.',
      scheduledTime: '11:30 AM',
    },
    {
      id: 'ld-102',
      name: 'Priya Patel',
      phone: '+91 87541 98321',
      project: 'Green Hills Township',
      temperature: 'HOT',
      slaState: 'BREACHED',
      slaTimeLeft: 'Breached by 22m',
      requirement: 'Plot 2,400 Sq. Ft / East Facing / Corner layout',
      budget: '₹60 Lakhs - ₹80 Lakhs',
      lastInteraction: 'Meta Ads Ingestion 29 Sep: Requested layout plan brochure via WhatsApp.',
      nextAction: 'Urgent SLA Outreach: Qualify immediate investment intent.',
      scheduledTime: 'Immediate',
    },
    {
      id: 'ld-103',
      name: 'Vikram Malhotra',
      phone: '+91 99102 67451',
      project: 'Green Hills Township',
      temperature: 'WARM',
      slaState: 'WITHIN_SLA',
      slaTimeLeft: '2h 15m remaining',
      requirement: 'Commercial Parcel / Main Boulevard frontage',
      budget: '₹1.50 Cr - ₹2.00 Cr',
      lastInteraction: 'Callback requested 27 Sep: "Travelling, call Monday morning."',
      nextAction: 'Scheduled Callback: Present Sector B commercial opportunities.',
      scheduledTime: '12:00 PM',
    },
    {
      id: 'ld-104',
      name: 'Ananya Deshmukh',
      phone: '+91 94231 11890',
      project: 'Park Avenue Towers',
      temperature: 'WARM',
      slaState: 'WITHIN_SLA',
      slaTimeLeft: '3h remaining',
      requirement: '3 BHK Garden Facing / Tower C',
      budget: '₹1.10 Cr',
      lastInteraction: 'Attended Virtual Walkthrough 26 Sep: Liked master suite layout.',
      nextAction: 'Site Visit Confirmation: Lock Saturday morning 11 AM appointment.',
      scheduledTime: '01:30 PM',
    },
    {
      id: 'ld-105',
      name: 'Suresh Raina',
      phone: '+91 91300 44211',
      project: 'Green Hills Township',
      temperature: 'COLD',
      slaState: 'WITHIN_SLA',
      slaTimeLeft: '4h remaining',
      requirement: '1,200 Sq. Ft NA Residential Plot',
      budget: '₹35 Lakhs - ₹45 Lakhs',
      lastInteraction: 'Walk-in Inquiry 25 Sep: Collected project pricing sheet.',
      nextAction: 'Requirement Re-check: Confirm budget fit with new phase release.',
      scheduledTime: '03:00 PM',
    },
  ];

  const selectedLead = leadsQueue.find((l) => l.id === selectedLeadId) || leadsQueue[0];

  const filteredQueue = leadsQueue.filter((l) => {
    if (filterTemp === 'ALL') return true;
    return l.temperature === filterTemp;
  });

  const handleDial = (lead: QueueLead) => {
    startCall({
      leadId: lead.id,
      leadName: lead.name,
      phone: lead.phone,
      project: lead.project,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Workstation Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div className="h1" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <PhoneCall size={26} color="var(--accent-primary)" />
            Telecaller "My Day" Workstation
          </div>
          <p className="subtitle" style={{ marginTop: '4px' }}>
            Continuous calling environment · Zero-navigation dialer · Authoritative post-call workflow
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => handleDial(selectedLead)}
            className="btn btn-primary"
            style={{ padding: '10px 20px', fontSize: '0.9375rem' }}
          >
            <Play size={16} fill="white" />
            <span>Start Continuous Calling Queue</span>
          </button>
        </div>
      </div>

      {/* Top Real-Time KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '14px' }}>
        <div className="glass-panel" style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>CALLS DUE TODAY</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>34</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', marginTop: '2px' }}>5 priority hot</div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>COMPLETED CALLS</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-success)', marginTop: '4px' }}>18</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>53% shift target</div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>PENDING CALLBACKS</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-warning)', marginTop: '4px' }}>6</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-warning)', marginTop: '2px' }}>Scheduled slots</div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>SITE VISITS TODAY</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>3</div>
          <div style={{ fontSize: '0.7rem', color: '#38bdf8', marginTop: '2px' }}>2 confirmed</div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>SLA BREACHES</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-danger)', marginTop: '4px' }}>1</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-danger)', marginTop: '2px' }}>Requires immediate dial</div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>CONNECTED RATE</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#a855f7', marginTop: '4px' }}>78%</div>
          <div style={{ fontSize: '0.7rem', color: '#a855f7', marginTop: '2px' }}>Above benchmark</div>
        </div>
      </div>

      {/* Main Calling Workstation (Split View) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* Left Column: Prioritized Call Queue */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '620px' }}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div className="h2" style={{ fontSize: '1.05rem' }}>Prioritized Call Queue</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Sorted by SLA Urgency & Buyer Intent
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {['ALL', 'HOT', 'WARM', 'COLD'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterTemp(t)}
                  className={`btn btn-sm ${filterTemp === t ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredQueue.map((lead) => {
                const isSelected = selectedLeadId === lead.id;
                return (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLeadId(lead.id)}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? '#eef2ff' : '#ffffff',
                      border: isSelected
                        ? '1px solid var(--accent-primary)'
                        : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.15s ease',
                      boxShadow: 'var(--shadow-xs)',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                          {lead.name}
                        </span>
                        <span
                          className={`badge ${
                            lead.temperature === 'HOT'
                              ? 'badge-danger'
                              : lead.temperature === 'WARM'
                              ? 'badge-warning'
                              : 'badge-info'
                          }`}
                        >
                          {lead.temperature}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        {lead.project} · Slot: <strong>{lead.scheduledTime}</strong>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            fontFamily: 'var(--font-mono)',
                            color:
                              lead.slaState === 'BREACHED'
                                ? 'var(--color-danger)'
                                : lead.slaState === 'DUE_SOON'
                                ? 'var(--color-warning)'
                                : 'var(--color-success)',
                          }}
                        >
                          ● {lead.slaTimeLeft}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDial(lead);
                      }}
                      className="btn btn-primary btn-sm"
                      style={{ padding: '8px 16px', display: 'flex', gap: '6px' }}
                    >
                      <PhoneCall size={14} />
                      <span>DIAL</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Prospect Context & Immediate Action Rail */}
        <div
          className="glass-panel"
          style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            height: '620px',
            overflowY: 'auto',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="badge badge-info" style={{ marginBottom: '6px' }}>
                  ACTIVE PROSPECT CONTEXT
                </span>
                <div className="h1" style={{ fontSize: '1.4rem' }}>{selectedLead.name}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {selectedLead.phone} · {selectedLead.project}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <span
                  className={`badge ${
                    selectedLead.temperature === 'HOT'
                      ? 'badge-danger'
                      : selectedLead.temperature === 'WARM'
                      ? 'badge-warning'
                      : 'badge-info'
                  }`}
                >
                  {selectedLead.temperature}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    color:
                      selectedLead.slaState === 'BREACHED'
                        ? 'var(--color-danger)'
                        : selectedLead.slaState === 'DUE_SOON'
                        ? 'var(--color-warning)'
                        : 'var(--color-success)',
                  }}
                >
                  {selectedLead.slaTimeLeft}
                </span>
              </div>
            </div>
          </div>

          {/* Primary Next Action Box */}
          <div className="next-action-card" style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                IMMEDIATE NEXT ACTION
              </div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                {selectedLead.nextAction}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Scheduled Slot: {selectedLead.scheduledTime}
              </div>
            </div>

            <button
              onClick={() => handleDial(selectedLead)}
              className="btn btn-primary"
              style={{ display: 'flex', gap: '8px', padding: '10px 18px' }}
            >
              <PhoneCall size={16} />
              <span>DIAL NOW</span>
            </button>
          </div>

          {/* Requirement & Budget Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              REQUIREMENTS & BUDGET
            </div>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                {selectedLead.requirement}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-success)', marginTop: '6px', fontWeight: 600 }}>
                Indicative Budget: {selectedLead.budget}
              </div>
            </div>
          </div>

          {/* Interaction History Context */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              LATEST INTERACTION SUMMARY
            </div>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {selectedLead.lastInteraction}
              </div>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
            <button
              onClick={() => handleDial(selectedLead)}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              <PhoneCall size={16} />
              <span>Call Lead</span>
            </button>
            <a
              href={`/leads?drawer=${selectedLead.id}`}
              className="btn btn-secondary"
              style={{ flex: 1, textDecoration: 'none' }}
            >
              Open Full Lead Record
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
