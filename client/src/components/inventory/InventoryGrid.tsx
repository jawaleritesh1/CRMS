'use client';

import React, { useState } from 'react';
import { Lock, Unlock, Clock, AlertTriangle, Building2, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api';

export interface PropertyUnitItem {
  id: string;
  unitNumber: string;
  floorNumber: number;
  configuration: string; // 2BHK, 3BHK, etc.
  carpetAreaSqFt: number;
  basePrice: string;
  availability: 'AVAILABLE' | 'ON_HOLD' | 'BOOKED' | 'BLOCKED' | 'SOLD';
  towerName?: string;
  activeHold?: {
    id: string;
    expiresAt: string;
    leadId: string;
    heldBy?: {
      user: {
        fullName: string;
      };
    };
  } | null;
}

interface InventoryGridProps {
  units: PropertyUnitItem[];
  onRefresh: () => void;
}

export function InventoryGrid({ units, onRefresh }: InventoryGridProps) {
  const [selectedUnit, setSelectedUnit] = useState<PropertyUnitItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [leadIdInput, setLeadIdInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Group units by floor number descending
  const floors = Array.from(new Set(units.map((u) => u.floorNumber))).sort((a, b) => b - a);

  const getStatusBadge = (unit: PropertyUnitItem) => {
    switch (unit.availability) {
      case 'AVAILABLE':
        return <span className="badge badge-success">Available</span>;
      case 'ON_HOLD':
        return <span className="badge badge-warning">On Hold</span>;
      case 'BOOKED':
        return <span className="badge badge-purple">Booked</span>;
      case 'SOLD':
        return <span className="badge badge-info">Sold</span>;
      default:
        return <span className="badge badge-muted">Blocked</span>;
    }
  };

  const handleCreateHold = async (unitId: string) => {
    try {
      setActionLoading(true);
      setError(null);
      await api.request('/api/v1/inventory/hold', {
        method: 'POST',
        body: JSON.stringify({
          unitId,
          leadId: leadIdInput || 'sample-lead-id',
          notes: 'Agent hold requested from inventory matrix',
        }),
      });
      setSelectedUnit(null);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Hold creation failed (Unit may have been claimed concurrently)');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReleaseHold = async (holdId: string) => {
    try {
      setActionLoading(true);
      setError(null);
      await api.request(`/api/v1/inventory/hold/${holdId}/release`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Manual agent release' }),
      });
      setSelectedUnit(null);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Hold release failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Grid Controls & Legend */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Building2 size={20} color="var(--accent-primary)" />
          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
            Tower A — Floor Plan Matrix (§13 & §14)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8125rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--color-success)' }} />
            <span>Available</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--color-warning)' }} />
            <span>On Hold (15m Lock)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--color-purple)' }} />
            <span>Booked</span>
          </div>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--color-danger-bg)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-danger)',
            fontSize: '0.8125rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Architectural Floor Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {floors.map((floor) => {
          const floorUnits = units.filter((u) => u.floorNumber === floor);

          return (
            <div
              key={floor}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                background: 'var(--bg-secondary)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {/* Floor Label */}
              <div
                style={{
                  width: '90px',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  color: 'var(--text-secondary)',
                }}
              >
                Floor {floor}
              </div>

              {/* Units Row */}
              <div style={{ display: 'flex', gap: '12px', flex: 1, flexWrap: 'wrap' }}>
                {floorUnits.map((unit) => {
                  const isAvailable = unit.availability === 'AVAILABLE';
                  const isOnHold = unit.availability === 'ON_HOLD';

                  return (
                    <div
                      key={unit.id}
                      onClick={() => setSelectedUnit(unit)}
                      style={{
                        padding: '12px 16px',
                        background: 'var(--bg-card)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        minWidth: '150px',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-focus)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                          Unit {unit.unitNumber}
                        </span>
                        {getStatusBadge(unit)}
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {unit.configuration} • {unit.carpetAreaSqFt} sq.ft
                      </div>

                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        ₹{Number(unit.basePrice).toLocaleString('en-IN')}
                      </div>

                      {isOnHold && unit.activeHold && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.7rem',
                            color: 'var(--color-warning)',
                            fontWeight: 600,
                            marginTop: '2px',
                          }}
                        >
                          <Clock size={12} />
                          <span>Hold Active (15m lock)</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Unit Action Drawer / Modal */}
      {selectedUnit && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setSelectedUnit(null)}
        >
          <div
            style={{
              width: '480px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              padding: '24px',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="h2">Unit {selectedUnit.unitNumber} Actions</span>
              <button
                onClick={() => setSelectedUnit(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Configuration: {selectedUnit.configuration} | Carpet Area: {selectedUnit.carpetAreaSqFt} sq.ft
              <br />
              Status: <strong>{selectedUnit.availability}</strong>
            </div>

            {selectedUnit.availability === 'AVAILABLE' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Enter Lead ID to bind 15-minute Hold Lock:
                </label>
                <input
                  type="text"
                  placeholder="e.g. lead_123"
                  value={leadIdInput}
                  onChange={(e) => setLeadIdInput(e.target.value)}
                  className="input-field"
                />
                <button
                  onClick={() => handleCreateHold(selectedUnit.id)}
                  disabled={actionLoading}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '6px' }}
                >
                  <Lock size={16} />
                  <span>Lock Unit on Hold (15 Min Exclusive)</span>
                </button>
              </div>
            )}

            {selectedUnit.availability === 'ON_HOLD' && selectedUnit.activeHold && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ padding: '12px', background: 'var(--color-warning-bg)', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', color: 'var(--color-warning)' }}>
                  This unit is locked under hold {selectedUnit.activeHold.id}.
                </div>
                <button
                  onClick={() => handleReleaseHold(selectedUnit.activeHold!.id)}
                  disabled={actionLoading}
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                >
                  <Unlock size={16} />
                  <span>Release Hold Manually</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
