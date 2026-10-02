'use client';

import React, { useState } from 'react';
import {
  Clock,
  PhoneCall,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { useCall } from '../../lib/callContext';

interface FollowUpItem {
  id: string;
  leadId: string;
  leadName: string;
  phone: string;
  project: string;
  type: 'CALL' | 'SITE_VISIT' | 'WHATSAPP' | 'DOC_COLLECTION';
  scheduledTime: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  notes: string;
  status: 'OVERDUE' | 'DUE_TODAY' | 'UPCOMING' | 'COMPLETED';
}

export default function FollowUpsPage() {
  const { startCall } = useCall();
  const [activeTab, setActiveTab] = useState<'OVERDUE' | 'DUE_TODAY' | 'UPCOMING' | 'COMPLETED'>('DUE_TODAY');
  const [searchTerm, setSearchTerm] = useState('');

  const [followUps, setFollowUps] = useState<FollowUpItem[]>([
    {
      id: 'fu-1',
      leadId: 'ld-101',
      leadName: 'Amit Sharma',
      phone: '+91 98204 45120',
      project: 'Park Avenue Towers',
      type: 'CALL',
      scheduledTime: 'Today, 11:30 AM',
      priority: 'HIGH',
      notes: 'Follow up on bank loan pre-qualification and layout confirmation.',
      status: 'DUE_TODAY',
    },
    {
      id: 'fu-2',
      leadId: 'ld-102',
      leadName: 'Priya Patel',
      phone: '+91 87541 98321',
      project: 'Green Hills Township',
      type: 'CALL',
      scheduledTime: 'Yesterday, 04:00 PM',
      priority: 'HIGH',
      notes: 'Customer requested pricing on Plot B-03 corner premium.',
      status: 'OVERDUE',
    },
    {
      id: 'fu-3',
      leadId: 'ld-103',
      leadName: 'Vikram Malhotra',
      phone: '+91 99102 67451',
      project: 'Green Hills Township',
      type: 'CALL',
      scheduledTime: 'Today, 12:00 PM',
      priority: 'MEDIUM',
      notes: 'Commercial sector B boulevard frontage query.',
      status: 'DUE_TODAY',
    },
    {
      id: 'fu-4',
      leadId: 'ld-104',
      leadName: 'Ananya Deshmukh',
      phone: '+91 94231 11890',
      project: 'Park Avenue Towers',
      type: 'SITE_VISIT',
      scheduledTime: 'Tomorrow, 11:00 AM',
      priority: 'HIGH',
      notes: 'Confirm site visit with sales executive Rajesh.',
      status: 'UPCOMING',
    },
    {
      id: 'fu-5',
      leadId: 'ld-105',
      leadName: 'Suresh Raina',
      phone: '+91 91300 44211',
      project: 'Green Hills Township',
      type: 'WHATSAPP',
      scheduledTime: 'Tomorrow, 02:00 PM',
      priority: 'LOW',
      notes: 'Send updated master layout brochure after Phase 2 approval.',
      status: 'UPCOMING',
    },
    {
      id: 'fu-6',
      leadId: 'ld-106',
      leadName: 'Karan Mehra',
      phone: '+91 98901 23456',
      project: 'Park Avenue Towers',
      type: 'CALL',
      scheduledTime: 'Today, 09:30 AM',
      priority: 'MEDIUM',
      notes: 'Completed discovery call. Customer scheduling site visit.',
      status: 'COMPLETED',
    },
  ]);

  const filteredItems = followUps.filter((item) => {
    const matchesTab = item.status === activeTab;
    const matchesSearch =
      item.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.notes.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const markCompleted = (id: string) => {
    setFollowUps((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'COMPLETED' } : item))
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div className="h1" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Clock size={26} color="var(--accent-primary)" />
            My Follow-ups Workspace
          </div>
          <p className="subtitle" style={{ marginTop: '4px' }}>
            Authoritative callback engine · Overdue escalation tracking · Instant resolution actions
          </p>
        </div>
      </div>

      {/* Tabs Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('OVERDUE')}
            className={`btn btn-sm ${activeTab === 'OVERDUE' ? 'btn-danger' : 'btn-secondary'}`}
            style={{ display: 'flex', gap: '6px' }}
          >
            <AlertTriangle size={14} />
            <span>Overdue ({followUps.filter((f) => f.status === 'OVERDUE').length})</span>
          </button>
          <button
            onClick={() => setActiveTab('DUE_TODAY')}
            className={`btn btn-sm ${activeTab === 'DUE_TODAY' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', gap: '6px' }}
          >
            <Clock size={14} />
            <span>Due Today ({followUps.filter((f) => f.status === 'DUE_TODAY').length})</span>
          </button>
          <button
            onClick={() => setActiveTab('UPCOMING')}
            className={`btn btn-sm ${activeTab === 'UPCOMING' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', gap: '6px' }}
          >
            <Calendar size={14} />
            <span>Upcoming ({followUps.filter((f) => f.status === 'UPCOMING').length})</span>
          </button>
          <button
            onClick={() => setActiveTab('COMPLETED')}
            className={`btn btn-sm ${activeTab === 'COMPLETED' ? 'btn-secondary' : 'btn-secondary'}`}
            style={{ display: 'flex', gap: '6px' }}
          >
            <CheckCircle2 size={14} />
            <span>Completed ({followUps.filter((f) => f.status === 'COMPLETED').length})</span>
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Search
            size={14}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search follow-ups..."
            className="input-field"
            style={{ paddingLeft: '32px', padding: '6px 12px 6px 32px', fontSize: '0.8125rem' }}
          />
        </div>
      </div>

      {/* Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredItems.length === 0 ? (
          <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
            <CheckCircle2 size={40} color="var(--color-success)" style={{ margin: '0 auto 12px auto' }} />
            <div className="h2">Zero Follow-ups in this queue</div>
            <div className="subtitle" style={{ marginTop: '4px' }}>
              All callbacks and scheduled touchpoints are cleared.
            </div>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="glass-panel"
              style={{
                padding: '18px 22px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
                borderLeft:
                  item.status === 'OVERDUE'
                    ? '4px solid var(--color-danger)'
                    : item.status === 'DUE_TODAY'
                    ? '4px solid var(--color-warning)'
                    : '4px solid var(--accent-primary)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>
                    {item.leadName}
                  </span>
                  <span className="badge badge-muted">{item.project}</span>
                  <span
                    className={`badge ${
                      item.priority === 'HIGH'
                        ? 'badge-danger'
                        : item.priority === 'MEDIUM'
                        ? 'badge-warning'
                        : 'badge-info'
                    }`}
                  >
                    {item.priority} PRIORITY
                  </span>
                </div>

                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {item.notes}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '2px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>Scheduled: <strong style={{ color: 'var(--text-primary)' }}>{item.scheduledTime}</strong></span>
                  <span>Contact: {item.phone}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={() =>
                    startCall({
                      leadId: item.leadId,
                      leadName: item.leadName,
                      phone: item.phone,
                      project: item.project,
                    })
                  }
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', gap: '6px' }}
                >
                  <PhoneCall size={14} />
                  <span>Call Now</span>
                </button>

                {item.status !== 'COMPLETED' && (
                  <button
                    onClick={() => markCompleted(item.id)}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'flex', gap: '6px' }}
                  >
                    <CheckCircle2 size={14} />
                    <span>Complete</span>
                  </button>
                )}

                <a
                  href={`/leads?drawer=${item.leadId}`}
                  className="btn btn-secondary btn-sm"
                  title="Open Lead"
                  style={{ textDecoration: 'none' }}
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
