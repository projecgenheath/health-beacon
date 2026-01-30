import { useState } from 'react';
import { useFamilyMembers, FamilyMember, getRelationshipLabel } from '@/hooks/useFamilyMembers';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Users,
    ChevronDown,
    Plus,
    User,
    Baby,
    Heart,
    UserPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface FamilyMemberSelectorProps {
    onMemberChange?: (member: FamilyMember | null) => void;
    className?: string;
}

const relationshipIcons: Record<FamilyMember['relationship'], React.ReactNode> = {
    self: <User className="h-4 w-4" />,
    spouse: <Heart className="h-4 w-4" />,
    child: <Baby className="h-4 w-4" />,
    parent: <Users className="h-4 w-4" />,
    sibling: <Users className="h-4 w-4" />,
    other: <UserPlus className="h-4 w-4" />,
};

/**
 * Seletor de membro da família
 * Permite alternar entre perfis de familiares para visualizar exames
 */
export const FamilyMemberSelector = ({
    onMemberChange,
    className
}: FamilyMemberSelectorProps) => {
    const {
        members,
        loading,
        activeMember,
        setActiveMember,
        addMember
    } = useFamilyMembers();

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberRelationship, setNewMemberRelationship] = useState<FamilyMember['relationship']>('child');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleMemberSelect = (member: FamilyMember) => {
        setActiveMember(member);
        onMemberChange?.(member);
    };

    const handleAddMember = async () => {
        if (!newMemberName.trim()) return;

        setIsSubmitting(true);
        const result = await addMember({
            fullName: newMemberName.trim(),
            relationship: newMemberRelationship,
        });

        if (result) {
            setNewMemberName('');
            setNewMemberRelationship('child');
            setIsAddDialogOpen(false);
        }
        setIsSubmitting(false);
    };

    const getInitials = (name: string): string => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    if (loading) {
        return (
            <div className={cn('flex items-center gap-2', className)}>
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-24" />
            </div>
        );
    }

    // If no family members yet, show a simple button to add
    if (members.length === 0) {
        return (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className={cn('gap-2', className)}
                    >
                        <UserPlus className="h-4 w-4" />
                        Adicionar Familiar
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adicionar Membro da Família</DialogTitle>
                        <DialogDescription>
                            Adicione membros da família para gerenciar os exames de todos em um só lugar.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome Completo</Label>
                            <Input
                                id="name"
                                value={newMemberName}
                                onChange={(e) => setNewMemberName(e.target.value)}
                                placeholder="Ex: Maria Silva"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="relationship">Parentesco</Label>
                            <Select
                                value={newMemberRelationship}
                                onValueChange={(v) => setNewMemberRelationship(v as FamilyMember['relationship'])}
                            >
                                <SelectTrigger id="relationship">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="spouse">Cônjuge</SelectItem>
                                    <SelectItem value="child">Filho(a)</SelectItem>
                                    <SelectItem value="parent">Pai/Mãe</SelectItem>
                                    <SelectItem value="sibling">Irmão(ã)</SelectItem>
                                    <SelectItem value="other">Outro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleAddMember} disabled={isSubmitting || !newMemberName.trim()}>
                            {isSubmitting ? 'Adicionando...' : 'Adicionar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <div className={cn('flex items-center gap-2', className)}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={activeMember?.avatarUrl || undefined} />
                            <AvatarFallback className="text-xs">
                                {activeMember ? getInitials(activeMember.fullName) : '?'}
                            </AvatarFallback>
                        </Avatar>
                        <span className="max-w-[120px] truncate">
                            {activeMember?.fullName || 'Selecionar'}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Família
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {members.map((member) => (
                        <DropdownMenuItem
                            key={member.id}
                            className={cn(
                                'flex items-center gap-3 cursor-pointer',
                                activeMember?.id === member.id && 'bg-accent'
                            )}
                            onClick={() => handleMemberSelect(member)}
                        >
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={member.avatarUrl || undefined} />
                                <AvatarFallback className="text-xs">
                                    {getInitials(member.fullName)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{member.fullName}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    {relationshipIcons[member.relationship]}
                                    {getRelationshipLabel(member.relationship)}
                                </p>
                            </div>
                        </DropdownMenuItem>
                    ))}

                    <DropdownMenuSeparator />

                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <DropdownMenuItem
                                className="flex items-center gap-2 cursor-pointer"
                                onSelect={(e) => e.preventDefault()}
                            >
                                <Plus className="h-4 w-4" />
                                Adicionar membro
                            </DropdownMenuItem>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Adicionar Membro da Família</DialogTitle>
                                <DialogDescription>
                                    Adicione um novo membro para gerenciar seus exames.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="add-name">Nome Completo</Label>
                                    <Input
                                        id="add-name"
                                        value={newMemberName}
                                        onChange={(e) => setNewMemberName(e.target.value)}
                                        placeholder="Ex: João Silva"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="add-relationship">Parentesco</Label>
                                    <Select
                                        value={newMemberRelationship}
                                        onValueChange={(v) => setNewMemberRelationship(v as FamilyMember['relationship'])}
                                    >
                                        <SelectTrigger id="add-relationship">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="spouse">Cônjuge</SelectItem>
                                            <SelectItem value="child">Filho(a)</SelectItem>
                                            <SelectItem value="parent">Pai/Mãe</SelectItem>
                                            <SelectItem value="sibling">Irmão(ã)</SelectItem>
                                            <SelectItem value="other">Outro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button onClick={handleAddMember} disabled={isSubmitting || !newMemberName.trim()}>
                                    {isSubmitting ? 'Adicionando...' : 'Adicionar'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};
