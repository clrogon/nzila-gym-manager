import { useState, useRef } from 'react';
import { useGym } from '@/contexts/GymContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Upload, CheckCircle2, XCircle, AlertTriangle, FileText, Loader2 } from 'lucide-react';
import { 
  parseMulticaixaProof, 
  validateProofIBAN, 
  formatAngolaCurrency,
  ParsedMulticaixaProof 
} from '@/lib/multicaixaParser';

interface Props {
  onProofValidated?: (proof: ParsedMulticaixaProof, matchedPaymentId: string | null) => void;
}

export function MulticaixaProofUpload({ onProofValidated }: Props) {
  const { currentGym } = useGym();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [parsedProof, setParsedProof] = useState<ParsedMulticaixaProof | null>(null);
  const [ibanValidation, setIbanValidation] = useState<{ valid: boolean; error?: string } | null>(null);
  const [matchedPayment, setMatchedPayment] = useState<{ id: string; amount: number; member_name: string } | null>(null);
  const [textInput, setTextInput] = useState('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      // For demo, we'll read text files directly
      // In production, this would use an OCR service
      if (file.type.includes('text') || file.name.endsWith('.txt')) {
        const text = await file.text();
        await processProofText(text);
      } else {
        // Simulate OCR for PDF/images
        toast.info('OCR Simulation', {
          description: 'In production, this would use OCR to extract text from the document. Please paste the proof text manually.',
        });
        setLoading(false);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Failed to process file');
      setLoading(false);
    }
  };

  const processProofText = async (text: string) => {
    setLoading(true);
    try {
      // Parse the proof
      const proof = parseMulticaixaProof(text);
      setParsedProof(proof);

      // Validate IBAN against gym settings
      if (proof.iban) {
        const { data: gym } = await supabase
          .from('gyms')
          .select('bank_iban')
          .eq('id', currentGym?.id)
          .single();

        const validation = validateProofIBAN(proof.iban, gym?.bank_iban || null);
        setIbanValidation(validation);
      }

      // Try to match with pending payment
      if (proof.amount && currentGym?.id) {
        const { data: payments } = await supabase
          .from('payments')
          .select('id, amount, member_id')
          .eq('gym_id', currentGym.id)
          .in('payment_status', ['pending'])
          .order('created_at', { ascending: false });

        if (payments) {
          // Find payment with matching amount (within 1% tolerance)
          const match = payments.find(p => {
            const diff = Math.abs(p.amount - (proof.amount || 0));
            return diff <= p.amount * 0.01;
          });

          if (match) {
            const { data: member } = await supabase
              .from('members')
              .select('full_name')
              .eq('id', match.member_id)
              .single();

            setMatchedPayment({
              id: match.id,
              amount: match.amount,
              member_name: member?.full_name || 'Unknown',
            });
          } else {
            setMatchedPayment(null);
          }
        }
      }

      if (proof.isValid) {
        toast.success('Proof parsed successfully');
      } else {
        toast.warning('Proof parsed with warnings', {
          description: proof.errors.join(', '),
        });
      }
    } catch (error) {
      console.error('Error processing proof:', error);
      toast.error('Failed to process proof');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmMatch = async () => {
    if (!parsedProof || !matchedPayment) return;

    try {
      const { error } = await supabase
        .from('payments')
        .update({
          payment_status: 'completed',
          paid_at: parsedProof.date || new Date().toISOString(),
          proof_verified: true,
          proof_transaction_id: parsedProof.transactionId,
        })
        .eq('id', matchedPayment.id);

      if (error) throw error;

      toast.success('Payment confirmed', {
        description: `Payment for ${matchedPayment.member_name} has been marked as completed.`,
      });

      onProofValidated?.(parsedProof, matchedPayment.id);
      
      // Reset state
      setParsedProof(null);
      setMatchedPayment(null);
      setIbanValidation(null);
      setTextInput('');
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error('Failed to confirm payment');
    }
  };

  const handleReset = () => {
    setParsedProof(null);
    setMatchedPayment(null);
    setIbanValidation(null);
    setTextInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Multicaixa Proof Processing
        </CardTitle>
        <CardDescription>
          Upload a payment proof (comprovativo) to automatically verify and match payments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!parsedProof ? (
          <>
            {/* File Upload */}
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf,image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="proof-upload"
              />
              <label
                htmlFor="proof-upload"
                className="flex flex-col items-center gap-2 cursor-pointer"
              >
                <Upload className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Click to upload or drag and drop
                </span>
                <span className="text-xs text-muted-foreground">
                  PDF, Image, or Text file
                </span>
              </label>
            </div>

            {/* Manual Text Input */}
            <div className="space-y-2">
              <Label>Or paste proof text:</Label>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste the content of your Multicaixa receipt here..."
                className="w-full h-32 p-3 text-sm border rounded-md bg-background resize-none"
              />
              <Button
                onClick={() => processProofText(textInput)}
                disabled={!textInput.trim() || loading}
                className="w-full"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Process Text
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Parsed Results */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Transaction ID</p>
                  <p className="font-mono font-medium">
                    {parsedProof.transactionId || 'Not found'}
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="font-medium">
                    {parsedProof.amount ? formatAngolaCurrency(parsedProof.amount) : 'Not found'}
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {parsedProof.date || 'Not found'}
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">IBAN</p>
                  <p className="font-mono text-sm">
                    {parsedProof.iban || 'Not found'}
                  </p>
                </div>
              </div>

              {/* IBAN Validation */}
              {ibanValidation && (
                <Alert variant={ibanValidation.valid ? 'default' : 'destructive'}>
                  {ibanValidation.valid ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  <AlertTitle>
                    {ibanValidation.valid ? 'IBAN Verified' : 'IBAN Mismatch'}
                  </AlertTitle>
                  <AlertDescription>
                    {ibanValidation.valid
                      ? 'The payment was sent to your registered account.'
                      : ibanValidation.error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Match Result */}
              {matchedPayment ? (
                <Alert>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <AlertTitle>Payment Match Found</AlertTitle>
                  <AlertDescription>
                    Matched with pending payment for <strong>{matchedPayment.member_name}</strong> 
                    {' '}({formatAngolaCurrency(matchedPayment.amount)})
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="default">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertTitle>No Match Found</AlertTitle>
                  <AlertDescription>
                    Could not find a pending payment matching this amount.
                  </AlertDescription>
                </Alert>
              )}

              {/* Errors */}
              {parsedProof.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertTitle>Parsing Warnings</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside">
                      {parsedProof.errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset} className="flex-1">
                  Try Another
                </Button>
                {matchedPayment && ibanValidation?.valid && (
                  <Button onClick={handleConfirmMatch} className="flex-1">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Confirm Payment
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
