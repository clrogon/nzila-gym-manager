import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Image, Link, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LogoUploaderProps {
  currentLogoUrl: string | null;
  gymId: string;
  canEdit: boolean;
  onSave: () => Promise<void>;
}

export function LogoUploader({ currentLogoUrl, gymId, canEdit, onSave }: LogoUploaderProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState(currentLogoUrl || '');
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl);
  const [mode, setMode] = useState<'upload' | 'url'>(currentLogoUrl?.startsWith('http') ? 'url' : 'upload');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Erro', description: 'Por favor selecione uma imagem.', variant: 'destructive' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Erro', description: 'O ficheiro deve ter menos de 2MB.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${gymId}-logo-${Date.now()}.${fileExt}`;
      const filePath = `gym-logos/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('gym-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        // If bucket doesn't exist, fall back to base64
        const reader = new FileReader();
        reader.onload = async (event) => {
          const base64 = event.target?.result as string;
          await saveLogoUrl(base64);
        };
        reader.readAsDataURL(file);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('gym-assets')
        .getPublicUrl(filePath);

      await saveLogoUrl(publicUrl);
    } catch (error) {
      console.error('Upload failed:', error);
      toast({ title: 'Erro', description: 'Falha ao carregar logótipo.', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const saveLogoUrl = async (url: string) => {
    try {
      const { error } = await supabase
        .from('gyms')
        .update({ logo_url: url, updated_at: new Date().toISOString() })
        .eq('id', gymId);

      if (error) throw error;

      setPreviewUrl(url);
      setUrlInput(url);
      await onSave();
      toast({ title: 'Logótipo Atualizado', description: 'O logótipo foi guardado com sucesso.' });
    } catch (error) {
      console.error('Save logo failed:', error);
      toast({ title: 'Erro', description: 'Falha ao guardar logótipo.', variant: 'destructive' });
    }
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;

    // Basic URL validation
    try {
      new URL(urlInput);
    } catch {
      toast({ title: 'Erro', description: 'URL inválido.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    await saveLogoUrl(urlInput.trim());
    setUploading(false);
  };

  const removeLogo = async () => {
    if (!confirm('Tem a certeza que deseja remover o logótipo?')) return;

    setUploading(true);
    try {
      const { error } = await supabase
        .from('gyms')
        .update({ logo_url: null, updated_at: new Date().toISOString() })
        .eq('id', gymId);

      if (error) throw error;

      setPreviewUrl(null);
      setUrlInput('');
      await onSave();
      toast({ title: 'Logótipo Removido', description: 'O logótipo foi removido.' });
    } catch (error) {
      console.error('Remove logo failed:', error);
      toast({ title: 'Erro', description: 'Falha ao remover logótipo.', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">Logótipo do Ginásio</Label>
      
      <div className="flex items-start gap-6">
        {/* Preview */}
        <div className="relative group/logo">
          <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-border/60 flex items-center justify-center bg-muted/30 overflow-hidden transition-all duration-300 group-hover/logo:border-primary/40">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Logótipo"
                className="w-full h-full object-cover"
                onError={() => setPreviewUrl(null)}
              />
            ) : (
              <Image className="w-10 h-10 text-muted-foreground/40" />
            )}
          </div>
          {previewUrl && canEdit && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover/logo:opacity-100 transition-opacity"
              onClick={removeLogo}
              disabled={uploading}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Upload Options */}
        {canEdit && (
          <div className="flex-1">
            <Tabs value={mode} onValueChange={(v) => setMode(v as 'upload' | 'url')}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="upload" className="gap-2">
                  <Upload className="w-4 h-4" />
                  Carregar
                </TabsTrigger>
                <TabsTrigger value="url" className="gap-2">
                  <Link className="w-4 h-4" />
                  URL
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="w-full h-20 border-dashed"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <Upload className="w-5 h-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Clique ou arraste (max 2MB)
                      </span>
                    </div>
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="url" className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="https://exemplo.com/logo.png"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    disabled={uploading}
                  />
                  <Button onClick={handleUrlSubmit} disabled={uploading || !urlInput.trim()}>
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
