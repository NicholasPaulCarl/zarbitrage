import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import useAlerts from '@/hooks/useAlerts';
import AlertSettings from '@/components/AlertSettings';
import AlertHistory from '@/components/AlertHistory';
import Layout from '@/components/Layout';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import { Separator, Card, CardContent, CardDescription, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger, Spinner, useTheme, Button, Input, Label, Switch, Badge } from '@/components/dark-ui';
import { useLocation } from 'wouter';
import { Bell, InfoIcon, Lock, Webhook, AlertCircle, MessageSquare, Mail, CheckCircle2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Plus, Edit, Trash2, TestTube, ExternalLink, Copy } from 'lucide-react';

interface WebhookAlert {
  id: number;
  userId: number;
  name: string;
  webhookUrl: string;
  isActive: boolean;
  triggerThreshold: string;
  customPayload?: string;
  httpMethod: string;
  headers?: string;
  createdAt: string;
  lastTriggered?: string;
  triggerCount: number;
}

interface WebhookFormData {
  name: string;
  webhookUrl: string;
  triggerThreshold: string;
  isActive: boolean;
  customPayload: string;
  httpMethod: string;
  headers: string;
}

const defaultPayloadTemplates = {
  discord: {
    name: "Discord Webhook",
    payload: JSON.stringify({
      content: "🚨 **Arbitrage Alert** 🚨",
      embeds: [{
        title: "{{route}}",
        description: "Spread: **{{spreadPercentage}}%**",
        color: 5763719,
        fields: [
          { name: "Buy", value: "{{buyExchange}} - ${{buyPrice}}", inline: true },
          { name: "Sell", value: "{{sellExchange}} - ${{sellPrice}}", inline: true },
          { name: "Profit", value: "${{spread}}", inline: true }
        ],
        timestamp: "{{timestamp}}"
      }]
    }, null, 2)
  },
  slack: {
    name: "Slack Webhook",
    payload: JSON.stringify({
      text: "🚨 Arbitrage Alert: {{spreadPercentage}}% spread detected!",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*{{route}}*\nSpread: *{{spreadPercentage}}%* - Profit: *${{spread}}*"
          }
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: "*Buy:*\n{{buyExchange}} - ${{buyPrice}}" },
            { type: "mrkdwn", text: "*Sell:*\n{{sellExchange}} - ${{sellPrice}}" }
          ]
        }
      ]
    }, null, 2)
  },
  generic: {
    name: "Generic Webhook",
    payload: JSON.stringify({
      type: "arbitrage_alert",
      message: "{{spreadPercentage}}% spread detected on {{route}}",
      data: {
        route: "{{route}}",
        buyExchange: "{{buyExchange}}",
        sellExchange: "{{sellExchange}}",
        spreadPercentage: "{{spreadPercentage}}",
        spread: "{{spread}}",
        buyPrice: "{{buyPrice}}",
        sellPrice: "{{sellPrice}}",
        timestamp: "{{timestamp}}"
      }
    }, null, 2)
  }
};

export default function UnifiedAlertsPage() {
  const { theme } = useTheme();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Browser alerts state
  const {
    alertHistory,
    isLoading: alertsLoading,
    options,
    toggleSoundAlerts,
    toggleBrowserNotifications,
    clearAlerts,
    testBrowserNotification,
    testMultipleToasts
  } = useAlerts();
  
  const [threshold, setThreshold] = useState(3.0);
  
  // Webhook alerts state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookAlert | null>(null);
  const [formData, setFormData] = useState<WebhookFormData>({
    name: '',
    webhookUrl: '',
    triggerThreshold: '3.0',
    isActive: true,
    customPayload: '',
    httpMethod: 'POST',
    headers: ''
  });

  // Get initial tab from URL params - default to webhooks
  const [searchParams] = useState(new URLSearchParams(window.location.search));
  const initialTab = searchParams.get('tab') || 'webhooks';
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // WhatsApp email signup state
  const [whatsappEmail, setWhatsappEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Load threshold from localStorage on component mount
  useEffect(() => {
    const savedThreshold = localStorage.getItem('alertThreshold');
    if (savedThreshold) {
      setThreshold(parseFloat(savedThreshold));
    }
  }, []);

  // Save threshold to localStorage when it changes
  const handleThresholdChange = (newThreshold: number) => {
    setThreshold(newThreshold);
    localStorage.setItem('alertThreshold', newThreshold.toString());
    console.log(`Alert threshold saved from alerts page: ${newThreshold}%`);
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      setLocation('/login');
    }
  }, [isAuthenticated, authLoading, setLocation]);

  // Fetch webhook alerts
  const { data: webhooks = [], isLoading: webhooksLoading } = useQuery<WebhookAlert[]>({
    queryKey: ['/api/webhook-alerts'],
    enabled: isAuthenticated
  });

  // Webhook mutations
  const createWebhookMutation = useMutation({
    mutationFn: async (data: Omit<WebhookFormData, 'headers'> & { headers?: string }) => {
      return apiRequest('/api/webhook-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/webhook-alerts'] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Success", description: "Webhook alert created successfully!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create webhook alert",
        variant: "destructive"
      });
    }
  });

  const updateWebhookMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<WebhookFormData> }) => {
      return apiRequest(`/api/webhook-alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/webhook-alerts'] });
      setIsDialogOpen(false);
      setEditingWebhook(null);
      resetForm();
      toast({ title: "Success", description: "Webhook alert updated successfully!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update webhook alert",
        variant: "destructive"
      });
    }
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/webhook-alerts/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/webhook-alerts'] });
      toast({ title: "Success", description: "Webhook alert deleted successfully!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete webhook alert",
        variant: "destructive"
      });
    }
  });

  const testWebhookMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/webhook-alerts/${id}/test`, { method: 'POST' });
    },
    onSuccess: () => {
      toast({ title: "Test Successful", description: "Webhook test message sent!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Test Failed", 
        description: error.message || "Webhook test failed",
        variant: "destructive"
      });
    }
  });

  // Webhook helper functions
  const resetForm = () => {
    setFormData({
      name: '',
      webhookUrl: '',
      triggerThreshold: '3.0',
      isActive: true,
      customPayload: '',
      httpMethod: 'POST',
      headers: ''
    });
  };

  const handleEdit = (webhook: WebhookAlert) => {
    setEditingWebhook(webhook);
    setFormData({
      name: webhook.name,
      webhookUrl: webhook.webhookUrl,
      triggerThreshold: webhook.triggerThreshold,
      isActive: webhook.isActive,
      customPayload: webhook.customPayload || '',
      httpMethod: webhook.httpMethod,
      headers: webhook.headers || ''
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingWebhook) {
      updateWebhookMutation.mutate({ id: editingWebhook.id, data: formData });
    } else {
      createWebhookMutation.mutate(formData);
    }
  };

  const applyTemplate = (template: keyof typeof defaultPayloadTemplates) => {
    setFormData(prev => ({
      ...prev,
      customPayload: defaultPayloadTemplates[template].payload
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Copied to clipboard!" });
  };

  // WhatsApp email signup handler
  const handleWhatsAppSignup = async () => {
    if (!whatsappEmail || !whatsappEmail.includes('@')) {
      toast({ 
        title: "Invalid Email", 
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setIsSubscribing(true);
    try {
      // Simulate API call for email signup
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({ 
        title: "Success!", 
        description: "You'll be notified when WhatsApp alerts are available"
      });
      setWhatsappEmail('');
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to sign up. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center" style={{ minHeight: '60vh' }}>
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Alert overview stats
  const totalBrowserAlerts = alertHistory.length;
  const totalWebhookAlerts = webhooks.length;
  const activeWebhooks = webhooks.filter(w => w.isActive).length;

  const content = (
    <>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 
            className="text-2xl font-bold tracking-tight"
            style={{ color: theme.colors.text.primary }}
          >
            Alerts
          </h1>
          <p style={{ color: theme.colors.text.secondary }}>
            Manage your arbitrage opportunity notifications
          </p>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList 
          className="mb-6 flex gap-1" 
          style={{ 
            maxWidth: '400px',
            backgroundColor: theme.colors.background.tertiary,
            border: `1px solid ${theme.colors.border.primary}`,
            borderRadius: '8px',
            padding: '4px'
          }}
        >
          <TabsTrigger 
            value="webhooks" 
            className="flex items-center gap-2 transition-all duration-200 h-7 px-3 text-xs"
            style={{
              color: activeTab === 'webhooks' ? theme.colors.primary.main : theme.colors.text.secondary,
              backgroundColor: activeTab === 'webhooks' ? theme.colors.background.primary : 'transparent',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: '500'
            }}
          >
            <Webhook className="h-4 w-4" />
            <span className="hidden sm:inline">Webhooks</span>
            <span className="sm:hidden">Web</span>
            {totalWebhookAlerts > 0 && (
              <span 
                className="ml-1 px-1.5 py-0.5 text-xs rounded-full"
                style={{
                  backgroundColor: theme.colors.background.tertiary,
                  color: theme.colors.text.secondary
                }}
              >
                {activeWebhooks}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="browser" 
            className="flex items-center gap-2 transition-all duration-200 h-7 px-3 text-xs"
            style={{
              color: activeTab === 'browser' ? theme.colors.primary.main : theme.colors.text.secondary,
              backgroundColor: activeTab === 'browser' ? theme.colors.background.primary : 'transparent',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: '500'
            }}
          >
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Browser</span>
            <span className="sm:hidden">App</span>
            {totalBrowserAlerts > 0 && (
              <span 
                className="ml-1 px-1.5 py-0.5 text-xs rounded-full"
                style={{
                  backgroundColor: theme.colors.background.tertiary,
                  color: theme.colors.text.secondary
                }}
              >
                {totalBrowserAlerts}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="whatsapp" 
            className="flex items-center gap-2 transition-all duration-200 relative h-7 px-3 text-xs"
            style={{
              color: activeTab === 'whatsapp' ? theme.colors.primary.main : theme.colors.text.secondary,
              backgroundColor: activeTab === 'whatsapp' ? theme.colors.background.primary : 'transparent',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: '500'
            }}
          >
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">WhatsApp</span>
            <span className="sm:hidden">WA</span>
            <div 
              className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
              style={{ backgroundColor: theme.colors.status.warning }}
            />
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="webhooks" style={{ marginTop: 0 }}>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 
                  className="text-lg font-semibold" 
                  style={{ color: theme.colors.text.primary }}
                >
                  Webhook Alerts
                </h3>
                <p 
                  className="text-sm" 
                  style={{ color: theme.colors.text.secondary }}
                >
                  Create custom webhook alerts to receive notifications when arbitrage opportunities are detected
                </p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => { resetForm(); setEditingWebhook(null); }}
                    variant="primary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Webhook
                  </Button>
                </DialogTrigger>
                <DialogContent 
                  className="max-w-2xl"
                  style={{
                    backgroundColor: theme.colors.background.primary,
                    border: `1px solid ${theme.colors.border.primary}`,
                    color: theme.colors.text.primary
                  }}
                >
                  <DialogHeader>
                    <DialogTitle style={{ color: theme.colors.text.primary }}>
                      {editingWebhook ? 'Edit Webhook Alert' : 'Create Webhook Alert'}
                    </DialogTitle>
                    <DialogDescription style={{ color: theme.colors.text.secondary }}>
                      Configure a webhook to receive arbitrage alerts. You can use variables like {"{route}"} and {"{spreadPercentage}"} in your payload.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name" style={{ color: theme.colors.text.primary }}>Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="My Discord Alert"
                          style={{
                            backgroundColor: theme.colors.background.secondary,
                            border: `1px solid ${theme.colors.border.primary}`,
                            color: theme.colors.text.primary
                          }}
                        />
                      </div>
                      <div>
                        <Label htmlFor="threshold" style={{ color: theme.colors.text.primary }}>Trigger Threshold (%)</Label>
                        <Input
                          id="threshold"
                          type="number"
                          step="0.1"
                          value={formData.triggerThreshold}
                          onChange={(e) => setFormData(prev => ({ ...prev, triggerThreshold: e.target.value }))}
                          placeholder="3.0"
                          style={{
                            backgroundColor: theme.colors.background.secondary,
                            border: `1px solid ${theme.colors.border.primary}`,
                            color: theme.colors.text.primary
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="webhookUrl" style={{ color: theme.colors.text.primary }}>Webhook URL</Label>
                      <Input
                        id="webhookUrl"
                        value={formData.webhookUrl}
                        onChange={(e) => setFormData(prev => ({ ...prev, webhookUrl: e.target.value }))}
                        placeholder="https://discord.com/api/webhooks/..."
                        style={{
                          backgroundColor: theme.colors.background.secondary,
                          border: `1px solid ${theme.colors.border.primary}`,
                          color: theme.colors.text.primary
                        }}
                      />
                    </div>

                    <div className="flex gap-4 items-center">
                      <div>
                        <Label htmlFor="httpMethod" style={{ color: theme.colors.text.primary }}>HTTP Method</Label>
                        <Select value={formData.httpMethod} onValueChange={(value) => setFormData(prev => ({ ...prev, httpMethod: value }))}>
                          <SelectTrigger 
                            className="w-24"
                            style={{
                              backgroundColor: theme.colors.background.secondary,
                              border: `1px solid ${theme.colors.border.primary}`,
                              color: theme.colors.text.primary
                            }}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent style={{
                            backgroundColor: theme.colors.background.secondary,
                            border: `1px solid ${theme.colors.border.primary}`
                          }}>
                            <SelectItem value="POST">POST</SelectItem>
                            <SelectItem value="PUT">PUT</SelectItem>
                            <SelectItem value="PATCH">PATCH</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isActive"
                          checked={formData.isActive}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                        />
                        <Label htmlFor="isActive" style={{ color: theme.colors.text.primary }}>Active</Label>
                      </div>
                    </div>

                    <div>
                      <Label style={{ color: theme.colors.text.primary }}>Quick Templates</Label>
                      <div className="flex gap-2 mt-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => applyTemplate('discord')}
                        >
                          Discord
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => applyTemplate('slack')}
                        >
                          Slack
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => applyTemplate('generic')}
                        >
                          Generic
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="customPayload" style={{ color: theme.colors.text.primary }}>Custom Payload (JSON)</Label>
                      <Textarea
                        id="customPayload"
                        value={formData.customPayload}
                        onChange={(e) => setFormData(prev => ({ ...prev, customPayload: e.target.value }))}
                        placeholder="Leave empty for default payload or paste your custom JSON here..."
                        rows={6}
                        style={{
                          backgroundColor: theme.colors.background.secondary,
                          border: `1px solid ${theme.colors.border.primary}`,
                          color: theme.colors.text.primary
                        }}
                      />
                    </div>

                    <div>
                      <Label htmlFor="headers" style={{ color: theme.colors.text.primary }}>Custom Headers (JSON)</Label>
                      <Textarea
                        id="headers"
                        value={formData.headers}
                        onChange={(e) => setFormData(prev => ({ ...prev, headers: e.target.value }))}
                        placeholder='{"Authorization": "Bearer token", "X-Custom-Header": "value"}'
                        rows={3}
                        style={{
                          backgroundColor: theme.colors.background.secondary,
                          border: `1px solid ${theme.colors.border.primary}`,
                          color: theme.colors.text.primary
                        }}
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSubmit}
                        disabled={createWebhookMutation.isPending || updateWebhookMutation.isPending}
                        variant="primary"
                      >
                        {editingWebhook ? 'Update' : 'Create'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Webhook List */}
            <div className="space-y-4">
              {webhooksLoading ? (
                <div className="text-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : webhooks.length === 0 ? (
                <Card style={{
                  backgroundColor: theme.colors.background.secondary,
                  border: `1px solid ${theme.colors.border.primary}`
                }}>
                  <CardContent className="text-center py-8">
                    <Webhook 
                      className="w-12 h-12 mx-auto mb-4" 
                      style={{ color: theme.colors.text.secondary }}
                    />
                    <h3 
                      className="text-lg font-semibold mb-2"
                      style={{ color: theme.colors.text.primary }}
                    >
                      No webhook alerts configured
                    </h3>
                    <p 
                      className="mb-4"
                      style={{ color: theme.colors.text.secondary }}
                    >
                      Create your first webhook alert to start receiving notifications when arbitrage opportunities are detected.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                webhooks.map((webhook) => (
                  <Card 
                    key={webhook.id}
                    style={{
                      backgroundColor: theme.colors.background.secondary,
                      border: `1px solid ${theme.colors.border.primary}`
                    }}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle 
                            className="flex items-center gap-2"
                            style={{ color: theme.colors.text.primary }}
                          >
                            {webhook.name}
                            <Badge 
                              variant={webhook.isActive ? "default" : "secondary"}
                              style={{
                                backgroundColor: webhook.isActive ? theme.colors.status.success : theme.colors.background.tertiary,
                                color: webhook.isActive ? '#FFFFFF' : theme.colors.text.secondary
                              }}
                            >
                              {webhook.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </CardTitle>
                          <CardDescription style={{ color: theme.colors.text.secondary }}>
                            Trigger at {webhook.triggerThreshold}% spread
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => testWebhookMutation.mutate(webhook.id)}
                            disabled={testWebhookMutation.isPending}
                          >
                            <TestTube className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(webhook)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => deleteWebhookMutation.mutate(webhook.id)}
                            disabled={deleteWebhookMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span 
                            className="font-medium"
                            style={{ color: theme.colors.text.primary }}
                          >
                            URL:
                          </span>
                          <span 
                            className="font-mono text-xs"
                            style={{ color: theme.colors.text.secondary }}
                          >
                            {webhook.webhookUrl.substring(0, 50)}...
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(webhook.webhookUrl)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                        <div 
                          className="flex gap-4 text-sm"
                          style={{ color: theme.colors.text.secondary }}
                        >
                          <span>Method: {webhook.httpMethod}</span>
                          <span>Triggered: {webhook.triggerCount} times</span>
                          {webhook.lastTriggered && (
                            <span>Last: {new Date(webhook.lastTriggered).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Help Section */}
            <Card style={{
              backgroundColor: theme.colors.background.secondary,
              border: `1px solid ${theme.colors.border.primary}`
            }}>
              <CardHeader>
                <CardTitle style={{ color: theme.colors.text.primary }}>Available Variables</CardTitle>
                <CardDescription style={{ color: theme.colors.text.secondary }}>
                  Use these variables in your custom payload to include real-time data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <code 
                      className="px-1 rounded"
                      style={{ backgroundColor: theme.colors.background.tertiary, color: theme.colors.text.primary }}
                    >
                      {`{{route}}`}
                    </code>
                    <span style={{ color: theme.colors.text.secondary }}> - Trading route</span>
                  </div>
                  <div>
                    <code 
                      className="px-1 rounded"
                      style={{ backgroundColor: theme.colors.background.tertiary, color: theme.colors.text.primary }}
                    >
                      {`{{buyExchange}}`}
                    </code>
                    <span style={{ color: theme.colors.text.secondary }}> - Buy exchange</span>
                  </div>
                  <div>
                    <code 
                      className="px-1 rounded"
                      style={{ backgroundColor: theme.colors.background.tertiary, color: theme.colors.text.primary }}
                    >
                      {`{{sellExchange}}`}
                    </code>
                    <span style={{ color: theme.colors.text.secondary }}> - Sell exchange</span>
                  </div>
                  <div>
                    <code 
                      className="px-1 rounded"
                      style={{ backgroundColor: theme.colors.background.tertiary, color: theme.colors.text.primary }}
                    >
                      {`{{spreadPercentage}}`}
                    </code>
                    <span style={{ color: theme.colors.text.secondary }}> - Spread %</span>
                  </div>
                  <div>
                    <code 
                      className="px-1 rounded"
                      style={{ backgroundColor: theme.colors.background.tertiary, color: theme.colors.text.primary }}
                    >
                      {`{{spread}}`}
                    </code>
                    <span style={{ color: theme.colors.text.secondary }}> - Profit amount</span>
                  </div>
                  <div>
                    <code 
                      className="px-1 rounded"
                      style={{ backgroundColor: theme.colors.background.tertiary, color: theme.colors.text.primary }}
                    >
                      {`{{buyPrice}}`}
                    </code>
                    <span style={{ color: theme.colors.text.secondary }}> - Buy price</span>
                  </div>
                  <div>
                    <code 
                      className="px-1 rounded"
                      style={{ backgroundColor: theme.colors.background.tertiary, color: theme.colors.text.primary }}
                    >
                      {`{{sellPrice}}`}
                    </code>
                    <span style={{ color: theme.colors.text.secondary }}> - Sell price</span>
                  </div>
                  <div>
                    <code 
                      className="px-1 rounded"
                      style={{ backgroundColor: theme.colors.background.tertiary, color: theme.colors.text.primary }}
                    >
                      {`{{timestamp}}`}
                    </code>
                    <span style={{ color: theme.colors.text.secondary }}> - Alert time</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="browser" style={{ marginTop: 0 }}>
          <div className="space-y-6">
            {/* Alert Settings Section */}
            <Card style={{
              backgroundColor: theme.colors.background.secondary,
              border: `1px solid ${theme.colors.border.primary}`
            }}>
              <CardHeader style={{ paddingBottom: '0.75rem' }}>
                <div className="flex items-center space-x-2">
                  <InfoIcon className="h-5 w-5" style={{ color: theme.colors.primary.main }} />
                  <CardTitle style={{ color: theme.colors.text.primary }}>Alert Settings</CardTitle>
                </div>
                <CardDescription style={{ color: theme.colors.text.secondary }}>
                  Configure when and how you receive alerts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertSettings 
                  threshold={threshold}
                  setThreshold={handleThresholdChange}
                  soundEnabled={options.soundEnabled}
                  browserNotificationEnabled={options.browserNotificationEnabled}
                  toggleSoundAlerts={toggleSoundAlerts}
                  toggleBrowserNotifications={toggleBrowserNotifications}
                  testBrowserNotification={testBrowserNotification}
                  testMultipleToasts={testMultipleToasts}
                />
              </CardContent>
            </Card>

            {/* Alert History Section */}
            <Card style={{
              backgroundColor: theme.colors.background.secondary,
              border: `1px solid ${theme.colors.border.primary}`
            }}>
              <CardHeader style={{ paddingBottom: '0.75rem' }}>
                <div className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" style={{ color: theme.colors.primary.main }} />
                  <CardTitle style={{ color: theme.colors.text.primary }}>Alert History</CardTitle>
                </div>
                <CardDescription style={{ color: theme.colors.text.secondary }}>
                  Recent arbitrage opportunities that exceeded your threshold of {threshold}%
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertHistory 
                  alerts={alertHistory}
                  clearAlerts={clearAlerts}
                  isLoading={alertsLoading}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="whatsapp" style={{ marginTop: 0 }}>
          <div className="space-y-6">
            <Card style={{
              backgroundColor: theme.colors.background.secondary,
              border: `1px solid ${theme.colors.border.primary}`
            }}>
              <CardContent className="pt-8 pb-8">
                <div className="text-center max-w-2xl mx-auto">
                  <div className="mb-6">
                    <MessageSquare 
                      className="w-16 h-16 mx-auto mb-4" 
                      style={{ color: theme.colors.status.warning }}
                    />
                    <h2 
                      className="text-2xl font-bold mb-2"
                      style={{ color: theme.colors.text.primary }}
                    >
                      WhatsApp Alerts Coming Soon
                    </h2>
                    <p 
                      className="text-lg"
                      style={{ color: theme.colors.text.secondary }}
                    >
                      Get instant arbitrage alerts directly on WhatsApp with rich formatting and immediate notifications
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="text-left space-y-4">
                      <h3 
                        className="font-semibold text-lg"
                        style={{ color: theme.colors.text.primary }}
                      >
                        🚀 What's Coming
                      </h3>
                      <ul className="space-y-2">
                        <li 
                          className="flex items-center gap-2"
                          style={{ color: theme.colors.text.secondary }}
                        >
                          <CheckCircle2 className="w-4 h-4" style={{ color: theme.colors.status.success }} />
                          Direct messages to your WhatsApp
                        </li>
                        <li 
                          className="flex items-center gap-2"
                          style={{ color: theme.colors.text.secondary }}
                        >
                          <CheckCircle2 className="w-4 h-4" style={{ color: theme.colors.status.success }} />
                          Rich formatting with profit calculations
                        </li>
                        <li 
                          className="flex items-center gap-2"
                          style={{ color: theme.colors.text.secondary }}
                        >
                          <CheckCircle2 className="w-4 h-4" style={{ color: theme.colors.status.success }} />
                          Instant notifications (faster than email)
                        </li>
                        <li 
                          className="flex items-center gap-2"
                          style={{ color: theme.colors.text.secondary }}
                        >
                          <CheckCircle2 className="w-4 h-4" style={{ color: theme.colors.status.success }} />
                          One-click setup process
                        </li>
                      </ul>
                    </div>

                    <div 
                      className="p-4 rounded-lg border"
                      style={{
                        backgroundColor: theme.colors.background.tertiary,
                        borderColor: theme.colors.border.primary
                      }}
                    >
                      <h4 
                        className="font-medium mb-2"
                        style={{ color: theme.colors.text.primary }}
                      >
                        📱 Message Preview
                      </h4>
                      <div 
                        className="text-sm text-left p-3 rounded"
                        style={{
                          backgroundColor: theme.colors.background.primary,
                          color: theme.colors.text.secondary,
                          fontFamily: 'monospace'
                        }}
                      >
                        🚨 <strong>Arbitrage Alert</strong><br/>
                        <br/>
                        📈 <strong>Binance → VALR</strong><br/>
                        💰 Spread: <strong>4.2%</strong><br/>
                        🛒 Buy: $107,450<br/>
                        🏪 Sell: R1,952,000<br/>
                        💵 Profit: <strong>$4,513</strong><br/>
                        <br/>
                        ⏰ {new Date().toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 
                      className="font-semibold text-lg"
                      style={{ color: theme.colors.text.primary }}
                    >
                      📧 Get Notified When It's Ready
                    </h3>
                    <p 
                      className="text-sm"
                      style={{ color: theme.colors.text.secondary }}
                    >
                      Be the first to know when WhatsApp alerts go live. We'll send you a one-time notification.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                      <div className="flex-1">
                        <Input
                          type="email"
                          placeholder="Enter your email address"
                          value={whatsappEmail}
                          onChange={(e) => setWhatsappEmail(e.target.value)}
                          style={{
                            backgroundColor: theme.colors.background.primary,
                            border: `1px solid ${theme.colors.border.primary}`,
                            color: theme.colors.text.primary
                          }}
                        />
                      </div>
                      <Button
                        onClick={handleWhatsAppSignup}
                        disabled={isSubscribing}
                        variant="primary"
                      >
                        {isSubscribing ? (
                          <>
                            <Spinner size="sm" className="mr-2" />
                            Subscribing...
                          </>
                        ) : (
                          <>
                            <Mail className="w-4 h-4 mr-2" />
                            Notify Me
                          </>
                        )}
                      </Button>
                    </div>

                    <p 
                      className="text-xs mt-4"
                      style={{ color: theme.colors.text.secondary }}
                    >
                      We respect your privacy. One notification only. Unsubscribe anytime.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );

  return (
    <Layout headerOptions={{
      refreshRate: 30,
      setRefreshRate: () => {},
      refreshData: () => {},
      isLoading: false
    }}>
      <SubscriptionGuard featureName="Arbitrage Alerts">
        {content}
      </SubscriptionGuard>
    </Layout>
  );
}