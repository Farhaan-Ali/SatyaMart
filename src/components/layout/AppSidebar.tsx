import { 
  LayoutDashboard, 
  Building2, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings,
  Crown 
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';

export function AppSidebar() {
  const location = useLocation();
  const { userRole } = useAuth();

  const getNavigationItems = () => {
    const baseItems = [
      {
        title: 'Dashboard',
        url: '/dashboard',
        icon: LayoutDashboard,
      },
    ];

    switch (userRole?.role) {
      case 'superadmin':
        return [
          ...baseItems,
          {
            title: 'User Management',
            url: '/users',
            icon: Users,
          },
          {
            title: 'Supplier Approvals',
            url: '/approvals',
            icon: Crown,
          },
          {
            title: 'All Suppliers',
            url: '/suppliers',
            icon: Building2,
          },
          {
            title: 'All Products',
            url: '/products',
            icon: Package,
          },
          {
            title: 'All Orders',
            url: '/orders',
            icon: ShoppingCart,
          },
        ];
      
      case 'supplier':
        return [
          ...baseItems,
          {
            title: 'My Products',
            url: '/products',
            icon: Package,
          },
          {
            title: 'Orders Received',
            url: '/orders',
            icon: ShoppingCart,
          },
          {
            title: 'My Suppliers',
            url: '/suppliers',
            icon: Building2,
          },
        ];
      
      case 'vendor':
        return [
          ...baseItems,
          {
            title: 'Browse Suppliers',
            url: '/suppliers',
            icon: Building2,
          },
          {
            title: 'Browse Products',
            url: '/products',
            icon: Package,
          },
          {
            title: 'My Orders',
            url: '/orders',
            icon: ShoppingCart,
          },
        ];
      
      default:
        return baseItems;
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-accent rounded-lg flex items-center justify-center">
            <Crown className="w-4 h-4 text-accent-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-sidebar-foreground">Supply Pulse</h2>
            <p className="text-xs text-sidebar-foreground/70">
              {userRole?.role === 'superadmin' ? 'Admin Portal' : 
               userRole?.role === 'supplier' ? 'Supplier Dashboard' : 
               'Vendor Portal'}
            </p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <Link to={item.url} className="flex items-center space-x-2">
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}