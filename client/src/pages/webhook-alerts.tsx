import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Plus, Edit, Trash2, TestTube, Webhook, ExternalLink, Copy, CheckCircle } from 'lucide-react';

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

export default function WebhookAlertsPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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

  // Fetch webhook alerts
  const { data: webhooks = [], isLoading } = useQuery<WebhookAlert[]>({
    queryKey: ['/api/webhook-alerts'],
    enabled: isAuthenticated
  });

  // Create webhook mutation
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

  // Update webhook mutation
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

  // Delete webhook mutation
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

  // Test webhook mutation
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

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please log in to manage webhook alerts</h1>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Webhook Alerts</h1>
          <p className="text-muted-foreground">
            Create custom webhook alerts to receive notifications when arbitrage opportunities are detected.
            Connect to Discord, Slack, or any service that accepts webhooks.
          </p>
        </div>

        {/* Actions */}
        <div className="mb-6">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingWebhook(null); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Webhook Alert
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingWebhook ? 'Edit Webhook Alert' : 'Create Webhook Alert'}
                </DialogTitle>
                <DialogDescription>
                  Configure a webhook to receive arbitrage alerts. You can use variables like {"{route}"} and {"{spreadPercentage}"} in your payload.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="My Discord Alert"
                    />
                  </div>
                  <div>
                    <Label htmlFor="threshold">Trigger Threshold (%)</Label>
                    <Input
                      id="threshold"
                      type="number"
                      step="0.1"
                      value={formData.triggerThreshold}
                      onChange={(e) => setFormData(prev => ({ ...prev, triggerThreshold: e.target.value }))}
                      placeholder="3.0"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="webhookUrl">Webhook URL</Label>
                  <Input
                    id="webhookUrl"
                    value={formData.webhookUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, webhookUrl: e.target.value }))}
                    placeholder="https://discord.com/api/webhooks/..."
                  />
                </div>

                {/* HTTP Method and Active Toggle */}
                <div className="flex gap-4 items-center">
                  <div>
                    <Label htmlFor="httpMethod">HTTP Method</Label>
                    <Select value={formData.httpMethod} onValueChange={(value) => setFormData(prev => ({ ...prev, httpMethod: value }))}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
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
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                </div>

                {/* Templates */}
                <div>
                  <Label>Quick Templates</Label>
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

                {/* Custom Payload */}
                <div>
                  <Label htmlFor="customPayload">Custom Payload (JSON)</Label>
                  <Textarea
                    id="customPayload"
                    value={formData.customPayload}
                    onChange={(e) => setFormData(prev => ({ ...prev, customPayload: e.target.value }))}
                    placeholder="Leave empty for default payload or paste your custom JSON here..."
                    rows={6}
                  />
                </div>

                {/* Custom Headers */}
                <div>
                  <Label htmlFor="headers">Custom Headers (JSON)</Label>
                  <Textarea
                    id="headers"
                    value={formData.headers}
                    onChange={(e) => setFormData(prev => ({ ...prev, headers: e.target.value }))}
                    placeholder='{"Authorization": "Bearer token", "X-Custom-Header": "value"}'
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={createWebhookMutation.isPending || updateWebhookMutation.isPending}
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
          {isLoading ? (
            <div className="text-center py-8">Loading webhook alerts...</div>
          ) : webhooks.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Webhook className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No webhook alerts configured</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first webhook alert to start receiving notifications when arbitrage opportunities are detected.
                </p>
              </CardContent>
            </Card>
          ) : (
            webhooks.map((webhook) => (
              <Card key={webhook.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {webhook.name}
                        <Badge variant={webhook.isActive ? "default" : "secondary"}>
                          {webhook.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
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
                        variant="outline"
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
                      <span className="font-medium">URL:</span>
                      <span className="text-muted-foreground font-mono text-xs">
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
                    <div className="flex gap-4 text-sm text-muted-foreground">
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
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Available Variables</CardTitle>
            <CardDescription>
              Use these variables in your custom payload to include real-time data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div><code className="bg-muted px-1 rounded">{`{{route}}`}</code> - Trading route</div>
              <div><code className="bg-muted px-1 rounded">{`{{buyExchange}}`}</code> - Buy exchange</div>
              <div><code className="bg-muted px-1 rounded">{`{{sellExchange}}`}</code> - Sell exchange</div>
              <div><code className="bg-muted px-1 rounded">{`{{spreadPercentage}}`}</code> - Spread %</div>
              <div><code className="bg-muted px-1 rounded">{`{{spread}}`}</code> - Profit amount</div>
              <div><code className="bg-muted px-1 rounded">{`{{buyPrice}}`}</code> - Buy price</div>
              <div><code className="bg-muted px-1 rounded">{`{{sellPrice}}`}</code> - Sell price</div>
              <div><code className="bg-muted px-1 rounded">{`{{timestamp}}`}</code> - Alert time</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}