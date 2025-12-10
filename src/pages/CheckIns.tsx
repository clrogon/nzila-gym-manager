import { useEffect, useState } from 'react';
import { useGym } from '@/contexts/GymContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { UserCheck, Clock, LogOut } from 'lucide-react';
import { RequirePermission } from '@/components/common/RequirePermission';
import { useRBAC } from '@/hooks/useRBAC';

interface Member {
  id: string;
  full_name: string;
}

interface CheckIn {
  id: string;
  member_id: string;
  member_name: string;
  checked_in_at: string;
  checked_out_at: string | null;
}

export default function CheckIns() {
  const { currentGym } = useGym();
  const { toast } = useToast();
  const { hasPermission } = useRBAC();
  const [members, setMembers] = useState<Member[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentGym) {
      fetchMembers();
      fetchTodayCheckIns();
    }
  }, [currentGym]);

  const fetchMembers = async () => {
    if (!currentGym) return;

    const { data } = await supabase
      .from('members')
      .select('id, full_name')
      .eq('gym_id', currentGym.id)
      .eq('status', 'active')
      .order('full_name');

    setMembers(data || []);
  };

  const fetchTodayCheckIns = async () => {
    if (!currentGym) return;

    const today = new Date().toISOString().split('T')[0];

    try {
      const { data: checkInsData } = await supabase
        .from('check_ins')
        .select('id, member_id, checked_in_at, checked_out_at')
        .eq('gym_id', currentGym.id)
        .gte('checked_in_at', today)
        .order('checked_in_at', { ascending: false });

      if (checkInsData && checkInsData.length > 0) {
        const memberIds = [...new Set(checkInsData.map(c => c.member_id))];
        const { data: membersData } = await supabase
          .from('members')
          .select('id, full_name')
          .in('id', memberIds);

        const memberMap = new Map(membersData?.map(m => [m.id, m.full_name]));

        setCheckIns(
          checkInsData.map(c => ({
            ...c,
            member_name: memberMap.get(c.member_id) || 'Unknown',
          }))
        );
      } else {
        setCheckIns([]);
      }
    } catch (error) {
      console.error('Error fetching check-ins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!currentGym || !selectedMember) return;

    try {
      const { error } = await supabase.from('check_ins').insert({
        gym_id: currentGym.id,
        member_id: selectedMember.id,
      });

      if (error) throw error;

      toast({
        title: 'Checked In',
        description: `${selectedMember.full_name} has been checked in.`,
      });

      setSelectedMember(null);
      setSearchQuery('');
      fetchTodayCheckIns();
    } catch (error) {
      console.error('Error checking in:', error);
      toast({ title: 'Error', description: 'Failed to check in.', variant: 'destructive' });
    }
  };

  const handleCheckOut = async (checkInId: string, memberName: string) => {
    try {
      const { error } = await supabase
        .from('check_ins')
        .update({ checked_out_at: new Date().toISOString() })
        .eq('id', checkInId);

      if (error) throw error;

      toast({
        title: 'Checked Out',
        description: `${memberName} has been checked out.`,
      });

      fetchTodayCheckIns();
    } catch (error) {
      console.error('Error checking out:', error);
      toast({ title: 'Error', description: 'Failed to check out.', variant: 'destructive' });
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-AO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredMembers = members.filter(m =>
    m.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCheckIns = checkIns.filter(c => !c.checked_out_at);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Check-ins</h1>
          <p className="text-muted-foreground">Record member attendance</p>
        </div>

        {/* Quick Check-in */}
        <RequirePermission permission="checkins:create">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-primary" />
                Quick Check-in
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Command className="border rounded-lg">
                    <CommandInput
                      placeholder="Search member..."
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                    <CommandList>
                      <CommandEmpty>No member found.</CommandEmpty>
                      <CommandGroup>
                        {filteredMembers.slice(0, 5).map((member) => (
                          <CommandItem
                            key={member.id}
                            value={member.full_name}
                            onSelect={() => {
                              setSelectedMember(member);
                              setSearchQuery(member.full_name);
                            }}
                          >
                            {member.full_name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>
                <Button
                  onClick={handleCheckIn}
                  disabled={!selectedMember}
                  className="gradient-primary"
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Check In
                </Button>
              </div>
            </CardContent>
          </Card>
        </RequirePermission>

        {/* Currently in Gym */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent" />
              Currently in Gym ({activeCheckIns.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Checked In</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeCheckIns.length > 0 ? (
                  activeCheckIns.map((checkIn) => (
                    <TableRow key={checkIn.id}>
                      <TableCell className="font-medium">{checkIn.member_name}</TableCell>
                      <TableCell>{formatTime(checkIn.checked_in_at)}</TableCell>
                      <TableCell className="text-right">
                        <RequirePermission permission="checkins:update">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCheckOut(checkIn.id, checkIn.member_name)}
                          >
                            <LogOut className="w-4 h-4 mr-2" />
                            Check Out
                          </Button>
                        </RequirePermission>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      No one is currently checked in
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Today's History */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Check-in History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>In</TableHead>
                  <TableHead>Out</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checkIns.length > 0 ? (
                  checkIns.map((checkIn) => (
                    <TableRow key={checkIn.id}>
                      <TableCell className="font-medium">{checkIn.member_name}</TableCell>
                      <TableCell>{formatTime(checkIn.checked_in_at)}</TableCell>
                      <TableCell>
                        {checkIn.checked_out_at ? formatTime(checkIn.checked_out_at) : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      {loading ? 'Loading...' : 'No check-ins today'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}