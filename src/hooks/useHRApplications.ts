import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface HRApplication {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  route: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export function useHRApplications() {
  const [applications, setApplications] = useState<HRApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('concremrh_hr_applications')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      toast.error('Erro ao carregar aplicações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  return {
    applications,
    loading,
    refetch: fetchApplications,
  };
}
