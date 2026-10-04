import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ClientWorkspace } from '@/src/types';
import { useToast } from '@/src/contexts/ToastContext';

const WORKSPACES_STORAGE_KEY = 'sigmatactix_client_workspaces';
const ACTIVE_WORKSPACE_ID_KEY = 'sigmatactix_current_workspace_id';

export const DEFAULT_PRIMARY_WORKSPACE: ClientWorkspace = {
  id: 'ws-primary',
  name: 'Sigma Tactix (HQ)',
  domain: 'sigmatactix.com',
  industry: 'AI Growth Infrastructure & Autonomous Marketing OS',
  icp: 'B2B Founders, CMOs, and Revenue Leaders ($1M–$50M ARR)',
  geography: 'Global (NA & EMEA)',
  region: 'AWS eu-central-1 (Frankfurt)',
  tier: 'growth',
  status: 'ACTIVE',
  vaultSecurity: 'AES-256 GCM • Isolated pgvector',
  createdAt: '2026-08-01',
  activeModel: 'gemini-2.5-flash',
  brandVault: {
    corePositioning: 'Sovereign AI Growth Operating System that eliminates rented agency headcount by deploying client-owned Second Brain and autonomous multi-agent execution.',
    offersAndPricing: 'Starter OS ($499/mo), Growth OS ($1,499/mo), Enterprise / Agency OS ($3,499/mo). Includes real-time growth diagnostic and AEO topical authority.',
    voiceAndTone: 'Authoritative, empirical, anti-slop, engineering-grade, zero buzzwords. Grounded in unit economics and sovereign cloud infrastructure.'
  }
};

interface WorkspaceContextType {
  workspaces: ClientWorkspace[];
  currentWorkspace: ClientWorkspace;
  currentWorkspaceId: string;
  switchWorkspace: (workspaceId: string) => void;
  provisionWorkspace: (clientData: Partial<ClientWorkspace>) => ClientWorkspace;
  deleteWorkspace: (workspaceId: string) => void;
  updateWorkspaceTier: (workspaceId: string, tier: 'starter' | 'growth' | 'enterprise') => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { notifySuccess, notifyInfo, notifyWarning } = useToast();

  // Load workspaces from local storage or default to primary
  const [workspaces, setWorkspaces] = useState<ClientWorkspace[]>(() => {
    try {
      const stored = localStorage.getItem(WORKSPACES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load workspaces from localStorage', e);
    }
    return [DEFAULT_PRIMARY_WORKSPACE];
  });

  // Current active workspace ID
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(ACTIVE_WORKSPACE_ID_KEY);
      if (stored) return stored;
    } catch (e) {
      console.error('Failed to load active workspace ID', e);
    }
    return 'ws-primary';
  });

  // Derive current workspace object
  const currentWorkspace = React.useMemo(() => {
    return workspaces.find(w => w.id === currentWorkspaceId) || workspaces[0] || DEFAULT_PRIMARY_WORKSPACE;
  }, [workspaces, currentWorkspaceId]);

  // Persist workspaces
  useEffect(() => {
    try {
      localStorage.setItem(WORKSPACES_STORAGE_KEY, JSON.stringify(workspaces));
    } catch (e) {
      console.error('Failed to persist workspaces', e);
    }
  }, [workspaces]);

  // Persist active ID
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_WORKSPACE_ID_KEY, currentWorkspaceId);
    } catch (e) {
      console.error('Failed to persist active workspace ID', e);
    }
  }, [currentWorkspaceId]);

  // Switch workspace
  const switchWorkspace = (workspaceId: string) => {
    const target = workspaces.find(w => w.id === workspaceId);
    if (!target) {
      notifyWarning('Workspace Not Found', `No enclave found matching ID ${workspaceId}`);
      return;
    }
    setCurrentWorkspaceId(workspaceId);
    notifyInfo('Workspace Switched', `Now viewing "${target.name}" (${target.domain}) in this browser.`);
  };

  // Provision new client workspace
  const provisionWorkspace = (clientData: Partial<ClientWorkspace>): ClientWorkspace => {
    const rawDomain = clientData.domain || '';
    const cleanDomain = rawDomain.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
    const newId = `ws-${Date.now()}`;

    const newWorkspace: ClientWorkspace = {
      id: newId,
      name: clientData.name || clientData.domain || 'New client',
      domain: cleanDomain,
      industry: clientData.industry || '',
      icp: clientData.icp || '',
      geography: clientData.geography || '',
      region: clientData.region || 'Not configured',
      tier: clientData.tier || 'starter',
      status: 'PROVISIONING',
      vaultSecurity: 'Not verified',
      createdAt: new Date().toISOString().split('T')[0],
      activeModel: clientData.activeModel,
      brandVault: clientData.brandVault || {
        corePositioning: '',
        offersAndPricing: '',
        voiceAndTone: ''
      },
      connectors: clientData.connectors || []
    };

    // Connector choices are onboarding intent, not verified data pipelines.
    // A pipeline is created only by the server after provider verification.

    // Add to workspaces and set active
    setWorkspaces(prev => [newWorkspace, ...prev]);
    setCurrentWorkspaceId(newId);

    notifySuccess(
      'Workspace Draft Created',
      `"${newWorkspace.name}" (${newWorkspace.domain}) was saved in this browser. Connectors and infrastructure are not yet verified.`
    );

    return newWorkspace;
  };

  // Delete workspace
  const deleteWorkspace = (workspaceId: string) => {
    if (workspaceId === 'ws-primary') {
      notifyWarning('Protected Workspace', 'The primary sovereign HQ workspace cannot be deleted.');
      return;
    }

    setWorkspaces(prev => prev.filter(w => w.id !== workspaceId));

    if (currentWorkspaceId === workspaceId) {
      setCurrentWorkspaceId('ws-primary');
    }

    notifyInfo('Workspace Removed', `Workspace ${workspaceId} was removed from this browser.`);
  };

  // Update workspace tier
  const updateWorkspaceTier = (workspaceId: string, tier: 'starter' | 'growth' | 'enterprise') => {
    setWorkspaces(prev => prev.map(w => {
      if (w.id === workspaceId) {
        return { ...w, tier };
      }
      return w;
    }));
    notifySuccess('Plan Tier Updated', `Workspace plan updated to ${tier.toUpperCase()}.`);
  };

  return (
    <WorkspaceContext.Provider value={{
      workspaces,
      currentWorkspace,
      currentWorkspaceId,
      switchWorkspace,
      provisionWorkspace,
      deleteWorkspace,
      updateWorkspaceTier
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
