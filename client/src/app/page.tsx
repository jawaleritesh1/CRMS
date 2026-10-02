'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Building2,
  TrendingUp,
  Clock,
  ShieldCheck,
  ArrowUpRight,
  PhoneCall,
  CalendarCheck,
  CheckCircle2,
  Info,
  Layers,
  Activity,
  PieChart,
  Lock,
  ArrowDownRight,
} from 'lucide-react';
import { useAuth } from '../lib/authContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const [currentDateTime, setCurrentDateTime] = useState('Tue, 29 Apr 2025 | 10:24 AM');

  useEffect(() => {
    try {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      };
      setCurrentDateTime(now.toLocaleString('en-US', options).replace(',', ' |'));
    } catch {
      // Fallback
    }
  }, []);

  // 5 Real KPI Cards matching visual reference
  const metrics = [
    {
      title: 'Active Pipeline Leads',
      value: '284',
      change: '↑ 14%',
      period: 'vs last week',
      isPositive: true,
      icon: Users,
      badgeBg: '#eef2ff',
      badgeColor: '#4f46e5',
      sparklineColor: '#10b981',
      sparklinePoints: '0,28 10,24 20,26 30,18 40,20 50,12 60,16 70,8',
    },
    {
      title: 'Gross Bookings (WON)',
      value: '₹34.8 Cr',
      change: '↑ 22%',
      period: 'vs last week',
      isPositive: true,
      icon: TrendingUp,
      badgeBg: '#eff6ff',
      badgeColor: '#2563eb',
      sparklineColor: '#6366f1',
      sparklinePoints: '0,30 10,26 20,28 30,22 40,16 50,18 60,12 70,6',
    },
    {
      title: 'Net Collections',
      value: '₹8.4 Cr',
      change: '↑ 18%',
      period: 'vs last week',
      isPositive: true,
      icon: CheckCircle2,
      badgeBg: '#ecfdf5',
      badgeColor: '#059669',
      sparklineColor: '#10b981',
      sparklinePoints: '0,26 10,28 20,20 30,22 40,14 50,16 60,10 70,6',
    },
    {
      title: 'Active Holds (15m lock)',
      value: '6 Units',
      change: '↓ 25%',
      period: 'vs last week',
      isPositive: false,
      icon: Lock,
      badgeBg: '#fffbeb',
      badgeColor: '#d97706',
      sparklineColor: '#f59e0b',
      sparklinePoints: '0,10 10,12 20,18 30,14 40,24 50,20 60,26 70,28',
    },
    {
      title: "Today's Calls",
      value: '42',
      change: '↓ 31%',
      period: 'vs yesterday',
      isPositive: true,
      icon: PhoneCall,
      badgeBg: '#f5f3ff',
      badgeColor: '#7c3aed',
      sparklineColor: '#8b5cf6',
      sparklinePoints: '0,24 10,28 20,22 30,18 40,22 50,12 60,14 70,6',
    },
  ];

  // Pipeline 5D Funnel Stages
  const funnelStages = [
    { name: 'New Leads', count: '1,240', pct: '100%', widthPct: 100, color: '#6366f1' },
    { name: 'Contacted', count: '892', pct: '72%', widthPct: 82, color: '#3b82f6' },
    { name: 'Qualified', count: '503', pct: '41%', widthPct: 65, color: '#06b6d4' },
    { name: 'Site Visit', count: '284', pct: '23%', widthPct: 48, color: '#10b981' },
    { name: 'Proposal', count: '142', pct: '11%', widthPct: 34, color: '#14b8a6' },
    { name: 'Won', count: '68', pct: '5%', widthPct: 22, color: '#059669' },
  ];

  // Hourly Call Activity Data
  const callActivity = [
    { time: '9 AM', calls: 11 },
    { time: '10 AM', calls: 16, isPeak: true },
    { time: '11 AM', calls: 14 },
    { time: '12 PM', calls: 11 },
    { time: '1 PM', calls: 5 },
    { time: '2 PM', calls: 7 },
    { time: '3 PM', calls: 8 },
    { time: '4 PM', calls: 6 },
    { time: '5 PM', calls: 4 },
    { time: '6 PM', calls: 8 },
  ];

  // Lead Sources Distribution
  const leadSources = [
    { name: 'Meta Ads', pct: '38%', color: '#6366f1' },
    { name: 'Google Ads', pct: '22%', color: '#3b82f6' },
    { name: 'Website', pct: '18%', color: '#06b6d4' },
    { name: 'Channel Partners', pct: '12%', color: '#f59e0b' },
    { name: 'Walk-ins', pct: '6%', color: '#10b981' },
    { name: 'Other', pct: '4%', color: '#94a3b8' },
  ];

  // Real-Time CRM Activity Stream
  const recentActivities = [
    {
      title: 'Outbound call completed',
      detail: 'Rahul Sharma • 04:32',
      time: '10:18 AM',
      icon: PhoneCall,
      bg: '#ecfdf5',
      color: '#059669',
    },
    {
      title: 'New lead assigned',
      detail: 'Priya Deshmukh • 2 BHK • Baner',
      time: '10:12 AM',
      icon: Users,
      bg: '#eff6ff',
      color: '#2563eb',
    },
    {
      title: 'Site visit scheduled',
      detail: 'Amit Patil • Sun, 4:00 PM',
      time: '09:45 AM',
      icon: CalendarCheck,
      bg: '#fffbeb',
      color: '#d97706',
    },
    {
      title: 'Booking created',
      detail: 'Unit A-1203 • ₹1.28 Cr',
      time: '09:20 AM',
      icon: CheckCircle2,
      bg: '#f5f3ff',
      color: '#7c3aed',
    },
  ];

  // Invariant Guard Checks
  const architectureGuards = [
    { name: 'Multi-Tenant Row Isolation (Class A/G)', status: 'Active' },
    { name: 'SELECT FOR UPDATE Hold Concurrency', status: 'Active' },
    { name: 'Append-Only Compensating Refunds', status: 'Active' },
    { name: '60-Day CP Non-Poaching Window', status: 'Active' },
    { name: 'Outbox Worker SKIP LOCKED Dispatch', status: 'Active' },
    { name: 'Audit Log Integrity', status: 'Active' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* ─── Hero Section with Architectural Crop ─── */}
      <div
        className="glass-panel"
        style={{
          position: 'relative',
          padding: '28px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          overflow: 'hidden',
          background: '#ffffff',
          borderRadius: '16px',
          minHeight: '148px',
        }}
      >
        {/* Left Welcome Copy */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '620px' }}>
          <div
            style={{
              fontSize: '0.6875rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#6366f1',
              marginBottom: '6px',
            }}
          >
            GOOD MORNING
          </div>
          <h1
            style={{
              fontSize: '1.625rem',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.025em',
              lineHeight: 1.2,
              marginBottom: '8px',
            }}
          >
            Welcome back, {user?.fullName || 'Acme Administrator'}
          </h1>
          <p
            style={{
              fontSize: '0.875rem',
              color: '#64748b',
              lineHeight: 1.45,
            }}
          >
            Here’s what’s happening across{' '}
            <strong style={{ color: '#0f172a', fontWeight: 600 }}>
              {user?.organizationName || 'Acme Realty'}
            </strong>{' '}
            today. All critical sales, SLA and operational metrics at a glance.
          </p>
        </div>

        {/* Right Architectural Property Image & Action Buttons */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '16px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div
            style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: '#64748b',
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(8px)',
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
            }}
          >
            {currentDateTime}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Link
              href="/leads"
              className="btn btn-primary"
              style={{
                padding: '9px 18px',
                fontSize: '0.84375rem',
                borderRadius: '8px',
              }}
            >
              <span>View 5D Pipeline</span>
              <ArrowUpRight size={16} />
            </Link>
            <Link
              href="/inventory"
              className="btn btn-secondary"
              style={{
                padding: '9px 16px',
                fontSize: '0.84375rem',
                borderRadius: '8px',
              }}
            >
              <Building2 size={16} color="#64748b" />
              <span>Inventory Matrix</span>
            </Link>
          </div>
        </div>

        {/* Architectural Image Backdrop Crop */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '45%',
            backgroundImage: "url('/images/luxury_architectural_banner.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center 35%',
            opacity: 0.38,
            maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)',
            WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      </div>

      {/* ─── Row of 5 KPI Cards ─── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '16px',
        }}
      >
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.title}
              className="glass-panel"
              style={{
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                background: '#ffffff',
                borderRadius: '12px',
                position: 'relative',
              }}
            >
              {/* Header with Title & Badge Icon */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: m.badgeBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={16} color={m.badgeColor} strokeWidth={2.2} />
                </div>
                <span
                  style={{
                    fontSize: '0.78125rem',
                    fontWeight: 600,
                    color: '#64748b',
                    textAlign: 'right',
                  }}
                >
                  {m.title}
                </span>
              </div>

              {/* Primary Metric Number & Mini Sparkline */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  marginTop: '4px',
                }}
              >
                <div
                  style={{
                    fontSize: '1.625rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                  }}
                >
                  {m.value}
                </div>

                {/* Smooth SVG Sparkline */}
                <svg width="70" height="28" style={{ overflow: 'visible' }}>
                  <polyline
                    fill="none"
                    stroke={m.sparklineColor}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={m.sparklinePoints}
                  />
                </svg>
              </div>

              {/* Trend Comparison */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                <span
                  style={{
                    fontWeight: 700,
                    color: m.isPositive ? '#059669' : '#dc2626',
                  }}
                >
                  {m.change}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>{m.period}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Middle Row: SLA Health & Pipeline Distribution (2 Columns) ─── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.75fr 1fr',
          gap: '18px',
        }}
      >
        {/* First-Response SLA & Pipeline Distribution */}
        <div
          className="glass-panel"
          style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            background: '#ffffff',
            borderRadius: '14px',
          }}
        >
          {/* Card Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="h2" style={{ fontSize: '1.0625rem' }}>
              First-Response SLA & Pipeline Distribution
            </h2>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#ecfdf5',
                color: '#065f46',
                border: '1px solid #a7f3d0',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '0.71875rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669' }} />
              <span>SLA ENGINE NOMINAL</span>
            </div>
          </div>

          {/* 2-Part Grid: SLA Rates on Left, 5D Funnel on Right */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1.25fr',
              gap: '28px',
              alignItems: 'center',
            }}
          >
            {/* SLA Progress Meters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.84375rem', fontWeight: 700, color: '#0f172a' }}>
                  First-Response SLA
                </span>
                <Info size={14} color="#94a3b8" />
              </div>

              {/* Progress 1 */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.8125rem',
                    marginBottom: '8px',
                  }}
                >
                  <span style={{ color: '#475569', fontWeight: 500 }}>
                    Within 120s SLA Compliance Rate
                  </span>
                  <span style={{ fontWeight: 800, color: '#059669', fontSize: '0.9375rem' }}>
                    96.4%
                  </span>
                </div>
                <div
                  style={{
                    height: '8px',
                    background: '#f1f5f9',
                    borderRadius: '9999px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: '96.4%',
                      height: '100%',
                      background: '#10b981',
                      borderRadius: '9999px',
                    }}
                  />
                </div>
              </div>

              {/* Progress 2 */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.8125rem',
                    marginBottom: '8px',
                  }}
                >
                  <span style={{ color: '#475569', fontWeight: 500 }}>
                    Hot Opportunities Conversion Rate
                  </span>
                  <span style={{ fontWeight: 800, color: '#4f46e5', fontSize: '0.9375rem' }}>
                    42.1%
                  </span>
                </div>
                <div
                  style={{
                    height: '8px',
                    background: '#f1f5f9',
                    borderRadius: '9999px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: '42.1%',
                      height: '100%',
                      background: '#6366f1',
                      borderRadius: '9999px',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Pipeline Distribution Funnel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.84375rem', fontWeight: 700, color: '#0f172a' }}>
                  Pipeline Distribution (5D)
                </span>
                <Info size={14} color="#94a3b8" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {funnelStages.map((stage) => (
                  <div
                    key={stage.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.78125rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '60%' }}>
                      <div
                        style={{
                          height: '18px',
                          width: `${stage.widthPct}%`,
                          background: `linear-gradient(90deg, ${stage.color}ee, ${stage.color}cc)`,
                          borderRadius: '4px',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontWeight: 700, color: '#0f172a', minWidth: '40px', textAlign: 'right' }}>
                        {stage.count}
                      </span>
                      <span style={{ color: '#64748b', minWidth: '70px' }}>{stage.name}</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary)', minWidth: '36px', textAlign: 'right' }}>
                        {stage.pct}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Architecture Guards Card */}
        <div
          className="glass-panel"
          style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            background: '#ffffff',
            borderRadius: '14px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="#059669" />
              <h2 className="h2" style={{ fontSize: '1.0625rem' }}>
                Architecture Guards
              </h2>
            </div>
            <span
              style={{
                fontSize: '0.71875rem',
                fontWeight: 700,
                color: '#059669',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                padding: '3px 9px',
                borderRadius: '9999px',
              }}
            >
              All Systems Healthy
            </span>
          </div>

          {/* List of 6 Architecture Invariants */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
            {architectureGuards.map((g) => (
              <div
                key={g.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  background: '#fafbfd',
                  border: '1px solid #f1f5f9',
                  fontSize: '0.8125rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: '#10b981',
                      boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)',
                    }}
                  />
                  <span style={{ color: '#1e293b', fontWeight: 500 }}>{g.name}</span>
                </div>
                <span style={{ fontWeight: 700, color: '#059669', fontSize: '0.78125rem' }}>
                  {g.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Bottom Row: Calls Activity, Lead Sources, Recent Activities (3 Columns) ─── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.25fr 1fr 1.15fr',
          gap: '18px',
        }}
      >
        {/* Today's Call Activity (Hourly Bar Chart) */}
        <div
          className="glass-panel"
          style={{
            padding: '22px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            background: '#ffffff',
            borderRadius: '14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PhoneCall size={18} color="#4f46e5" />
              <h2 className="h2" style={{ fontSize: '1rem' }}>
                Today's Call Activity
              </h2>
            </div>
            <Link
              href="/todays-calls"
              style={{
                fontSize: '0.78125rem',
                color: '#4f46e5',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              View All Calls →
            </Link>
          </div>

          {/* Bar Chart Container */}
          <div style={{ display: 'flex', alignItems: 'flex-end', height: '140px', gap: '14px', paddingTop: '20px' }}>
            {callActivity.map((bar) => {
              const heightPct = (bar.calls / 18) * 100;
              return (
                <div
                  key={bar.time}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    height: '100%',
                    justifyContent: 'flex-end',
                    position: 'relative',
                  }}
                >
                  {/* Tooltip for Peak */}
                  {bar.isPeak && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        background: '#0f172a',
                        color: '#ffffff',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        whiteSpace: 'nowrap',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      {bar.calls} calls
                    </div>
                  )}

                  {/* Vertical Bar */}
                  <div
                    style={{
                      width: '100%',
                      height: `${heightPct}%`,
                      background: bar.isPeak ? '#4f46e5' : '#818cf8',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#4338ca')}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = bar.isPeak ? '#4f46e5' : '#818cf8')
                    }
                  />

                  {/* Hour Label */}
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {bar.time}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead Sources Donut Chart */}
        <div
          className="glass-panel"
          style={{
            padding: '22px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            background: '#ffffff',
            borderRadius: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieChart size={18} color="#4f46e5" />
            <h2 className="h2" style={{ fontSize: '1rem' }}>
              Lead Sources (This Week)
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            {/* Donut SVG with Centered Text */}
            <div style={{ position: 'relative', width: '110px', height: '110px', flexShrink: 0 }}>
              <svg width="110" height="110" viewBox="0 0 42 42">
                <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f1f5f9" strokeWidth="6" />
                <circle
                  cx="21"
                  cy="21"
                  r="15.91549430918954"
                  fill="transparent"
                  stroke="#6366f1"
                  strokeWidth="6"
                  strokeDasharray="38 62"
                  strokeDashoffset="25"
                />
                <circle
                  cx="21"
                  cy="21"
                  r="15.91549430918954"
                  fill="transparent"
                  stroke="#3b82f6"
                  strokeWidth="6"
                  strokeDasharray="22 78"
                  strokeDashoffset="87"
                />
                <circle
                  cx="21"
                  cy="21"
                  r="15.91549430918954"
                  fill="transparent"
                  stroke="#06b6d4"
                  strokeWidth="6"
                  strokeDasharray="18 82"
                  strokeDashoffset="65"
                />
                <circle
                  cx="21"
                  cy="21"
                  r="15.91549430918954"
                  fill="transparent"
                  stroke="#f59e0b"
                  strokeWidth="6"
                  strokeDasharray="12 88"
                  strokeDashoffset="47"
                />
                <circle
                  cx="21"
                  cy="21"
                  r="15.91549430918954"
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth="6"
                  strokeDasharray="6 94"
                  strokeDashoffset="35"
                />
                <circle
                  cx="21"
                  cy="21"
                  r="15.91549430918954"
                  fill="transparent"
                  stroke="#94a3b8"
                  strokeWidth="6"
                  strokeDasharray="4 96"
                  strokeDashoffset="29"
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1.1,
                }}
              >
                <span style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#0f172a' }}>284</span>
                <span style={{ fontSize: '0.625rem', color: '#64748b', fontWeight: 500 }}>Leads</span>
              </div>
            </div>

            {/* Legend Column */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px', width: '100%' }}>
              {leadSources.map((s) => (
                <div
                  key={s.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: s.color }} />
                    <span style={{ color: '#475569' }}>{s.name}</span>
                  </div>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{s.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div
          className="glass-panel"
          style={{
            padding: '22px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            background: '#ffffff',
            borderRadius: '14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="#4f46e5" />
              <h2 className="h2" style={{ fontSize: '1rem' }}>
                Recent Activities
              </h2>
            </div>
            <Link
              href="/admin/audit"
              style={{
                fontSize: '0.78125rem',
                color: '#4f46e5',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              View All →
            </Link>
          </div>

          {/* Activity Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
            {recentActivities.map((act, i) => {
              const Icon = act.icon;
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: act.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={15} color={act.color} strokeWidth={2.2} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a' }}>
                        {act.title}
                      </span>
                      <span style={{ fontSize: '0.71875rem', color: '#64748b' }}>
                        {act.detail}
                      </span>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      color: 'var(--text-secondary)',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {act.time}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
