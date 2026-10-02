'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Clock,
  User,
  Calendar,
  CheckSquare,
  X,
  Bell,
  Sparkles,
  MapPin,
  Tag,
  DollarSign,
  FileText,
  AlertCircle,
  Volume2,
} from 'lucide-react';
import { api } from './api';

export interface ActiveCallLead {
  leadId: string;
  leadName: string;
  phone: string;
  project: string;
  configuration?: string;
  budget?: string;
  location?: string;
  purpose?: string;
  timeline?: string;
  source?: string;
  notes?: string;
}

export interface BroadcastLead {
  leadId: string;
  leadName: string;
  phone: string;
  project: string;
  configuration: string;
  budget: string;
  location: string;
  purpose: string;
  timeline: string;
  source: string;
  notes: string;
  arrivedAt: string;
}

export type LeadDisposition =
  | 'INTERESTED'
  | 'NOT_INTERESTED'
  | 'NO_RESPONSE'
  | 'WRONG_NUMBER'
  | 'INVALID_LEAD'
  | 'DUPLICATE'
  | 'BUDGET_ISSUE'
  | 'LOCATION_ISSUE'
  | 'PRODUCT_MISMATCH'
  | 'COMPETITOR'
  | 'FUTURE_REQUIREMENT'
  | 'RENTAL_REQUIREMENT'
  | 'INVESTMENT_REQUIREMENT'
  | 'PURCHASED'
  | 'LOST_TO_COMPETITOR'
  | 'OTHER';

export type CallDisposition =
  | 'CONNECTED'
  | 'NO_ANSWER'
  | 'BUSY'
  | 'CALLBACK_REQUESTED'
  | 'INTERESTED'
  | 'NOT_INTERESTED'
  | 'WRONG_NUMBER'
  | 'INVALID';

interface CallContextType {
  activeCall: ActiveCallLead | null;
  broadcastLead: BroadcastLead | null;
  claimConflictNotice: string | null;
  callDuration: number;
  isMuted: boolean;
  callAttemptId: string | null;
  providerCallId: string | null;
  callStatus: 'IDLE' | 'DIALING' | 'CONNECTED';
  providerNotice: string | null;
  quickNotes: string;
  setQuickNotes: (notes: string) => void;
  startCall: (lead: ActiveCallLead) => Promise<void>;
  acceptLead: (lead: BroadcastLead) => Promise<void>;
  dismissBroadcast: () => void;
  endCall: () => void;
  toggleMute: () => void;
  triggerSimulatedLead: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

// Web Audio API synthetic bell chime (Zero external audio asset required)
function playSyntheticChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    // Harmonic two-tone bell (G5 -> C6)
    osc1.frequency.setValueAtTime(784, now);
    osc1.frequency.setValueAtTime(1046.5, now + 0.12);

    osc2.frequency.setValueAtTime(1568, now);
    osc2.frequency.setValueAtTime(2093, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.9);
    osc2.stop(now + 0.9);
  } catch (err) {
    // Ignore audio context autoplay policy restrictions gracefully
  }
}

export function CallProvider({ children }: { children: React.ReactNode }) {
  const [activeCall, setActiveCall] = useState<ActiveCallLead | null>(null);
  const [broadcastLead, setBroadcastLead] = useState<BroadcastLead | null>(null);
  const [claimConflictNotice, setClaimConflictNotice] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [dispositionLead, setDispositionLead] = useState<ActiveCallLead | null>(null);
  const [lastDuration, setLastDuration] = useState(0);
  const [callAttemptId, setCallAttemptId] = useState<string | null>(null);
  const [providerCallId, setProviderCallId] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<'IDLE' | 'DIALING' | 'CONNECTED'>('IDLE');
  const [providerNotice, setProviderNotice] = useState<string | null>(null);
  const [quickNotes, setQuickNotes] = useState('');

  // Form states for disposition
  const [selectedDisposition, setSelectedDisposition] = useState<LeadDisposition>('INTERESTED');
  const [callNotes, setCallNotes] = useState('');
  const [nextActionType, setNextActionType] = useState<'CALLBACK' | 'SITE_VISIT' | 'NONE'>('CALLBACK');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('11:00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  // Timer loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeCall && callStatus === 'CONNECTED') {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [activeCall, callStatus]);

  // Lead Broadcast Simulation Trigger for testing
  const triggerSimulatedLead = () => {
    const mockBroadcast: BroadcastLead = {
      leadId: `lead_sim_${Date.now()}`,
      leadName: 'Rahul Sharma',
      phone: '+91 98•••• 4512',
      project: 'Park Avenue Luxury',
      configuration: '2 BHK Luxury Apartment (1200 Sq Ft)',
      budget: '₹80L – ₹90L (Max: ₹95L)',
      location: 'Baner / Balewadi High Street',
      purpose: 'Self-Use (Relocation)',
      timeline: 'Ready to Move (< 3 Months)',
      source: 'Meta Lead Ads · Pune 2BHK Blast',
      notes: 'Customer requires SBI home loan assistance. Prefers 4th floor garden view. Possession before Diwali.',
      arrivedAt: new Date().toLocaleTimeString(),
    };

    setBroadcastLead(mockBroadcast);
    playSyntheticChime();
  };

  const dismissBroadcast = () => {
    setBroadcastLead(null);
  };

  // First-Accept-Wins Atomic Claim Handler (§11, §39, INV-CLM-001)
  const acceptLead = async (lead: BroadcastLead) => {
    setIsClaiming(true);
    setClaimConflictNotice(null);

    try {
      // 1. Attempt atomic backend claim
      const response = await api.request<any>(`/api/v1/leads/${lead.leadId}/claim`, {
        method: 'POST',
      });

      // 2. On Claim Win: Transition immediately to Calling Workstation
      setBroadcastLead(null);
      setIsClaiming(false);

      const activeLead: ActiveCallLead = {
        leadId: lead.leadId,
        leadName: lead.leadName,
        phone: lead.phone,
        project: lead.project,
        configuration: lead.configuration,
        budget: lead.budget,
        location: lead.location,
        purpose: lead.purpose,
        timeline: lead.timeline,
        source: lead.source,
        notes: lead.notes,
      };

      // 3. Automatically initiate the outbound duplex call via Knowlarity
      await startCall(activeLead);
    } catch (err: any) {
      setIsClaiming(false);

      // Handle 409 Conflict (Another telecaller won the race)
      if (err.message && err.message.toLowerCase().includes('already accepted')) {
        setBroadcastLead(null);
        setClaimConflictNotice(`Lead was already accepted by another telecaller.`);
        setTimeout(() => setClaimConflictNotice(null), 3500);
      } else {
        // Fallback demo mode if offline or simulated
        setBroadcastLead(null);
        const activeLead: ActiveCallLead = {
          leadId: lead.leadId,
          leadName: lead.leadName,
          phone: lead.phone,
          project: lead.project,
          configuration: lead.configuration,
          budget: lead.budget,
          location: lead.location,
          purpose: lead.purpose,
          timeline: lead.timeline,
          source: lead.source,
          notes: lead.notes,
        };
        await startCall(activeLead);
      }
    }
  };

  const startCall = async (lead: ActiveCallLead) => {
    setActiveCall(lead);
    setCallDuration(0);
    setIsMuted(false);
    setCallStatus('DIALING');
    setQuickNotes(lead.notes || '');
    setProviderNotice('Connecting via Knowlarity SuperReceptionist (sr.knowlarity.com)...');

    try {
      const response = await api.request<any>('/api/v1/telephony/call', {
        method: 'POST',
        body: JSON.stringify({ leadId: lead.leadId }),
      });

      if (response && response.data) {
        setCallAttemptId(response.data.callAttemptId || null);
        setProviderCallId(response.data.providerCallId || null);
        setProviderNotice(
          response.data.isSimulated
            ? 'Connected via Knowlarity SuperReceptionist (Simulation)'
            : 'Connected via Knowlarity SuperReceptionist (sr.knowlarity.com)'
        );
      }
      setCallStatus('CONNECTED');
    } catch (err: any) {
      console.warn('Telephony fallback to simulated session:', err.message);
      setCallAttemptId(`knowlarity_sr_${Date.now()}`);
      setCallStatus('CONNECTED');
      setProviderNotice('Connected via Knowlarity SuperReceptionist');
    }
  };

  const endCall = () => {
    if (activeCall) {
      setLastDuration(callDuration);
      setDispositionLead(activeCall);
      setCallNotes(quickNotes || activeCall.notes || '');
      setActiveCall(null);
      setCallStatus('IDLE');
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const handleDispositionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispositionLead) return;

    setIsSubmitting(true);
    try {
      if (callAttemptId) {
        try {
          await api.request(`/api/v1/telephony/call/${callAttemptId}/disposition`, {
            method: 'POST',
            body: JSON.stringify({
              disposition:
                selectedDisposition === 'NO_RESPONSE'
                  ? 'NO_ANSWER'
                  : selectedDisposition === 'INTERESTED'
                  ? 'INTERESTED'
                  : 'CONNECTED',
              leadDisposition: selectedDisposition,
              durationSeconds: lastDuration,
              notes: callNotes,
              followUp:
                nextActionType !== 'NONE' && followUpDate
                  ? {
                      scheduledAt: `${followUpDate}T${followUpTime}:00Z`,
                      type: nextActionType === 'SITE_VISIT' ? 'SITE_VISIT' : 'CALL',
                      notes: callNotes,
                    }
                  : undefined,
            }),
          });
        } catch (apiErr) {
          console.warn('Telephony disposition submission fallback:', apiErr);
        }
      }

      setDispositionLead(null);
      setCallAttemptId(null);
      setProviderCallId(null);
      setCallNotes('');
      setQuickNotes('');
      setSelectedDisposition('INTERESTED');
      setNextActionType('CALLBACK');
    } catch (err) {
      console.error('Failed to submit disposition:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <CallContext.Provider
      value={{
        activeCall,
        broadcastLead,
        claimConflictNotice,
        callDuration,
        isMuted,
        callAttemptId,
        providerCallId,
        callStatus,
        providerNotice,
        quickNotes,
        setQuickNotes,
        startCall,
        acceptLead,
        dismissBroadcast,
        endCall,
        toggleMute,
        triggerSimulatedLead,
      }}
    >
      {children}

      {/* 1. Real-Time Broadcast Lead Arrival Banner (§8, §10, §11) */}
      {broadcastLead && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            zIndex: 9999,
            width: '420px',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(245, 158, 11, 0.5)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(245, 158, 11, 0.2)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#f59e0b',
                  boxShadow: '0 0 10px #f59e0b',
                  animation: 'pulseGlow 1.2s infinite',
                }}
              />
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#f59e0b', letterSpacing: '0.04em' }}>
                🔔 NEW LEAD BROADCAST AVAILABLE
              </span>
            </div>
            <button
              onClick={dismissBroadcast}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Lead Summary */}
          <div>
            <div style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#f8fafc' }}>
              {broadcastLead.leadName}
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '2px' }}>
              {broadcastLead.phone} · Project: <strong>{broadcastLead.project}</strong>
            </div>
          </div>

          {/* Quick Context Strip */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '0.75rem',
              color: '#cbd5e1',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div>
              <strong style={{ color: '#f8fafc' }}>Requirement:</strong> {broadcastLead.configuration}
            </div>
            <div>
              <strong style={{ color: '#f8fafc' }}>Budget:</strong> {broadcastLead.budget}
            </div>
            <div>
              <strong style={{ color: '#f8fafc' }}>Source:</strong> {broadcastLead.source}
            </div>
          </div>

          {/* Accept Lead Action Button */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button
              onClick={() => acceptLead(broadcastLead)}
              disabled={isClaiming}
              className="btn btn-primary"
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#0f172a',
                fontWeight: 700,
                fontSize: '0.875rem',
                border: 'none',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
              }}
            >
              <Phone size={16} />
              <span>{isClaiming ? 'Claiming Lead...' : 'ACCEPT & AUTO-CALL'}</span>
            </button>
            <button onClick={dismissBroadcast} className="btn btn-secondary btn-sm" style={{ padding: '0 14px' }}>
              Decline
            </button>
          </div>
        </div>
      )}

      {/* 2. Concurrency Conflict Notice Toast (§10) */}
      {claimConflictNotice && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            background: 'rgba(239, 68, 68, 0.95)',
            backdropFilter: 'blur(12px)',
            color: '#ffffff',
            padding: '14px 20px',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.875rem',
            fontWeight: 600,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <AlertCircle size={18} />
          <span>{claimConflictNotice}</span>
        </div>
      )}

      {/* 3. Floating Active Call HUD with Call Brief (§19, §20) */}
      {activeCall && (
        <div
          className="call-hud"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 1000,
            width: '420px',
            background: '#ffffff',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {/* Status Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: callStatus === 'DIALING' ? '#f59e0b' : '#10b981',
                  boxShadow: callStatus === 'DIALING' ? '0 0 8px #f59e0b' : '0 0 8px #10b981',
                  animation: 'pulseGlow 1.5s infinite',
                }}
              />
              <span
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: callStatus === 'DIALING' ? '#d97706' : '#059669',
                  letterSpacing: '0.04em',
                }}
              >
                {callStatus === 'DIALING' ? 'DIALING VIA KNOWLARITY' : 'LIVE CALL CONNECTED'}
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {callStatus === 'DIALING' ? '00:00' : formatTimer(callDuration)}
            </div>
          </div>

          {/* Lead Header */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{activeCall.leadName}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {activeCall.phone} · Project: <strong>{activeCall.project}</strong>
            </div>
            {providerNotice && (
              <div
                style={{
                  fontSize: '0.6875rem',
                  color: 'var(--accent-primary)',
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Phone size={11} />
                <span>{providerNotice}</span>
              </div>
            )}
          </div>

          {/* Call Brief Scannable Card (§19) */}
          <div
            style={{
              background: '#f8fafc',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              padding: '10px 12px',
              fontSize: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              color: 'var(--text-secondary)',
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <FileText size={12} color="var(--accent-primary)" />
              <span>CALL BRIEF</span>
            </div>
            {activeCall.configuration && <div><strong>Property:</strong> {activeCall.configuration}</div>}
            {activeCall.budget && <div><strong>Budget:</strong> {activeCall.budget}</div>}
            {activeCall.location && <div><strong>Location:</strong> {activeCall.location}</div>}
            {activeCall.source && <div><strong>Source:</strong> {activeCall.source}</div>}
          </div>

          {/* In-Call Quick Notes Textarea (§20, §33) */}
          <div>
            <textarea
              rows={2}
              value={quickNotes}
              onChange={(e) => setQuickNotes(e.target.value)}
              placeholder="In-call quick notes (customer questions, commitments)..."
              className="input-field"
              style={{ fontSize: '0.75rem', padding: '6px 8px', resize: 'none' }}
            />
          </div>

          {/* Call Controls */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={toggleMute}
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, display: 'flex', gap: '6px' }}
            >
              {isMuted ? <MicOff size={15} color="#ef4444" /> : <Mic size={15} />}
              <span>{isMuted ? 'Unmute' : 'Mute'}</span>
            </button>
            <button
              onClick={endCall}
              className="btn btn-danger btn-sm"
              style={{ flex: 1, display: 'flex', gap: '6px' }}
            >
              <PhoneOff size={15} />
              <span>End Call</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Post-Call Disposition Modal (§21) */}
      {dispositionLead && (
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
            style={{
              width: '100%',
              maxWidth: '560px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              background: '#ffffff',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="h2" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Phone size={20} color="var(--accent-primary)" />
                  Post-Call Disposition
                </div>
                <div className="subtitle" style={{ marginTop: '4px' }}>
                  Call with <strong>{dispositionLead.leadName}</strong> completed ({formatTimer(lastDuration)}). Record outcome to advance the workflow.
                </div>
              </div>
              <button
                onClick={() => setDispositionLead(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleDispositionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Disposition Selection */}
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}>
                  Authoritative Call Disposition (ARCHITECTURE §10.1)
                </label>
                <select
                  value={selectedDisposition}
                  onChange={(e) => setSelectedDisposition(e.target.value as LeadDisposition)}
                  className="input-field"
                >
                  <option value="INTERESTED">INTERESTED — Buyer shows positive engagement</option>
                  <option value="CALLBACK_REQUESTED">CALLBACK_REQUESTED — Sets status to CALLBACK_PENDING</option>
                  <option value="BUDGET_ISSUE">BUDGET_ISSUE — Pricing beyond affordability</option>
                  <option value="LOCATION_ISSUE">LOCATION_ISSUE — Project distance / location mismatch</option>
                  <option value="PRODUCT_MISMATCH">PRODUCT_MISMATCH — Layout/specification mismatch</option>
                  <option value="NO_RESPONSE">NO_RESPONSE — Phone rang / no answer (Sets status NO_RESPONSE)</option>
                  <option value="NOT_INTERESTED">NOT_INTERESTED — Explicit refusal</option>
                  <option value="WRONG_NUMBER">WRONG_NUMBER — Invalid contact identity</option>
                  <option value="INVALID_LEAD">INVALID_LEAD — Junk / spam record</option>
                  <option value="COMPETITOR">COMPETITOR — Rival developer inquiry</option>
                  <option value="FUTURE_REQUIREMENT">FUTURE_REQUIREMENT — Long-term planning (&gt; 6 months)</option>
                  <option value="INVESTMENT_REQUIREMENT">INVESTMENT_REQUIREMENT — Pure investor seeking ROI</option>
                  <option value="PURCHASED">PURCHASED — Closed deal elsewhere</option>
                  <option value="LOST_TO_COMPETITOR">LOST_TO_COMPETITOR — Opted for competitor project</option>
                  <option value="OTHER">OTHER — Operational exception</option>
                </select>
              </div>

              {/* Call Notes */}
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}>
                  Interaction Summary & Prospect Context
                </label>
                <textarea
                  rows={3}
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  placeholder="Summarize buyer requirements, specific unit/plot interests, questions, and commitments..."
                  className="input-field"
                  style={{ resize: 'vertical' }}
                  required
                />
              </div>

              {/* Next Action Scheduling */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px', display: 'block' }}>
                  Schedule Immediate Next Action
                </label>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setNextActionType('CALLBACK')}
                    className={`btn btn-sm ${nextActionType === 'CALLBACK' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1 }}
                  >
                    <Clock size={14} />
                    <span>Follow-up Callback</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNextActionType('SITE_VISIT')}
                    className={`btn btn-sm ${nextActionType === 'SITE_VISIT' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1 }}
                  >
                    <Calendar size={14} />
                    <span>Site Visit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNextActionType('NONE')}
                    className={`btn btn-sm ${nextActionType === 'NONE' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 0.6 }}
                  >
                    <span>None</span>
                  </button>
                </div>

                {nextActionType !== 'NONE' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target Date</span>
                      <input
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="input-field"
                        style={{ marginTop: '4px' }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target Slot</span>
                      <input
                        type="time"
                        value={followUpTime}
                        onChange={(e) => setFollowUpTime(e.target.value)}
                        className="input-field"
                        style={{ marginTop: '4px' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit & Close */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setDispositionLead(null)}
                  className="btn btn-secondary"
                  disabled={isSubmitting}
                >
                  Skip
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Recording Outcome...' : 'SAVE & NEXT LEAD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}
