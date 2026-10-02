'use client';

import React, { useState } from 'react';
import {
  CalendarCheck,
  Calendar,
  Clock,
  User,
  Building,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Plus,
  Filter,
  Search,
} from 'lucide-react';
import { useCall } from '../../lib/callContext';

interface SiteVisitItem {
  id: string;
  leadId: string;
  leadName: string;
  phone: string;
  project: string;
  salesRep: string;
  date: string;
  timeSlot: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED';
  feedback?: string;
}

export default function SiteVisitsPage() {
  const { startCall } = useCall();
  const [viewMode, setViewMode] = useState<'LIST' | 'CALENDAR'>('LIST');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Form states for new visit
  const [newLeadName, setNewLeadName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newProject, setNewProject] = useState('Park Avenue Towers');
  const [newDate, setNewDate] = useState('2026-10-03');
  const [newTime, setNewTime] = useState('11:00');
  const [newAgent, setNewAgent] = useState('Rajesh Kumar (Sales Exec)');

  const [visits, setVisits] = useState<SiteVisitItem[]>([
    {
      id: 'sv-1',
      leadId: 'ld-101',
      leadName: 'Amit Sharma',
      phone: '+91 98204 45120',
      project: 'Park Avenue Towers',
      salesRep: 'Rajesh Kumar',
      date: '2026-09-29',
      timeSlot: '11:00 AM',
      status: 'CONFIRMED',
    },
    {
      id: 'sv-2',
      leadId: 'ld-104',
      leadName: 'Ananya Deshmukh',
      phone: '+91 94231 11890',
      project: 'Park Avenue Towers',
      salesRep: 'Rajesh Kumar',
      date: '2026-09-29',
      timeSlot: '03:00 PM',
      status: 'SCHEDULED',
    },
    {
      id: 'sv-3',
      leadId: 'ld-102',
      leadName: 'Priya Patel',
      phone: '+91 87541 98321',
      project: 'Green Hills Township',
      salesRep: 'Vikram Malhotra',
      date: '2026-09-30',
      timeSlot: '10:30 AM',
      status: 'SCHEDULED',
    },
    {
      id: 'sv-4',
      leadId: 'ld-107',
      leadName: 'Manish Pandey',
      phone: '+91 98112 33445',
      project: 'Green Hills Township',
      salesRep: 'Vikram Malhotra',
      date: '2026-09-28',
      timeSlot: '02:00 PM',
      status: 'COMPLETED',
      feedback: 'Customer visited Sector B plots. Shortlisted Plot B-04. Ready for Cost Sheet.',
    },
    {
      id: 'sv-5',
      leadId: 'ld-108',
      leadName: 'Kavita Joshi',
      phone: '+91 97223 44556',
      project: 'Park Avenue Towers',
      salesRep: 'Rajesh Kumar',
      date: '2026-09-28',
      timeSlot: '11:30 AM',
      status: 'NO_SHOW',
      feedback: 'Customer unreachable at scheduled visit time.',
    },
  ]);

  const updateVisitStatus = (id: string, newStatus: SiteVisitItem['status'], feedback?: string) => {
    setVisits((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: newStatus, feedback: feedback || v.feedback } : v))
    );
  };

  const handleCreateVisit = (e: React.FormEvent) => {
    e.preventDefault();
    const newVisit: SiteVisitItem = {
      id: `sv-${Date.now()}`,
      leadId: `ld-${Date.now()}`,
      leadName: newLeadName,
      phone: newPhone,
      project: newProject,
      salesRep: newAgent,
      date: newDate,
      timeSlot: newTime,
      status: 'SCHEDULED',
    };
    setVisits([newVisit, ...visits]);
    setIsScheduleModalOpen(false);
    setNewLeadName('');
    setNewPhone('');
  };

  const filteredVisits = visits.filter((v) => {
    if (statusFilter === 'ALL') return true;
    return v.status === statusFilter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div className="h1" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CalendarCheck size={26} color="var(--accent-primary)" />
            Site Visits Management
          </div>
          <p className="subtitle" style={{ marginTop: '4px' }}>
            Schedule appointments, verify attendance, and satisfy stage-gate preconditions for deal negotiation
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setViewMode('LIST')}
              className={`btn btn-sm ${viewMode === 'LIST' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none' }}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('CALENDAR')}
              className={`btn btn-sm ${viewMode === 'CALENDAR' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none' }}
            >
              Weekly Calendar
            </button>
          </div>

          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="btn btn-primary"
            style={{ display: 'flex', gap: '8px' }}
          >
            <Plus size={16} />
            <span>Schedule Site Visit</span>
          </button>
        </div>
      </div>

      {/* Filter Strip */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Status:</span>
        {['ALL', 'SCHEDULED', 'CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Visits List */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: '#f8fafc' }}>
              <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>PROSPECT</th>
              <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>PROJECT</th>
              <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>ASSIGNED EXECUTIVE</th>
              <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>DATE & SLOT</th>
              <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>STATUS</th>
              <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em', textAlign: 'right' }}>QUICK ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredVisits.map((visit) => (
              <tr
                key={visit.id}
                style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s ease' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '16px 18px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{visit.leadName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{visit.phone}</div>
                </td>

                <td style={{ padding: '16px 18px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {visit.project}
                </td>

                <td style={{ padding: '16px 18px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {visit.salesRep}
                </td>

                <td style={{ padding: '16px 18px' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{visit.date}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{visit.timeSlot}</div>
                </td>

                <td style={{ padding: '16px 18px' }}>
                  <span
                    className={`badge ${
                      visit.status === 'COMPLETED'
                        ? 'badge-success'
                        : visit.status === 'CONFIRMED'
                        ? 'badge-purple'
                        : visit.status === 'NO_SHOW'
                        ? 'badge-danger'
                        : visit.status === 'CANCELLED'
                        ? 'badge-muted'
                        : 'badge-info'
                    }`}
                  >
                    {visit.status}
                  </span>
                </td>

                <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '8px' }}>
                    {visit.status !== 'COMPLETED' && visit.status !== 'NO_SHOW' && (
                      <>
                        <button
                          onClick={() => updateVisitStatus(visit.id, 'COMPLETED', 'Attended site visit. Satisfies QUALIFIED -> NEGOTIATION precondition.')}
                          className="btn btn-sm btn-primary"
                          title="Record Completed Outcome"
                        >
                          <CheckCircle2 size={14} />
                          <span>Complete</span>
                        </button>
                        <button
                          onClick={() => updateVisitStatus(visit.id, 'NO_SHOW', 'Customer did not arrive.')}
                          className="btn btn-sm btn-danger"
                          title="Record No-Show"
                        >
                          <XCircle size={14} />
                          <span>No-Show</span>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Schedule Visit Modal */}
      {isScheduleModalOpen && (
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
            style={{ width: '100%', maxWidth: '520px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px', background: '#ffffff', boxShadow: 'var(--shadow-lg)' }}
          >
            <div className="h2" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CalendarCheck size={20} color="var(--accent-primary)" />
              Schedule New Site Visit
            </div>

            <form onSubmit={handleCreateVisit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', display: 'block' }}>
                  Prospect Name
                </label>
                <input
                  type="text"
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  placeholder="e.g. Rahul Patil"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', display: 'block' }}>
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+91 98..."
                  className="input-field"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', display: 'block' }}>
                    Project
                  </label>
                  <select
                    value={newProject}
                    onChange={(e) => setNewProject(e.target.value)}
                    className="input-field"
                  >
                    <option value="Park Avenue Towers">Park Avenue Towers</option>
                    <option value="Green Hills Township">Green Hills Township</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', display: 'block' }}>
                    Assigned Agent
                  </label>
                  <input
                    type="text"
                    value={newAgent}
                    onChange={(e) => setNewAgent(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', display: 'block' }}>
                    Date
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', display: 'block' }}>
                    Time Slot
                  </label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Site Visit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
