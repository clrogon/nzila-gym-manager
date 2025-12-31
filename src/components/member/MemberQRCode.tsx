import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface MemberQRCodeProps {
  memberId: string;
  memberName: string;
}

export default function MemberQRCode({ memberId, memberName }: MemberQRCodeProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Generate a simple QR code using a free API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(memberId)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(memberId);
      setCopied(true);
      toast({ title: 'ID copiado!', description: 'O seu ID de membro foi copiado.' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível copiar.', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <QrCode className="w-5 h-5 text-primary" />
          O Meu QR Code
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <img 
            src={qrCodeUrl} 
            alt="QR Code do Membro" 
            className="w-48 h-48"
          />
        </div>
        
        <p className="text-sm text-muted-foreground text-center">
          Mostre este código na receção para fazer check-in rápido
        </p>

        <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-lg">
          <code className="text-xs font-mono">{memberId.slice(0, 8)}...</code>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="w-3 h-3 text-green-600" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          {memberName}
        </p>
      </CardContent>
    </Card>
  );
}
