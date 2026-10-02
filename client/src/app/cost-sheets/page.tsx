'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  Building,
  User,
  ArrowRight,
} from 'lucide-react';

interface CostSheetItem {
  id: string;
  code: string;
  version: number;
  leadName: string;
  assetType: 'UNIT' | 'PLOT';
  assetIdentifier: string;
  agreementValue: number;
  totalAllInclusive: number;
  status: 'DRAFT' | 'ISSUED' | 'SUPERSEDED' | 'CONSUMED';
  generatedAt: string;
  generatedBy: string;
  pricingRuleVersion: string;
}

export default function CostSheetsPage() {
  const [costSheets, setCostSheets] = useState<CostSheetItem[]>([
    {
      id: 'cs-1',
      code: 'CS-2026-0847',
      version: 2,
      leadName: 'Amit Sharma',
      assetType: 'PLOT',
      assetIdentifier: 'Plot B-03 (Green Hills)',
      agreementValue: 3425000,
      totalAllInclusive: 3699000,
      status: 'ISSUED',
      generatedAt: '2026-09-29 10:15',
      generatedBy: 'Rajesh Kumar (Sales Exec)',
      pricingRuleVersion: 'RULE-PLT-2026-V3',
    },
    {
      id: 'cs-2',
      code: 'CS-2026-0847',
      version: 1,
      leadName: 'Amit Sharma',
      assetType: 'PLOT',
      assetIdentifier: 'Plot B-03 (Green Hills)',
      agreementValue: 3550000,
      totalAllInclusive: 3834000,
      status: 'SUPERSEDED',
      generatedAt: '2026-09-28 14:20',
      generatedBy: 'Rajesh Kumar (Sales Exec)',
      pricingRuleVersion: 'RULE-PLT-2026-V3',
    },
    {
      id: 'cs-3',
      code: 'CS-2026-0912',
      version: 1,
      leadName: 'Ananya Deshmukh',
      assetType: 'UNIT',
      assetIdentifier: 'Unit A-1201 (Park Ave)',
      agreementValue: 8500000,
      totalAllInclusive: 9180000,
      status: 'ISSUED',
      generatedAt: '2026-09-29 11:30',
      generatedBy: 'Rajesh Kumar (Sales Exec)',
      pricingRuleVersion: 'RULE-BLD-2026-V2',
    },
    {
      id: 'cs-4',
      code: 'CS-2026-0950',
      version: 1,
      leadName: 'Priya Patel',
      assetType: 'PLOT',
      assetIdentifier: 'Plot B-01 (Green Hills)',
      agreementValue: 5040000,
      totalAllInclusive: 5443200,
      status: 'DRAFT',
      generatedAt: '2026-09-29 12:00',
      generatedBy: 'Vikram Malhotra (Manager)',
      pricingRuleVersion: 'RULE-PLT-2026-V3',
    },
  ]);

  const [selectedSheet, setSelectedSheet] = useState<CostSheetItem | null>(costSheets[0]);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

  // New Cost Sheet form state
  const [genLead, setGenLead] = useState('');
  const [genAssetType, setGenAssetType] = useState<'PLOT' | 'UNIT'>('PLOT');
  const [genAsset, setGenAsset] = useState('Plot B-02 (Green Hills)');
  const [genArea, setGenArea] = useState(1500);
  const [genRate, setGenRate] = useState(2800);
  const [genDiscount, setGenDiscount] = useState(0);

  const handleCreateNewVersion = (current: CostSheetItem) => {
    const nextVersion: CostSheetItem = {
      id: `cs-${Date.now()}`,
      code: current.code,
      version: current.version + 1,
      leadName: current.leadName,
      assetType: current.assetType,
      assetIdentifier: current.assetIdentifier,
      agreementValue: current.agreementValue * 0.98, // 2% negotiated adjustment
      totalAllInclusive: current.totalAllInclusive * 0.98,
      status: 'DRAFT',
      generatedAt: 'Just now',
      generatedBy: 'Current User',
      pricingRuleVersion: current.pricingRuleVersion,
    };

    setCostSheets([nextVersion, ...costSheets]);
    setSelectedSheet(nextVersion);
  };

  const handleGenerateSheet = (e: React.FormEvent) => {
    e.preventDefault();
    const baseValue = genArea * genRate;
    const discounted = baseValue - (baseValue * genDiscount) / 100;
    const agreement = discounted + 140000; // infra + dev charges
    const allInclusive = agreement * 1.08; // 8% taxes

    const newSheet: CostSheetItem = {
      id: `cs-${Date.now()}`,
      code: `CS-2026-0${Math.floor(Math.random() * 900 + 100)}`,
      version: 1,
      leadName: genLead,
      assetType: genAssetType,
      assetIdentifier: genAsset,
      agreementValue: agreement,
      totalAllInclusive: allInclusive,
      status: 'DRAFT',
      generatedAt: 'Just now',
      generatedBy: 'Current User',
      pricingRuleVersion: 'RULE-PLT-2026-V3',
    };

    setCostSheets([newSheet, ...costSheets]);
    setSelectedSheet(newSheet);
    setIsGeneratorOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div className="h1" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileSpreadsheet size={26} color="var(--accent-primary)" />
            Cost Sheets &amp; Versioning Engine
          </div>
          <p className="subtitle" style={{ marginTop: '4px' }}>
            Immutable commercial snapshots · Role-capped discounts · Automated tax calculations
          </p>
        </div>

        <button
          onClick={() => setIsGeneratorOpen(true)}
          className="btn btn-primary"
          style={{ display: 'flex', gap: '8px' }}
        >
          <Plus size={16} />
          <span>Generate New Cost Sheet</span>
        </button>
      </div>

      {/* Grid: List + Detail Viewer */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* Cost Sheet Table */}
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: '#f8fafc' }}>
                <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>DOCUMENT CODE</th>
                <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>PROSPECT</th>
                <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>TARGET ASSET</th>
                <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>ALL-INCLUSIVE</th>
                <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {costSheets.map((sheet) => {
                const isSelected = selectedSheet?.id === sheet.id;
                return (
                  <tr
                    key={sheet.id}
                    onClick={() => setSelectedSheet(sheet)}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      background: isSelected ? 'rgba(79, 70, 229, 0.06)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        {sheet.code}
                      </div>
                      <span className="badge badge-muted" style={{ marginTop: '2px', fontSize: '0.7rem' }}>
                        v{sheet.version}
                      </span>
                    </td>

                    <td style={{ padding: '14px 18px', fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {sheet.leadName}
                    </td>

                    <td style={{ padding: '14px 18px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {sheet.assetIdentifier}
                    </td>

                    <td style={{ padding: '14px 18px', fontSize: '0.875rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-success)' }}>
                      ₹{(sheet.totalAllInclusive / 100000).toFixed(2)} L
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <span
                        className={`badge ${
                          sheet.status === 'ISSUED'
                            ? 'badge-success'
                            : sheet.status === 'DRAFT'
                            ? 'badge-warning'
                            : sheet.status === 'CONSUMED'
                            ? 'badge-purple'
                            : 'badge-muted'
                        }`}
                      >
                        {sheet.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Cost Sheet Snapshot & Actions */}
        {selectedSheet && (
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="badge badge-info">{selectedSheet.assetType} COST SHEET</span>
                <div className="h1" style={{ fontSize: '1.35rem', marginTop: '4px' }}>
                  {selectedSheet.code} <span style={{ color: 'var(--accent-primary)' }}>(v{selectedSheet.version})</span>
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Lead: <strong>{selectedSheet.leadName}</strong> · Asset: <strong>{selectedSheet.assetIdentifier}</strong>
                </div>
              </div>

              <span
                className={`badge ${
                  selectedSheet.status === 'ISSUED'
                    ? 'badge-success'
                    : selectedSheet.status === 'DRAFT'
                    ? 'badge-warning'
                    : 'badge-muted'
                }`}
              >
                {selectedSheet.status}
              </span>
            </div>

            {/* Immutability Callout */}
            {selectedSheet.status === 'ISSUED' && (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  fontSize: '0.8125rem',
                  color: 'var(--color-success)',
                  lineHeight: 1.5,
                }}
              >
                🔒 <strong>This is an officially Issued Financial Document.</strong> Direct edits are disabled to maintain accounting explainability. To renegotiate prices, generate a new version.
              </div>
            )}

            {/* Commercial Breakdown */}
            <div
              style={{
                background: '#f8fafc',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '0.875rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Agreement Value:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  ₹{(selectedSheet.agreementValue / 100000).toFixed(2)} Lakhs
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Estimated Stamp Duty &amp; Reg:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  ₹{((selectedSheet.agreementValue * 0.06) / 100000).toFixed(2)} Lakhs
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>GST &amp; Statutory Levies:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  ₹{((selectedSheet.agreementValue * 0.02) / 100000).toFixed(2)} Lakhs
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '8px',
                  fontWeight: 700,
                  fontSize: '1rem',
                  color: 'var(--text-primary)',
                }}
              >
                <span>Total All-Inclusive:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-success)' }}>
                  ₹{(selectedSheet.totalAllInclusive / 100000).toFixed(2)} Lakhs
                </span>
              </div>
            </div>

            {/* Pricing Rule Reference */}
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Pricing Rule Version: <code style={{ color: 'var(--accent-primary)' }}>{selectedSheet.pricingRuleVersion}</code>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
              <button
                onClick={() => handleCreateNewVersion(selectedSheet)}
                className="btn btn-secondary"
                style={{ display: 'flex', gap: '8px' }}
              >
                <Copy size={16} />
                <span>Create New Version (v{selectedSheet.version + 1})</span>
              </button>

              <button className="btn btn-primary" style={{ display: 'flex', gap: '8px' }}>
                <Download size={16} />
                <span>Download Signed Commercial PDF</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Generator Drawer Modal */}
      {isGeneratorOpen && (
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
            style={{ width: '100%', maxWidth: '520px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px', background: '#ffffff', boxShadow: 'var(--shadow-lg)' }}
          >
            <div className="h2" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileSpreadsheet size={20} color="var(--accent-primary)" />
              Generate Cost Sheet
            </div>

            <form onSubmit={handleGenerateSheet} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', display: 'block' }}>
                  Prospect Name
                </label>
                <input
                  type="text"
                  value={genLead}
                  onChange={(e) => setGenLead(e.target.value)}
                  placeholder="e.g. Ramesh Kulkarni"
                  className="input-field"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', display: 'block' }}>
                    Asset Class
                  </label>
                  <select
                    value={genAssetType}
                    onChange={(e) => setGenAssetType(e.target.value as any)}
                    className="input-field"
                  >
                    <option value="PLOT">Plotted Land</option>
                    <option value="UNIT">Constructed Unit</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', display: 'block' }}>
                    Target Asset
                  </label>
                  <input
                    type="text"
                    value={genAsset}
                    onChange={(e) => setGenAsset(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', display: 'block' }}>
                    Area (Sq. Ft)
                  </label>
                  <input
                    type="number"
                    value={genArea}
                    onChange={(e) => setGenArea(Number(e.target.value))}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', display: 'block' }}>
                    Base Rate (₹ / Sq. Ft)
                  </label>
                  <input
                    type="number"
                    value={genRate}
                    onChange={(e) => setGenRate(Number(e.target.value))}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', display: 'block' }}>
                  Negotiated Discount (% — Capped at 2% for Sales Exec)
                </label>
                <input
                  type="number"
                  max={2}
                  min={0}
                  value={genDiscount}
                  onChange={(e) => setGenDiscount(Number(e.target.value))}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsGeneratorOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Calculate &amp; Issue v1
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
