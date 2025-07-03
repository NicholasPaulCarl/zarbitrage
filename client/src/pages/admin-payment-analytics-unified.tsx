import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  FileText, 
  Image, 
  CreditCard, 
  KeyRound, 
  LogOut, 
  Home,
  Settings,
  ArrowLeft
} from "lucide-react";
import { useAdminApi } from "@/hooks/use-admin-api";
import PaymentAnalyticsContent from "@/components/PaymentAnalyticsContent";

export default function AdminPaymentAnalyticsUnifiedPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("payment-analytics");
  const {
    adminToken,
    isTokenValid,
    adminUser,
  } = useAdminApi();

  // Check if admin token is valid
  useEffect(() => {
    if (!adminToken || !isTokenValid) {
      toast({
        title: "Admin Access Required",
        description: "Please login with admin credentials",
        variant: "destructive",
      });
      setLocation("/admin-bypass");
    }
  }, [adminToken, isTokenValid, toast, setLocation]);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    toast({
      title: "Logged Out",
      description: "Admin session ended",
    });
    setLocation("/admin-bypass");
  };

  // Navigation items
  const navItems = [
    { id: "users", label: "Users", icon: Users, path: "/admin-dashboard" },
    { id: "feature-requests", label: "Feature Requests", icon: FileText, path: "/admin-dashboard" },
    { id: "carousels", label: "Homepage Carousels", icon: Image, path: "/admin-carousel" },
    { id: "payment-analytics", label: "Payment Analytics", icon: CreditCard, path: "/admin-payment-analytics-unified" },
  ];

  if (!adminToken || !isTokenValid) {
    return null; // Will redirect via useEffect
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Global Navigation Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="container py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation("/")}
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Home
                </Button>
                <div className="h-6 w-px bg-gray-300" />
                <h1 className="text-xl font-semibold">Admin Panel</h1>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <KeyRound className="h-4 w-4" />
                  {adminUser?.username}
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="bg-white border-b border-gray-100">
          <div className="container py-3">
            <nav className="flex space-x-6">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant={item.id === activeTab ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    if (item.path !== location) {
                      setLocation(item.path);
                    } else {
                      setActiveTab(item.id);
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="container py-6">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <CreditCard className="h-6 w-6 text-blue-600" />
                <h2 className="text-2xl font-bold">Payment Analytics</h2>
              </div>
              <p className="text-gray-600">
                Monitor payment flows, user conversion rates, and subscription metrics
              </p>
            </div>

            {/* Analytics Content */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <PaymentAnalyticsContent />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}