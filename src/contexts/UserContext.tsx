import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'ADMIN' | 'SUB_ADMIN' | 'USER';

interface UserContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>('ADMIN'); // Default to ADMIN for development
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(min-width: 768px)').matches;
  });

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  return (
    <UserContext.Provider value={{ role, setRole, isSidebarOpen, toggleSidebar }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
