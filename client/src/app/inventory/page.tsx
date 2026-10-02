'use client';

import React, { useState, useEffect } from 'react';
import { InventoryGrid, PropertyUnitItem } from '../../components/inventory/InventoryGrid';
import { RefreshCw, Filter, Layers } from 'lucide-react';
import { api } from '../../lib/api';

const INITIAL_DEMO_UNITS: PropertyUnitItem[] = [
  // Floor 4
  { id: 'u_401', unitNumber: '401', floorNumber: 4, configuration: '3 BHK', carpetAreaSqFt: 1450, basePrice: '12500000', availability: 'AVAILABLE' },
  { id: 'u_402', unitNumber: '402', floorNumber: 4, configuration: '3 BHK', carpetAreaSqFt: 1450, basePrice: '12500000', availability: 'ON_HOLD', activeHold: { id: 'hold_99', expiresAt: new Date(Date.now() + 600000).toISOString(), leadId: 'lead_001' } },
  { id: 'u_403', unitNumber: '403', floorNumber: 4, configuration: '2 BHK', carpetAreaSqFt: 1100, basePrice: '9200000', availability: 'AVAILABLE' },
  { id: 'u_404', unitNumber: '404', floorNumber: 4, configuration: '2 BHK', carpetAreaSqFt: 1100, basePrice: '9200000', availability: 'BOOKED' },

  // Floor 3
  { id: 'u_301', unitNumber: '301', floorNumber: 3, configuration: '3 BHK', carpetAreaSqFt: 1450, basePrice: '12350000', availability: 'AVAILABLE' },
  { id: 'u_302', unitNumber: '302', floorNumber: 3, configuration: '3 BHK', carpetAreaSqFt: 1450, basePrice: '12350000', availability: 'AVAILABLE' },
  { id: 'u_303', unitNumber: '303', floorNumber: 3, configuration: '2 BHK', carpetAreaSqFt: 1100, basePrice: '9100000', availability: 'SOLD' },
  { id: 'u_304', unitNumber: '304', floorNumber: 3, configuration: '2 BHK', carpetAreaSqFt: 1100, basePrice: '9100000', availability: 'AVAILABLE' },

  // Floor 2
  { id: 'u_201', unitNumber: '201', floorNumber: 2, configuration: '3 BHK', carpetAreaSqFt: 1450, basePrice: '12200000', availability: 'AVAILABLE' },
  { id: 'u_202', unitNumber: '202', floorNumber: 2, configuration: '3 BHK', carpetAreaSqFt: 1450, basePrice: '12200000', availability: 'BLOCKED' },
  { id: 'u_203', unitNumber: '203', floorNumber: 2, configuration: '2 BHK', carpetAreaSqFt: 1100, basePrice: '9000000', availability: 'AVAILABLE' },
  { id: 'u_204', unitNumber: '204', floorNumber: 2, configuration: '2 BHK', carpetAreaSqFt: 1100, basePrice: '9000000', availability: 'AVAILABLE' },

  // Floor 1
  { id: 'u_101', unitNumber: '101', floorNumber: 1, configuration: '3 BHK', carpetAreaSqFt: 1450, basePrice: '12000000', availability: 'BOOKED' },
  { id: 'u_102', unitNumber: '102', floorNumber: 1, configuration: '3 BHK', carpetAreaSqFt: 1450, basePrice: '12000000', availability: 'AVAILABLE' },
  { id: 'u_103', unitNumber: '103', floorNumber: 1, configuration: '2 BHK', carpetAreaSqFt: 1100, basePrice: '8850000', availability: 'SOLD' },
  { id: 'u_104', unitNumber: '104', floorNumber: 1, configuration: '2 BHK', carpetAreaSqFt: 1100, basePrice: '8850000', availability: 'AVAILABLE' },
];

export default function InventoryPage() {
  const [units, setUnits] = useState<PropertyUnitItem[]>(INITIAL_DEMO_UNITS);
  const [loading, setLoading] = useState(false);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const res = await api.request<{ units: any[] }>('/api/v1/inventory/units');
      if (res?.units && res.units.length > 0) {
        setUnits(res.units);
      }
    } catch {
      // Keep demo units if API is cold
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="h1">Real Estate Inventory & Hold Matrix</div>
          <div className="subtitle">
            Strict row-level concurrency locking (<strong>SELECT FOR UPDATE</strong>) enforces single active holds with 15-minute expiration (§13 & §14).
          </div>
        </div>

        <button onClick={fetchUnits} className="btn btn-secondary btn-sm" disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Sync Real-Time Inventory</span>
        </button>
      </div>

      <InventoryGrid units={units} onRefresh={fetchUnits} />
    </div>
  );
}
