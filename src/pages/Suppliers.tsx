import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, 
  Search, 
  Filter, 
  Eye, 
  Mail,
  Phone,
  MapPin,
  Award,
  Star,
  Calendar,
  X,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface Supplier {
  id: string;
  user_id: string;
  full_name: string;
  business_name: string;
  business_type: string;
  business_address: string;
  contact_number: string;
  fssai_license: string;
  other_certifications: string[];
  avatar_url?: string;
  created_at: string;
  user_roles?: {
    approval_status: 'pending' | 'approved' | 'rejected';
  };
}

export default function Suppliers() {
  const { userRole } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      console.log('Fetching suppliers for role:', userRole?.role);
      
      // Get supplier profiles with their user roles
      const { data: profiles, error: profilesError } = await supabase
        .from('supplier_profiles')
        .select(`
          *,
          users!supplier_profiles_user_id_fkey (
            id,
            user_roles (role, approval_status)
          )
        `);

      if (profilesError) throw profilesError;
      console.log('Found supplier profiles with roles:', profiles);

      // Transform the data to match our interface
      const combined = profiles?.map(profile => ({
        ...profile,
        user_roles: profile.users?.user_roles?.[0] // Get the first (and should be only) user role
      })).filter(supplier => supplier.user_roles?.role === 'supplier') || [];

      console.log('Combined supplier data:', combined);

      setSuppliers(combined);
    } catch (error: any) {
      setErrorMsg('Failed to fetch suppliers. Please try again.');
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSupplier = async (supplierId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ approval_status: 'approved' })
        .eq('user_id', supplierId);

      if (error) throw error;

      toast({
        title: "Supplier Approved",
        description: "Supplier has been approved successfully.",
      });

      fetchSuppliers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve supplier.",
        variant: "destructive"
      });
    }
  };

  const handleRejectSupplier = async (supplierId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ approval_status: 'rejected' })
        .eq('user_id', supplierId);

      if (error) throw error;

      toast({
        title: "Supplier Rejected",
        description: "Supplier has been rejected.",
      });

      fetchSuppliers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject supplier.",
        variant: "destructive"
      });
    }
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.business_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || supplier.user_roles?.approval_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };
  // Filter suppliers based on user role
  const getFilteredSuppliers = () => {
    if (userRole?.role === 'superadmin') {
      return filteredSuppliers; // Show all suppliers
    } else {
      // For now, show all suppliers to vendors (we'll fix approval logic later)
      console.log('Filtering suppliers for vendor, showing all suppliers');
      return filteredSuppliers;
    }
  };

  const displaySuppliers = getFilteredSuppliers();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-accent rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Suppliers</h1>
            <p className="text-muted-foreground">
              {userRole?.role === 'superadmin' 
                ? 'Manage all registered suppliers on the platform'
                : 'Browse verified suppliers on the platform'}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSuppliers} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
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
                placeholder="Search suppliers..."
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
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading suppliers...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displaySuppliers.map((supplier) => (
            <Card key={supplier.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{supplier.business_name}</CardTitle>
                      <CardDescription>{supplier.full_name}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={getStatusColor(supplier.user_roles?.approval_status || 'pending')} className="flex items-center space-x-1">
                    {getStatusIcon(supplier.user_roles?.approval_status || 'pending')}
                    <span>{supplier.user_roles?.approval_status || 'pending'}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span>{supplier.business_type}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="truncate">{supplier.business_address}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{supplier.contact_number}</span>
                  </div>
                  {supplier.fssai_license && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Award className="w-4 h-4 text-muted-foreground" />
                      <span>FSSAI: {supplier.fssai_license}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    Joined {new Date(supplier.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedSupplier(supplier)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                    {userRole?.role === 'superadmin' && supplier.user_roles?.approval_status === 'pending' && (
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleApproveSupplier(supplier.user_id)}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => handleRejectSupplier(supplier.user_id)}
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredSuppliers.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No suppliers found</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : userRole?.role === 'superadmin'
                ? 'No suppliers are currently registered'
                : 'No approved suppliers are currently available'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Supplier Detail Modal */}
      {selectedSupplier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5" />
                  <span>Supplier Details</span>
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedSupplier(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Business Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Business Name:</span>
                      <p className="font-medium">{selectedSupplier.business_name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Owner Name:</span>
                      <p>{selectedSupplier.full_name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Business Type:</span>
                      <p>{selectedSupplier.business_type}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={getStatusColor(selectedSupplier.user_roles?.approval_status || 'pending')} className="ml-2">
                        {getStatusIcon(selectedSupplier.user_roles?.approval_status || 'pending')}
                        {selectedSupplier.user_roles?.approval_status || 'pending'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedSupplier.contact_number}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedSupplier.business_address}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Registration Date:</span>
                      <p>{new Date(selectedSupplier.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Certifications & Licenses</h4>
                <div className="space-y-2 text-sm">
                  {selectedSupplier.fssai_license && (
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4 text-muted-foreground" />
                      <span>FSSAI License: {selectedSupplier.fssai_license}</span>
                    </div>
                  )}
                  {selectedSupplier.other_certifications && selectedSupplier.other_certifications.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Other Certifications:</span>
                      <div className="mt-1 space-y-1">
                        {selectedSupplier.other_certifications.map((cert, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Star className="w-3 h-3 text-muted-foreground" />
                            <span>{cert}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {selectedSupplier.avatar_url && (
                <div>
                  <h4 className="font-medium mb-2">Profile Image</h4>
                  <img 
                    src={selectedSupplier.avatar_url} 
                    alt={selectedSupplier.business_name}
                    className="w-32 h-32 object-cover rounded"
                  />
                </div>
              )}

              {selectedSupplier.user_roles?.approval_status === 'pending' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Approval Actions</h4>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        handleApproveSupplier(selectedSupplier.user_id);
                        setSelectedSupplier(null);
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve Supplier
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      onClick={() => {
                        handleRejectSupplier(selectedSupplier.user_id);
                        setSelectedSupplier(null);
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject Supplier
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