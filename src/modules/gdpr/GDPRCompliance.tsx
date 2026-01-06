import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Shield, Download, Trash2, AlertTriangle, CheckCircle2, Loader2, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Consent {
  consent_type: string;
  granted: boolean;
  granted_at: string | null;
  revoked_at: string | null;
}

interface ExportRequest {
  id: string;
  status: string;
  download_url: string | null;
  expires_at: string | null;
  requested_at: string;
}

interface DeletionRequest {
  id: string;
  status: string;
  reason: string | null;
  cooling_off_ends_at: string | null;
  requested_at: string;
}

const CONSENT_TYPES = [
  { id: 'marketing_emails', label: 'Marketing Emails', description: 'Receive promotional emails and newsletters' },
  { id: 'analytics_tracking', label: 'Analytics', description: 'Allow usage analytics to improve our service' },
  { id: 'third_party_sharing', label: 'Third-party Sharing', description: 'Share data with trusted partners' },
];

export function ConsentManagement() {
  const { user } = useAuth();
  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) fetchConsents();
  }, [user]);

  const fetchConsents = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gdpr_consents')
        .select('consent_type, granted')
        .eq('user_id', user.id);

      if (error) throw error;

      const consentMap: Record<string, boolean> = {};
      CONSENT_TYPES.forEach(ct => consentMap[ct.id] = false);
      data?.forEach(c => consentMap[c.consent_type] = c.granted);
      setConsents(consentMap);
    } catch (error) {
      console.error('Error fetching consents:', error);
      toast.error('Failed to load privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const updateConsent = async (consentType: string, granted: boolean) => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('gdpr_consents')
        .upsert({
          user_id: user.id,
          consent_type: consentType,
          granted,
          granted_at: granted ? new Date().toISOString() : null,
          revoked_at: granted ? null : new Date().toISOString(),
          user_agent: navigator.userAgent,
        }, { onConflict: 'user_id,consent_type' });

      if (error) throw error;

      setConsents(prev => ({ ...prev, [consentType]: granted }));
      toast.success(`Privacy setting ${granted ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error updating consent:', error);
      toast.error('Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Privacy Settings
        </CardTitle>
        <CardDescription>
          Manage your data privacy preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {CONSENT_TYPES.map(ct => (
          <div key={ct.id} className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor={ct.id} className="text-base">{ct.label}</Label>
              <p className="text-sm text-muted-foreground">{ct.description}</p>
            </div>
            <Switch
              id={ct.id}
              checked={consents[ct.id] || false}
              onCheckedChange={(checked) => updateConsent(ct.id, checked)}
              disabled={saving}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function DataExportRequest() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ExportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (user) fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('data_export_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('requested_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching export requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestExport = async () => {
    if (!user) return;
    setRequesting(true);
    try {
      const { error } = await supabase
        .from('data_export_requests')
        .insert({
          user_id: user.id,
          status: 'pending',
        });

      if (error) throw error;

      toast.success('Data export requested. You will be notified when ready.');
      fetchRequests();
    } catch (error) {
      console.error('Error requesting export:', error);
      toast.error('Failed to request data export');
    } finally {
      setRequesting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      processing: 'secondary',
      completed: 'default',
      failed: 'destructive',
      expired: 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Your Data
        </CardTitle>
        <CardDescription>
          Request a copy of all your personal data (GDPR Right to Access)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={requestExport} disabled={requesting}>
          {requesting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Requesting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Request Data Export
            </>
          )}
        </Button>

        {requests.length > 0 && (
          <div className="space-y-2 mt-4">
            <h4 className="text-sm font-medium">Recent Requests</h4>
            {requests.map(req => (
              <div key={req.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                <span>{new Date(req.requested_at).toLocaleDateString()}</span>
                {getStatusBadge(req.status)}
                {req.status === 'completed' && req.download_url && (
                  <a href={req.download_url} className="text-primary hover:underline">
                    Download
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DataDeletionRequest() {
  const { user } = useAuth();
  const [request, setRequest] = useState<DeletionRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (user) fetchRequest();
  }, [user]);

  const fetchRequest = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('deletion_requests')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pending', 'cooling_off', 'processing'])
        .maybeSingle();

      if (error) throw error;
      setRequest(data);
    } catch (error) {
      console.error('Error fetching deletion request:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestDeletion = async () => {
    if (!user) return;
    setRequesting(true);
    try {
      const coolingOffEnds = new Date();
      coolingOffEnds.setDate(coolingOffEnds.getDate() + 30);

      const { error } = await supabase
        .from('deletion_requests')
        .insert({
          user_id: user.id,
          status: 'cooling_off',
          reason: reason || null,
          cooling_off_ends_at: coolingOffEnds.toISOString(),
        });

      if (error) throw error;

      toast.success('Account deletion requested. You have 30 days to cancel.');
      fetchRequest();
    } catch (error) {
      console.error('Error requesting deletion:', error);
      toast.error('Failed to request account deletion');
    } finally {
      setRequesting(false);
    }
  };

  const cancelDeletion = async () => {
    if (!user || !request) return;
    setRequesting(true);
    try {
      const { error } = await supabase
        .from('deletion_requests')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      if (error) throw error;

      toast.success('Account deletion cancelled');
      setRequest(null);
    } catch (error) {
      console.error('Error cancelling deletion:', error);
      toast.error('Failed to cancel deletion');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (request) {
    const daysRemaining = request.cooling_off_ends_at 
      ? Math.max(0, Math.ceil((new Date(request.cooling_off_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0;

    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Clock className="h-5 w-5" />
            Deletion Pending
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Account scheduled for deletion</AlertTitle>
            <AlertDescription>
              Your account will be permanently deleted in {daysRemaining} days. 
              All your data will be removed. You can cancel this request before the deadline.
            </AlertDescription>
          </Alert>
          <Button variant="outline" onClick={cancelDeletion} disabled={requesting}>
            {requesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Cancel Deletion Request
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Delete Your Account
        </CardTitle>
        <CardDescription>
          Permanently delete your account and all associated data (GDPR Right to Erasure)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            This action is irreversible. After 30 days, all your personal data will be permanently deleted.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="reason">Reason (optional)</Label>
          <Textarea
            id="reason"
            placeholder="Help us improve - why are you leaving?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Request Account Deletion
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will schedule your account for permanent deletion after a 30-day cooling-off period. 
                You can cancel this request within 30 days.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={requestDeletion} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Yes, delete my account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

export function GDPRComplianceDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Privacy & GDPR</h1>
          <p className="text-muted-foreground">Manage your data privacy settings</p>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <ConsentManagement />
        <DataExportRequest />
      </div>
      <DataDeletionRequest />
    </div>
  );
}

export default GDPRComplianceDashboard;
