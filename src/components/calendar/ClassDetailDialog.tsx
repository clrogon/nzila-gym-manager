import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useGym } from '@/contexts/GymContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Clock, MapPin, Users, User, AlertCircle, CheckCircle, XCircle, UserPlus } from 'lucide-react';

interface ClassEvent {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  capacity: number;
  status: string;
  is_recurring?: boolean;
  recurrence_rule?: string;
  class_type?: { name: string; color: string } | null;
  location?: { name: string } | null;
}

interface Booking {
  id: string;
  member_id: string;
  status: string;
  booked_at: string;
  checked_in_at: string | null;
  member?: { full_name: string; email: string | null } | null;
}

interface Props {
  classEvent: ClassEvent | null;
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export function ClassDetailDialog({ classEvent, open, onClose, onRefresh }: Props) {
  const { currentGym } = useGym();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [members, setMembers] = useState<{ id: string; full_name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && classEvent) {
      fetchBookings();
      fetchMembers();
    }
  }, [open, classEvent?.id]);

  const fetchBookings = async () => {
    if (!classEvent) return;
    const { data } = await supabase
      .from('class_bookings')
      .select('*, member:members(full_name, email)')
      .eq('class_id', classEvent.id)
      .order('booked_at');
    setBookings(data || []);
  };

  const fetchMembers = async () => {
    if (!currentGym?.id) return;
    const { data } = await supabase
      .from('members')
      .select('id, full_name')
      .eq('gym_id', currentGym.id)
      .eq('status', 'active');
    setMembers(data || []);
  };

  const confirmedBookings = bookings.filter(b => b.status === 'booked' || b.status === 'confirmed');
  const waitlistBookings = bookings.filter(b => b.status === 'waitlist');

  const handleAddBooking = async (memberId: string) => {
    if (!classEvent) return;
    setLoading(true);
    try {
      const isWaitlist = confirmedBookings.length >= classEvent.capacity;
      const { error } = await supabase.from('class_bookings').insert({
        class_id: classEvent.id,
        member_id: memberId,
        status: isWaitlist ? 'waitlist' : 'booked',
      });
      if (error) throw error;
      toast.success(isWaitlist ? 'Added to waitlist' : 'Booking confirmed');
      fetchBookings();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add booking');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('class_bookings')
        .update({ checked_in_at: new Date().toISOString(), status: 'confirmed' })
        .eq('id', bookingId);
      if (error) throw error;
      toast.success('Checked in');
      fetchBookings();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('class_bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);
      if (error) throw error;
      
      // Promote first waitlist member if any
      if (waitlistBookings.length > 0) {
        await supabase
          .from('class_bookings')
          .update({ status: 'booked' })
          .eq('id', waitlistBookings[0].id);
        toast.success('Booking cancelled. Next waitlist member promoted.');
      } else {
        toast.success('Booking cancelled');
      }
      fetchBookings();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleCancelClass = async () => {
    if (!classEvent) return;
    try {
      const { error } = await supabase
        .from('classes')
        .update({ status: 'cancelled' })
        .eq('id', classEvent.id);
      if (error) throw error;
      toast.success('Class cancelled');
      onRefresh();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (!classEvent) return null;

  const availableMembersForBooking = members.filter(
    m => !bookings.some(b => b.member_id === m.id && b.status !== 'cancelled')
  );

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: classEvent.class_type?.color || '#3B82F6' }}
            />
            {classEvent.title}
            {classEvent.status === 'cancelled' && (
              <Badge variant="destructive">Cancelled</Badge>
            )}
            {classEvent.is_recurring && (
              <Badge variant="secondary">Recurring</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Class Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              {format(parseISO(classEvent.start_time), 'PPP p')} -{' '}
              {format(parseISO(classEvent.end_time), 'p')}
            </div>
            {classEvent.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                {classEvent.location.name}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className={confirmedBookings.length >= classEvent.capacity ? 'text-destructive' : ''}>
                {confirmedBookings.length}/{classEvent.capacity} booked
              </span>
              {waitlistBookings.length > 0 && (
                <Badge variant="outline">{waitlistBookings.length} waitlist</Badge>
              )}
            </div>
          </div>

          {classEvent.description && (
            <p className="text-sm text-muted-foreground">{classEvent.description}</p>
          )}

          <Tabs defaultValue="bookings">
            <TabsList>
              <TabsTrigger value="bookings">
                Bookings ({confirmedBookings.length})
              </TabsTrigger>
              <TabsTrigger value="waitlist">
                Waitlist ({waitlistBookings.length})
              </TabsTrigger>
              <TabsTrigger value="add">Add Member</TabsTrigger>
            </TabsList>

            <TabsContent value="bookings">
              <ScrollArea className="h-[300px]">
                {confirmedBookings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No bookings yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {confirmedBookings.map(booking => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{booking.member?.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Booked {format(parseISO(booking.booked_at), 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {booking.checked_in_at ? (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Checked In
                            </Badge>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => handleCheckIn(booking.id)}>
                              Check In
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="waitlist">
              <ScrollArea className="h-[300px]">
                {waitlistBookings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No waitlist
                  </div>
                ) : (
                  <div className="space-y-2">
                    {waitlistBookings.map((booking, index) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <div>
                            <p className="font-medium">{booking.member?.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Added {format(parseISO(booking.booked_at), 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => handleCancelBooking(booking.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="add">
              <ScrollArea className="h-[300px]">
                {availableMembersForBooking.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    All members are already booked
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableMembersForBooking.map(member => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50"
                      >
                        <div className="flex items-center gap-3">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <p className="font-medium">{member.full_name}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddBooking(member.id)}
                          disabled={loading}
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          {confirmedBookings.length >= classEvent.capacity ? 'Add to Waitlist' : 'Book'}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {classEvent.status !== 'cancelled' && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button variant="destructive" onClick={handleCancelClass}>
                Cancel Class
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
