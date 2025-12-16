// src/pages/settings/SettingsGeneral.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGym } from "@/contexts/GymContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type GeneralSettings = {
  gym_name?: string;
  timezone?: string;
  currency?: string;
  locale?: string;
};

export default function SettingsGeneral() {
  const { gym } = useGym();
  const gymId = gym?.id;

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [data, setData] = useState<GeneralSettings>({
    gym_name: "",
    timezone: "",
    currency: "AOA",
    locale: "pt-PT",
  });

  useEffect(() => {
    if (!gymId) return;

    setLoading(true);
    supabase
      .from("gyms") // IMPORTANT: use your existing gyms table
      .select("name, timezone, currency, locale")
      .eq("id", gymId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error(error);
          setMessage("Erro ao carregar dados do ginásio.");
          return;
        }

        setData({
          gym_name: data.name ?? "",
          timezone: data.timezone ?? "",
          currency: data.currency ?? "AOA",
          locale: data.locale ?? "pt-PT",
        });
      })
      .finally(() => setLoading(false));
  }, [gymId]);

  async function handleSave() {
    if (!gymId) return;

    setLoading(true);
    setMessage(null);

    const { error } = await supabase
      .from("gyms")
      .update({
        name: data.gym_name,
        timezone: data.timezone,
        currency: data.currency,
        locale: data.locale,
      })
      .eq("id", gymId);

    if (error) {
      console.error(error);
      setMessage("Erro ao guardar alterações.");
    } else {
      setMessage("Definições actualizadas com sucesso.");
    }

    setLoading(false);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <label className="block text-sm font-medium">Nome do ginásio</label>
        <Input
          value={data.gym_name}
          onChange={(e) => setData({ ...data, gym_name: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium">Fuso horário</label>
          <Input
            placeholder="Africa/Luanda"
            value={data.timezone}
            onChange={(e) => setData({ ...data, timezone: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Moeda</label>
          <Input
            value={data.currency}
            onChange={(e) => setData({ ...data, currency: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Idioma</label>
          <Input
            placeholder="pt-PT"
            value={data.locale}
            onChange={(e) => setData({ ...data, locale: e.target.value })}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "A guardar..." : "Guardar alterações"}
        </Button>
        {message && <span className="text-sm">{message}</span>}
      </div>
    </div>
  );
}
