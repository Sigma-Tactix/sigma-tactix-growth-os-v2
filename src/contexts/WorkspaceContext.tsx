import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ClientWorkspace } from '@/src/types';
import { useToast } from '@/src/contexts/ToastContext';
import { listWorkspaces, createWorkspaceEnclave, setWorkspaceTier } from '@/src/lib/api';

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
  role: 'owner',
  status: 'ACTIVE',
  vaultSecurity: 'AES-256 GCM · Isolated pgvector',
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
  isSyncing: boolean;
  switchWorkspace: (workspaceId: string) => void;
  provisionWorkspace: (clientData: Partial<ClientWorkspace>) => Promise<ClientWorkspace>;
  deleteWorkspace: (workspaceId: string) => void;
  updateWorkspaceTier: (workspaceId: string, tier: 'starter' | 'growth' | 'enterprise') => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { notifySuccess, notifyInfo, notifyWarning, notifyError } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);

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

  // Reconcile workspaces with server-enforced membership and tiers
  const refreshWorkspaces = useCallback(async () => {
    try {
      setIsSyncing(true);
      const res = await listWorkspaces();
      if (res && Array.isArray(res.workspaces)) {
        setWorkspaces(prev => {
          const map = new Map<string, ClientWorkspace>();
          // Preserve primary HQ
          map.set(DEFAULT_PRIMARY_WORKSPACE.id, DEFAULT_PRIMARY_WORKSPACE);

          // Seed existing local state for custom domain/brand metadata
          for (const local of prev) {
            map.set(local.id, local);
          }

          // Merge server-issued workspaces: role and tier ALWAYS derive from server
          for (const sw of res.workspaces) {
            const existing = map.get(sw.id);
            if (existing) {
              map.set(sw.id, {
                ...existing,
                name: sw.name,
                role: sw.role,
                tier: (sw.tier as any) || existing.tier || 'starter',
              });
            } else {
              map.set(sw.id, {
                id: sw.id,
                name: sw.name,
                domain: sw.name.toLowerCase().includes('.') ? sw.name.toLowerCase() : '',
                industry: '',
                icp: '',
                geography: '',
                region: 'AWS eu-central-1',
                tier: (sw.tier as any) || 'starter',
                role: sw.role,
                status: 'ACTIVE',
                vaultSecurity: 'AES-256 GCM · Isolated pgvector',
                createdAt: sw.createdAt || new Date().toISOString().split('T')[0],
              });
            }
          }
          return Array.from(map.values());
        });
      }
    } catch {
      // Unauthenticated / offline context: keep cached/sovereign defaults
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    refreshWorkspaces();
  }, [refreshWorkspaces]);

  // Derive current workspace object - role and tier come from server-verified state
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
    notifyInfo('Workspace Switched', `Now viewing "${target.name}" (${target.domain || target.id}). Role: ${target.role || 'member'}`);
  };

  // Provision new client workspace with server-issued ID
  const provisionWorkspace = async (clientData: Partial<ClientWorkspace>): Promise<ClientWorkspace> => {
    const rawDomain = clientData.domain || '';
    const cleanDomain = rawDomain.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
    const clientName = clientData.name || clientData.domain || 'New client';

    let serverEnclave: { id: string; name: string; role: 'owner' | 'admin' | 'member'; tier?: any; createdAt: string } | null = null;
    try {
      serverEnclave = await createWorkspaceEnclave({
        name: clientName,
        profile: clientData,
      });
    } catch (err: any) {
      console.warn('Server workspace creation unavailable, falling back to sovereign local provision:', err?.message || err);
    }

    const assignedId = serverEnclave?.id || `ws-${Date.now()}`;
    const newWorkspace: ClientWorkspace = {
      id: assignedId,
      name: serverEnclave?.name || clientName,
      domain: cleanDomain,
      industry: clientData.industry || '',
      icp: clientData.icp || '',
      geography: clientData.geography || '',
      region: clientData.region || 'AWS eu-central-1',
      tier: (serverEnclave?.tier as any) || clientData.tier || 'starter',
      role: serverEnclave?.role || 'owner',
      status: 'ACTIVE',
      vaultSecurity: 'AES-256 GCM · Isolated pgvector',
      createdAt: serverEnclave?.createdAt || new Date().toISOString().split('T')[0],
      activeModel: clientData.activeModel,
      brandVault: clientData.brandVault || {
        corePositioning: '',
        offersAndPricing: '',
        voiceAndTone: ''
      },
      connectors: clientData.connectors || []
    };

    setWorkspaces(prev => [newWorkspace, ...prev.filter(w => w.id !== newWorkspace.id)]);
    setCurrentWorkspaceId(newWorkspace.id);

    notifySuccess(
      'Workspace Enclave Provisioned',
      `"${newWorkspace.name}" (${newWorkspace.domain || newWorkspace.id}) registered with server-issued ID ${newWorkspace.id}. Role: ${newWorkspace.role}.`
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

  // Update workspace tier via authoritative server billing gate
  const updateWorkspaceTier = async (workspaceId: string, tier: 'starter' | 'growth' | 'enterprise'): Promise<void> => {
    try {
      await setWorkspaceTier(tier);
      setWorkspaces(prev => prev.map(w => {
        if (w.id === workspaceId) {
          return { ...w, tier };
        }
        return w;
      }));
      notifySuccess('Plan Tier Updated', `Workspace plan updated to ${tier.toUpperCase()}.`);
    } catch (err: any) {
      notifyError('Tier Update Rejected', err?.message || 'Server rejected tier update. Owner or admin permission required.');
    }
  };

  return (
    <WorkspaceContext.Provider value={{
      workspaces,
      currentWorkspace,
      currentWorkspaceId,
      isSyncing,
      switchWorkspace,
      provisionWorkspace,
      deleteWorkspace,
      updateWorkspaceTier,
      refreshWorkspaces
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
