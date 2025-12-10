import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useGym } from '@/contexts/GymContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Package, Wrench, AlertTriangle, Edit, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

type ProductCategory = 'supplement' | 'gear' | 'apparel' | 'snack' | 'other';

type Product = {
  id: string;
  name: string;
  sku: string | null;
  category: ProductCategory;
  description: string | null;
  price: number;
  cost: number;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
};

type Asset = {
  id: string;
  name: string;
  asset_tag: string | null;
  category: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  condition: string;
  last_maintenance_date: string | null;
  next_maintenance_date: string | null;
  notes: string | null;
  is_active: boolean;
};

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  supplement: 'Supplement',
  gear: 'Gear',
  apparel: 'Apparel',
  snack: 'Snack',
  other: 'Other',
};

export function InventoryTabs() {
  const { currentGym } = useGym();
  const queryClient = useQueryClient();
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const productForm = useForm();
  const assetForm = useForm();

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products', currentGym?.id],
    queryFn: async () => {
      if (!currentGym?.id) return [];
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('gym_id', currentGym.id)
        .order('name');
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!currentGym?.id,
  });

  const { data: assets = [], isLoading: assetsLoading } = useQuery({
    queryKey: ['assets', currentGym?.id],
    queryFn: async () => {
      if (!currentGym?.id) return [];
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('gym_id', currentGym.id)
        .order('name');
      if (error) throw error;
      return data as Asset[];
    },
    enabled: !!currentGym?.id,
  });

  const createProduct = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('products').insert({
        gym_id: currentGym!.id,
        name: data.name,
        sku: data.sku || null,
        category: data.category || 'other',
        description: data.description || null,
        price: parseFloat(data.price) || 0,
        cost: parseFloat(data.cost) || 0,
        stock_quantity: parseInt(data.stock_quantity) || 0,
        low_stock_threshold: parseInt(data.low_stock_threshold) || 5,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created');
      setProductDialogOpen(false);
      productForm.reset();
    },
    onError: () => toast.error('Failed to create product'),
  });

  const createAsset = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('assets').insert({
        gym_id: currentGym!.id,
        name: data.name,
        asset_tag: data.asset_tag || null,
        category: data.category || null,
        purchase_date: data.purchase_date || null,
        purchase_price: data.purchase_price ? parseFloat(data.purchase_price) : null,
        condition: data.condition || 'good',
        notes: data.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset created');
      setAssetDialogOpen(false);
      assetForm.reset();
    },
    onError: () => toast.error('Failed to create asset'),
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted');
    },
  });

  const deleteAsset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('assets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset deleted');
    },
  });

  const lowStockProducts = products.filter(p => p.stock_quantity <= p.low_stock_threshold);
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.cost * p.stock_quantity), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Inventory</h1>
        <p className="text-muted-foreground">Manage products and assets</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Products</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Wrench className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assets</p>
                <p className="text-2xl font-bold">{assets.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-yellow-500/10">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold">{lowStockProducts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Inventory Value</p>
              <p className="text-2xl font-bold">{totalInventoryValue.toLocaleString()} AOA</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" /> Add Product
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Product</DialogTitle>
                </DialogHeader>
                <form onSubmit={productForm.handleSubmit((data) => createProduct.mutate(data))} className="space-y-4">
                  <div>
                    <Label>Name *</Label>
                    <Input {...productForm.register('name', { required: true })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>SKU</Label>
                      <Input {...productForm.register('sku')} />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Select onValueChange={(v) => productForm.setValue('category', v)} defaultValue="other">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Price</Label>
                      <Input type="number" step="0.01" {...productForm.register('price')} />
                    </div>
                    <div>
                      <Label>Cost</Label>
                      <Input type="number" step="0.01" {...productForm.register('cost')} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Stock Quantity</Label>
                      <Input type="number" {...productForm.register('stock_quantity')} />
                    </div>
                    <div>
                      <Label>Low Stock Threshold</Label>
                      <Input type="number" {...productForm.register('low_stock_threshold')} defaultValue={5} />
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea {...productForm.register('description')} />
                  </div>
                  <Button type="submit" className="w-full" disabled={createProduct.isPending}>
                    Create Product
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.sku || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{CATEGORY_LABELS[product.category]}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{product.price.toLocaleString()} AOA</TableCell>
                    <TableCell className="text-right">
                      <span className={product.stock_quantity <= product.low_stock_threshold ? 'text-destructive font-medium' : ''}>
                        {product.stock_quantity}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => deleteProduct.mutate(product.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {products.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No products yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={assetDialogOpen} onOpenChange={setAssetDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" /> Add Asset
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Asset</DialogTitle>
                </DialogHeader>
                <form onSubmit={assetForm.handleSubmit((data) => createAsset.mutate(data))} className="space-y-4">
                  <div>
                    <Label>Name *</Label>
                    <Input {...assetForm.register('name', { required: true })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Asset Tag</Label>
                      <Input {...assetForm.register('asset_tag')} />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Input {...assetForm.register('category')} placeholder="e.g., Cardio, Strength" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Purchase Date</Label>
                      <Input type="date" {...assetForm.register('purchase_date')} />
                    </div>
                    <div>
                      <Label>Purchase Price</Label>
                      <Input type="number" step="0.01" {...assetForm.register('purchase_price')} />
                    </div>
                  </div>
                  <div>
                    <Label>Condition</Label>
                    <Select onValueChange={(v) => assetForm.setValue('condition', v)} defaultValue="good">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea {...assetForm.register('notes')} />
                  </div>
                  <Button type="submit" className="w-full" disabled={createAsset.isPending}>
                    Create Asset
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Tag</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell>{asset.asset_tag || '-'}</TableCell>
                    <TableCell>{asset.category || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={asset.condition === 'excellent' || asset.condition === 'good' ? 'default' : 'secondary'}>
                        {asset.condition}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {asset.purchase_price ? `${asset.purchase_price.toLocaleString()} AOA` : '-'}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => deleteAsset.mutate(asset.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {assets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No assets yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
