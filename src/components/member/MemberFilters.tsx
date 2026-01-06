import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MemberFilters } from '@/hooks/useMembersData';

interface MemberFiltersProps {
  filters: MemberFilters;
  onFilterChange: (filters: MemberFilters) => void;
  memberCount: number;
}

/**
 * Member Filters Component
 * Handles search and filtering with proper state management
 */
export function MemberFilters({ filters, onFilterChange, memberCount }: MemberFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.searchQuery);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    // Debounce search to avoid excessive re-renders
    const timeoutId = setTimeout(() => {
      onFilterChange({ ...filters, searchQuery: value });
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleStatusChange = (status: string) => {
    onFilterChange({ ...filters, statusFilter: status });
  };

  return (
    <div className="flex items-center justify-between space-y-4 py-4">
      <div className="flex items-center space-x-2 flex-1">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search members..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>

        <Select value={filters.statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>

        <div className="text-sm text-gray-500 ml-4">
          Showing {memberCount} members
        </div>
      </div>
    </div>
  );
}
