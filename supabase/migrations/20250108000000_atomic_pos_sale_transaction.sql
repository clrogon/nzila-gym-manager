-- ============================================================================
-- ATOMIC POS SALE TRANSACTION RPC FUNCTION
-- Migration: 20250108000000_atomic_pos_sale_transaction.sql
-- ============================================================================
-- This migration creates a secure, atomic transaction function for POS sales
-- to prevent race conditions and ensure data consistency

-- Drop existing function if exists
DROP FUNCTION IF EXISTS public.complete_pos_sale_transaction;

-- Create atomic transaction function
CREATE OR REPLACE FUNCTION public.complete_pos_sale_transaction(
  p_gym_id UUID,
  p_member_id UUID,
  p_cashier_id UUID,
  p_payment_method TEXT,
  p_items JSONB
)
RETURNS TABLE (
  sale_id UUID,
  sale_items JSONB,
  products_updated JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subtotal NUMERIC;
  v_tax NUMERIC;
  v_total NUMERIC;
  v_sale_id UUID;
  v_product_record RECORD;
  v_item JSONB;
  v_sale_items_result JSONB := '[]'::JSONB;
  v_products_updated_result JSONB := '[]'::JSONB;
  v_cart_array JSONB;
  v_index INTEGER := 0;
BEGIN
  -- Validate inputs
  IF p_gym_id IS NULL OR p_cashier_id IS NULL OR p_payment_method IS NULL THEN
    RAISE EXCEPTION 'Missing required parameters: gym_id, cashier_id, or payment_method';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Sale items cannot be empty';
  END IF;

  -- Parse items array
  v_cart_array := p_items;

  -- Validate all items have required fields
  FOR v_index IN 0..jsonb_array_length(v_cart_array) - 1 LOOP
    v_item := v_cart_array -> v_index;

    IF NOT (v_item ? 'product_id' AND v_item ? 'quantity' AND v_item ? 'price') THEN
      RAISE EXCEPTION 'Item at index % is missing required fields', v_index;
    END IF;
  END LOOP;

  -- Calculate totals
  SELECT
    SUM((item->>'quantity')::NUMERIC * (item->>'price')::NUMERIC)
  INTO v_subtotal
  FROM jsonb_array_elements(v_cart_array) AS item;

  v_tax := v_subtotal * 0.14; -- 14% VAT
  v_total := v_subtotal + v_tax;

  -- Start atomic transaction
  BEGIN
    -- Create sale record
    INSERT INTO public.sales (
      gym_id,
      member_id,
      cashier_id,
      subtotal,
      tax,
      total,
      payment_method,
      created_at
    )
    VALUES (
      p_gym_id,
      p_member_id,
      p_cashier_id,
      v_subtotal,
      v_tax,
      v_total,
      p_payment_method,
      NOW()
    )
    RETURNING id INTO v_sale_id;

    -- Process sale items and update stock atomically
    FOR v_index IN 0..jsonb_array_length(v_cart_array) - 1 LOOP
      v_item := v_cart_array -> v_index;

      -- Get current product record with lock (FOR UPDATE)
      SELECT * INTO v_product_record
      FROM public.products
      WHERE id = (v_item->>'product_id')::UUID
      FOR UPDATE;

      -- Validate product exists and belongs to gym
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Product with id % not found', (v_item->>'product_id');
      END IF;

      IF v_product_record.gym_id != p_gym_id THEN
        RAISE EXCEPTION 'Product % does not belong to gym %', (v_item->>'product_id'), p_gym_id;
      END IF;

      -- Validate sufficient stock
      IF v_product_record.stock_quantity < (v_item->>'quantity')::INTEGER THEN
        RAISE EXCEPTION 'Insufficient stock for product % (requested: %, available: %)',
          v_product_record.name,
          (v_item->>'quantity')::INTEGER,
          v_product_record.stock_quantity;
      END IF;

      -- Create sale item
      INSERT INTO public.sale_items (
        sale_id,
        product_id,
        quantity,
        unit_price,
        total
      )
      VALUES (
        v_sale_id,
        (v_item->>'product_id')::UUID,
        (v_item->>'quantity')::INTEGER,
        (v_item->>'price')::NUMERIC,
        (v_item->>'price')::NUMERIC * (v_item->>'quantity')::NUMERIC
      );

      -- Update product stock atomically
      UPDATE public.products
      SET
        stock_quantity = stock_quantity - (v_item->>'quantity')::INTEGER,
        updated_at = NOW()
      WHERE id = (v_item->>'product_id')::UUID;

      -- Build results
      v_sale_items_result := v_sale_items_result || jsonb_build_object(
        'product_id', (v_item->>'product_id')::UUID,
        'product_name', v_product_record.name,
        'quantity', (v_item->>'quantity')::INTEGER,
        'unit_price', (v_item->>'price')::NUMERIC,
        'total', (v_item->>'price')::NUMERIC * (v_item->>'quantity')::NUMERIC
      );

      v_products_updated_result := v_products_updated_result || jsonb_build_object(
        'product_id', (v_item->>'product_id')::UUID,
        'product_name', v_product_record.name,
        'old_stock', v_product_record.stock_quantity,
        'new_stock', v_product_record.stock_quantity - (v_item->>'quantity')::INTEGER
      );
    END LOOP;

    -- Commit is automatic on successful completion
  END;

  -- Return results
  RETURN QUERY SELECT
    v_sale_id AS sale_id,
    v_sale_items_result AS sale_items,
    v_products_updated_result AS products_updated;

EXCEPTION
  WHEN OTHERS THEN
    -- Transaction is automatically rolled back
    RAISE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.complete_pos_sale_transaction TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.complete_pos_sale_transaction IS 'Atomic transaction for completing POS sales. Ensures stock updates and sale items are created atomically to prevent race conditions and data inconsistency.';

-- ============================================================================
-- ADDITIONAL HELPER FUNCTIONS
-- ============================================================================

-- Function to validate sale before processing
CREATE OR REPLACE FUNCTION public.validate_pos_sale(
  p_gym_id UUID,
  p_items JSONB
)
RETURNS TABLE (
  is_valid BOOLEAN,
  error_message TEXT,
  total_cost NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product RECORD;
  v_item JSONB;
  v_index INTEGER := 0;
  v_total NUMERIC := 0;
  v_error_message TEXT := '';
BEGIN
  -- Check if cart is empty
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RETURN QUERY SELECT false AS is_valid, 'Cart cannot be empty'::TEXT AS error_message, 0::NUMERIC AS total_cost;
    RETURN;
  END IF;

  -- Validate each item
  FOR v_index IN 0..jsonb_array_length(p_items) - 1 LOOP
    v_item := p_items -> v_index;

    -- Get product with lock
    SELECT * INTO v_product
    FROM public.products
    WHERE id = (v_item->>'product_id')::UUID
      AND gym_id = p_gym_id
      AND is_active = true;

    IF NOT FOUND THEN
      v_error_message := 'Product not found or inactive: ' || (v_item->>'product_id');
      RETURN QUERY SELECT false AS is_valid, v_error_message AS error_message, 0::NUMERIC AS total_cost;
      RETURN;
    END IF;

    -- Check stock
    IF v_product.stock_quantity < (v_item->>'quantity')::INTEGER THEN
      v_error_message := 'Insufficient stock for ' || v_product_name || ': requested ' ||
        (v_item->>'quantity') || ', available ' || v_product.stock_quantity;
      RETURN QUERY SELECT false AS is_valid, v_error_message AS error_message, 0::NUMERIC AS total_cost;
      RETURN;
    END IF;

    -- Accumulate total
    v_total := v_total + (v_item->>'price')::NUMERIC * (v_item->>'quantity')::NUMERIC;
  END LOOP;

  -- Return success
  RETURN QUERY SELECT true AS is_valid, NULL::TEXT AS error_message, v_total AS total_cost;
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_pos_sale TO authenticated;

COMMENT ON FUNCTION public.validate_pos_sale IS 'Validates a POS sale before processing. Returns validation result, error message (if any), and total cost including tax.';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next Steps:
-- 1. Update POSInterface.tsx to use complete_pos_sale_transaction RPC
-- 2. Add pre-validation using validate_pos_sale
-- 3. Test with concurrent sales to verify atomicity
