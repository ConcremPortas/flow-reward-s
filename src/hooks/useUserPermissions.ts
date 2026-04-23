import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'rh_manager' | 'user';
  created_at: string;
  updated_at: string;
}

export interface UserApplicationPermission {
  id: string;
  user_id: string;
  application_id: string;
  granted_by: string | null;
  granted_at: string;
  created_at: string;
  updated_at: string;
}

export function useUserPermissions(userId?: string) {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [permissions, setPermissions] = useState<UserApplicationPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchUserRoles = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('concremrh_user_roles')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      setRoles(data || []);
      setIsAdmin(data?.some(r => r.role === 'admin') || false);
    } catch (error: any) {
      console.error('Error fetching user roles:', error);
      toast.error('Erro ao carregar permissões de usuário');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPermissions = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('concremrh_user_application_permissions')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      setPermissions(data || []);
    } catch (error: any) {
      console.error('Error fetching user permissions:', error);
    }
  };

  const hasPermission = (applicationCode: string): boolean => {
    // Admins have access to everything
    if (isAdmin) return true;

    // Check if user has specific permission for this app
    // This would need to join with applications table
    return false; // Simplified for now
  };

  useEffect(() => {
    if (userId) {
      fetchUserRoles();
      fetchUserPermissions();
    } else {
      setLoading(false);
    }
  }, [userId]);

  return {
    roles,
    permissions,
    loading,
    isAdmin,
    hasPermission,
    refetch: () => {
      fetchUserRoles();
      fetchUserPermissions();
    },
  };
}
