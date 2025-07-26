
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { SupplierDetailDialog } from './SupplierDetailDialog';
import { 
  Users, 
  Building2, 
  Package, 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  XCircle,
  Crown,
  TrendingUp
} from 'lucide-react';

interface PendingSupplier {
  id: string;
  user_id: string;
  role: string;
  approval_status: string;
  created_at: string;
  profiles: {
    full_name: string;
    business_name: string;
    fssai_license: string;
    business_type: string;
    business_address: string;
    contact_number: string;
    other_certifications: string[];
  };
}

export function SuperadminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSuppliers: 0,
    totalVendors: 0,
    pendingApprovals: 0,
    totalProducts: 0,
    totalOrders: 0
  });
  const [pendingSuppliers, setPendingSuppliers] = useState<PendingSupplier[]>([]);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);
  const fetchAll = async () => {
    setLoading(true);
    setErrorMsg(null);
    await Promise.all([fetchStats(), fetchPendingSuppliers()]);
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      // Get user counts by role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role, approval_status');

      const suppliers = roles?.filter(r => r.role === 'supplier') || [];
      const vendors = roles?.filter(r => r.role === 'vendor') || [];
      const pending = suppliers.filter(s => s.approval_status === 'pending');

      // Get products count
      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      // Get orders count
      const { count: orderCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalUsers: roles?.length || 0,
        totalSuppliers: suppliers.length,
        totalVendors: vendors.length,
        pendingApprovals: pending.length,
        totalProducts: productCount || 0,
        totalOrders: orderCount || 0
      });
    } catch (error) {
      setErrorMsg('Failed to fetch stats. Please try again.');
      console.error('Error fetching stats:', error);
    }
  };

  const fetchPendingSuppliers = async () => {
    try {
      // First get user roles
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('*')
        .eq('role', 'supplier')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });

      if (!userRoles) {
        setPendingSuppliers([]);
        return;
      }

      // Then get supplier_profiles for these users
      const userIds = userRoles.map(ur => ur.user_id);
      const { data: profiles } = await supabase
        .from('supplier_profiles')
        .select(`
          user_id, 
          full_name, 
          business_name, 
          fssai_license, 
          business_type,
          business_address,
          contact_number,
          other_certifications,
          avatar_url
        `)
        .in('user_id', userIds);

      // Combine the data
      const combined = userRoles.map(role => {
        const profile = profiles?.find(p => p.user_id === role.user_id);
        return {
          ...role,
          profiles: profile || {
            full_name: '',
            business_name: '',
            fssai_license: '',
            business_type: '',
            business_address: '',
            contact_number: '',
            other_certifications: [],
            avatar_url: ''
          }
        };
      });

      setPendingSuppliers(combined);
    } catch (error) {
      setErrorMsg('Failed to fetch pending suppliers. Please try again.');
      console.error('Error fetching pending suppliers:', error);
    }
  };

  const handleApproveSupplier = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ approval_status: 'approved' })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Supplier Approved",
        description: "The supplier has been approved and can now access the platform.",
      });

      fetchStats();
      fetchPendingSuppliers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve supplier. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRejectSupplier = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ approval_status: 'rejected' })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Supplier Rejected",
        description: "The supplier application has been rejected.",
      });

      fetchStats();
      fetchPendingSuppliers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject supplier. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3 justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-accent rounded-lg flex items-center justify-center">
            <Crown className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Superadmin Dashboard</h1>
            <p className="text-muted-foreground">Monitor and manage the entire platform</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>
      {errorMsg && (
        <div className="bg-red-100 text-red-700 p-2 rounded mb-2 text-center">
          {errorMsg}
        </div>
      )}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading dashboard...</div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">Registered platform users</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSuppliers}</div>
                <p className="text-xs text-muted-foreground">Verified suppliers</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalVendors}</div>
                <p className="text-xs text-muted-foreground">Active buyers</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                <Clock className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">{stats.pendingApprovals}</div>
                <p className="text-xs text-muted-foreground">Awaiting review</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProducts}</div>
                <p className="text-xs text-muted-foreground">Listed products</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground">Platform orders</p>
              </CardContent>
            </Card>
          </div>

          {/* Pending Supplier Approvals */}
          {pendingSuppliers.length > 0 && (
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-warning" />
                  <span>Pending Supplier Approvals</span>
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning">
                    {pendingSuppliers.length}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Review detailed supplier information and approve legitimate businesses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingSuppliers.map((supplier) => (
                    <div key={supplier.id} className="flex items-center justify-between p-4 border rounded-lg bg-card/50">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-3">
                          <p className="font-medium">{supplier.profiles?.full_name}</p>
                          <Badge variant="secondary">{supplier.profiles?.business_type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">
                          {supplier.profiles?.business_name}
                        </p>
                        <div className="flex items-center space-x-6 text-xs text-muted-foreground">
                          <span className="flex items-center space-x-1">
                            <span>FSSAI:</span> 
                            <span className={supplier.profiles?.fssai_license ? "text-success font-medium" : "text-muted-foreground"}>
                              {supplier.profiles?.fssai_license || 'Not provided'}
                            </span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <span>Certifications:</span>
                            <span className="font-medium">
                              {supplier.profiles?.other_certifications?.length || 0}
                            </span>
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <SupplierDetailDialog 
                          supplier={supplier}
                          onApprove={handleApproveSupplier}
                          onReject={handleRejectSupplier}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {pendingSuppliers.length === 0 && (
            <Card className="bg-gradient-card shadow-card">
              <CardContent className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">All Caught Up!</h3>
                <p className="text-muted-foreground">No pending supplier approvals at the moment.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
