'use client';

import React, { useState } from 'react';
import {
  Map,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Building,
  ShieldAlert,
  ShieldCheck,
  FileText,
  Clock,
  Layers,
  CheckCircle,
  X,
  AlertTriangle,
  Lock,
  Compass,
} from 'lucide-react';

interface PlotData {
  id: string;
  plotNumber: string;
  phase: string;
  sector: string;
  block: string;
  areaSqFt: number;
  facing: 'North' | 'South' | 'East' | 'West' | 'North-East';
  isCorner: boolean;
  roadWidthFt: number;
  baseRateSqFt: number;
  cornerPremium: number;
  infraCharges: number;
  devCharges: number;
  // 4 Dimensions
  commercialAvailability: 'AVAILABLE' | 'ON_HOLD' | 'BOOKING_IN_PROGRESS' | 'BOOKED' | 'SOLD' | 'BLOCKED';
  regulatoryStatus: 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'MARKETABLE' | 'BOOKABLE' | 'REGISTRATION_ELIGIBLE' | 'SUSPENDED';
  registrationStatus: 'AGREEMENT_PENDING' | 'AGREEMENT_EXECUTED' | 'REGISTRATION_PENDING' | 'REGISTERED' | 'POSSESSION_HANDOVER';
  classification: 'SALEABLE_PLOT' | 'ROAD_NETWORK' | 'PARK_OPEN_SPACE' | 'CIVIC_AMENITY' | 'COMMERCIAL_PARCEL';
  // Hold info
  heldBy?: string;
  holdExpiresAt?: string;
  // Coordinates for SVG polygon (x, y, w, h)
  x: number;
  y: number;
  w: number;
  h: number;
}

export default function PlottedInventoryPage() {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedPlot, setSelectedPlot] = useState<PlotData | null>(null);
  const [facingFilter, setFacingFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Holding async state
  const [isHolding, setIsHolding] = useState(false);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);

  const [plots, setPlots] = useState<PlotData[]>([
    {
      id: 'plt-1',
      plotNumber: 'B-01',
      phase: 'Phase 1',
      sector: 'Sector B',
      block: 'Block 1',
      areaSqFt: 1800,
      facing: 'East',
      isCorner: true,
      roadWidthFt: 40,
      baseRateSqFt: 2800,
      cornerPremium: 150000,
      infraCharges: 100000,
      devCharges: 75000,
      commercialAvailability: 'AVAILABLE',
      regulatoryStatus: 'BOOKABLE',
      registrationStatus: 'AGREEMENT_PENDING',
      classification: 'SALEABLE_PLOT',
      x: 60,
      y: 60,
      w: 90,
      h: 110,
    },
    {
      id: 'plt-2',
      plotNumber: 'B-02',
      phase: 'Phase 1',
      sector: 'Sector B',
      block: 'Block 1',
      areaSqFt: 1500,
      facing: 'North',
      isCorner: false,
      roadWidthFt: 30,
      baseRateSqFt: 2800,
      cornerPremium: 0,
      infraCharges: 80000,
      devCharges: 60000,
      commercialAvailability: 'ON_HOLD',
      regulatoryStatus: 'BOOKABLE',
      registrationStatus: 'AGREEMENT_PENDING',
      classification: 'SALEABLE_PLOT',
      heldBy: 'Vikram (West Zone)',
      holdExpiresAt: '43m 12s',
      x: 170,
      y: 60,
      w: 90,
      h: 110,
    },
    {
      id: 'plt-3',
      plotNumber: 'B-03',
      phase: 'Phase 1',
      sector: 'Sector B',
      block: 'Block 1',
      areaSqFt: 2400,
      facing: 'North-East',
      isCorner: true,
      roadWidthFt: 60,
      baseRateSqFt: 3100,
      cornerPremium: 250000,
      infraCharges: 120000,
      devCharges: 90000,
      commercialAvailability: 'AVAILABLE',
      regulatoryStatus: 'BOOKABLE',
      registrationStatus: 'AGREEMENT_PENDING',
      classification: 'SALEABLE_PLOT',
      x: 280,
      y: 60,
      w: 110,
      h: 110,
    },
    {
      id: 'plt-4',
      plotNumber: 'B-04',
      phase: 'Phase 1',
      sector: 'Sector B',
      block: 'Block 1',
      areaSqFt: 1500,
      facing: 'East',
      isCorner: false,
      roadWidthFt: 30,
      baseRateSqFt: 2800,
      cornerPremium: 0,
      infraCharges: 80000,
      devCharges: 60000,
      commercialAvailability: 'BLOCKED',
      regulatoryStatus: 'UNDER_REVIEW',
      registrationStatus: 'AGREEMENT_PENDING',
      classification: 'SALEABLE_PLOT',
      x: 410,
      y: 60,
      w: 90,
      h: 110,
    },
    {
      id: 'plt-5',
      plotNumber: 'B-05',
      phase: 'Phase 1',
      sector: 'Sector B',
      block: 'Block 1',
      areaSqFt: 1500,
      facing: 'North',
      isCorner: false,
      roadWidthFt: 30,
      baseRateSqFt: 2800,
      cornerPremium: 0,
      infraCharges: 80000,
      devCharges: 60000,
      commercialAvailability: 'SOLD',
      regulatoryStatus: 'REGISTRATION_ELIGIBLE',
      registrationStatus: 'REGISTERED',
      classification: 'SALEABLE_PLOT',
      x: 520,
      y: 60,
      w: 90,
      h: 110,
    },
    // Row 2
    {
      id: 'plt-6',
      plotNumber: 'B-06',
      phase: 'Phase 1',
      sector: 'Sector B',
      block: 'Block 2',
      areaSqFt: 1800,
      facing: 'South',
      isCorner: true,
      roadWidthFt: 40,
      baseRateSqFt: 2800,
      cornerPremium: 150000,
      infraCharges: 100000,
      devCharges: 75000,
      commercialAvailability: 'AVAILABLE',
      regulatoryStatus: 'BOOKABLE',
      registrationStatus: 'AGREEMENT_PENDING',
      classification: 'SALEABLE_PLOT',
      x: 60,
      y: 250,
      w: 90,
      h: 110,
    },
    {
      id: 'plt-7',
      plotNumber: 'B-07',
      phase: 'Phase 1',
      sector: 'Sector B',
      block: 'Block 2',
      areaSqFt: 1500,
      facing: 'South',
      isCorner: false,
      roadWidthFt: 30,
      baseRateSqFt: 2800,
      cornerPremium: 0,
      infraCharges: 80000,
      devCharges: 60000,
      commercialAvailability: 'BOOKING_IN_PROGRESS',
      regulatoryStatus: 'BOOKABLE',
      registrationStatus: 'AGREEMENT_EXECUTED',
      classification: 'SALEABLE_PLOT',
      x: 170,
      y: 250,
      w: 90,
      h: 110,
    },
    {
      id: 'plt-8',
      plotNumber: 'B-08',
      phase: 'Phase 1',
      sector: 'Sector B',
      block: 'Block 2',
      areaSqFt: 1500,
      facing: 'South',
      isCorner: false,
      roadWidthFt: 30,
      baseRateSqFt: 2800,
      cornerPremium: 0,
      infraCharges: 80000,
      devCharges: 60000,
      commercialAvailability: 'AVAILABLE',
      regulatoryStatus: 'BOOKABLE',
      registrationStatus: 'AGREEMENT_PENDING',
      classification: 'SALEABLE_PLOT',
      x: 280,
      y: 250,
      w: 90,
      h: 110,
    },
  ]);

  const handlePlaceHold = async (plot: PlotData) => {
    setIsHolding(true);
    try {
      // Simulate backend concurrency check
      await new Promise((r) => setTimeout(r, 700));

      const updatedPlot: PlotData = {
        ...plot,
        commercialAvailability: 'ON_HOLD',
        heldBy: 'Current User (Sales Exec)',
        holdExpiresAt: '59m 59s',
      };

      setPlots((prev) => prev.map((p) => (p.id === plot.id ? updatedPlot : p)));
      setSelectedPlot(updatedPlot);
    } catch (err) {
      setConflictModalOpen(true);
    } finally {
      setIsHolding(false);
    }
  };

  const handleReleaseHold = (plotId: string) => {
    const updated = plots.map((p) => {
      if (p.id === plotId) {
        return {
          ...p,
          commercialAvailability: 'AVAILABLE' as const,
          heldBy: undefined,
          holdExpiresAt: undefined,
        };
      }
      return p;
    });
    setPlots(updated);
    if (selectedPlot?.id === plotId) {
      setSelectedPlot(updated.find((p) => p.id === plotId) || null);
    }
  };

  const getPlotFill = (plot: PlotData) => {
    switch (plot.commercialAvailability) {
      case 'AVAILABLE':
        return '#064e3b'; // subtle dark emerald
      case 'ON_HOLD':
        return '#78350f'; // subtle amber/brown
      case 'BOOKING_IN_PROGRESS':
        return '#1e3a8a'; // subtle indigo
      case 'SOLD':
        return '#1e293b'; // slate dark
      case 'BLOCKED':
        return '#7f1d1d'; // deep dark red
      default:
        return '#0f172a';
    }
  };

  const getPlotStroke = (plot: PlotData) => {
    switch (plot.commercialAvailability) {
      case 'AVAILABLE':
        return '#10b981';
      case 'ON_HOLD':
        return '#f59e0b';
      case 'BOOKING_IN_PROGRESS':
        return '#6366f1';
      case 'SOLD':
        return '#475467';
      case 'BLOCKED':
        return '#ef4444';
      default:
        return '#334155';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div className="h1" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Map size={26} color="var(--accent-primary)" />
            Plotted Layout Map & Land Inventory
          </div>
          <p className="subtitle" style={{ marginTop: '4px' }}>
            Green Hills Township · Phase 1, Sector B · Multi-dimensional land parcel architecture
          </p>
        </div>

        {/* Zoom & Reset Toolbar */}
        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-card)', padding: '6px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 1.8))}
            className="btn btn-secondary btn-sm"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.8))}
            className="btn btn-secondary btn-sm"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="btn btn-secondary btn-sm"
            title="Reset Zoom"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* 4 Dimension Legend Strip */}
      <div
        className="glass-panel"
        style={{
          padding: '12px 18px',
          display: 'flex',
          gap: '24px',
          alignItems: 'center',
          flexWrap: 'wrap',
          fontSize: '0.8125rem',
        }}
      >
        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Commercial Availability:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 12, height: 12, borderRadius: 2, background: '#10b981', display: 'inline-block' }} />
          <span>Available (AV)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 12, height: 12, borderRadius: 2, background: '#f59e0b', display: 'inline-block' }} />
          <span>On Hold (HLD)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 12, height: 12, borderRadius: 2, background: '#6366f1', display: 'inline-block' }} />
          <span>Booking Active (BKG)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 12, height: 12, borderRadius: 2, background: '#475467', display: 'inline-block' }} />
          <span>Sold (SLD)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 12, height: 12, borderRadius: 2, background: '#ef4444', display: 'inline-block' }} />
          <span>Blocked (BLK)</span>
        </div>
      </div>

      {/* Main Map + Drawer Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedPlot ? '1fr 420px' : '1fr', gap: '20px' }}>
        {/* Interactive SVG Map Container */}
        <div className="plot-map-container" style={{ height: '620px' }}>
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 740 450"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top left',
              transition: 'transform 0.15s ease-out',
            }}
          >
            <defs>
              {/* Striped pattern for non-saleable civic amenity */}
              <pattern id="amenityHatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
              </pattern>
            </defs>

            {/* 40 FT Boulevard Road */}
            <rect x="0" y="190" width="740" height="40" fill="#1e293b" />
            <text x="370" y="215" fill="#64748b" fontSize="11" fontWeight="700" textAnchor="middle" letterSpacing="0.1em">
              ═══════ 40 FT MAIN BOULEVARD ROAD ═══════
            </text>

            {/* Civic Amenity & Green Park (Non-Saleable) */}
            <rect x="400" y="250" width="220" height="110" fill="url(#amenityHatch)" stroke="#334155" strokeWidth="1.5" rx="6" />
            <text x="510" y="300" fill="#94a3b8" fontSize="13" fontWeight="700" textAnchor="middle">
              CIVIC AMENITY &amp; PARK
            </text>
            <text x="510" y="320" fill="#64748b" fontSize="10" textAnchor="middle">
              (Non-Saleable Layout Reservation)
            </text>

            {/* Saleable Land Plots */}
            {plots.map((plot) => {
              const isSelected = selectedPlot?.id === plot.id;
              return (
                <g key={plot.id} onClick={() => setSelectedPlot(plot)}>
                  <rect
                    x={plot.x}
                    y={plot.y}
                    width={plot.w}
                    height={plot.h}
                    rx="6"
                    fill={getPlotFill(plot)}
                    stroke={isSelected ? '#fff' : getPlotStroke(plot)}
                    strokeWidth={isSelected ? '3' : '1.5'}
                    className="plot-polygon"
                  />
                  {/* Plot Code & Label */}
                  <text
                    x={plot.x + plot.w / 2}
                    y={plot.y + 35}
                    fill="#f8fafc"
                    fontSize="13"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {plot.plotNumber}
                  </text>
                  <text
                    x={plot.x + plot.w / 2}
                    y={plot.y + 55}
                    fill="rgba(255,255,255,0.7)"
                    fontSize="10"
                    fontFamily="var(--font-mono)"
                    textAnchor="middle"
                  >
                    {plot.areaSqFt} Sq.Ft
                  </text>
                  <text
                    x={plot.x + plot.w / 2}
                    y={plot.y + 80}
                    fill="#fff"
                    fontSize="10"
                    fontWeight="800"
                    textAnchor="middle"
                  >
                    [ {plot.commercialAvailability === 'AVAILABLE' ? 'AV' : plot.commercialAvailability.substring(0, 3)} ]
                  </text>

                  {/* Corner indicator badge */}
                  {plot.isCorner && (
                    <circle cx={plot.x + 12} cy={plot.y + 12} r={5} fill="#f59e0b" />
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Plot Detail Drawer */}
        {selectedPlot && (
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="badge badge-muted">LAND PARCEL</span>
                <div className="h1" style={{ fontSize: '1.4rem', marginTop: '4px' }}>
                  Plot {selectedPlot.plotNumber}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  {selectedPlot.phase} · {selectedPlot.sector}
                </div>
              </div>
              <button
                onClick={() => setSelectedPlot(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* 4 Architectural Dimensions Panel */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                4 Architectural State Dimensions
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Commercial:</span>
                <span
                  style={{
                    fontWeight: 700,
                    color:
                      selectedPlot.commercialAvailability === 'AVAILABLE'
                        ? 'var(--color-success)'
                        : selectedPlot.commercialAvailability === 'ON_HOLD'
                        ? 'var(--color-warning)'
                        : 'var(--text-primary)',
                  }}
                >
                  {selectedPlot.commercialAvailability}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Regulatory Sanction:</span>
                <span style={{ fontWeight: 600, color: '#0284c7' }}>{selectedPlot.regulatoryStatus}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Registration State:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedPlot.registrationStatus}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Classification:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{selectedPlot.classification}</span>
              </div>
            </div>

            {/* Physical Characteristics */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                PHYSICAL ATTRIBUTES
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8125rem' }}>
                <div style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Plot Area</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{selectedPlot.areaSqFt} Sq. Ft</div>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Facing</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{selectedPlot.facing}</div>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Road Width</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{selectedPlot.roadWidthFt} Ft</div>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Corner Status</div>
                  <div style={{ fontWeight: 700, color: selectedPlot.isCorner ? '#d97706' : 'var(--text-secondary)', marginTop: '2px' }}>
                    {selectedPlot.isCorner ? 'Yes (Corner)' : 'Standard'}
                  </div>
                </div>
              </div>
            </div>

            {/* Commercial Pricing Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                COMMERCIAL VALUATION
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Base Land Value:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                    ₹{((selectedPlot.areaSqFt * selectedPlot.baseRateSqFt) / 100000).toFixed(2)} Lakhs
                  </span>
                </div>
                {selectedPlot.isCorner && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Corner Premium:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      ₹{(selectedPlot.cornerPremium / 100000).toFixed(2)} Lakhs
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Total Indicative Agreement:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-success)' }}>
                    ₹{(((selectedPlot.areaSqFt * selectedPlot.baseRateSqFt) + selectedPlot.cornerPremium + selectedPlot.infraCharges + selectedPlot.devCharges) / 100000).toFixed(2)} Lakhs
                  </span>
                </div>
              </div>
            </div>

            {/* Active Hold Status or Hold Actions */}
            {selectedPlot.commercialAvailability === 'ON_HOLD' ? (
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={16} color="var(--color-warning)" />
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#b45309' }}>
                    ACTIVE INVENTORY HOLD
                  </span>
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                  Held by: <strong>{selectedPlot.heldBy}</strong>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Expires in: <strong style={{ color: '#b45309', fontFamily: 'var(--font-mono)' }}>{selectedPlot.holdExpiresAt}</strong>
                </div>
                <button
                  onClick={() => handleReleaseHold(selectedPlot.id)}
                  className="btn btn-danger btn-sm"
                  style={{ marginTop: '6px' }}
                >
                  Release Hold
                </button>
              </div>
            ) : selectedPlot.commercialAvailability === 'AVAILABLE' ? (
              <button
                onClick={() => handlePlaceHold(selectedPlot)}
                disabled={isHolding}
                className="btn btn-primary"
                style={{ padding: '12px' }}
              >
                <Lock size={16} />
                <span>{isHolding ? 'Holding Asset on Server...' : 'Place 60-Minute Hold'}</span>
              </button>
            ) : (
              <div style={{ padding: '10px', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                This parcel is currently {selectedPlot.commercialAvailability}. Transactions locked.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Concurrency Conflict Modal */}
      {conflictModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            className="glass-panel"
            style={{ width: '100%', maxWidth: '440px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={24} color="var(--color-danger)" />
              <div className="h2" style={{ fontSize: '1.15rem' }}>Inventory Conflict (HTTP 409)</div>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              This parcel was locked by another agent milliseconds earlier. The database partial unique index rejected duplicate hold creation. State has been refreshed.
            </p>

            <button
              onClick={() => setConflictModalOpen(false)}
              className="btn btn-primary"
              style={{ alignSelf: 'flex-end' }}
            >
              Acknowledge &amp; Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
