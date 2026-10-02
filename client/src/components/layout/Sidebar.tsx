'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  PhoneCall,
  CalendarCheck,
  Users,
  Clock,
  Building2,
  Map,
  FileSpreadsheet,
  CheckCircle2,
  CreditCard,
  AlertTriangle,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Share2,
} from 'lucide-react';
import { useAuth } from '../../lib/authContext';

export function Sidebar() {
  let pathname = '/';
  try {
    pathname = usePathname() || '/';
  } catch {
    pathname = '/';
  }
  const { user, logout } = useAuth();

  // Collapsed state (defaults to true for ultra-compact 68px rail)
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ralix_sidebar_collapsed');
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      }
    } catch {}
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('ralix_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const navGroups = [
    {
      group: 'OVERVIEW',
      items: [
        { label: 'Executive Dashboard', href: '/', icon: LayoutDashboard },
        { label: 'Telecaller "My Day"', href: '/my-day', icon: PhoneCall },
      ],
    },
    {
      group: 'SALES & EXECUTION',
      items: [
        { label: "Today's Calls", href: '/todays-calls', icon: PhoneCall },
        { label: '5D Leads Pipeline', href: '/leads', icon: Users },
        { label: 'My Follow-ups', href: '/follow-ups', icon: Clock },
        { label: 'Site Visits', href: '/site-visits', icon: CalendarCheck },
      ],
    },
    {
      group: 'INVENTORY & ASSETS',
      items: [
        { label: 'Constructed Units', href: '/inventory', icon: Building2 },
        { label: 'Plotted Layouts', href: '/inventory/plots', icon: Map },
      ],
    },
    {
      group: 'COMMERCIAL & FINANCE',
      items: [
        { label: 'Cost Sheets', href: '/cost-sheets', icon: FileSpreadsheet },
        { label: 'Bookings', href: '/bookings', icon: CheckCircle2 },
        { label: 'Payments & Ledger', href: '/payments', icon: CreditCard },
      ],
    },
    {
      group: 'GOVERNANCE & AUDIT',
      items: [
        { label: 'Meta Lead Ads', href: '/integrations/meta', icon: Share2 },
        { label: 'Attention Center', href: '/admin/attention', icon: AlertTriangle },
        { label: 'Reports & Analytics', href: '/reports', icon: BarChart3 },
      ],
    },
  ];

  const sidebarWidth = isCollapsed ? '68px' : '210px';

  return (
    <aside
      style={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        background: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '1px 0 3px 0 rgba(0, 0, 0, 0.02)',
        transition: 'width 0.2s cubic-bezier(0.16, 1, 0.3, 1), min-width 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
      }}
    >
      {/* ─── Brand Header + Collapse Toggle ─── */}
      <div
        style={{
          height: 'var(--header-height)',
          padding: isCollapsed ? '0 14px' : '0 12px 0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          borderBottom: '1px solid #eef2f6',
          flexShrink: 0,
        }}
      >
        {isCollapsed ? (
          <div
            onClick={toggleCollapse}
            title="Click to expand sidebar"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'transform 0.15s ease',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <img
              src="/images/Logos/logo-mark.png"
              alt="Ralyxx Logo"
              style={{
                width: '30px',
                height: '30px',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </div>
        ) : (
          <>
            <Link
              href="/"
              title="Ralix / Ralyxx CRM"
              style={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                flex: 1,
                minWidth: 0,
                height: '100%',
              }}
            >
              <img
                src="/images/Logos/logomain.png"
                alt="Ralyxx CRM"
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '44px',
                  objectFit: 'contain',
                  objectPosition: 'left center',
                  display: 'block',
                }}
              />
            </Link>

            <button
              onClick={toggleCollapse}
              title="Collapse sidebar to 68px rail"
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                background: '#ffffff',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.color = '#0f172a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.color = '#64748b';
              }}
            >
              <ChevronLeft size={15} />
            </button>
          </>
        )}
      </div>

      {/* ─── Navigation Sections ─── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: isCollapsed ? '12px 0' : '12px 8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isCollapsed ? 'center' : 'stretch',
          gap: isCollapsed ? '6px' : '14px',
        }}
      >
        {navGroups.map((section, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: isCollapsed ? 'center' : 'stretch',
              gap: '2px',
              width: isCollapsed ? '100%' : 'auto',
            }}
          >
            {/* Section Divider / Label */}
            {isCollapsed ? (
              idx > 0 && (
                <div
                  style={{
                    width: '32px',
                    height: '1px',
                    background: '#eef2f6',
                    margin: '4px 0',
                  }}
                />
              )
            ) : (
              section.group && (
                <span
                  style={{
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    color: '#64748b',
                    letterSpacing: '0.05em',
                    padding: '3px 6px',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {section.group}
                </span>
              )
            )}

            {section.items.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  title={item.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    gap: isCollapsed ? '0' : '9px',
                    width: isCollapsed ? '42px' : '100%',
                    height: isCollapsed ? '40px' : 'auto',
                    padding: isCollapsed ? '0' : '7px 9px',
                    borderRadius: '8px',
                    fontSize: '0.78125rem',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#4f46e5' : '#475569',
                    background: isActive ? '#eef2ff' : 'transparent',
                    textDecoration: 'none',
                    transition: 'all 0.12s ease',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = '#f8fafc';
                      e.currentTarget.style.color = '#0f172a';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#475569';
                    }
                  }}
                >
                  <Icon
                    size={17}
                    color={isActive ? '#4f46e5' : '#64748b'}
                    strokeWidth={isActive ? 2.2 : 1.8}
                    style={{ flexShrink: 0 }}
                  />

                  {!isCollapsed && (
                    <span
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* ─── Footer Controls ─── */}
      <div
        style={{
          padding: isCollapsed ? '12px 0' : '12px 10px',
          borderTop: '1px solid #eef2f6',
          display: 'flex',
          flexDirection: isCollapsed ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          gap: isCollapsed ? '8px' : '0',
          flexShrink: 0,
        }}
      >
        {isCollapsed ? (
          <>
            <button
              onClick={toggleCollapse}
              title="Expand sidebar"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                background: '#ffffff',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.color = '#0f172a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.color = '#64748b';
              }}
            >
              <ChevronRight size={16} />
            </button>

            <button
              onClick={logout}
              title="Sign out of session"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '6px',
                border: 'none',
                background: 'transparent',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
            >
              <LogOut size={16} />
            </button>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
              <span style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 500, whiteSpace: 'nowrap' }}>
                v5.1 Enterprise
              </span>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.15s ease',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
            >
              <LogOut size={15} />
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
