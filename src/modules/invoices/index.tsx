import DashboardLayout from '@/components/layout/DashboardLayout';
import { InvoicesList } from './components/InvoicesList';

export function InvoicesPage() {
  return (
    <DashboardLayout>
      <InvoicesList />
    </DashboardLayout>
  );
}
