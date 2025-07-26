import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Crown, Building2, ShoppingBag, ArrowRight } from 'lucide-react';

const Index = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="w-20 h-20 bg-gradient-accent rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Crown className="w-10 h-10 text-accent-foreground" />
          </div>
          <h1 className="text-6xl font-bold text-white mb-6">
            Supply Pulse
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
            The ultimate supply chain management platform connecting suppliers, vendors, and superadmins in one seamless ecosystem.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/auth')}
            className="bg-accent hover:bg-accent-glow text-accent-foreground font-semibold px-8 py-3 text-lg"
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-accent/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">For Suppliers</h3>
            <p className="text-white/80">
              Showcase your products, manage inventory, and reach verified vendors. 
              Get approved by our quality assurance team.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-accent/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">For Vendors</h3>
            <p className="text-white/80">
              Discover quality suppliers, browse verified products, and manage your 
              purchase orders effortlessly.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-accent/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">For Admins</h3>
            <p className="text-white/80">
              Comprehensive platform oversight, supplier approval management, 
              and complete system administration.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Supply Chain?
          </h2>
          <p className="text-white/80 mb-8">
            Join thousands of suppliers and vendors already using Supply Pulse
          </p>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => navigate('/auth')}
            className="bg-white/20 text-white border-white/30 hover:bg-white/30"
          >
            Start Your Journey
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
