import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { SupplierDetailDialog } from '@/components/dashboards/SupplierDetailDialog';
import { 
  Clock, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  Crown,
  Building2,
  Award,
  FileText
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

export default function Approvals() {
  const { userRole } = useAuth();
  const [pendingSuppliers, setPendingSuppliers] = useState<PendingSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const { toast } = useToast();

  useEffect(() => {
    if (userRole?.role !== 'superadmin') {
      return;
    }
    fetchPendingSuppliers();
  }, [userRole]);

  const fetchPendingSuppliers = async () => {
    setLoading(true);
    setErrorMsg(null);
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
    } finally {
      setLoading(false);
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

      fetchPendingSuppliers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject supplier. Please try again.",
        variant: "destructive"
      });
    }
  };

  const filteredSuppliers = pendingSuppliers.filter(supplier => {
    const matchesSearch = supplier.profiles?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.profiles?.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.profiles?.business_type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (userRole?.role !== 'superadmin') {
    return (
      <div className="text-center py-12">
        <Crown className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Access Denied</h3>
        <p className="text-muted-foreground">Only superadmins can access supplier approvals.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-accent rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Supplier Approvals</h1>
            <p className="text-muted-foreground">Review and approve supplier applications</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchPendingSuppliers} disabled={loading}>
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
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading approvals...</div>
      ) : (
        <>
          {filteredSuppliers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-warning" />
                  <span>Pending Supplier Approvals</span>
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning">
                    {filteredSuppliers.length}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Review detailed supplier information and approve legitimate businesses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredSuppliers.map((supplier) => (
                    <Card key={supplier.id} className="border-l-4 border-l-warning">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center">
                              <Building2 className="w-6 h-6 text-accent-foreground" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <h3 className="font-semibold">{supplier.profiles?.full_name}</h3>
                                <Badge variant="secondary">{supplier.profiles?.business_type}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground font-medium">
                                {supplier.profiles?.business_name}
                              </p>
                              <div className="flex items-center space-x-6 text-xs text-muted-foreground mt-2">
                                <span className="flex items-center space-x-1">
                                  <FileText className="w-3 h-3" />
                                  <span>FSSAI: {supplier.profiles?.fssai_license || 'Not provided'}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Award className="w-3 h-3" />
                                  <span>Certifications: {supplier.profiles?.other_certifications?.length || 0}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span>Applied: {new Date(supplier.created_at).toLocaleDateString()}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <SupplierDetailDialog 
                              supplier={supplier}
                              onApprove={handleApproveSupplier}
                              onReject={handleRejectSupplier}
                            />
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleApproveSupplier(supplier.user_id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => handleRejectSupplier(supplier.user_id)}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {filteredSuppliers.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">All Caught Up!</h3>
                <p className="text-muted-foreground">
                  {searchTerm 
                    ? 'No suppliers match your search criteria' 
                    : 'No pending supplier approvals at the moment.'}
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
} 