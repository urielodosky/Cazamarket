import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Use service role key to bypass RLS and fetch all interactions globally
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Fetch all published interactions from the last 7 days that have a 'concreto' review
    const { data: sales, error } = await supabase
      .from('interactions')
      .select('product_id, service_id, seller_id, reviews!inner(purchase_outcome)')
      .eq('status', 'published')
      .gte('created_at', oneWeekAgo.toISOString())
      .eq('reviews.purchase_outcome', 'concreto');

    if (error) throw error;

    const salesData = sales || [];
    
    const prodCounts: Record<string, number> = {};
    const servCounts: Record<string, number> = {};
    const sellerCounts: Record<string, number> = {};

    salesData.forEach(s => {
      if (s.seller_id) sellerCounts[s.seller_id] = (sellerCounts[s.seller_id] || 0) + 1;
      if (s.product_id) prodCounts[s.product_id] = (prodCounts[s.product_id] || 0) + 1;
      if (s.service_id) servCounts[s.service_id] = (servCounts[s.service_id] || 0) + 1;
    });

    const topProdIds = Object.entries(prodCounts).sort((a,b) => b[1] - a[1]).slice(0, 10).map(e => e[0]);
    const topServIds = Object.entries(servCounts).sort((a,b) => b[1] - a[1]).slice(0, 10).map(e => e[0]);
    const topSellerIds = Object.entries(sellerCounts).sort((a,b) => b[1] - a[1]).slice(0, 10).map(e => e[0]);

    let topNegocios = [];
    if (topSellerIds.length > 0) {
      const { data } = await supabase.from('profiles').select('id, name, type, profile_image_url').in('id', topSellerIds);
      if (data) {
        topNegocios = topSellerIds.map(id => {
          const p = data.find(d => d.id === id);
          if (!p) return null;
          return {
            id: p.id,
            name: p.name || 'Negocio',
            type: p.type || 'Tienda',
            image: p.profile_image_url || '/placeholder.jpg',
            ventas_concretadas: sellerCounts[p.id] || 0,
            clicks: 0
          };
        }).filter(Boolean) as any[];
      }
    } else {
      // Fallback if no sales
      const { data } = await supabase.from('profiles').select('id, name, type, profile_image_url').eq('role', 'negocio').limit(10);
      if (data) {
        topNegocios = data.map(p => ({
          id: p.id,
          name: p.name || 'Negocio',
          type: p.type || 'Tienda',
          image: p.profile_image_url || '/placeholder.jpg',
          ventas_concretadas: 0,
          clicks: 0
        }));
      }
    }

    let topProductos = [];
    if (topProdIds.length > 0) {
      const { data } = await supabase.from('products').select('id, name, image_urls, clicks').in('id', topProdIds);
      if (data) {
        topProductos = topProdIds.map(id => {
          const p = data.find(d => d.id === id);
          if (!p) return null;
          return {
            id: p.id,
            name: p.name,
            image: (p.image_urls && p.image_urls.length > 0) ? p.image_urls[0] : '/placeholder.jpg',
            ventas_concretadas: prodCounts[p.id] || 0,
            clicks: p.clicks || 0
          };
        }).filter(Boolean) as any[];
      }
    } else {
      // Fallback to most clicked
      const { data } = await supabase.from('products').select('id, name, image_urls, clicks').order('clicks', { ascending: false }).limit(10);
      if (data) {
        topProductos = data.map(p => ({
          id: p.id,
          name: p.name,
          image: (p.image_urls && p.image_urls.length > 0) ? p.image_urls[0] : '/placeholder.jpg',
          ventas_concretadas: 0,
          clicks: p.clicks || 0
        }));
      }
    }

    let topServicios = [];
    if (topServIds.length > 0) {
      const { data } = await supabase.from('services').select('id, name, image_urls, location, clicks').in('id', topServIds);
      if (data) {
        topServicios = topServIds.map(id => {
          const p = data.find(d => d.id === id);
          if (!p) return null;
          return {
            id: p.id,
            name: p.name,
            location: p.location || 'Argentina',
            image: (p.image_urls && p.image_urls.length > 0) ? p.image_urls[0] : '/placeholder.jpg',
            ventas_concretadas: servCounts[p.id] || 0,
            clicks: p.clicks || 0
          };
        }).filter(Boolean) as any[];
      }
    } else {
      // Fallback to most clicked
      const { data } = await supabase.from('services').select('id, name, image_urls, location, clicks').order('clicks', { ascending: false }).limit(10);
      if (data) {
        topServicios = data.map(p => ({
          id: p.id,
          name: p.name,
          location: p.location || 'Argentina',
          image: (p.image_urls && p.image_urls.length > 0) ? p.image_urls[0] : '/placeholder.jpg',
          ventas_concretadas: 0,
          clicks: p.clicks || 0
        }));
      }
    }

    return NextResponse.json({
      negocios: topNegocios,
      productos: topProductos,
      servicios: topServicios
    });

  } catch (error: any) {
    console.error('API /trending error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
