import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Trash2, Edit, Plus, Move, Eye, EyeOff, ArrowUp, ArrowDown, Upload, ExternalLink, Monitor, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import AdminNavigation from "@/components/AdminNavigation";
import Layout from "@/components/Layout";
import type { Carousel, InsertCarousel, UpdateCarousel } from "@shared/schema";

const carouselFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  imageUrl: z.string().url("Please provide a valid image URL"),
  ctaText: z.string().optional(),
  ctaLink: z.string().refine((val) => {
    if (!val || val === "") return true; // Optional field
    // Allow internal paths (starting with /) or full URLs
    return val.startsWith('/') || val.match(/^https?:\/\/.+/);
  }, "Please provide a valid URL (http://...) or internal path (/page)").optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

type CarouselFormData = z.infer<typeof carouselFormSchema>;

// Internal URLs for quick selection
const internalUrls = [
  { label: "Home Page", value: "/" },
  { label: "Calculator", value: "/calculator" },
  { label: "Price Alerts", value: "/alerts" },
  { label: "Trade Journal", value: "/trade-journal" },
  { label: "Premium Subscription", value: "/premium" },
  { label: "Feature Requests", value: "/feature-requests" },
  { label: "Price Tree Map", value: "/treemap" },
  { label: "User Profile", value: "/profile" },
];

export default function AdminCarousel() {
  const [editingCarousel, setEditingCarousel] = useState<Carousel | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewCarousel, setPreviewCarousel] = useState<Carousel | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: carousels = [], isLoading } = useQuery<Carousel[]>({
    queryKey: ['/api/admin/carousels'],
  });

  const form = useForm<CarouselFormData>({
    resolver: zodResolver(carouselFormSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      ctaText: "",
      ctaLink: "",
      isActive: true,
      sortOrder: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertCarousel) => apiRequest('/api/admin/carousels', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/carousels'] });
      queryClient.invalidateQueries({ queryKey: ['/api/carousels'] });
      toast({ title: "Success", description: "Carousel created successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      console.error('Carousel creation error:', error);
      const errorMessage = error?.message || "Failed to create carousel";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCarousel }) => 
      apiRequest(`/api/admin/carousels/${id}`, { 
        method: 'PUT', 
        body: JSON.stringify(data) 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/carousels'] });
      queryClient.invalidateQueries({ queryKey: ['/api/carousels'] });
      toast({ title: "Success", description: "Carousel updated successfully" });
      setIsDialogOpen(false);
      setEditingCarousel(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update carousel", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/carousels/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/carousels'] });
      queryClient.invalidateQueries({ queryKey: ['/api/carousels'] });
      toast({ title: "Success", description: "Carousel deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete carousel", variant: "destructive" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (carouselIds: number[]) => apiRequest('/api/admin/carousels/reorder', { 
      method: 'PUT', 
      body: JSON.stringify({ carouselIds }) 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/carousels'] });
      queryClient.invalidateQueries({ queryKey: ['/api/carousels'] });
      toast({ title: "Success", description: "Carousel order updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reorder carousels", variant: "destructive" });
    },
  });

  const onSubmit = (data: CarouselFormData) => {
    console.log('Form submission data:', data);
    console.log('Form errors:', form.formState.errors);
    
    const formattedData = {
      ...data,
      ctaLink: data.ctaLink || undefined,
      ctaText: data.ctaText || undefined,
      description: data.description || undefined,
    };

    console.log('Formatted data for submission:', formattedData);

    if (editingCarousel) {
      console.log('Updating carousel:', editingCarousel.id);
      updateMutation.mutate({ id: editingCarousel.id, data: formattedData });
    } else {
      console.log('Creating new carousel');
      createMutation.mutate(formattedData);
    }
  };

  const handleEdit = (carousel: Carousel) => {
    setEditingCarousel(carousel);
    form.reset({
      title: carousel.title,
      description: carousel.description || "",
      imageUrl: carousel.imageUrl,
      ctaText: carousel.ctaText || "",
      ctaLink: carousel.ctaLink || "",
      isActive: carousel.isActive,
      sortOrder: carousel.sortOrder,
    });
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingCarousel(null);
    form.reset({
      title: "",
      description: "",
      imageUrl: "",
      ctaText: "",
      ctaLink: "",
      isActive: true,
      sortOrder: carousels.length,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this carousel?")) {
      deleteMutation.mutate(id);
    }
  };

  const moveCarousel = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= carousels.length) return;

    const reorderedCarousels = [...carousels];
    const [movedCarousel] = reorderedCarousels.splice(index, 1);
    reorderedCarousels.splice(newIndex, 0, movedCarousel);

    const carouselIds = reorderedCarousels.map(c => c.id);
    reorderMutation.mutate(carouselIds);
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      // For now, let users proceed without image upload due to routing issue
      // We'll use the profile picture upload endpoint as a workaround
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await fetch('/api/auth/profile-picture-direct', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const responseText = await response.text();
      console.log('Upload response text:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error(`Upload routing issue - please contact support`);
      }

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      if (data.profilePictureUrl) {
        form.setValue('imageUrl', data.profilePictureUrl);
        toast({ title: "Success", description: "Image uploaded successfully" });
      } else {
        throw new Error('No URL returned from upload');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({ 
        title: "Upload Issue", 
        description: "There's a technical routing issue with uploads. You can still create carousels by entering image URLs directly in the Image URL field.", 
        variant: "destructive" 
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Error", description: "Image must be less than 5MB", variant: "destructive" });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
        return;
      }

      handleImageUpload(file);
    }
  };

  const handlePreview = (carousel: Carousel) => {
    setPreviewCarousel(carousel);
    setIsPreviewOpen(true);
  };

  const handlePreviewFormData = () => {
    const formData = form.getValues();
    const previewData: Carousel = {
      id: 0,
      title: formData.title,
      description: formData.description || null,
      imageUrl: formData.imageUrl,
      ctaText: formData.ctaText || null,
      ctaLink: formData.ctaLink || null,
      isActive: formData.isActive,
      sortOrder: formData.sortOrder,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setPreviewCarousel(previewData);
    setIsPreviewOpen(true);
  };

  return (
    <Layout>
      <AdminNavigation activeTab="carousel">
        <div className="container py-4">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">Carousel Management</h1>
              <p className="text-muted-foreground">Manage homepage carousel content and ordering</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Carousel
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingCarousel ? 'Edit Carousel' : 'Add New Carousel'}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter carousel title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter carousel description" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Carousel Image</FormLabel>
                          <div className="space-y-3">
                            <div className="flex gap-2">
                              <FormControl>
                                <Input placeholder="https://example.com/image.jpg" {...field} />
                              </FormControl>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingImage}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                {uploadingImage ? "Uploading..." : "Upload"}
                              </Button>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              <strong>Recommended:</strong> 1920x600px (16:5 ratio) • Max 5MB • JPG, PNG, WebP
                            </div>
                            {field.value && (
                              <div className="relative w-full h-24 bg-gray-100 rounded border overflow-hidden">
                                <img
                                  src={field.value}
                                  alt="Preview"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                          </div>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept="image/*"
                            className="hidden"
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="ctaText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Call-to-Action Text (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Learn More" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="ctaLink"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Call-to-Action Link (Optional)</FormLabel>
                            <div className="space-y-2">
                              <FormControl>
                                <Input placeholder="https://example.com or /internal-page" {...field} />
                              </FormControl>
                              <Select onValueChange={(value) => {
                                field.onChange(value);
                                form.setValue('ctaLink', value);
                              }}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Or select an internal page" />
                                </SelectTrigger>
                                <SelectContent>
                                  {internalUrls.map((url) => (
                                    <SelectItem key={url.value} value={url.value}>
                                      <div className="flex items-center">
                                        <ExternalLink className="h-3 w-3 mr-2" />
                                        {url.label}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Active</FormLabel>
                              <div className="text-sm text-muted-foreground">
                                Show this carousel on the homepage
                              </div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="sortOrder"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sort Order</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-between">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handlePreviewFormData}
                        className="flex items-center"
                      >
                        <Monitor className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <div className="flex space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createMutation.isPending || updateMutation.isPending}
                        >
                          {editingCarousel ? 'Update' : 'Create'} Carousel
                        </Button>
                      </div>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {/* Preview Dialog */}
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Carousel Preview</DialogTitle>
                  <DialogDescription>
                    This is how your carousel item will appear to users
                  </DialogDescription>
                </DialogHeader>
                {previewCarousel && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="relative w-full h-64 bg-gray-200 rounded-lg overflow-hidden">
                        {previewCarousel.imageUrl ? (
                          <img
                            src={previewCarousel.imageUrl}
                            alt={previewCarousel.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-500">
                            <ImageIcon className="h-12 w-12 mr-2" />
                            No image selected
                          </div>
                        )}
                        {/* Carousel content overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                          <div className="text-center text-white max-w-2xl px-4">
                            <h3 className="text-3xl font-bold mb-2">{previewCarousel.title}</h3>
                            {previewCarousel.description && (
                              <p className="text-lg mb-4 opacity-90">{previewCarousel.description}</p>
                            )}
                            {previewCarousel.ctaText && previewCarousel.ctaLink && (
                              <Button
                                className="bg-white text-black hover:bg-gray-100"
                                size="lg"
                                asChild
                              >
                                <a href={previewCarousel.ctaLink} target="_blank" rel="noopener noreferrer">
                                  {previewCarousel.ctaText}
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Carousel Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Status:</strong> {previewCarousel.isActive ? 'Active' : 'Inactive'}
                      </div>
                      <div>
                        <strong>Sort Order:</strong> {previewCarousel.sortOrder}
                      </div>
                      {previewCarousel.ctaLink && (
                        <div className="col-span-2">
                          <strong>Link:</strong> <span className="text-blue-600">{previewCarousel.ctaLink}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex justify-end">
                  <Button onClick={() => setIsPreviewOpen(false)}>
                    Close Preview
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : carousels.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No carousels found. Add your first carousel to get started!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {carousels.map((carousel, index) => (
                <Card key={carousel.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CardTitle className="text-lg">{carousel.title}</CardTitle>
                        <Badge variant={carousel.isActive ? "default" : "secondary"}>
                          {carousel.isActive ? (
                            <>
                              <Eye className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </Badge>
                        <Badge variant="outline">Order: {carousel.sortOrder}</Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveCarousel(index, 'up')}
                          disabled={index === 0 || reorderMutation.isPending}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveCarousel(index, 'down')}
                          disabled={index === carousels.length - 1 || reorderMutation.isPending}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreview(carousel)}
                        >
                          <Monitor className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(carousel)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(carousel.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        {carousel.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {carousel.description}
                          </p>
                        )}
                        {carousel.ctaText && carousel.ctaLink && (
                          <div className="text-sm">
                            <strong>CTA:</strong> {carousel.ctaText} → {carousel.ctaLink}
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end">
                        <img
                          src={carousel.imageUrl}
                          alt={carousel.title}
                          className="w-32 h-20 object-cover rounded"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="80" viewBox="0 0 128 80"><rect width="128" height="80" fill="%23f3f4f6"/><text x="64" y="40" text-anchor="middle" dy=".3em" fill="%236b7280" font-family="Arial" font-size="12">Image not found</text></svg>';
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </AdminNavigation>
    </Layout>
  );
}