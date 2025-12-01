-- Supabase (Postgres) schema for Pizzeria

-- 1. Pizzas table: lista de produtos
CREATE TABLE IF NOT EXISTS pizzas (
  id serial PRIMARY KEY,
  name text NOT NULL,
  description text,
  price numeric(8,2) NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- 2. Carts: represent a shopping cart (can be anonymous)
CREATE TABLE IF NOT EXISTS carts (
  id serial PRIMARY KEY,
  user_id text, -- opcional, para identificar usuário
  created_at timestamptz DEFAULT now()
);

-- 3. Cart items: itens dentro do carrinho
CREATE TABLE IF NOT EXISTS cart_items (
  id serial PRIMARY KEY,
  cart_id integer NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  pizza_id integer NOT NULL REFERENCES pizzas(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  added_at timestamptz DEFAULT now()
);

-- 4. Orders: pedido finalizado
CREATE TABLE IF NOT EXISTS orders (
  id serial PRIMARY KEY,
  cart_id integer NOT NULL REFERENCES carts(id),
  total numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- 5. Order items: snapshot of items when ordering (optional but useful)
CREATE TABLE IF NOT EXISTS order_items (
  id serial PRIMARY KEY,
  order_id integer NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  pizza_id integer NOT NULL,
  pizza_name text NOT NULL,
  unit_price numeric(8,2) NOT NULL,
  quantity integer NOT NULL,
  line_total numeric(10,2) NOT NULL
);

-- Índices para performance básica
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
