import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { UserType, Profile } from '@/types/marketplace';

export function useUserType() {
    const { user } = useAuth();
    const [userType, setUserType] = useState<UserType | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadUserType();
        } else {
            setUserType(null);
            setProfile(null);
            setIsLoading(false);
        }
    }, [user]);

    const loadUserType = async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('user_type, *')
                .eq('user_id', user.id)
                .single();

            if (error) throw error;

            setUserType(data.user_type);
            setProfile(data);
        } catch (error) {
            console.error('Error loading user type:', error);
            setUserType(null);
            setProfile(null);
        } finally {
            setIsLoading(false);
        }
    };

    return { userType, profile, isLoading, refetch: loadUserType };
}
