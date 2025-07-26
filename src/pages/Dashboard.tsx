import { useAuth } from '@/hooks/useAuth';
import { SupplierDashboard } from '@/components/dashboards/SupplierDashboard';
import { VendorDashboard } from '@/components/dashboards/VendorDashboard';
import { SuperadminDashboard } from '@/components/dashboards/SuperadminDashboard';

const Dashboard = () => {
  const { userRole } = useAuth();

  const renderDashboard = () => {
    switch (userRole?.role) {
      case 'superadmin':
        return <SuperadminDashboard />;
      case 'supplier':
        return <SupplierDashboard />;
      case 'vendor':
        return <VendorDashboard />;
      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-4">Welcome to Supply Pulse</h2>
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {renderDashboard()}
    </div>
  );
};

export default Dashboard;