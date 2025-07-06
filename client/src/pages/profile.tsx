import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { updatePasswordSchema, updateProfileSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Avatar, AvatarFallback, AvatarImage, Tabs, TabsContent, TabsList, TabsTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, Input, Button, useTheme } from "@/components/dark-ui";
import { useLocation } from "wouter";
import { Loader2, Upload, Crop, Timer } from "lucide-react";
import ImageCropper from "@/components/ImageCropper";
import { useAdminApi } from "@/hooks/use-admin-api";
import YocoPaymentFlow from "@/components/YocoPaymentFlow";

export default function Profile() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { adminToken, isTokenValid } = useAdminApi();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("profile");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageToEdit, setImageToEdit] = useState<string | null>(null);
  const [refreshRate, setRefreshRate] = useState<string>("30");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Load saved refresh rate from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedRefreshRate = window.localStorage.getItem("refreshRate");
      if (savedRefreshRate) {
        setRefreshRate(savedRefreshRate);
      }
    }
  }, []);
  
  // Redirect if not authenticated
  if (!isLoading && !isAuthenticated) {
    navigate("/login");
    return null;
  }
  
  // Profile form
  const profileForm = useForm<z.infer<typeof updateProfileSchema>>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
    },
  });
  
  // Password form
  const passwordForm = useForm<z.infer<typeof updatePasswordSchema>>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };
  
  // Handle profile update - supports token-based authentication
  async function onProfileSubmit(values: z.infer<typeof updateProfileSchema>) {
    setIsSubmitting(true);
    
    try {
      // Determine if we should use token-based auth
      const useTokenAuth = !!adminToken && isTokenValid;
      console.log("Profile update - Using token auth:", useTokenAuth);
      
      // Prepare headers based on authentication method
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Add token to headers if available
      if (useTokenAuth) {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }
      
      // Make the API request
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: headers,
        credentials: 'include', // Include cookies for session auth
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }
      
      // Success notification
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      
      // Update local data
      const updatedUser = await response.json();
      console.log("Profile updated successfully:", updatedUser);
      
      // Refetch user data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  // Handle password update - supports token-based authentication
  async function onPasswordSubmit(values: z.infer<typeof updatePasswordSchema>) {
    setIsSubmitting(true);
    
    try {
      // Determine if we should use token-based auth
      const useTokenAuth = !!adminToken && isTokenValid;
      console.log("Password update - Using token auth:", useTokenAuth);
      
      // Prepare headers based on authentication method
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Add token to headers if available
      if (useTokenAuth) {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }
      
      // Make the API request
      const response = await fetch("/api/auth/password", {
        method: "PATCH",
        headers: headers,
        credentials: 'include', // Include cookies for session auth
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update password");
      }
      
      // Success notification
      toast({
        title: "Password Updated",
        description: "Your password has been updated successfully.",
      });
      
      // Clear password form
      passwordForm.reset();
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  // Handle initial image selection
  const handleProfilePictureSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    // Check if file is an image and not too large
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file (JPG, PNG, etc.)",
        variant: "destructive"
      });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }
    
    // Create a URL for the selected image
    const imageUrl = URL.createObjectURL(file);
    setImageToEdit(imageUrl);
    setCropperOpen(true);
  };
  
  // Handle cropped image upload - supports token-based authentication
  const handleCroppedImageUpload = async (croppedImage: Blob) => {
    if (!user || !user.id) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to upload a profile picture",
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Create form data to send the file
      const formData = new FormData();
      formData.append('profilePicture', croppedImage, 'profile.jpg');
      
      // Determine if we should use token-based auth
      const useTokenAuth = !!adminToken && isTokenValid;
      console.log("Profile picture upload - Using token auth:", useTokenAuth);
      
      // Using direct upload endpoint with userId in URL
      console.log('Starting direct profile picture upload for user ID:', user.id);
      
      // Create headers for the request (don't set Content-Type for FormData)
      const headers: Record<string, string> = {};
      
      // Add token to headers if available
      if (useTokenAuth) {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }
      
      // Use fetch API with auth token if available
      const response = await fetch(`/api/auth/profile-picture-direct?userId=${user.id}`, {
        method: 'POST',
        headers: headers,
        credentials: 'include', // Include cookies for session auth
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      toast({
        title: "Profile Picture Updated",
        description: "Your profile picture has been updated successfully."
      });
      
      // Update avatar with cache busting parameter
      if (user) {
        const pictureUrl = `${data.user.profilePicture}?t=${Date.now()}`;
        document.querySelector('.avatar-image')?.setAttribute('src', pictureUrl);
      }
      
      // Refresh user data in the background
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "An error occurred during the upload",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      
      // Clean up resources
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      if (imageToEdit) {
        URL.revokeObjectURL(imageToEdit);
        setImageToEdit(null);
      }
      
      // Close the cropper dialog
      setCropperOpen(false);
    }
  };
  
  // Show loading indicator while user data is being fetched
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container mx-auto py-6 max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
        
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <Card className="w-full md:w-1/3">
            <CardContent className="pt-6 flex flex-col items-center">
              <div className="relative group">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage className="avatar-image" src={user?.profilePicture || ""} alt={user?.username} />
                  <AvatarFallback className="text-lg">{getInitials(user?.username || "")}</AvatarFallback>
                </Avatar>
                
                {/* Hidden file input */}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleProfilePictureSelection}
                />
                
                {/* Upload button overlay */}
                <div 
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploading ? (
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  ) : (
                    <Upload className="h-6 w-6 text-white" />
                  )}
                </div>
              </div>
              
              <h2 className="text-xl font-semibold mb-1">{user?.username}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="text-xs text-muted-foreground mt-2">
                Member since {new Date(user?.createdAt || "").toLocaleDateString()}
              </div>
              
              <div className="mt-4 text-center w-full">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Picture
                    </>
                  )}
                </Button>
                <p className="text-xs mt-1 text-muted-foreground">
                  JPG, PNG or GIF, max 5MB
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="w-full md:w-2/3">
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>
                Manage your account settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="password">Password</TabsTrigger>
                  <TabsTrigger value="subscription">Subscription</TabsTrigger>
                  <TabsTrigger value="preferences">Preferences</TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile">
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                      <FormField
                        control={profileForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="Email" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
                
                <TabsContent value="password">
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input placeholder="••••••••" type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input placeholder="••••••••" type="password" {...field} />
                            </FormControl>
                            <FormDescription>
                              Must be at least 6 characters
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <Input placeholder="••••••••" type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Update Password"
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
                
                <TabsContent value="subscription">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Subscription Status</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex flex-col space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">Status</h4>
                              <p className="text-sm text-muted-foreground">
                                Your current subscription status
                              </p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-sm ${user?.subscriptionActive ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                              {user?.subscriptionActive ? 'Active' : 'Inactive'}
                            </div>
                          </div>

                          {user?.subscriptionActive && user.subscriptionExpires && (
                            <>
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium">Expires</h4>
                                  <p className="text-sm text-muted-foreground">
                                    Your subscription expires on
                                  </p>
                                </div>
                                <div className="text-sm font-medium">
                                  {new Date(user.subscriptionExpires).toLocaleDateString()}
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium">Days Remaining</h4>
                                  <p className="text-sm text-muted-foreground">
                                    Until next billing cycle
                                  </p>
                                </div>
                                <div className="flex items-center text-sm font-medium">
                                  <Timer className="h-4 w-4 mr-1 text-muted-foreground" />
                                  {(() => {
                                    const today = new Date();
                                    const expires = new Date(user.subscriptionExpires);
                                    const diffTime = Math.abs(expires.getTime() - today.getTime());
                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                    return diffDays;
                                  })() || 0} days
                                </div>
                              </div>
                            </>
                          )}

                          <div className="pt-4 border-t mt-4">
                            <h4 className="font-medium mb-2">Subscription Details</h4>
                            <ul className="text-sm space-y-2">
                              <li className="flex items-start">
                                <div className="h-5 w-5 text-green-500 mr-2">✓</div>
                                <span>Access to real-time arbitrage opportunities</span>
                              </li>
                              <li className="flex items-start">
                                <div className="h-5 w-5 text-green-500 mr-2">✓</div>
                                <span>Price alerts and notifications</span>
                              </li>
                              <li className="flex items-start">
                                <div className="h-5 w-5 text-green-500 mr-2">✓</div>
                                <span>Advanced trading calculators</span>
                              </li>
                              <li className="flex items-start">
                                <div className="h-5 w-5 text-green-500 mr-2">✓</div>
                                <span>Historical data and analytics</span>
                              </li>
                            </ul>
                          </div>

                          <div className="space-y-2">
                            {user?.subscriptionActive ? (
                              <Button 
                                className="w-full mt-4" 
                                variant="outline"
                              >
                                Manage Subscription
                              </Button>
                            ) : (
                              <div className="w-full mt-4">
                                {user && <YocoPaymentFlow userId={user.id} buttonText="Subscribe Now" />}
                              </div>
                            )}
                            
                            {process.env.NODE_ENV === 'development' && !user?.subscriptionActive && (
                              <Button
                                className="w-full"
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  if (!user?.id) return;
                                  
                                  try {
                                    const response = await apiRequest('/api/payment/simulate-success', {
                                      method: 'POST',
                                      body: JSON.stringify({ userId: user.id })
                                    });
                                    
                                    toast({
                                      title: "Simulation Successful",
                                      description: "Your subscription has been activated. Refreshing page..."
                                    });
                                    
                                    // Refresh user data and page
                                    setTimeout(() => {
                                      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
                                      window.location.reload();
                                    }, 1500);
                                  } catch (error) {
                                    toast({
                                      title: "Simulation Failed",
                                      description: "Could not simulate payment success",
                                      variant: "destructive"
                                    });
                                  }
                                }}
                              >
                                Simulate Payment Success (Dev Only)
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Your subscription is billed monthly at $5 USD, paid in Bitcoin.
                      </p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="preferences">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Data Auto-Refresh</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Control how frequently the application will automatically fetch new data
                      </p>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Refresh interval</h4>
                            <p className="text-sm text-muted-foreground">
                              Data will automatically refresh at this interval
                            </p>
                          </div>
                          <Select 
                            value={refreshRate}
                            onValueChange={(value: string) => {
                              setRefreshRate(value);
                              if (typeof window !== "undefined") {
                                window.localStorage.setItem("refreshRate", value);
                                window.dispatchEvent(new Event("storage"));
                              }
                            }}
                          >
                            <SelectTrigger className="w-[100px]">
                              <SelectValue placeholder="30 seconds" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10">10 seconds</SelectItem>
                              <SelectItem value="30">30 seconds</SelectItem>
                              <SelectItem value="60">60 seconds</SelectItem>
                              <SelectItem value="120">2 minutes</SelectItem>
                              <SelectItem value="300">5 minutes</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        These preferences are saved in your browser and will persist across sessions.
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Image Cropper Component */}
      <ImageCropper 
        open={cropperOpen}
        onClose={() => {
          setCropperOpen(false);
          if (imageToEdit) {
            URL.revokeObjectURL(imageToEdit);
            setImageToEdit(null);
          }
        }}
        image={imageToEdit}
        onCropComplete={handleCroppedImageUpload}
      />
    </Layout>
  );
}