
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  User, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  FileText,
  Award
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

interface SupplierDetailDialogProps {
  supplier: PendingSupplier;
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
}

export function SupplierDetailDialog({ supplier, onApprove, onReject }: SupplierDetailDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleApprove = async () => {
    try {
      await onApprove(supplier.user_id);
      setOpen(false);
      toast({
        title: "Supplier Approved",
        description: `${supplier.profiles?.business_name || supplier.profiles?.full_name} has been approved successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve supplier. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleReject = async () => {
    try {
      await onReject(supplier.user_id);
      setOpen(false);
      toast({
        title: "Supplier Rejected",
        description: `${supplier.profiles?.business_name || supplier.profiles?.full_name} has been rejected.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject supplier. Please try again.",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
        >
          <Eye className="w-4 h-4 mr-1" />
          View Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-primary" />
            <span>Supplier Registration Details</span>
          </DialogTitle>
          <DialogDescription>
            Review all information provided by the supplier before making an approval decision.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Basic Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <p className="text-base font-medium">{supplier.profiles?.full_name || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Registration Date</label>
                  <p className="text-base">{formatDate(supplier.created_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Building2 className="w-5 h-5" />
                <span>Business Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Business Name</label>
                  <p className="text-base font-medium">{supplier.profiles?.business_name || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Business Type</label>
                  <p className="text-base">{supplier.profiles?.business_type || 'Not provided'}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Business Address</label>
                <p className="text-base flex items-start space-x-2">
                  <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <span>{supplier.profiles?.business_address || 'Not provided'}</span>
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Contact Number</label>
                <p className="text-base flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{supplier.profiles?.contact_number || 'Not provided'}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Certifications & Licenses */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Award className="w-5 h-5" />
                <span>Certifications & Licenses</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">FSSAI License</label>
                <div className="flex items-center space-x-2 mt-1">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-base font-medium">
                    {supplier.profiles?.fssai_license || 'Not provided'}
                  </span>
                  {supplier.profiles?.fssai_license && (
                    <Badge variant="outline" className="bg-success/10 text-success border-success">
                      Provided
                    </Badge>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Other Certifications</label>
                <div className="mt-2">
                  {supplier.profiles?.other_certifications && supplier.profiles.other_certifications.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {supplier.profiles.other_certifications.map((cert, index) => (
                        <Badge key={index} variant="outline" className="bg-primary/10 text-primary border-primary">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-base text-muted-foreground">No additional certifications provided</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approval Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning">
                Pending Approval
              </Badge>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleReject}
              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject Application
            </Button>
            <Button
              onClick={handleApprove}
              className="bg-success hover:bg-success/90 text-success-foreground"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve Supplier
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
