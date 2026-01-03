import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useGym } from '@/contexts/GymContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, Search } from 'lucide-react';

type Product = {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  category: string;
};

type CartItem = {
  product: Product;
  quantity: number;
};

type Member = {
  id: string;
  full_name: string;
};

export function POSInterface() {
  const { currentGym } = useGym();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: products = [] } = useQuery({
    queryKey: ['products', currentGym?.id],
    queryFn: async () => {
      if (!currentGym?.id) return [];
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('gym_id', currentGym.id)
        .eq('is_active', true)
        .gt('stock_quantity', 0)
        .order('name');
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!currentGym?.id,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['members-list', currentGym?.id],
    queryFn: async () => {
      if (!currentGym?.id) return [];
      const { data, error } = await supabase
        .from('members')
        .select('id, full_name')
        .eq('gym_id', currentGym.id)
        .eq('status', 'active')
        .order('full_name');
      if (error) throw error;
      return data as Member[];
    },
    enabled: !!currentGym?.id,
  });

  const completeSale = useMutation({
    mutationFn: async () => {
      const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      const tax = subtotal * 0.14; // 14% VAT
      const total = subtotal + tax;

      // Create sale
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          gym_id: currentGym!.id,
          member_id: selectedMember || null,
          cashier_id: user!.id,
          subtotal,
          tax,
          total,
          payment_method: paymentMethod,
        })
        .select()
        .single();
      if (saleError) throw saleError;

      // Create sale items and update stock
      for (const item of cart) {
        await supabase.from('sale_items').insert({
          sale_id: sale.id,
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.product.price,
          total: item.product.price * item.quantity,
        });

        await supabase
          .from('products')
          .update({ stock_quantity: item.product.stock_quantity - item.quantity })
          .eq('id', item.product.id);
      }

      return sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Sale completed');
      setCart([]);
      setSelectedMember(null);
    },
    onError: () => toast.error('Failed to complete sale'),
  });

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          toast.error('Not enough stock');
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id !== productId) return item;
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.product.stock_quantity) {
            toast.error('Not enough stock');
            return item;
          }
          return { ...item, quantity: newQty };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax = subtotal * 0.14;
  const total = subtotal + tax;

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Point of Sale</h1>
        <p className="text-muted-foreground">Quick sales interface</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => addToCart(product)}
              >
                <CardContent className="p-4">
                  <h3 className="font-medium truncate">{product.name}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-lg font-bold text-primary">
                      {product.price.toLocaleString()}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {product.stock_quantity}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No products found
              </div>
            )}
          </div>
        </div>

        {/* Cart */}
        <Card className="h-fit sticky top-20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Cart
              {cart.length > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Member Selection */}
            <Select value={selectedMember || ''} onValueChange={setSelectedMember}>
              <SelectTrigger>
                <SelectValue placeholder="Select member (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Walk-in Customer</SelectItem>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Separator />

            {/* Cart Items */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {cart.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.product.price.toLocaleString()} AOA
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.product.id, -1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.product.id, 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => removeFromCart(item.product.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {cart.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Cart is empty
                </div>
              )}
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{subtotal.toLocaleString()} AOA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT (14%)</span>
                <span>{tax.toLocaleString()} AOA</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{total.toLocaleString()} AOA</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="flex gap-2">
              <Button
                variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                className="flex-1 gap-2"
                onClick={() => setPaymentMethod('cash')}
              >
                <Banknote className="w-4 h-4" />
                Cash
              </Button>
              <Button
                variant={paymentMethod === 'multicaixa' ? 'default' : 'outline'}
                className="flex-1 gap-2"
                onClick={() => setPaymentMethod('multicaixa')}
              >
                <CreditCard className="w-4 h-4" />
                Card
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              size="lg"
              disabled={cart.length === 0 || completeSale.isPending}
              onClick={() => completeSale.mutate()}
            >
              Complete Sale
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
