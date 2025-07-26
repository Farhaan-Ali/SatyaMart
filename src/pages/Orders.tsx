import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  Eye, 
  Package,
  Building2,
  User,
  Calendar,
  DollarSign,
  Truck,
  Mail,
  X,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Order {
  id: string;
  quantity: number;
  total_amount: number;
  unit_price: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
  products?: {
    id: string;
    name: string;
    image_url?: string;
    unit_price: number;
  };
  suppliers?: {
    id: string;
    name: string;
    contact_email: string;
  };
  profiles?: {
    full_name: string;
    company_name: string;
  };
}

export default function Orders() {
  const { user, userRole } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          products (
            id,
            name,
            image_url,
            unit_price
          ),
          suppliers (
            id,
            name,
            contact_email
          ),
          profiles (
            full_name,
            company_name
          )
        `);

      // Apply role-based filtering
      if (userRole?.role === 'supplier') {
        const { data: supplierData } = await supabase
          .from('suppliers')
          .select('id')
          .eq('user_id', user?.id)
          .single();
        
        if (supplierData) {
          query = query.eq('supplier_id', supplierData.id);
        }
      } else if (userRole?.role === 'vendor') {
        query = query.eq('user_id', user?.id);
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      setOrders(data || []);
    } catch (error: any) {
      setErrorMsg('Failed to fetch orders. Please try again.');
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Order Updated",
        description: `Order status updated to ${newStatus}`,
      });

      fetchOrders();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update order status.",
        variant: "destructive"
      });
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Order Cancelled",
        description: "Order has been cancelled successfully.",
      });

      fetchOrders();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel order.",
        variant: "destructive"
      });
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.products?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.suppliers?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.profiles?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.profiles?.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'confirmed': return 'default';
      case 'shipped': return 'default';
      case 'delivered': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'delivered': return <Package className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const canUpdateStatus = (order: Order) => {
    if (userRole?.role === 'supplier') {
      return order.status === 'pending' || order.status === 'confirmed';
    }
    return false;
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending': return 'confirmed';
      case 'confirmed': return 'shipped';
      case 'shipped': return 'delivered';
      default: return currentStatus;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-accent rounded-lg flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Orders</h1>
            <p className="text-muted-foreground">
              {userRole?.role === 'superadmin' 
                ? 'Monitor all platform orders' 
                : userRole?.role === 'supplier'
                ? 'Manage orders from customers'
                : 'Track your purchase orders'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {userRole?.role === 'vendor' && (
            <Button asChild>
              <Link to="/products">
                <Package className="w-4 h-4 mr-2" />
                Browse Products
              </Link>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={fetchOrders} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-100 text-red-700 p-2 rounded mb-2 text-center">
          {errorMsg}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading orders...</div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{order.products?.name}</h3>
                        <Badge variant={getStatusColor(order.status)} className="flex items-center space-x-1">
                          {getStatusIcon(order.status)}
                          <span>{order.status}</span>
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(order.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-4 h-4" />
                          <span>₹{order.total_amount}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Package className="w-4 h-4" />
                          <span>Qty: {order.quantity}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {userRole?.role === 'supplier' && canUpdateStatus(order) && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateOrderStatus(order.id, getNextStatus(order.status))}
                      >
                        {order.status === 'pending' ? 'Confirm' : 'Ship'}
                      </Button>
                    )}
                    {userRole?.role === 'vendor' && order.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => handleCancelOrder(order.id)}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span>Supplier: {order.suppliers?.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>Customer: {order.profiles?.full_name || order.profiles?.company_name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Truck className="w-4 h-4 text-muted-foreground" />
                      <span>Order ID: #{order.id.slice(0, 8)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredOrders.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No orders found</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : userRole?.role === 'vendor'
                ? 'Start by browsing products and placing orders'
                : 'No orders are currently available'}
            </p>
            {userRole?.role === 'vendor' && (
              <Button className="mt-4" asChild>
                <Link to="/products">
                  <Package className="w-4 h-4 mr-2" />
                  Browse Products
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <ShoppingCart className="w-5 h-5" />
                  <span>Order Details</span>
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedOrder(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Order Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Order ID:</span>
                      <p className="font-mono">#{selectedOrder.id}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={getStatusColor(selectedOrder.status)} className="ml-2">
                        {getStatusIcon(selectedOrder.status)}
                        {selectedOrder.status}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Quantity:</span>
                      <p>{selectedOrder.quantity} units</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Amount:</span>
                      <p className="text-lg font-bold">₹{selectedOrder.total_amount}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Order Date:</span>
                      <p>{new Date(selectedOrder.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Product Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Product:</span>
                      <p>{selectedOrder.products?.name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Unit Price:</span>
                      <p>₹{selectedOrder.products?.unit_price}</p>
                    </div>
                    {selectedOrder.products?.image_url && (
                      <div>
                        <span className="text-muted-foreground">Image:</span>
                        <img 
                          src={selectedOrder.products.image_url} 
                          alt={selectedOrder.products.name}
                          className="w-20 h-20 object-cover rounded mt-1"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Supplier Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedOrder.suppliers?.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedOrder.suppliers?.contact_email}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Customer Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedOrder.profiles?.full_name}</span>
                    </div>
                    {selectedOrder.profiles?.company_name && (
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedOrder.profiles.company_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {userRole?.role === 'supplier' && canUpdateStatus(selectedOrder) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Order Actions</h4>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        handleUpdateOrderStatus(selectedOrder.id, getNextStatus(selectedOrder.status));
                        setSelectedOrder(null);
                      }}
                    >
                      {selectedOrder.status === 'pending' ? 'Confirm Order' : 'Ship Order'}
                    </Button>
                  </div>
                </div>
              )}

              {userRole?.role === 'vendor' && selectedOrder.status === 'pending' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-2">Order Actions</h4>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      onClick={() => {
                        handleCancelOrder(selectedOrder.id);
                        setSelectedOrder(null);
                      }}
                    >
                      Cancel Order
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 