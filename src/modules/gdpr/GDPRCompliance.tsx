// src/modules/gdpr/GDPRCompliance.tsx
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Trash2, Shield, AlertTriangle, FileText, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ConsentRecord {
  id: string;
  user_id: string;
  consent_type: 'marketing' | 'analytics' | 'essential' | 'third_party';
  granted: boolean;
  timestamp: string;
  ip_address: string | null;
  version: string;
}

interface DataExportRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requested_at: string;
  completed_at: string | null;
  download_url: string | null;
  expires_at: string | null;
}

interface DeletionRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected';
  reason: string;
  requested_at: string;
  scheduled_for: string | null;
  completed_at: string | null;
}

// Consent Management Component
export function ConsentManagement() {
  const { user } = useAuth();
  const [consents, setConsents] = useState<Record<string, boolean>>({
    marketing: false,
    analytics: false,
    third_party: false,
  });
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const CONSENT_VERSION = '1.0.0';

  const loadConsents = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_consents')
      .select('*')
      .eq('user_id', user.id)
      .eq('version', CONSENT_VERSION)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Failed to load consents:', error);
      return;
    }

    if (data && data.length > 0) {
      const consentMap: Record<string, boolean> = {};
      data.forEach(record => {
        consentMap[record.consent_type] = record.granted;
      });
      setConsents(consentMap);
      setLastUpdated(new Date(data[0].timestamp));
    }
  };

  const updateConsent = async (type: string, granted: boolean) => {
    if (!user) return;

    setLoading(true);
    try {
      // Get user's IP (in production, use a proper IP detection service)
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const { ip } = await ipResponse.json();

      const { error } = await supabase.from('user_consents').insert({
        user_id: user.id,
        consent_type: type,
        granted,
        version: CONSENT_VERSION,
        ip_address: ip,
        timestamp: new Date().toISOString(),
      });

      if (error) throw error;

      setConsents(prev => ({ ...prev, [type]: granted }));
      setLastUpdated(new Date());
      toast.success('Consent preferences updated');

      // Audit log
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'CONSENT_UPDATED',
        entity_type: 'gdpr_consent',
        new_values: { consent_type: type, granted },
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to update consent:', error);
      toast.error('Failed to update consent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Privacy Preferences
        </CardTitle>
        <CardDescription>
          Manage how your data is used. Essential services are always enabled.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Essential - Always On */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <Checkbox checked disabled />
            <div>
              <Label>Essential Services</Label>
              <p className="text-sm text-muted-foreground">
                Required for basic functionality (authentication, security)
              </p>
            </div>
          </div>
          <Badge variant="default">Required</Badge>
        </div>

        {/* Marketing */}
        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={consents.marketing}
              onCheckedChange={(checked) => updateConsent('marketing', Boolean(checked))}
              disabled={loading}
            />
            <div>
              <Label>Marketing Communications</Label>
              <p className="text-sm text-muted-foreground">
                Receive promotional emails about new features and offers
              </p>
            </div>
          </div>
        </div>

        {/* Analytics */}
        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={consents.analytics}
              onCheckedChange={(checked) => updateConsent('analytics', Boolean(checked))}
              disabled={loading}
            />
            <div>
              <Label>Analytics</Label>
              <p className="text-sm text-muted-foreground">
                Help us improve by sharing anonymous usage data
              </p>
            </div>
          </div>
        </div>

        {/* Third Party */}
        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={consents.third_party}
              onCheckedChange={(checked) => updateConsent('third_party', Boolean(checked))}
              disabled={loading}
            />
            <div>
              <Label>Third-Party Integrations</Label>
              <p className="text-sm text-muted-foreground">
                Allow data sharing with integrated services (Google Calendar, etc.)
              </p>
            </div>
          </div>
        </div>

        {lastUpdated && (
          <p className="text-xs text-muted-foreground">
            Last updated: {lastUpdated.toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Data Export Component
export function DataExportRequest() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [exportStatus, setExportStatus] = useState<DataExportRequest | null>(null);

  const requestDataExport = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Create export request
      const { data, error } = await supabase
        .from('data_export_requests')
        .insert({
          user_id: user.id,
          status: 'pending',
          requested_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setExportStatus(data);
      toast.success('Export request submitted. You will receive an email when ready.');

      // Audit log
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'DATA_EXPORT_REQUESTED',
        entity_type: 'gdpr_export',
        status: 'success',
      });

      // Trigger serverless function to process export
      await supabase.functions.invoke('process-data-export', {
        body: { request_id: data.id },
      });
    } catch (error) {
      console.error('Export request failed:', error);
      toast.error('Failed to request data export');
    } finally {
      setLoading(false);
    }
  };

  const downloadExport = async () => {
    if (!exportStatus?.download_url) return;

    try {
      const response = await fetch(exportStatus.download_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Data downloaded successfully');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download data');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export Your Data
        </CardTitle>
        <CardDescription>
          Download a copy of all your personal data (Right to Access)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <FileText className="w-4 h-4" />
          <AlertTitle>What's Included</AlertTitle>
          <AlertDescription>
            Your export will include: profile information, membership history, 
            payment records, attendance logs, workout data, and preferences.
          </AlertDescription>
        </Alert>

        {exportStatus?.status === 'pending' && (
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              Your export is being prepared. This may take up to 24 hours. 
              You'll receive an email when it's ready.
            </AlertDescription>
          </Alert>
        )}

        {exportStatus?.status === 'completed' && exportStatus.download_url && (
          <Alert>
            <CheckCircle className="w-4 h-4" />
            <AlertDescription>
              Your data export is ready! Download expires in 7 days.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          {exportStatus?.status === 'completed' && exportStatus.download_url ? (
            <Button onClick={downloadExport} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Download My Data
            </Button>
          ) : (
            <Button
              onClick={requestDataExport}
              disabled={loading || exportStatus?.status === 'pending'}
              className="w-full"
            >
              {loading ? 'Processing...' : 'Request Data Export'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Account Deletion Component
export function AccountDeletionRequest() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reason, setReason] = useState('');

  const requestDeletion = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Create deletion request
      const { data, error } = await supabase
        .from('deletion_requests')
        .insert({
          user_id: user.id,
          status: 'pending',
          reason: reason || 'User requested deletion',
          requested_at: new Date().toISOString(),
          // Schedule for 30 days from now (cooling-off period)
          scheduled_for: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Deletion request submitted. You have 30 days to cancel.');

      // Audit log
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'ACCOUNT_DELETION_REQUESTED',
        entity_type: 'gdpr_deletion',
        new_values: { reason },
        status: 'success',
      });

      setConfirmOpen(false);
    } catch (error) {
      console.error('Deletion request failed:', error);
      toast.error('Failed to request account deletion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            Delete My Account
          </CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data (Right to Erasure)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              This action cannot be undone. All your data will be permanently deleted 
              after a 30-day cooling-off period.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>What will be deleted:</Label>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Your profile and personal information</li>
              <li>Membership records and attendance history</li>
              <li>Workout plans and progress data</li>
              <li>Communication preferences</li>
              <li>Account access (immediate)</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label>What will be retained:</Label>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Payment records (legal requirement, anonymized)</li>
              <li>Anonymized usage statistics</li>
            </ul>
          </div>

          <Button
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
            className="w-full"
          >
            Request Account Deletion
          </Button>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Account Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your account? This will schedule your 
              account for deletion in 30 days.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason for Deletion (Optional)</Label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Help us improve by letting us know why you're leaving..."
                className="w-full p-3 border rounded-md bg-background resize-none"
                rows={3}
              />
            </div>

            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                You will have 30 days to cancel this request. After that, 
                your data will be permanently deleted.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={requestDeletion}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Confirm Deletion'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Main GDPR Dashboard
export function GDPRDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Privacy & Data Management</h1>
        <p className="text-muted-foreground">
          Manage your privacy preferences and exercise your data rights
        </p>
      </div>

      <ConsentManagement />
      <DataExportRequest />
      <AccountDeletionRequest />

      <Card>
        <CardHeader>
          <CardTitle>Your Rights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>Right to Access:</strong> You can request a copy of all your personal data.
          </div>
          <div>
            <strong>Right to Rectification:</strong> You can update your personal information 
            at any time in your profile settings.
          </div>
          <div>
            <strong>Right to Erasure:</strong> You can request deletion of your account and data.
          </div>
          <div>
            <strong>Right to Restrict Processing:</strong> You can limit how we use your data 
            through privacy preferences.
          </div>
          <div>
            <strong>Right to Data Portability:</strong> You can export your data in a 
            machine-readable format.
          </div>
          <div>
            <strong>Right to Object:</strong> You can opt-out of marketing communications 
            and analytics.
          </div>
          <div className="pt-4 border-t">
            <p className="text-muted-foreground">
              For questions about your privacy rights, contact: <strong>privacy@nzila.app</strong>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
