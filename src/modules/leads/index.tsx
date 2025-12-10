import DashboardLayout from '@/components/layout/DashboardLayout';
import { LeadsKanban } from './components/LeadsKanban';

export function LeadsPage() {
  return (
    <DashboardLayout>
      <LeadsKanban />
    </DashboardLayout>
  );
}
