import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Medication {
    id: string;
    name: string;
    dosage: string | null;
    frequency: string | null;
    start_date: string | null;
    end_date: string | null;
    notes: string | null;
    created_at: string;
    is_active: boolean;
}

export const useMedications = () => {
    const { user } = useAuth();
    const [medications, setMedications] = useState<Medication[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMedications = useCallback(async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('medications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Calculate if medication is active
            const now = new Date();
            const withActiveStatus = (data || []).map((med) => ({
                ...med,
                is_active: !med.end_date || new Date(med.end_date) >= now,
            }));

            setMedications(withActiveStatus);
        } catch (error) {
            console.error('Error fetching medications:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const addMedication = async (medication: Omit<Medication, 'id' | 'created_at' | 'is_active'>) => {
        if (!user) return null;

        try {
            const { data, error } = await supabase
                .from('medications')
                .insert({
                    user_id: user.id,
                    ...medication,
                })
                .select()
                .single();

            if (error) throw error;

            await fetchMedications();
            return data;
        } catch (error) {
            console.error('Error adding medication:', error);
            return null;
        }
    };

    const updateMedication = async (id: string, updates: Partial<Medication>) => {
        if (!user) return false;

        try {
            const { error } = await supabase
                .from('medications')
                .update(updates)
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;

            await fetchMedications();
            return true;
        } catch (error) {
            console.error('Error updating medication:', error);
            return false;
        }
    };

    const deleteMedication = async (id: string) => {
        if (!user) return false;

        try {
            const { error } = await supabase
                .from('medications')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;

            await fetchMedications();
            return true;
        } catch (error) {
            console.error('Error deleting medication:', error);
            return false;
        }
    };

    useEffect(() => {
        if (user) {
            fetchMedications();
        }
    }, [user, fetchMedications]);

    return {
        medications,
        loading,
        addMedication,
        updateMedication,
        deleteMedication,
        refetch: fetchMedications,
        activeMedications: medications.filter((m) => m.is_active),
    };
};
