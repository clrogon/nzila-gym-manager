import DashboardLayout from '@/components/layout/DashboardLayout';
import { InventoryTabs } from './components/InventoryTabs';

export function InventoryPage() {
  return (
    <DashboardLayout>
      <InventoryTabs />
    </DashboardLayout>
  );
}
