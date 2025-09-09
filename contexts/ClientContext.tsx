"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

export type Client = {
  _id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  taxId?: string;
  website?: string;
  projectTotalAmount?: number;
  status?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
};

type ClientContextType = {
  client: Client | null;
  isLoading: boolean;
  error: string | null;
};

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session, status } = useSession();

  useEffect(() => {
    const fetchClientData = async () => {
      if (status === 'authenticated' && session?.user?.email) {
        try {
          setIsLoading(true);
          setError(null);
          
          const response = await fetch(`/api/clients/email/${encodeURIComponent(session.user.email)}`);
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to fetch client data');
          }
          
          const data: Client = await response.json();
          
          // Ensure required fields
          if (!data._id || !data.email) {
            throw new Error('Invalid client data received');
          }
          
          setClient(data);
        } catch (err) {
          console.error('Error fetching client data:', err);
          setError(err instanceof Error ? err.message : 'Failed to load client data');
          setClient(null);
        } finally {
          setIsLoading(false);
        }
      } else if (status === 'unauthenticated') {
        setClient(null);
        setIsLoading(false);
      }
    };

    fetchClientData();
  }, [status, session]);

  return (
    <ClientContext.Provider value={{ client, isLoading, error }}>
      {children}
    </ClientContext.Provider>
  );
}

export const useClient = (): ClientContextType => {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
};
