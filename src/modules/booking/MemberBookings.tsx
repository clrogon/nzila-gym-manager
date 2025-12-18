import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";

interface ClassItem {
  id: string;
  title: string;
  startsAt: string;
  capacity: number;
  coachName?: string;
  booking?: {
    id: string;
    status: "confirmed" | "waitlisted";
  };
}

export default function MemberBookings() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    const res = await fetch("/api/classes?scope=member");
    const data = await res.json();
    setClasses(data);
    setLoading(false);
  };

  const bookClass = async (classId: string) => {
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classId }),
    });

    if (!res.ok) {
      const err = await res.json();
      toast({ title: "Erro", description: err.error, variant: "destructive" });
      return;
    }

    toast({ title: "Reserva criada" });
    fetchClasses();
  };

  const cancelBooking = async (bookingId: string) => {
    await fetch(`/api/bookings/${bookingId}`, {
      method: "DELETE",
    });

    toast({ title: "Reserva cancelada" });
    fetchClasses();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">A carregar aulas…</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Aulas Disponíveis</h1>

        {classes.map((cls) => (
          <Card key={cls.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="font-semibold">{cls.title}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(cls.startsAt).toLocaleString()}
                </p>

                {cls.booking && (
                  <Badge
                    className="mt-2"
                    variant={
                      cls.booking.status === "confirmed"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {cls.booking.status === "confirmed"
                      ? "Confirmado"
                      : "Lista de Espera"}
                  </Badge>
                )}
              </div>

              <div>
                {!cls.booking && (
                  <Button onClick={() => bookClass(cls.id)}>
                    Reservar
                  </Button>
                )}

                {cls.booking && (
                  <Button
                    variant="outline"
                    onClick={() => cancelBooking(cls.booking!.id)}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
