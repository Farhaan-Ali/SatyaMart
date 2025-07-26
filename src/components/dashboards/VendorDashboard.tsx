import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  ShoppingCart, 
  Building2, 
  Package, 
  TrendingDown,
  Eye,
  Search,
  ShoppingBag
} from 'lucide-react';

export function VendorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalSpent: 0,
    activeSuppliers: 0,
    availableProducts: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [featuredSuppliers, setFeaturedSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  const fetchDashboardData = async () => {
    if (!user?.id) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      // Get orders stats
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id);
      if (ordersError) throw ordersError;

      const pendingOrders = orders?.filter(o => o.status === 'pending') || [];
      const completedOrders = orders?.filter(o => o.status === 'delivered') || [];
      const totalSpent = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      // Get recent orders with details
      const { data: recentOrdersData, error: recentOrdersError } = await supabase
        .from('orders')
        .select(`
          *,
          products (name, image_url),
          suppliers (name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (recentOrdersError) throw recentOrdersError;

      // Get suppliers count
      const { count: suppliersCount, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      if (suppliersError) throw suppliersError;

      // Get products count
      const { count: productsCount, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      if (productsError) throw productsError;

      // Get featured suppliers
      const { data: suppliersData, error: featuredSuppliersError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('status', 'active')
        .limit(4);
      if (featuredSuppliersError) throw featuredSuppliersError;

      setStats({
        totalOrders: orders?.length || 0,
        pendingOrders: pendingOrders.length,
        completedOrders: completedOrders.length,
        totalSpent,
        activeSuppliers: suppliersCount || 0,
        availableProducts: productsCount || 0
      });

      setRecentOrders(recentOrdersData || []);
      setFeaturedSuppliers(suppliersData || []);
    } catch (error: any) {
      setErrorMsg('Failed to fetch dashboard data. Please try again.');
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-accent rounded-lg flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
            <p className="text-muted-foreground">Discover suppliers and manage your orders</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link to="/suppliers">
              <Search className="w-4 h-4 mr-2" />
              Browse Suppliers
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={fetchDashboardData} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
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
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.pendingOrders} pending orders
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{stats.totalSpent.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.completedOrders} completed orders
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.availableProducts}</div>
                <p className="text-xs text-muted-foreground">
                  From {stats.activeSuppliers} suppliers
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Your latest purchase orders</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/orders">
                    <Eye className="w-4 h-4 mr-2" />
                    View All
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {recentOrders.length > 0 ? (
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{order.products?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            From: {order.suppliers?.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Qty: {order.quantity} • ₹{order.total_amount}
                          </p>
                        </div>
                        <Badge variant={order.status === 'pending' ? 'secondary' : 'default'}>
                          {order.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">No orders yet</p>
                    <Button asChild size="sm">
                      <Link to="/products">Start Shopping</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Featured Suppliers */}
            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="w-5 h-5" />
                    <span>Featured Suppliers</span>
                  </CardTitle>
                  <CardDescription>Trusted suppliers on our platform</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/suppliers">
                    <Eye className="w-4 h-4 mr-2" />
                    View All
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {featuredSuppliers.length > 0 ? (
                  <div className="space-y-4">
                    {featuredSuppliers.map((supplier) => (
                      <div key={supplier.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-accent rounded-full flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-accent-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{supplier.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {supplier.contact_email}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">Active</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No suppliers available
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}