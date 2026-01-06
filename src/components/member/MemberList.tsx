import React, { useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit, Trash2, Eye, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Member } from '@/hooks/useMembersData';

interface MemberListProps {
  members: Member[];
  onEdit: (member: Member) => void;
  onView: (member: Member) => void;
  onDelete: (memberId: string) => void;
  loading?: boolean;
}

/**
 * Member List Component
 * Displays members in a table with proper memoization to prevent re-renders
 */
export const MemberListItem = React.memo(function MemberListItem({ 
  member, 
  onEdit, 
  onView,
  onDelete 
}: { 
  member: Member; 
  onEdit: (member: Member) => void;
  onView: (member: Member) => void;
  onDelete: (memberId: string) => void;
}) {
  // Memoize status color function
  const getStatusColor = useCallback((status: string): string => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }, []);

  // Memoize action handlers
  const handleEdit = useCallback(() => {
    onEdit(member);
  }, [member, onEdit]);

  const handleView = useCallback(() => {
    onView(member);
  }, [member, onView]);

  const handleDelete = useCallback(() => {
    onDelete(member.id);
  }, [member.id, onDelete]);
  const getStatusColor = useCallback((status: string): string => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }, []);

  const handleEdit = useCallback(() => {
    onEdit(member);
  }, [member, onEdit]);

  const handleView = useCallback(() => {
    onView(member);
  }, [member, onView]);

  const handleDelete = useCallback(() => {
    onDelete(member.id);
  }, [member.id, onDelete]);

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            {member.photo_url ? (
              <AvatarImage src={member.photo_url} alt={member.full_name} />
            ) : (
              <AvatarFallback>{member.full_name?.charAt(0) || 'M'}</AvatarFallback>
            )}
          </Avatar>
          <span className="font-medium">{member.full_name}</span>
        </div>
      </TableCell>
      <TableCell>{member.email || '-'}</TableCell>
      <TableCell>{member.phone || '-'}</TableCell>
      <TableCell>
        <Badge className={getStatusColor(member.status)}>
          {member.status}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end space-x-2">
          <Button variant="ghost" size="sm" onClick={handleView}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleEdit}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});

/**
 * Main Member List Component
 */
export function MemberList({ members, onEdit, onView, onDelete, loading }: MemberListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading members...</div>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-2">
        <div className="text-gray-500 text-lg">No members found</div>
        <div className="text-gray-400 text-sm">Create a new member to get started</div>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <MemberListItem
            key={member.id}
            member={member}
            onEdit={onEdit}
            onView={onView}
            onDelete={onDelete}
          />
        ))}
      </TableBody>
    </Table>
  );
}
