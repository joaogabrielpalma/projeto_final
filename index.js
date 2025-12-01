import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// GET PIZZAS
app.get('/pizzas', async (req, res) => {
  const { data, error } = await supabase.from('pizzas').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// CREATE CART
app.post('/cart', async (req, res) => {
  const { data, error } = await supabase.from('carts').insert([{}]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ADD ITEM
app.post('/cart/:cartId/items', async (req, res) => {
  const { cartId } = req.params;
  const { pizza_id, quantity } = req.body;

  const { data, error } = await supabase
    .from('cart_items')
    .insert([{ cart_id: cartId, pizza_id, quantity }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET CART
app.get('/cart/:cartId', async (req, res) => {
  const { cartId } = req.params;

  const { data: items, error } = await supabase
    .from('cart_items')
    .select('id, pizza_id, quantity')
    .eq('cart_id', cartId);

  // ← CORREÇÃO IMPORTANTE AQUI
  if (!items || items.length === 0) {
    return res.json({ cart_id: cartId, items: [] });
  }

  const pizzaIds = items.map(i => i.pizza_id);

  const { data: pizzas } = await supabase
    .from('pizzas')
    .select('id, name, price, image_url')
    .in('id', pizzaIds);

  const merged = items.map(it => ({
    ...it,
    pizza: pizzas.find(p => p.id === it.pizza_id)
  }));

  res.json({ cart_id: cartId, items: merged });
});

// DELETE ITEM
app.delete('/cart/items/:id', async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase.from('cart_items').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });

  res.json({ message: "Item removido" });
});

// CHECKOUT FIXED
app.post('/checkout/:cartId', async (req, res) => {
  const { cartId } = req.params;

  const { data: items, error: itemsError } = await supabase
    .from('cart_items')
    .select('pizza_id, quantity')
    .eq('cart_id', cartId);

  // ← CORREÇÃO IMPORTANTE AQUI (EVITA O ERRO QUE VOCÊ TEVE)
  if (!items || items.length === 0) {
    return res.status(400).json({ error: "Carrinho vazio" });
  }

  const pizzaIds = items.map(i => i.pizza_id);

  const { data: pizzas, error: pizzasError } = await supabase
    .from('pizzas')
    .select('id, price, name')
    .in('id', pizzaIds);

  let total = 0;
  items.forEach(i => {
    const p = pizzas.find(x => x.id === i.pizza_id);
    total += p.price * i.quantity;
  });

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert([{ cart_id: cartId, total, status: "paid" }])
    .select()
    .single();

  await supabase.from('cart_items').delete().eq('cart_id', cartId);

  res.json(order);
});

app.listen(PORT, () => console.log("API rodando na porta " + PORT));
