'use server'

import { createClient as createServerClient } from '@/lib/supabase/server';
import { productSchema, serviceSchema } from '@/lib/validations/marketplaceSchemas';

export async function upsertProduct(productData: any, editId?: string) {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'No autorizado' };
  }

  // Validación Zod Backend
  const validationResult = productSchema.safeParse(productData);
  if (!validationResult.success) {
    return { 
      success: false, 
      error: 'Datos de producto inválidos', 
      details: validationResult.error.flatten().fieldErrors 
    };
  }

  const cleanData = { ...validationResult.data, user_id: user.id };

  if (editId) {
    const { error } = await supabase
      .from('products')
      .update(cleanData)
      .eq('id', editId)
      .eq('user_id', user.id);
      
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from('products').insert([cleanData]);
    if (error) return { success: false, error: error.message };
  }

  return { success: true };
}

export async function upsertService(serviceData: any, editId?: string) {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'No autorizado' };
  }

  // Validación Zod Backend
  const validationResult = serviceSchema.safeParse(serviceData);
  if (!validationResult.success) {
    return { 
      success: false, 
      error: 'Datos de servicio inválidos', 
      details: validationResult.error.flatten().fieldErrors 
    };
  }

  const cleanData = { ...validationResult.data, user_id: user.id };

  if (editId) {
    const { error } = await supabase
      .from('services')
      .update(cleanData)
      .eq('id', editId)
      .eq('user_id', user.id);
      
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from('services').insert([cleanData]);
    if (error) return { success: false, error: error.message };
  }

  return { success: true };
}
