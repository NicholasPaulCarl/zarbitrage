import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { createErrorToast, createSuccessToast } from '@/lib/errorHandler';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import Layout from '@/components/Layout';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit2, Trash2, BookOpen, TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { TradeJournal } from '@shared/schema';

// Simple trade form component
function TradeForm({ 
  onSave, 
  onCancel, 
  isLoading = false,
  initialData = null 
}: {
  onSave: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: any;
}) {
  const [formData, setFormData] = useState({
    tradeDate: initialData?.tradeDate || new Date(),
    exchange: initialData?.exchange || '',
    tradePair: initialData?.tradePair || '',
    tradeType: initialData?.tradeType || 'buy',
    price: initialData?.price || '',
    amount: initialData?.amount || '',
    fee: initialData?.fee || '',
    notes: initialData?.notes || '',
    profitLoss: initialData?.profitLoss || '',
    tags: initialData?.tags || []
  });

  const [newTag, setNewTag] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.exchange || !formData.tradePair || !formData.price || !formData.amount) {
      return;
    }

    onSave({
      tradeDate: formData.tradeDate.toISOString(),
      exchange: formData.exchange,
      tradePair: formData.tradePair,
      tradeType: formData.tradeType,
      price: formData.price.toString(),
      amount: formData.amount.toString(),
      fee: formData.fee ? formData.fee.toString() : null,
      notes: formData.notes || null,
      profitLoss: formData.profitLoss ? formData.profitLoss.toString() : null,
      tags: formData.tags.length > 0 ? formData.tags : null
    });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tradeDate">Trade Date</Label>
          <DatePicker
            date={formData.tradeDate}
            onChange={(date) => setFormData({...formData, tradeDate: date || new Date()})}
          />
        </div>
        
        <div>
          <Label htmlFor="tradeType">Trade Type</Label>
          <Select 
            value={formData.tradeType} 
            onValueChange={(value) => setFormData({...formData, tradeType: value})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="buy">Buy</SelectItem>
              <SelectItem value="sell">Sell</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="exchange">Exchange</Label>
          <Input
            id="exchange"
            value={formData.exchange}
            onChange={(e) => setFormData({...formData, exchange: e.target.value})}
            placeholder="e.g., Binance, Coinbase"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="tradePair">Trading Pair</Label>
          <Input
            id="tradePair"
            value={formData.tradePair}
            onChange={(e) => setFormData({...formData, tradePair: e.target.value})}
            placeholder="e.g., BTC/USD, ETH/USDT"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            type="number"
            step="0.00000001"
            value={formData.price}
            onChange={(e) => setFormData({...formData, price: e.target.value})}
            placeholder="Price per unit"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            step="0.00000001"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            placeholder="Quantity"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fee">Fee (Optional)</Label>
          <Input
            id="fee"
            type="number"
            step="0.00000001"
            value={formData.fee}
            onChange={(e) => setFormData({...formData, fee: e.target.value})}
            placeholder="Trading fee"
          />
        </div>
        
        <div>
          <Label htmlFor="profitLoss">Profit/Loss (Optional)</Label>
          <Input
            id="profitLoss"
            type="number"
            step="0.01"
            value={formData.profitLoss}
            onChange={(e) => setFormData({...formData, profitLoss: e.target.value})}
            placeholder="Profit or loss amount"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          placeholder="Trade notes and observations"
          rows={3}
        />
      </div>

      <div>
        <Label>Tags</Label>
        <div className="flex gap-2 mb-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Add a tag"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          />
          <Button type="button" onClick={addTag} variant="outline">
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
              {tag} ×
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Trade'}
        </Button>
      </div>
    </form>
  );
}

// Empty state component
function EmptyTradeState({ onAddTrade }: { onAddTrade: () => void }) {
  return (
    <div className="text-center py-12">
      <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">No trades recorded yet</h3>
      <p className="text-muted-foreground mb-6">
        Start building your trading history by recording your first trade
      </p>
      <Button onClick={onAddTrade} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Your First Trade
      </Button>
    </div>
  );
}

// Main trade journal page
export default function TradeJournalPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isNewTradeOpen, setIsNewTradeOpen] = useState(false);
  const [isEditTradeOpen, setIsEditTradeOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<TradeJournal | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Fetch trades
  const { data: trades = [], isLoading: tradesLoading } = useQuery({
    queryKey: ['/api/trade-journal'],
    enabled: !!user?.subscriptionActive
  });

  // Create trade mutation
  const createTradeMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/trade-journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Trade saved successfully!",
      });
      setIsNewTradeOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/trade-journal'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save trade",
        variant: "destructive",
      });
    }
  });

  // Update trade mutation
  const updateTradeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => 
      apiRequest(`/api/trade-journal/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Trade updated successfully!",
      });
      setIsEditTradeOpen(false);
      setSelectedTrade(null);
      queryClient.invalidateQueries({ queryKey: ['/api/trade-journal'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update trade",
        variant: "destructive",
      });
    }
  });

  // Delete trade mutation
  const deleteTradeMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/trade-journal/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Trade deleted successfully!",
      });
      setIsDeleteDialogOpen(false);
      setSelectedTrade(null);
      queryClient.invalidateQueries({ queryKey: ['/api/trade-journal'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete trade",
        variant: "destructive",
      });
    }
  });

  const handleCreateTrade = (data: any) => {
    createTradeMutation.mutate(data);
  };

  const handleEditTrade = (trade: TradeJournal) => {
    setSelectedTrade(trade);
    setIsEditTradeOpen(true);
  };

  const handleUpdateTrade = (data: any) => {
    if (!selectedTrade) return;
    updateTradeMutation.mutate({ id: selectedTrade.id, data });
  };

  const handleDeleteConfirm = (trade: TradeJournal) => {
    setSelectedTrade(trade);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteTrade = () => {
    if (!selectedTrade) return;
    deleteTradeMutation.mutate(selectedTrade.id);
  };

  // Calculate stats
  const buyTrades = trades.filter((t: TradeJournal) => t.tradeType === 'buy');
  const sellTrades = trades.filter((t: TradeJournal) => t.tradeType === 'sell');
  const totalProfitLoss = trades.reduce((sum: number, trade: TradeJournal) => 
    sum + (trade.profitLoss ? Number(trade.profitLoss) : 0), 0
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  return (
    <Layout>
      <SubscriptionGuard featureName="Trading Journal">
        <div className="container mx-auto py-6 space-y-6" data-testid="trade-journal">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Trading Journal</h1>
              <p className="text-muted-foreground">
                Track and analyze your cryptocurrency trades
              </p>
            </div>
            
            <Button onClick={() => setIsNewTradeOpen(true)} className="gap-2" data-testid="add-trade-button">
              <Plus className="h-4 w-4" />
              Add Trade
            </Button>
          </div>

          {/* Summary cards */}
          {trades.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    Buy Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{buyTrades.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    Sell Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{sellTrades.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-blue-500" />
                    Total P&L
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${totalProfitLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(totalProfitLoss)}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-purple-500" />
                    Total Trades
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{trades.length}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main content */}
          {tradesLoading ? (
            <div className="text-center py-12">
              <p>Loading trades...</p>
            </div>
          ) : trades.length === 0 ? (
            <EmptyTradeState onAddTrade={() => setIsNewTradeOpen(true)} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Trade History</CardTitle>
                <CardDescription>
                  Your recorded cryptocurrency trades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all">
                  <TabsList>
                    <TabsTrigger value="all">All Trades</TabsTrigger>
                    <TabsTrigger value="buy">Buy Orders</TabsTrigger>
                    <TabsTrigger value="sell">Sell Orders</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="all">
                    <TradeTable trades={trades} onEdit={handleEditTrade} onDelete={handleDeleteConfirm} />
                  </TabsContent>
                  
                  <TabsContent value="buy">
                    <TradeTable trades={buyTrades} onEdit={handleEditTrade} onDelete={handleDeleteConfirm} />
                  </TabsContent>
                  
                  <TabsContent value="sell">
                    <TradeTable trades={sellTrades} onEdit={handleEditTrade} onDelete={handleDeleteConfirm} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* New Trade Dialog */}
          <Dialog open={isNewTradeOpen} onOpenChange={setIsNewTradeOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Trade</DialogTitle>
                <DialogDescription>
                  Record a new cryptocurrency trade in your journal
                </DialogDescription>
              </DialogHeader>
              <TradeForm
                onSave={handleCreateTrade}
                onCancel={() => setIsNewTradeOpen(false)}
                isLoading={createTradeMutation.isPending}
              />
            </DialogContent>
          </Dialog>

          {/* Edit Trade Dialog */}
          <Dialog open={isEditTradeOpen} onOpenChange={setIsEditTradeOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Edit Trade</DialogTitle>
                <DialogDescription>
                  Update the details of your trade
                </DialogDescription>
              </DialogHeader>
              {selectedTrade && (
                <TradeForm
                  onSave={handleUpdateTrade}
                  onCancel={() => {
                    setIsEditTradeOpen(false);
                    setSelectedTrade(null);
                  }}
                  isLoading={updateTradeMutation.isPending}
                  initialData={{
                    ...selectedTrade,
                    tradeDate: new Date(selectedTrade.tradeDate)
                  }}
                />
              )}
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the trade from your journal.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteTrade}
                  disabled={deleteTradeMutation.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteTradeMutation.isPending ? 'Deleting...' : 'Delete Trade'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SubscriptionGuard>
    </Layout>
  );
}

// Trade table component
function TradeTable({ 
  trades, 
  onEdit, 
  onDelete 
}: { 
  trades: TradeJournal[], 
  onEdit: (trade: TradeJournal) => void,
  onDelete: (trade: TradeJournal) => void 
}) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  return (
    <div className="rounded-md border mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Exchange</TableHead>
            <TableHead>Pair</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>P&L</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.map((trade) => (
            <TableRow key={trade.id}>
              <TableCell>{format(new Date(trade.tradeDate), 'MMM d, yyyy')}</TableCell>
              <TableCell>
                <Badge variant={trade.tradeType === 'buy' ? 'default' : 'secondary'}>
                  {trade.tradeType.toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell>{trade.exchange}</TableCell>
              <TableCell>{trade.tradePair}</TableCell>
              <TableCell>{formatCurrency(Number(trade.price))}</TableCell>
              <TableCell>{Number(trade.amount).toFixed(8)}</TableCell>
              <TableCell className={trade.profitLoss ? (Number(trade.profitLoss) >= 0 ? 'text-emerald-600' : 'text-red-600') : ''}>
                {trade.profitLoss ? formatCurrency(Number(trade.profitLoss)) : '-'}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(trade)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(trade)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}