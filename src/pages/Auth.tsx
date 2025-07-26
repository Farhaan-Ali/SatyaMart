import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Building2, Store, Crown, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [userType, setUserType] = useState<'vendor' | 'supplier' | ''>('');
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    company_name: '',
    business_name: '',
    business_type: '',
    business_address: '',
    contact_number: '',
    fssai_license: '',
    other_certifications: [] as string[]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (authMode === 'signin') {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          toast({
            title: "Sign In Failed",
            description: error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "You have successfully signed in.",
          });
          navigate('/dashboard');
        }
      } else {
        if (!userType) {
          toast({
            title: "Please select user type",
            description: "You must select whether you're a vendor or supplier.",
            variant: "destructive"
          });
          return;
        }

        const userData = {
          ...formData,
          role: userType
        };

        const { error } = await signUp(formData.email, formData.password, userData);
        if (error) {
          toast({
            title: "Sign Up Failed", 
            description: error.message,
            variant: "destructive"
          });
        } else {
          if (userType === 'supplier') {
            toast({
              title: "Registration Submitted",
              description: "Your supplier registration is pending admin approval. You'll receive an email once approved.",
            });
          } else {
            toast({
              title: "Welcome to Supply Pulse!",
              description: "Your account has been created successfully.",
            });
          }
          navigate('/dashboard');
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCertificationAdd = (certification: string) => {
    if (certification && !formData.other_certifications.includes(certification)) {
      setFormData(prev => ({
        ...prev,
        other_certifications: [...prev.other_certifications, certification]
      }));
    }
  };

  const handleCertificationRemove = (certification: string) => {
    setFormData(prev => ({
      ...prev,
      other_certifications: prev.other_certifications.filter(c => c !== certification)
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Supply Pulse</h1>
          <p className="text-white/80">Connect. Trade. Grow.</p>
        </div>

        <Card className="bg-white/95 backdrop-blur-sm shadow-elegant border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {authMode === 'signin' ? 'Welcome Back' : 'Join Supply Pulse'}
            </CardTitle>
            <CardDescription>
              {authMode === 'signin' 
                ? 'Sign in to your account to continue' 
                : 'Create your account to get started'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs value={authMode} onValueChange={(value) => setAuthMode(value as 'signin' | 'signup')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit} className="space-y-4">
                <TabsContent value="signin" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                      placeholder="Enter your email"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      required
                      placeholder="Enter your password"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4">
                  {/* User Type Selection */}
                  <div className="space-y-3">
                    <Label>I am a:</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant={userType === 'vendor' ? 'default' : 'outline'}
                        onClick={() => setUserType('vendor')}
                        className="h-auto p-4 flex flex-col items-center space-y-2"
                      >
                        <Building2 className="h-6 w-6" />
                        <span className="font-medium">Vendor</span>
                        <span className="text-xs text-center">Buy products from suppliers</span>
                      </Button>
                      
                      <Button
                        type="button"
                        variant={userType === 'supplier' ? 'default' : 'outline'}
                        onClick={() => setUserType('supplier')}
                        className="h-auto p-4 flex flex-col items-center space-y-2"
                      >
                        <Store className="h-6 w-6" />
                        <span className="font-medium">Supplier</span>
                        <span className="text-xs text-center">Sell products to vendors</span>
                      </Button>
                    </div>
                  </div>

                  {userType && (
                    <>
                      {/* Basic Information */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-email">Email</Label>
                          <Input
                            id="signup-email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            required
                            placeholder="Enter your email"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="signup-password">Password</Label>
                          <Input
                            id="signup-password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                            required
                            placeholder="Create a strong password"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="full_name">Full Name</Label>
                          <Input
                            id="full_name"
                            value={formData.full_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                            required
                            placeholder="Enter your full name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="company_name">Company Name</Label>
                          <Input
                            id="company_name"
                            value={formData.company_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                            required
                            placeholder="Enter your company name"
                          />
                        </div>
                      </div>

                      {/* Business Details */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="business_name">Business Name</Label>
                          <Input
                            id="business_name"
                            value={formData.business_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                            placeholder="Legal business name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="business_type">Business Type</Label>
                          <Select onValueChange={(value) => setFormData(prev => ({ ...prev, business_type: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select business type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manufacturer">Manufacturer</SelectItem>
                              <SelectItem value="distributor">Distributor</SelectItem>
                              <SelectItem value="wholesaler">Wholesaler</SelectItem>
                              <SelectItem value="retailer">Retailer</SelectItem>
                              <SelectItem value="trading">Trading Company</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="business_address">Business Address</Label>
                          <Textarea
                            id="business_address"
                            value={formData.business_address}
                            onChange={(e) => setFormData(prev => ({ ...prev, business_address: e.target.value }))}
                            placeholder="Complete business address"
                            rows={3}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="contact_number">Contact Number</Label>
                          <Input
                            id="contact_number"
                            value={formData.contact_number}
                            onChange={(e) => setFormData(prev => ({ ...prev, contact_number: e.target.value }))}
                            placeholder="Primary contact number"
                          />
                        </div>
                      </div>

                      {/* Supplier-specific fields */}
                      {userType === 'supplier' && (
                        <div className="space-y-4 p-4 bg-secondary/50 rounded-lg">
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <AlertCircle className="h-4 w-4" />
                            <span>Supplier verification required</span>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="fssai_license">FSSAI License Number *</Label>
                            <Input
                              id="fssai_license"
                              value={formData.fssai_license}
                              onChange={(e) => setFormData(prev => ({ ...prev, fssai_license: e.target.value }))}
                              required
                              placeholder="Enter FSSAI license number"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Other Certifications</Label>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {formData.other_certifications.map((cert, index) => (
                                <Badge key={index} variant="secondary" className="cursor-pointer" 
                                       onClick={() => handleCertificationRemove(cert)}>
                                  {cert} ×
                                </Badge>
                              ))}
                            </div>
                            <Input
                              placeholder="Add certification (press Enter)"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleCertificationAdd(e.currentTarget.value);
                                  e.currentTarget.value = '';
                                }
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    "Processing..."
                  ) : authMode === 'signin' ? (
                    <>Sign In <ArrowRight className="ml-2 h-4 w-4" /></>
                  ) : (
                    <>Create Account <ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
              </form>
            </Tabs>
          </CardContent>
        </Card>
        
        {authMode === 'signup' && userType === 'supplier' && (
          <Card className="mt-4 bg-warning/10 border-warning">
            <CardContent className="pt-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-warning-foreground">Approval Required</p>
                  <p className="text-muted-foreground">
                    Supplier accounts require admin approval. You'll receive an email notification once your account is verified and approved.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Auth;