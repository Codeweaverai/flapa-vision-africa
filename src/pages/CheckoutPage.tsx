
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, Minus } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import Layout from '@/components/layout/Layout';
import TicketHolderForm from '@/components/cart/TicketHolderForm';
import PriceDisplay from '@/components/currency/PriceDisplay';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, updateQuantity, removeFromCart, clearCart, getTotalPrice } = useCart();
  const { currentCurrency, convertPrice } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [convertedTotal, setConvertedTotal] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (items.length === 0) {
      navigate('/courses');
      return;
    }

    const updateConvertedTotal = async () => {
      const total = getTotalPrice();
      const converted = await convertPrice(total, 'USD');
      setConvertedTotal(converted);
    };

    updateConvertedTotal();
  }, [user, items, navigate, getTotalPrice, convertPrice]);

  const handleCheckout = async () => {
    if (!user) {
      toast.error('Please sign in to continue');
      return;
    }

    setLoading(true);
    try {
      // Create order first
      const orderData = {
        user_id: user.id,
        email: user.email,
        total_amount: getTotalPrice(),
        currency: 'USD',
        payment_status: 'pending',
        payment_method: 'stripe'
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        item_id: item.item_id,
        item_type: item.item_type,
        item_name: item.title,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        metadata: (item.item_type === 'event_ticket' ? 
          { ticket_holder_names: item.ticket_holder_names } : {}) as any
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Determine the primary item type for redirect URL
      const hasEventTickets = items.some(item => item.item_type === 'event_ticket');
      const hasCourses = items.some(item => item.item_type === 'course');
      
      let redirectType = 'mixed';
      let redirectId = order.id;
      
      if (hasEventTickets && !hasCourses) {
        redirectType = 'event';
        redirectId = items.find(item => item.item_type === 'event_ticket')?.event_id || order.id;
      } else if (hasCourses && !hasEventTickets) {
        redirectType = 'course';
        redirectId = items.find(item => item.item_type === 'course')?.item_id || order.id;
      }

      // Create Stripe checkout session
      const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
        body: {
          orderId: order.id,
          amount: Math.round(getTotalPrice() * 100), // Convert to cents
          currency: 'usd',
          title: `Order ${order.id.slice(-8).toUpperCase()}`,
          successUrl: `${window.location.origin}/payment/result?type=${redirectType}&id=${redirectId}&order_id=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/checkout`
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Clear cart after successful checkout initiation
        await clearCart();
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to process checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">Add some courses or events to your cart to continue.</p>
              <Button onClick={() => navigate('/courses')}>Browse Courses</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Checkout</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.title}</h3>
                        <p className="text-sm text-gray-600 capitalize">
                          {item.item_type === 'event_ticket' ? 'Event Ticket' : 'Course'}
                        </p>
                        <div className="flex items-center gap-4 mt-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={loading}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="px-3 py-1 bg-gray-100 rounded">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={loading}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          <PriceDisplay amount={item.price * item.quantity} originalCurrency="USD" />
                        </p>
                      </div>
                    </div>

                    {/* Ticket Holder Form for Event Tickets */}
                    {item.item_type === 'event_ticket' && (
                      <div className="mt-6">
                        <TicketHolderForm
                          eventTitle={item.title}
                          quantity={item.quantity}
                          ticketHolders={item.ticket_holder_names || []}
                          onUpdateTicketHolders={(holders) => {
                            // Update the cart item with new ticket holders
                            // This will be handled by the CartContext
                          }}
                          onUpdateQuantity={(newQuantity) => updateQuantity(item.id, newQuantity)}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <PriceDisplay amount={getTotalPrice()} originalCurrency="USD" />
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <PriceDisplay amount={getTotalPrice()} originalCurrency="USD" />
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleCheckout}
                    disabled={loading}
                    className="w-full mt-6"
                    size="lg"
                  >
                    {loading ? 'Processing...' : 'Proceed to Payment'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutPage;
