import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface FamilyMember {
    id: string;
    fullName: string;
    birthDate: string | null;
    sex: 'M' | 'F' | 'O' | null;
    relationship: 'self' | 'spouse' | 'child' | 'parent' | 'sibling' | 'other';
    avatarUrl: string | null;
    isActive: boolean;
    createdAt: string;
}

interface FamilyMemberInput {
    fullName: string;
    birthDate?: string;
    sex?: 'M' | 'F' | 'O';
    relationship: FamilyMember['relationship'];
    avatarUrl?: string;
}

interface UseFamilyMembersReturn {
    members: FamilyMember[];
    loading: boolean;
    error: Error | null;
    activeMember: FamilyMember | null;
    setActiveMember: (member: FamilyMember | null) => void;
    addMember: (data: FamilyMemberInput) => Promise<FamilyMember | null>;
    updateMember: (id: string, data: Partial<FamilyMemberInput>) => Promise<boolean>;
    deleteMember: (id: string) => Promise<boolean>;
    refetch: () => Promise<void>;
}

const relationshipLabels: Record<FamilyMember['relationship'], string> = {
    self: 'Eu',
    spouse: 'Cônjuge',
    child: 'Filho(a)',
    parent: 'Pai/Mãe',
    sibling: 'Irmão(ã)',
    other: 'Outro',
};

export const getRelationshipLabel = (relationship: FamilyMember['relationship']): string => {
    return relationshipLabels[relationship] || relationship;
};

/**
 * Hook para gerenciar membros da família
 * Permite adicionar, editar e remover perfis de familiares
 */
export const useFamilyMembers = (): UseFamilyMembersReturn => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [members, setMembers] = useState<FamilyMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [activeMember, setActiveMember] = useState<FamilyMember | null>(null);

    const fetchMembers = useCallback(async () => {
        if (!user) {
            setMembers([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('family_members')
                .select('*')
                .eq('owner_id', user.id)
                .eq('is_active', true)
                .order('relationship', { ascending: true })
                .order('full_name', { ascending: true });

            if (fetchError) throw fetchError;

            const mappedMembers: FamilyMember[] = (data || []).map(row => ({
                id: row.id,
                fullName: row.full_name,
                birthDate: row.birth_date,
                sex: row.sex as FamilyMember['sex'],
                relationship: row.relationship as FamilyMember['relationship'],
                avatarUrl: row.avatar_url,
                isActive: row.is_active,
                createdAt: row.created_at,
            }));

            setMembers(mappedMembers);

            // Set self as active by default if no active member
            if (!activeMember) {
                const selfMember = mappedMembers.find(m => m.relationship === 'self');
                if (selfMember) {
                    setActiveMember(selfMember);
                }
            }
        } catch (err) {
            console.error('Error fetching family members:', err);
            setError(err instanceof Error ? err : new Error('Failed to fetch family members'));
        } finally {
            setLoading(false);
        }
    }, [user, activeMember]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    const addMember = useCallback(async (data: FamilyMemberInput): Promise<FamilyMember | null> => {
        if (!user) return null;

        try {
            const { data: newMember, error: insertError } = await supabase
                .from('family_members')
                .insert({
                    owner_id: user.id,
                    full_name: data.fullName,
                    birth_date: data.birthDate || null,
                    sex: data.sex || null,
                    relationship: data.relationship,
                    avatar_url: data.avatarUrl || null,
                })
                .select()
                .single();

            if (insertError) throw insertError;

            const mapped: FamilyMember = {
                id: newMember.id,
                fullName: newMember.full_name,
                birthDate: newMember.birth_date,
                sex: newMember.sex as FamilyMember['sex'],
                relationship: newMember.relationship as FamilyMember['relationship'],
                avatarUrl: newMember.avatar_url,
                isActive: newMember.is_active,
                createdAt: newMember.created_at,
            };

            setMembers(prev => [...prev, mapped]);

            toast({
                title: 'Membro adicionado',
                description: `${data.fullName} foi adicionado à sua família.`,
            });

            return mapped;
        } catch (err) {
            console.error('Error adding family member:', err);
            toast({
                title: 'Erro',
                description: 'Não foi possível adicionar o membro da família.',
                variant: 'destructive',
            });
            return null;
        }
    }, [user, toast]);

    const updateMember = useCallback(async (
        id: string,
        data: Partial<FamilyMemberInput>
    ): Promise<boolean> => {
        try {
            const updateData: Record<string, unknown> = {};
            if (data.fullName !== undefined) updateData.full_name = data.fullName;
            if (data.birthDate !== undefined) updateData.birth_date = data.birthDate;
            if (data.sex !== undefined) updateData.sex = data.sex;
            if (data.relationship !== undefined) updateData.relationship = data.relationship;
            if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl;
            updateData.updated_at = new Date().toISOString();

            const { error: updateError } = await supabase
                .from('family_members')
                .update(updateData)
                .eq('id', id);

            if (updateError) throw updateError;

            setMembers(prev => prev.map(m =>
                m.id === id
                    ? {
                        ...m,
                        ...data,
                        fullName: data.fullName ?? m.fullName,
                    }
                    : m
            ));

            toast({
                title: 'Membro atualizado',
                description: 'As informações foram atualizadas com sucesso.',
            });

            return true;
        } catch (err) {
            console.error('Error updating family member:', err);
            toast({
                title: 'Erro',
                description: 'Não foi possível atualizar o membro.',
                variant: 'destructive',
            });
            return false;
        }
    }, [toast]);

    const deleteMember = useCallback(async (id: string): Promise<boolean> => {
        try {
            // Soft delete - just mark as inactive
            const { error: deleteError } = await supabase
                .from('family_members')
                .update({ is_active: false, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (deleteError) throw deleteError;

            setMembers(prev => prev.filter(m => m.id !== id));

            // Clear active member if it was deleted
            if (activeMember?.id === id) {
                const remaining = members.filter(m => m.id !== id);
                setActiveMember(remaining.find(m => m.relationship === 'self') || remaining[0] || null);
            }

            toast({
                title: 'Membro removido',
                description: 'O membro foi removido da sua família.',
            });

            return true;
        } catch (err) {
            console.error('Error deleting family member:', err);
            toast({
                title: 'Erro',
                description: 'Não foi possível remover o membro.',
                variant: 'destructive',
            });
            return false;
        }
    }, [toast, activeMember, members]);

    return {
        members,
        loading,
        error,
        activeMember,
        setActiveMember,
        addMember,
        updateMember,
        deleteMember,
        refetch: fetchMembers,
    };
};
