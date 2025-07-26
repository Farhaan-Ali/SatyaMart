import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, 
  Search, 
  Filter, 
  Eye, 
  Plus,
  Edit,
  Trash2,
  Building2,
  AlertTriangle,
  Star,
  Mail,
  X,
  ShoppingCart
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { setupSampleData } from '@/utils/sampleData';

interface Product {
  id: string;
  name: string;
  description: string;
  unit_price: number;
  stock_quantity: number;
  min_stock_level: number;
  status: 'active' | 'inactive';
  image_url?: string;
  sku: string;
  supplier_id: string;
  created_at: string;
  suppliers?: {
    name: string;
    contact_email: string;
  };
}

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  min_stock_level: number;
  status: 'active' | 'inactive';
  image_url: string;
  sku: string;
}

export default function Products() {
  const { user, userRole } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    stock_quantity: 0,
    min_stock_level: 10,
    status: 'active',
    image_url: '',
    sku: ''
  });

  useEffect(() => {
    if (user?.id) {
      fetchProducts();
    }
  }, [user?.id]);

  const fetchProducts = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      console.log('=== PRODUCTS DEBUG START ===');
      console.log('Current user role:', userRole?.role);
      console.log('Current user ID:', user?.id);
      
      let query = supabase
        .from('products')
        .select(`
          *,
          suppliers (
            name,
            contact_email
          )
        `);

      // First check if ANY products exist at all
      const { data: allProducts, error: allProductsError } = await supabase
        .from('products')
        .select('*');
      
      console.log('🔍 ALL PRODUCTS IN DATABASE:', allProducts);
      console.log('🔍 Number of products in DB:', allProducts?.length || 0);
      
      if (!allProducts || allProducts.length === 0) {
        console.log('❌ NO PRODUCTS FOUND IN DATABASE AT ALL');
        console.log('🔧 Let me try to create some sample data...');
        
        // Try to create sample data if no products exist
        await createSampleDataIfNeeded();
        
        // Retry fetching after creating sample data
        const { data: retryProducts, error: retryError } = await supabase
          .from('products')
          .select('*');
        
        if (retryProducts && retryProducts.length > 0) {
          console.log('✅ Sample data created! Found products:', retryProducts);
          // Continue with the normal flow
        } else {
          console.log('❌ Still no products after sample data creation');
          setProducts([]);
          setLoading(false);
          return;
        }
      }
      
      // Re-fetch all products after potential sample data creation
      const { data: finalProducts, error: finalError } = await supabase
        .from('products')
        .select(`
          *,
          suppliers (
            name,
            contact_email
          )
        `);
      
      if (finalError) throw finalError;
      
      if (!finalProducts || finalProducts.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }
      
      // Check all suppliers
      const { data: allSuppliers, error: allSuppliersError } = await supabase
        .from('suppliers')
        .select('*');
      console.log('🔍 ALL SUPPLIERS IN DATABASE:', allSuppliers);
      
      // Check all user roles
      const { data: allUserRoles, error: allUserRolesError } = await supabase
        .from('user_roles')
        .select('*');
      console.log('🔍 ALL USER ROLES IN DATABASE:', allUserRoles);

      // If supplier, only show their products
      // If vendor, show all active products from approved suppliers
      // If superadmin, show all products
      if (userRole?.role === 'supplier') {
        console.log('👤 SUPPLIER MODE - fetching supplier record');
        // Ensure supplier record exists first
        const supplierData = await ensureSupplierRecord();
        
        if (supplierData) {
          console.log('✅ Supplier record found:', supplierData);
          query = query.eq('supplier_id', supplierData.id);
        } else {
          console.log('❌ No supplier record found for user');
        }
      } else if (userRole?.role === 'vendor') {
        console.log('🛒 VENDOR MODE - showing all active products (temporarily)');
        
        // FOR DEBUGGING: Show ALL active products to vendors (remove approval filtering)
        query = query.eq('status', 'active');
        console.log('🛒 Vendor query: showing all active products');
      } else {
        console.log('👑 SUPERADMIN MODE - showing all products');
      }

      // Apply filters
      if (statusFilter !== 'all') {
        console.log('🔍 Applying status filter:', statusFilter);
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      console.log('✅ FINAL FETCHED PRODUCTS:', data);
      console.log('✅ Number of products fetched:', data?.length || 0);
      console.log('=== PRODUCTS DEBUG END ===');

      setProducts(finalProducts || []);
    } catch (error: any) {
      console.error('❌ PRODUCTS FETCH ERROR:', error);
      setErrorMsg('Failed to fetch products. Please try again.');
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSampleDataIfNeeded = async () => {
    // Don't create sample data if user is not authenticated
    if (!user?.id) {
      console.log('❌ Cannot create sample data: user not authenticated');
      return;
    }

    try {
      console.log('🔧 Creating sample data...');
      
      // First, check if we have any suppliers
      const { data: existingSuppliers } = await supabase
        .from('suppliers')
        .select('*')
        .limit(1);
      
      let supplierId = existingSuppliers?.[0]?.id;
      
      if (!supplierId) {
        console.log('🔧 No suppliers found, creating sample supplier...');
        
        // Create a sample supplier first
        const { data: newSupplier, error: supplierError } = await supabase
          .from('suppliers')
          .insert({
            user_id: user.id,
            name: 'Sample Supplier Co.',
            contact_email: 'contact@samplesupplier.com',
            address: '123 Sample Street, Sample City',
            status: 'active'
          })
          .select()
          .single();
        
        if (supplierError) {
          console.error('❌ Error creating sample supplier:', supplierError);
          return;
        }
        
        supplierId = newSupplier.id;
        console.log('✅ Created sample supplier:', newSupplier);
      }
      
      // Now create sample products
      const sampleProducts = [
        {
          name: 'Premium Rice',
          description: 'High-quality basmati rice, perfect for all occasions',
          unit_price: 150.00,
          stock_quantity: 100,
          min_stock_level: 20,
          status: 'active',
          sku: 'RICE-001',
          supplier_id: supplierId
        },
        {
          name: 'Organic Wheat Flour',
          description: 'Freshly ground organic wheat flour',
          unit_price: 80.00,
          stock_quantity: 50,
          min_stock_level: 10,
          status: 'active',
          sku: 'FLOUR-001',
          supplier_id: supplierId
        },
        {
          name: 'Fresh Vegetables Mix',
          description: 'Assorted fresh vegetables from local farms',
          unit_price: 120.00,
          stock_quantity: 30,
          min_stock_level: 5,
          status: 'active',
          sku: 'VEG-001',
          supplier_id: supplierId
        }
      ];
      
      const { data: createdProducts, error: productsError } = await supabase
        .from('products')
        .insert(sampleProducts)
        .select();
      
      if (productsError) {
        console.error('❌ Error creating sample products:', productsError);
        return;
      }
      
      console.log('✅ Created sample products:', createdProducts);
      
    } catch (error) {
      console.error('❌ Error in createSampleDataIfNeeded:', error);
    }
  };

  const handleAddProduct = async () => {
    try {
      // Ensure supplier record exists
      const supplierData = await ensureSupplierRecord();
      
      if (!supplierData) {
        toast({
          title: "Error",
          description: "Supplier profile not found. Please contact support.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('products')
        .insert({
          name: formData.name,
          description: formData.description,
          unit_price: formData.price,
          stock_quantity: formData.stock_quantity,
          min_stock_level: formData.min_stock_level,
          status: formData.status,
          image_url: formData.image_url,
          sku: formData.sku || `SKU-${Date.now()}`,
          supplier_id: supplierData.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product added successfully!",
      });

      setShowAddModal(false);
      setFormData({
        name: '',
        description: '',
        price: 0,
        stock_quantity: 0,
        min_stock_level: 10,
        status: 'active',
        image_url: '',
        sku: ''
      });
      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add product. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: formData.name,
          description: formData.description,
          unit_price: formData.price,
          stock_quantity: formData.stock_quantity,
          min_stock_level: formData.min_stock_level,
          status: formData.status,
          image_url: formData.image_url,
          sku: formData.sku
        })
        .eq('id', editingProduct.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product updated successfully!",
      });

      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: 0,
        stock_quantity: 0,
        min_stock_level: 10,
        status: 'active',
        image_url: '',
        sku: ''
      });
      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update product. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Product deleted successfully!",
      });
      
      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.unit_price || 0,
      stock_quantity: product.stock_quantity,
      min_stock_level: product.min_stock_level,
      status: product.status,
      image_url: product.image_url || '',
      sku: product.sku
    });
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    console.log(`Product ${product.name} matches search "${searchTerm}":`, matchesSearch);
    return matchesSearch;
  });

  const generateSKU = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    setFormData(prev => ({ ...prev, sku: `SKU-${timestamp}-${random}` }));
  };

  const handlePlaceOrder = async (product: Product) => {
    try {
      // Get supplier ID for the product
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('id')
        .eq('id', product.supplier_id)
        .single();

      if (!supplierData) {
        toast({
          title: "Error",
          description: "Supplier information not found for this product.",
          variant: "destructive"
        });
        return;
      }

      // Create order (default quantity of 1)
      const { error } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id,
          product_id: product.id,
          supplier_id: supplierData.id,
          quantity: 1,
          unit_price: product.unit_price,
          total_amount: product.unit_price,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Order Placed!",
        description: `Order for ${product.name} has been placed successfully.`,
      });

      // Navigate to orders page
      window.location.href = '/orders';
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Ensure supplier record exists for the current user
  const ensureSupplierRecord = async () => {
    if (!user?.id) return null;
    
    try {
      // Check if supplier record exists
      let { data: supplierData } = await supabase
        .from('suppliers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!supplierData) {
        // Get profile data
        const { data: profileData } = await supabase
          .from('supplier_profiles')
          .select('business_name, contact_number, business_address')
          .eq('user_id', user.id)
          .single();

        if (!profileData) {
          throw new Error('Supplier profile not found');
        }

        // Create supplier record
        const { data: newSupplier, error: supplierError } = await supabase
          .from('suppliers')
          .insert({
            user_id: user.id,
            name: profileData.business_name,
            contact_email: profileData.contact_number,
            address: profileData.business_address,
            status: 'active'
          })
          .select()
          .single();

        if (supplierError) throw supplierError;
        supplierData = newSupplier;
      }

      return supplierData;
    } catch (error) {
      console.error('Error ensuring supplier record:', error);
      return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-accent rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Products</h1>
            <p className="text-muted-foreground">
              {userRole?.role === 'supplier' 
                ? 'Manage your product catalog' 
                : userRole?.role === 'vendor'
                ? 'Browse products from suppliers'
                : 'Browse all available products'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {userRole?.role === 'supplier' && (
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                  <DialogDescription>
                    Fill in the details to add a new product to your catalog.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Product Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter product name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sku">SKU</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="sku"
                          value={formData.sku}
                          onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                          placeholder="Enter SKU"
                        />
                        <Button type="button" variant="outline" onClick={generateSKU}>
                          Generate
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter product description"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="price">Price (₹)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="stock">Stock Quantity</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={formData.stock_quantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="min_stock">Min Stock Level</Label>
                      <Input
                        id="min_stock"
                        type="number"
                        value={formData.min_stock_level}
                        onChange={(e) => setFormData(prev => ({ ...prev, min_stock_level: parseInt(e.target.value) || 10 }))}
                        placeholder="10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value: 'active' | 'inactive') => setFormData(prev => ({ ...prev, status: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="image_url">Image URL</Label>
                      <Input
                        id="image_url"
                        value={formData.image_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setShowAddModal(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddProduct}>
                      Add Product
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Button variant="outline" size="sm" onClick={fetchProducts} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
          {userRole?.role === 'superadmin' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={async () => {
                try {
                  await setupSampleData(user?.id || '');
                  toast({
                    title: "Sample Data Added",
                    description: "Sample supplier and product have been created for testing.",
                  });
                  fetchProducts();
                } catch (error) {
                  toast({
                    title: "Error",
                    description: "Failed to create sample data.",
                    variant: "destructive"
                  });
                }
              }}
            >
              Add Sample Data
            </Button>
          )}
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
                placeholder="Search products..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading products...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <CardDescription>SKU: {product.sku}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                    {product.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">₹{product.unit_price}</span>
                    <div className="flex items-center space-x-2">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{product.stock_quantity} in stock</span>
                    </div>
                  </div>
                </div>

                {product.stock_quantity <= product.min_stock_level && (
                  <div className="flex items-center space-x-2 text-warning text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Low stock alert</span>
                  </div>
                )}

                {userRole?.role !== 'supplier' && product.suppliers && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span>{product.suppliers.name}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    Added {new Date(product.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedProduct(product)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    {userRole?.role === 'supplier' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </>
                    )}
                    {userRole?.role === 'vendor' && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handlePlaceOrder(product)}
                      >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Order
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredProducts.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No products found</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : userRole?.role === 'supplier'
                ? 'Start by adding your first product'
                : userRole?.role === 'vendor'
                ? 'No products are currently available from approved suppliers.'
                : 'No products are currently available'}
            </p>
            {userRole?.role === 'supplier' && (
              <Button className="mt-4" onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Product
              </Button>
            )}
            {userRole?.role === 'vendor' && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  To see products here, suppliers need to:
                </p>
                <ul className="text-sm text-muted-foreground text-left max-w-md mx-auto">
                  <li>• Register as suppliers</li>
                  <li>• Get approved by superadmin</li>
                  <li>• Add active products to their catalog</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>
                Update the product details.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Product Name</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter product name"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-sku">SKU</Label>
                  <Input
                    id="edit-sku"
                    value={formData.sku}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    placeholder="Enter SKU"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter product description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-price">Price (₹)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-stock">Stock Quantity</Label>
                  <Input
                    id="edit-stock"
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-min-stock">Min Stock Level</Label>
                  <Input
                    id="edit-min-stock"
                    type="number"
                    value={formData.min_stock_level}
                    onChange={(e) => setFormData(prev => ({ ...prev, min_stock_level: parseInt(e.target.value) || 10 }))}
                    placeholder="10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: 'active' | 'inactive') => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-image-url">Image URL</Label>
                  <Input
                    id="edit-image-url"
                    value={formData.image_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setEditingProduct(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateProduct}>
                  Update Product
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Package className="w-5 h-5" />
                  <span>Product Details</span>
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedProduct(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Product Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <p>{selectedProduct.name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">SKU:</span>
                      <p className="font-mono">{selectedProduct.sku}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Price:</span>
                      <p className="text-lg font-bold">₹{selectedProduct.unit_price}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={selectedProduct.status === 'active' ? 'default' : 'secondary'}>
                        {selectedProduct.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Inventory</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Stock Quantity:</span>
                      <p>{selectedProduct.stock_quantity} units</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Min Stock Level:</span>
                      <p>{selectedProduct.min_stock_level} units</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created:</span>
                      <p>{new Date(selectedProduct.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm">{selectedProduct.description}</p>
              </div>

              {selectedProduct.image_url && (
                <div>
                  <h4 className="font-medium mb-2">Product Image</h4>
                  <img 
                    src={selectedProduct.image_url} 
                    alt={selectedProduct.name}
                    className="w-32 h-32 object-cover rounded"
                  />
                </div>
              )}

              {selectedProduct.suppliers && (
                <div>
                  <h4 className="font-medium mb-2">Supplier Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedProduct.suppliers.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedProduct.suppliers.contact_email}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedProduct.stock_quantity <= selectedProduct.min_stock_level && (
                <div className="bg-warning/10 border border-warning rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-warning">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium">Low Stock Alert</span>
                  </div>
                  <p className="text-sm text-warning mt-1">
                    This product is running low on inventory. Current stock: {selectedProduct.stock_quantity} units
                  </p>
                </div>
              )}

              {userRole?.role === 'vendor' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">Order Actions</h4>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        handlePlaceOrder(selectedProduct);
                        setSelectedProduct(null);
                      }}
                    >
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      Place Order
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