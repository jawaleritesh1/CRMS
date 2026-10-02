'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Settings,
  Building,
  ShieldCheck,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Zap,
  CheckCircle2,
  Sliders,
  ExternalLink,
  X,
} from 'lucide-react';
import { useAuth } from '../../lib/authContext';
import { useCall } from '../../lib/callContext';
import Link from 'next/link';

export function Header() {
  const { user, logout } = useAuth();
  const { triggerSimulatedLead } = useCall();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [simulationTriggered, setSimulationTriggered] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const settingsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const userInitials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'AA';

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsSettingsOpen(false);
        setIsProfileOpen(false);
      }
      // ⌘ K or Ctrl K to focus search
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSimulateLead = () => {
    triggerSimulatedLead();
    setSimulationTriggered(true);
    setTimeout(() => setSimulationTriggered(false), 2500);
  };

  return (
    <header
      style={{
        height: 'var(--header-height)',
        background: '#ffffff',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
      }}
    >
      {/* ─── Search Input ─── */}
      <div style={{ display: 'flex', alignItems: 'center', width: '380px', position: 'relative' }}>
        <Search
          size={16}
          color="#64748b"
          style={{ position: 'absolute', left: '14px', pointerEvents: 'none' }}
        />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search leads, units, customers, bookings..."
          className="input-field"
          style={{
            paddingLeft: '40px',
            paddingRight: searchQuery ? '36px' : '14px',
            height: '38px',
            fontSize: '0.84375rem',
            background: '#f8fafc',
            borderColor: '#e2e8f0',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
          }}
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              searchInputRef.current?.focus();
            }}
            title="Clear search"
            style={{
              position: 'absolute',
              right: '10px',
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px',
              borderRadius: '50%',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#475569')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* ─── Right Controls: Unified Settings Menu & Profile ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Settings & System Hub Menu */}
        <div ref={settingsRef} style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setIsSettingsOpen((prev) => !prev);
              setIsProfileOpen(false);
            }}
            aria-label="Settings and System Controls"
            title="Workspace Settings & System Health"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              border: isSettingsOpen ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
              background: isSettingsOpen ? 'var(--accent-primary-light)' : '#ffffff',
              color: isSettingsOpen ? 'var(--accent-primary)' : '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              position: 'relative',
              boxShadow: 'var(--shadow-xs)',
            }}
            onMouseEnter={(e) => {
              if (!isSettingsOpen) {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.color = '#0f172a';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSettingsOpen) {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.color = '#475569';
              }
            }}
          >
            <Settings size={18} />
            {/* Live Status indicator on gear icon */}
            <span
              style={{
                position: 'absolute',
                top: '7px',
                right: '7px',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#059669',
                border: '1.5px solid #ffffff',
              }}
            />
          </button>

          {/* Unified Settings Dropdown Panel */}
          {isSettingsOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '340px',
                background: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 12px 28px -4px rgba(15, 23, 42, 0.12), 0 4px 10px -2px rgba(15, 23, 42, 0.05)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                zIndex: 100,
                animation: 'fadeIn 0.15s ease-out',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sliders size={16} color="var(--accent-primary)" />
                  <span style={{ fontSize: '0.84375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Workspace &amp; System Controls
                  </span>
                </div>
                <span className="badge badge-purple" style={{ fontSize: '0.65625rem' }}>
                  v5.1 ENTERPRISE
                </span>
              </div>

              {/* 1. Tenant / Organization Context */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: 'var(--radius-sm)',
                    background: '#eef2ff',
                    border: '1px solid #c7d2fe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Building size={18} color="#4f46e5" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.84375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {user?.organizationName || 'Acme Realty'}
                    </span>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#059669', background: '#ecfdf5', padding: '1px 6px', borderRadius: '4px' }}>
                      Primary
                    </span>
                  </div>
                  <span style={{ fontSize: '0.71875rem', color: 'var(--text-secondary)' }}>
                    Pune Regional Territory · Multi-Tenant
                  </span>
                </div>
              </div>

              {/* 2. SLA Monitor Health */}
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-sm)',
                    background: '#dcfce7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <ShieldCheck size={18} color="#15803d" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#16a34a' }} />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#166534' }}>
                      SLA Engine: Operational
                    </span>
                  </div>
                  <span style={{ fontSize: '0.71875rem', color: '#15803d', marginTop: '2px' }}>
                    5-minute first-touch timer &amp; escalation active
                  </span>
                </div>
              </div>

              {/* 3. Developer / Simulation Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Live Diagnostics &amp; Ingestion Testing
                </span>
                <button
                  onClick={handleSimulateLead}
                  className="btn btn-secondary btn-sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    width: '100%',
                    background: simulationTriggered ? '#ecfdf5' : '#ffffff',
                    borderColor: simulationTriggered ? '#a7f3d0' : 'var(--border-subtle)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap size={15} color={simulationTriggered ? '#059669' : '#d97706'} />
                    <span style={{ fontSize: '0.78125rem', fontWeight: 600, color: simulationTriggered ? '#065f46' : 'var(--text-primary)' }}>
                      {simulationTriggered ? 'Broadcasting to Queue...' : 'Simulate Inbound Lead'}
                    </span>
                  </div>
                  {simulationTriggered ? (
                    <CheckCircle2 size={14} color="#059669" />
                  ) : (
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Chime &amp; Alert</span>
                  )}
                </button>
              </div>

              {/* 4. Quick Nav Links */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                <Link
                  href="/integrations/meta"
                  onClick={() => setIsSettingsOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78125rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    transition: 'background 0.12s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.color = '#0f172a';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1877f2' }} />
                    <span>Meta Lead Ads Integration</span>
                  </span>
                  <ExternalLink size={13} color="#94a3b8" />
                </Link>

                <Link
                  href="/admin/attention"
                  onClick={() => setIsSettingsOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78125rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    transition: 'background 0.12s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.color = '#0f172a';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  <span>Attention Center &amp; Escalations</span>
                  <ExternalLink size={13} color="#94a3b8" />
                </Link>

                <Link
                  href="/reports"
                  onClick={() => setIsSettingsOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78125rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    transition: 'background 0.12s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.color = '#0f172a';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  <span>System Audit Logs &amp; Reports</span>
                  <ExternalLink size={13} color="#94a3b8" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ─── Compact User Profile Menu ─── */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setIsProfileOpen((prev) => !prev);
              setIsSettingsOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              padding: '4px 8px 4px 4px',
              background: isProfileOpen ? '#f8fafc' : 'transparent',
              border: isProfileOpen ? '1px solid var(--border-subtle)' : '1px solid transparent',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
              transition: 'all 0.12s ease',
            }}
            onMouseEnter={(e) => {
              if (!isProfileOpen) {
                e.currentTarget.style.background = '#f8fafc';
              }
            }}
            onMouseLeave={(e) => {
              if (!isProfileOpen) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#047857',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.78125rem',
                fontWeight: 700,
                letterSpacing: '0.02em',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              }}
            >
              {userInitials}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.2 }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {user?.fullName || 'Acme Admin'}
              </span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                {user?.roles?.[0] || 'Administrator'}
              </span>
            </div>
            <ChevronDown size={14} color="#64748b" style={{ marginLeft: '2px' }} />
          </button>

          {/* User Profile Dropdown */}
          {isProfileOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '260px',
                background: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 12px 28px -4px rgba(15, 23, 42, 0.12), 0 4px 10px -2px rgba(15, 23, 42, 0.05)',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                zIndex: 100,
                animation: 'fadeIn 0.15s ease-out',
              }}
            >
              <div style={{ padding: '6px 8px 10px 8px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {user?.fullName || 'Acme Administrator'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {user?.email || 'admin@acme.com'}
                </div>
                <div style={{ marginTop: '8px' }}>
                  <span className="badge badge-success" style={{ fontSize: '0.65625rem' }}>
                    {user?.roles?.[0] || 'ADMINISTRATOR'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingTop: '4px' }}>
                <button
                  onClick={async () => {
                    setIsProfileOpen(false);
                    await logout();
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    justifyContent: 'flex-start',
                    color: 'var(--color-danger)',
                    borderColor: 'transparent',
                    padding: '8px 10px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <LogOut size={14} color="var(--color-danger)" />
                  <span>Sign out of Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
