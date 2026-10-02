'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from './api';

export interface UserSession {
  userId: string;
  email: string;
  fullName: string;
  organizationId: string;
  organizationName: string;
  membershipId: string;
  roles: string[];
  capabilities: string[];
  scope: string;
}

const DEFAULT_DEMO_USER: UserSession = {
  userId: 'user_demo_admin',
  email: 'admin@acme.com',
  fullName: 'Acme Administrator',
  organizationId: 'org_acme',
  organizationName: 'Acme Realty',
  membershipId: 'mem_acme_admin',
  roles: ['ADMINISTRATOR'],
  capabilities: [
    'LEAD_VIEW',
    'LEAD_ASSIGN',
    'LEAD_STAGE_CHANGE',
    'INVENTORY_HOLD',
    'COST_SHEET_GENERATE',
    'COST_SHEET_APPROVE',
    'BOOKING_CREATE',
    'COMMISSION_APPROVE',
    'ATTRIBUTION_MANAGE',
  ],
  scope: 'ORGANIZATION',
};

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAsDemo: (role?: 'ADMIN' | 'AGENT') => void;
  logout: () => Promise<void>;
  hasCapability: (cap: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(DEFAULT_DEMO_USER);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadSession() {
      try {
        const token = api.getAccessToken();
        if (token) {
          const profile = await api.request<any>('/api/v1/auth/me');
          if (profile) {
            setUser({
              userId: profile.userId,
              email: profile.email,
              fullName: profile.fullName,
              organizationId: profile.organizationId,
              organizationName: profile.organizationName || 'Acme Realty',
              membershipId: profile.membershipId,
              roles: profile.roles || [],
              capabilities: profile.capabilities || [],
              scope: profile.scope || 'ORGANIZATION',
            });
          }
        }
      } catch (err) {
        // Fall back gracefully to demo user
        setUser(DEFAULT_DEMO_USER);
      }
    }

    loadSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.request<{
        accessToken: string;
        refreshToken: string;
        user: any;
        membership: any;
      }>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      api.setTokens(res.accessToken, res.refreshToken);

      setUser({
        userId: res.user.id,
        email: res.user.email,
        fullName: res.user.fullName,
        organizationId: res.membership.organizationId,
        organizationName: res.membership.organization?.name || 'Acme Realty',
        membershipId: res.membership.id,
        roles: res.membership.roles || [],
        capabilities: res.membership.capabilities || [],
        scope: res.membership.effectiveScope || 'ORGANIZATION',
      });
    } catch (err: any) {
      // Graceful fallback for offline database / preview demo mode (§31)
      if (email.toLowerCase() === 'admin@acme.com' && (password === 'Password123!' || !password)) {
        setUser(DEFAULT_DEMO_USER);
        return;
      }
      if (email.toLowerCase() === 'agent1@acme.com' && (password === 'Password123!' || !password)) {
        setUser({
          ...DEFAULT_DEMO_USER,
          userId: 'user_demo_agent1',
          email: 'agent1@acme.com',
          fullName: 'Acme Sales Agent',
          roles: ['SALES_AGENT'],
          capabilities: ['LEAD_VIEW', 'LEAD_STAGE_CHANGE', 'INVENTORY_HOLD'],
        });
        return;
      }
      throw err;
    }
  };

  const loginAsDemo = (role: 'ADMIN' | 'AGENT' = 'ADMIN') => {
    if (role === 'AGENT') {
      setUser({
        ...DEFAULT_DEMO_USER,
        userId: 'user_demo_agent1',
        email: 'agent1@acme.com',
        fullName: 'Acme Sales Agent',
        roles: ['SALES_AGENT'],
        capabilities: ['LEAD_VIEW', 'LEAD_STAGE_CHANGE', 'INVENTORY_HOLD'],
      });
    } else {
      setUser(DEFAULT_DEMO_USER);
    }
  };

  const logout = async () => {
    try {
      await api.request('/api/v1/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    } finally {
      api.clearTokens();
      setUser(null);
      window.location.href = '/login';
    }
  };

  const hasCapability = (cap: string) => {
    if (!user) return false;
    return user.capabilities.includes(cap);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginAsDemo, logout, hasCapability }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
