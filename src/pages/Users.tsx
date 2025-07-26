import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users as UsersIcon, 
  Search, 
  Filter, 
  Eye, 
  Crown,
  Building2,
  ShoppingBag,
  Mail,
  Calendar,
  Shield,
  UserCheck,
  UserX
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  created_at: string;
  user_roles?: {
    role: 'supplier' | 'vendor' | 'superadmin';
    approval_status: 'pending' | 'approved' | 'rejected';
  };
  supplier_profiles?: {
    business_name: string;
    business_type: string;
  };
  vendor_profiles?: {
    company_name: string;
  };
}

export default function Users() {
  const { userRole } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    if (userRole?.role !== 'superadmin') {
      return;
    }
    fetchUsers();
  }, [userRole]);

  const fetchUsers = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) throw authError;

      // Get user roles and profiles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');
      if (rolesError) throw rolesError;

      const { data: supplierProfiles, error: supplierError } = await supabase
        .from('supplier_profiles')
        .select('user_id, business_name, business_type');
      if (supplierError) throw supplierError;

      const { data: vendorProfiles, error: vendorError } = await supabase
        .from('vendor_profiles')
        .select('user_id, company_name');
      if (vendorError) throw vendorError;

      // Combine data
      const combinedUsers = authUsers.users.map(user => {
        const role = userRoles?.find(r => r.user_id === user.id);
        const supplierProfile = supplierProfiles?.find(p => p.user_id === user.id);
        const vendorProfile = vendorProfiles?.find(p => p.user_id === user.id);

        return {
          id: user.id,
          email: user.email || '',
          created_at: user.created_at,
          user_roles: role,
          supplier_profiles: supplierProfile,
          vendor_profiles: vendorProfile
        };
      });

      setUsers(combinedUsers);
    } catch (error: any) {
      setErrorMsg('Failed to fetch users. Please try again.');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.supplier_profiles?.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.vendor_profiles?.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.user_roles?.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'superadmin': return <Crown className="w-4 h-4" />;
      case 'supplier': return <Building2 className="w-4 h-4" />;
      case 'vendor': return <ShoppingBag className="w-4 h-4" />;
      default: return <UsersIcon className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'destructive';
      case 'supplier': return 'default';
      case 'vendor': return 'secondary';
      default: return 'outline';
    }
  };

  if (userRole?.role !== 'superadmin') {
    return (
      <div className="text-center py-12">
        <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Access Denied</h3>
        <p className="text-muted-foreground">Only superadmins can access user management.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-accent rounded-lg flex items-center justify-center">
            <UsersIcon className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage all platform users and their roles</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
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
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="superadmin">Superadmin</SelectItem>
                <SelectItem value="supplier">Supplier</SelectItem>
                <SelectItem value="vendor">Vendor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading users...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center">
                      <UsersIcon className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{user.email}</CardTitle>
                      <CardDescription>
                        {user.supplier_profiles?.business_name || 
                         user.vendor_profiles?.company_name || 
                         'No business name'}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <Badge variant={getRoleColor(user.user_roles?.role || '')} className="flex items-center space-x-1">
                      {getRoleIcon(user.user_roles?.role || '')}
                      <span>{user.user_roles?.role}</span>
                    </Badge>
                    {user.user_roles?.role === 'supplier' && (
                      <Badge variant={user.user_roles.approval_status === 'approved' ? 'default' : 'secondary'}>
                        {user.user_roles.approval_status}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                  {user.supplier_profiles && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span>{user.supplier_profiles.business_type}</span>
                    </div>
                  )}
                  {user.vendor_profiles && (
                    <div className="flex items-center space-x-2 text-sm">
                      <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                      <span>Vendor</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    User ID: {user.id.slice(0, 8)}...
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedUser(user)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    {user.user_roles?.role === 'supplier' && user.user_roles.approval_status === 'pending' && (
                      <Button size="sm" variant="outline" className="text-green-600">
                        <UserCheck className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredUsers.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <UsersIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No users found</h3>
            <p className="text-muted-foreground">
              {searchTerm || roleFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'No users are currently registered'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <UsersIcon className="w-5 h-5" />
                  <span>User Details</span>
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedUser(null)}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Basic Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <p>{selectedUser.email}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">User ID:</span>
                      <p className="font-mono">{selectedUser.id}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Joined:</span>
                      <p>{new Date(selectedUser.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Role Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Role:</span>
                      <Badge variant={getRoleColor(selectedUser.user_roles?.role || '')} className="ml-2">
                        {getRoleIcon(selectedUser.user_roles?.role || '')}
                        {selectedUser.user_roles?.role}
                      </Badge>
                    </div>
                    {selectedUser.user_roles?.role === 'supplier' && (
                      <div>
                        <span className="text-muted-foreground">Approval Status:</span>
                        <Badge variant={selectedUser.user_roles.approval_status === 'approved' ? 'default' : 'secondary'} className="ml-2">
                          {selectedUser.user_roles.approval_status}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedUser.supplier_profiles && (
                <div>
                  <h4 className="font-medium mb-2">Supplier Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Business Name:</span>
                      <p>{selectedUser.supplier_profiles.business_name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Business Type:</span>
                      <p>{selectedUser.supplier_profiles.business_type}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedUser.vendor_profiles && (
                <div>
                  <h4 className="font-medium mb-2">Vendor Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Company Name:</span>
                      <p>{selectedUser.vendor_profiles.company_name}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedUser.user_roles?.role === 'supplier' && selectedUser.user_roles.approval_status === 'pending' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Approval Actions</h4>
                  <div className="flex space-x-2">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      <UserCheck className="w-4 h-4 mr-1" />
                      Approve Supplier
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                      <UserX className="w-4 h-4 mr-1" />
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