// src/pages/settings/SettingsGeneral.tsx
import { useState, useEffect } from "react";
import { useGym } from "@/contexts/GymContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type SettingsRow = {
  id?: string;
  gym_id: string;
  org_name?: string;
  timezone?: string;
  currency?: string;
  locale?: string;
  logo_path?: string | null;
  updated_at?: string | null;
  updated_by?: string | null;
};

export default function SettingsGeneral() {
  const { gym, user } = useGym(); // assumption: useGym provides gym and current user
  const gymId = gym?.id;
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<Partial<SettingsRow>>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!gymId) return;
    let ignore = false;
    setLoading(true);
    supabase
      .from<SettingsRow>("settings")
      .select("*")
      .eq("gym_id", gymId)
      .single()
      .then(({ data, error }) => {
        if (ignore) return;
        if (error && error.code !== "PGRST116") {
          console.error("fetch settings error", error);
          setMessage("Erro ao carregar definições.");
        } else if (data) {
          setSettings(data);
        }
      })
      .finally(() => setLoading(false));
    return () => {
      ignore = true;
    };
  }, [gymId]);

  async function uploadLogoAndGetPath(file: File) {
    if (!gymId) throw new Error("Missing gymId");
    const ext = file.name.split(".").pop();
    const filename = `logo-${gymId}.${ext}`;
    const { data, error } = await supabase.storage
      .from("logos")
      .upload(`${gymId}/${filename}`, file, { upsert: true });
    if (error) throw error;
    return data.path; // path in bucket
  }

  async function handleSave(e?: React.FormEvent) {
    e?.preventDefault();
    if (!gymId) {
      setMessage("Organization not loaded.");
      return;
    }
    setLoading(true);
    setMessage(null);

    try {
      let logo_path = settings.logo_path || null;
      if (logoFile) {
        const path = await uploadLogoAndGetPath(logoFile);
        logo_path = path;
      }

      const payload = {
        gym_id: gymId,
        org_name: settings.org_name || "",
        timezone: settings.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        currency: settings.currency || "AOA",
        locale: settings.locale || "pt-PT",
        logo_path,
        updated_by: user?.id ?? null,
      };

      const { data, error } = await supabase.from("settings").upsert(payload, { returning: "representation" }).select();
      if (error) {
        console.error("upsert error", error);
        setMessage("Erro ao guardar definições.");
      } else {
        setSettings((data as SettingsRow[])[0] || payload);
        setMessage("Definições guardadas.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Erro inesperado ao guardar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout title="Definições — Geral">
      <form onSubmit={handleSave} className="max-w-3xl space-y-6">
        <div>
          <label className="block text-sm font-medium">Nome do Ginásio</label>
          <Input
            value={settings.org_name || ""}
            onChange={(e) => setSettings({ ...settings, org_name: e.target.value })}
            placeholder="Ex: Nzila Fitness"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium">Fuso horário</label>
            <Input
              value={settings.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              placeholder="Africa/Luanda"
            />
            <p className="text-xs text-muted-foreground mt-1">Use formato IANA (ex: Africa/Luanda)</p>
          </div>

          <div>
            <label className="block text-sm font-medium">Moeda</label>
            <Input
              value={settings.currency || "AOA"}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              placeholder="AOA"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Localização / Idioma</label>
            <Input
              value={settings.locale || "pt-PT"}
              onChange={(e) => setSettings({ ...settings, locale: e.target.value })}
              placeholder="pt-PT"
            />
            <p className="text-xs text-muted-foreground mt-1">Ex: pt-PT ou pt-BR</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Logo (PNG/JPG)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(ev) => {
              const f = ev.target.files?.[0] ?? null;
              setLogoFile(f);
            }}
          />
          {settings.logo_path && !logoFile && (
            <div className="mt-2">
              <p className="text-xs">Logo actual:</p>
              <img
                src={supabase.storage.from("logos").getPublicUrl(settings.logo_path).publicURL}
                alt="Logo"
                className="h-20"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "A gravar..." : "Guardar"}
          </Button>
          <Button variant="ghost" onClick={() => window.location.reload()}>
            Recarregar
          </Button>
          {message && <span className="text-sm">{message}</span>}
        </div>

        {settings.updated_at && (
          <div className="text-xs text-muted-foreground">
            Última alteração: {new Date(settings.updated_at).toLocaleString()} {settings.updated_by ? `por ${settings.updated_by}` : ""}
          </div>
        )}
      </form>
    </DashboardLayout>
  );
}
