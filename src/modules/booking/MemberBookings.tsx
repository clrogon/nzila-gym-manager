import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useGym } from "@/contexts/GymContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { BookingService } from "./bookingService";
import { Booking, BookingStatus } from "./types";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Loader2, 
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";

interface ClassWithBooking {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  capacity: number;
  status: string;
  location?: { name: string } | null;
  bookings_count?: number;
  user_booking?: {
    id: string;
    status: BookingStatus;
    booked_at: string;
    checked_in_at: string | null;
  } | null;
}

export default function MemberBookings() {
  const { user } = useAuth();
  const { currentGym } = useGym();
  const { toast } = useToast();
  
  const [classes, setClasses] = useState<ClassWithBooking[]>([]);
  const [myMemberId, setMyMemberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user && currentGym) {
      fetchMemberIdAndClasses();
    }
  }, [user, currentGym]);

  const fetchMemberIdAndClasses = async () => {
    if (!user || !currentGym) return;

    setLoading(true);
    try {
      // 1. Get member ID for current user
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user.id)
        .eq('gym_id', currentGym.id)
        .maybeSingle();

      if (memberError) throw memberError;

      if (!member) {
        toast({
          title: "Perfil não encontrado",
          description: "Não foi possível encontrar o seu perfil de membro.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      setMyMemberId(member.id);

      // 2. Fetch upcoming classes with user's bookings
      await fetchClasses(member.id);
    } catch (error: any) {
      console.error('Failed to load data:', error?.message);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar as aulas disponíveis.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async (memberId: string) => {
    if (!currentGym) return;

    try {
      // Fetch upcoming classes
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select(`
          id,
          title,
          description,
          start_time,
          end_time,
          capacity,
          status,
          location:locations(name)
        `)
        .eq('gym_id', currentGym.id)
        .gte('start_time', new Date().toISOString())
        .eq('status', 'scheduled')
        .order('start_time', { ascending: true })
        .limit(20);

      if (classesError) throw classesError;

      // Fetch user's bookings for these classes
      const classIds = classesData?.map(c => c.id) || [];
      
      let userBookingsData: any[] = [];
      if (classIds.length > 0) {
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('class_bookings')
          .select('id, class_id, status, booked_at, checked_in_at')
          .eq('member_id', memberId)
          .in('class_id', classIds)
          .in('status', ['booked', 'confirmed', 'waitlisted']);

        if (bookingsError) throw bookingsError;
        userBookingsData = bookingsData || [];
      }

      // Get booking counts for each class
      const classesWithBookings: ClassWithBooking[] = await Promise.all(
        (classesData || []).map(async (cls) => {
          // Count bookings
          const { count } = await supabase
            .from('class_bookings')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', cls.id)
            .in('status', ['booked', 'confirmed']);

          // Find user's booking
          const userBooking = userBookingsData.find(b => b.class_id === cls.id);

          return {
            ...cls,
            bookings_count: count || 0,
            user_booking: userBooking || null
          };
        })
      );

      setClasses(classesWithBookings);
    } catch (error: any) {
      console.error('Failed to fetch classes:', error?.message);
      throw error;
    }
  };

  const handleBookClass = async (classItem: ClassWithBooking) => {
    if (!myMemberId || !currentGym) return;

    setActionLoading(classItem.id);
    try {
      await BookingService.createBooking(classItem.id, myMemberId, currentGym.id);
      
      toast({
        title: "Reserva criada",
        description: classItem.capacity && (classItem.bookings_count || 0) >= classItem.capacity
          ? "Foi adicionado à lista de espera"
          : "A sua reserva foi confirmada"
      });

      await fetchClasses(myMemberId);
    } catch (error: any) {
      console.error('Booking failed:', error?.message);
      toast({
        title: "Erro ao reservar",
        description: error?.message || "Não foi possível criar a reserva",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!user || !myMemberId) return;

    if (!confirm("Tem a certeza que deseja cancelar esta reserva?")) return;

    setActionLoading(bookingId);
    try {
      await BookingService.cancelBooking(bookingId, user.id);
      
      toast({
        title: "Reserva cancelada",
        description: "A sua reserva foi cancelada com sucesso"
      });

      await fetchClasses(myMemberId);
    } catch (error: any) {
      console.error('Cancel failed:', error?.message);
      toast({
        title: "Erro ao cancelar",
        description: error?.message || "Não foi possível cancelar a reserva",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: BookingStatus) => {
    const config = {
      confirmed: { 
        variant: "default" as const, 
        icon: CheckCircle2, 
        label: "Confirmado",
        color: "text-green-600"
      },
      booked: { 
        variant: "default" as const, 
        icon: CheckCircle2, 
        label: "Reservado",
        color: "text-blue-600"
      },
      waitlisted: { 
        variant: "secondary" as const, 
        icon: AlertCircle, 
        label: "Lista de Espera",
        color: "text-yellow-600"
      },
      cancelled: { 
        variant: "outline" as const, 
        icon: XCircle, 
        label: "Cancelado",
        color: "text-muted-foreground"
      }
    };

    const { variant, icon: Icon, label, color } = config[status] || config.booked;
    
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className={`w-3 h-3 ${color}`} />
        {label}
      </Badge>
    );
  };

  const isFull = (classItem: ClassWithBooking) => {
    return (classItem.bookings_count || 0) >= classItem.capacity;
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Por favor, inicie sessão para ver as aulas.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!currentGym) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Por favor, selecione um ginásio.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">As Minhas Reservas</h1>
          <p className="text-muted-foreground">Reserve a sua vaga nas próximas aulas</p>
        </div>

        {classes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhuma aula disponível de momento
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {classes.map((classItem) => (
              <Card key={classItem.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{classItem.title}</CardTitle>
                      {classItem.description && (
                        <p className="text-sm text-muted-foreground">
                          {classItem.description}
                        </p>
                      )}
                    </div>
                    {classItem.user_booking && (
                      getStatusBadge(classItem.user_booking.status)
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    {/* Class Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {format(new Date(classItem.start_time), "EEEE, d 'de' MMMM", { locale: pt })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>
                          {format(new Date(classItem.start_time), "HH:mm")} - {format(new Date(classItem.end_time), "HH:mm")}
                        </span>
                      </div>

                      {classItem.location && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{classItem.location.name}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>
                          {classItem.bookings_count || 0} / {classItem.capacity} reservas
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <div>
                        {isFull(classItem) && !classItem.user_booking && (
                          <p className="text-xs text-yellow-600 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Aula cheia - será adicionado à lista de espera
                          </p>
                        )}
                      </div>

                      <div>
                        {!classItem.user_booking ? (
                          <Button 
                            onClick={() => handleBookClass(classItem)}
                            disabled={actionLoading === classItem.id}
                          >
                            {actionLoading === classItem.id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                A reservar...
                              </>
                            ) : (
                              "Reservar"
                            )}
                          </Button>
                        ) : classItem.user_booking.status !== 'cancelled' ? (
                          <Button
                            variant="outline"
                            onClick={() => handleCancelBooking(classItem.user_booking!.id)}
                            disabled={actionLoading === classItem.user_booking!.id}
                          >
                            {actionLoading === classItem.user_booking!.id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                A cancelar...
                              </>
                            ) : (
                              "Cancelar Reserva"
                            )}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
