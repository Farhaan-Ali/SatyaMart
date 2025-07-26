import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle,
  Plus,
  Eye,
  Store
} from 'lucide-react';

export function SupplierDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
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
      // Get supplier info
      const { data: supplierData, error: supplierError } = await supabase
        .from('suppliers')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (supplierError) throw supplierError;
      if (!supplierData) return;
      // Get products stats
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('supplier_id', supplierData.id);
      if (productsError) throw productsError;
      const activeProducts = products?.filter(p => p.status === 'active') || [];
      const lowStock = products?.filter(p => p.stock_quantity <= (p.min_stock_level || 10)) || [];
      // Get orders stats
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('supplier_id', supplierData.id);
      if (ordersError) throw ordersError;
      const pendingOrders = orders?.filter(o => o.status === 'pending') || [];
      const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      // Get recent orders
      const { data: recentOrdersData, error: recentOrdersError } = await supabase
        .from('orders')
        .select(`
          *,
          products (name),
          profiles (full_name, company_name)
        `)
        .eq('supplier_id', supplierData.id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (recentOrdersError) throw recentOrdersError;
      setStats({
        totalProducts: products?.length || 0,
        activeProducts: activeProducts.length,
        lowStockProducts: lowStock.length,
        totalOrders: orders?.length || 0,
        pendingOrders: pendingOrders.length,
        totalRevenue
      });
      setRecentOrders(recentOrdersData || []);
      setLowStockProducts(lowStock.slice(0, 5));
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
            <Store className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Supplier Dashboard</h1>
            <p className="text-muted-foreground">Manage your products and orders</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link to="/products">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
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
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProducts}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeProducts} active products
                </p>
              </CardContent>
            </Card>

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
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">All time revenue</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Latest orders from customers</CardDescription>
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
                            {order.profiles?.company_name || order.profiles?.full_name}
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
                  <p className="text-center text-muted-foreground py-4">No orders yet</p>
                )}
              </CardContent>
            </Card>

            {/* Low Stock Alert */}
            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-warning" />
                    <span>Low Stock Alerts</span>
                  </CardTitle>
                  <CardDescription>Products running low on inventory</CardDescription>
                </div>
                {stats.lowStockProducts > 0 && (
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning">
                    {stats.lowStockProducts}
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                {lowStockProducts.length > 0 ? (
                  <div className="space-y-4">
                    {lowStockProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-warning">
                            {product.stock_quantity} units
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Min: {product.min_stock_level || 10}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">All products are well stocked</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}