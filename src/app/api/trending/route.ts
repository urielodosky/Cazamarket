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
      .select('product_id, service_id, seller_id, reviews!inner(purchase_outcome, seller_rating, product_rating)')
      .eq('status', 'published')
      .gte('created_at', oneWeekAgo.toISOString())
      .eq('reviews.purchase_outcome', 'concreto');

    if (error) throw error;

    const salesData = sales || [];
    
    type Agg = { count: number; ratingSum: number };
    const prodAgg: Record<string, Agg> = {};
    const servAgg: Record<string, Agg> = {};
    const sellerAgg: Record<string, Agg> = {};

    salesData.forEach(s => {
      // Use any to bypass TS complaints since reviews could be array or object in postgrest response
      const review = Array.isArray(s.reviews) ? s.reviews[0] : s.reviews;
      const sRating = review?.seller_rating || 0;
      const pRating = review?.product_rating || sRating; // Fallback to seller rating if product rating is missing

      if (s.seller_id) {
        if (!sellerAgg[s.seller_id]) sellerAgg[s.seller_id] = { count: 0, ratingSum: 0 };
        sellerAgg[s.seller_id].count += 1;
        sellerAgg[s.seller_id].ratingSum += sRating;
      }
      if (s.product_id) {
        if (!prodAgg[s.product_id]) prodAgg[s.product_id] = { count: 0, ratingSum: 0 };
        prodAgg[s.product_id].count += 1;
        prodAgg[s.product_id].ratingSum += pRating;
      }
      if (s.service_id) {
        if (!servAgg[s.service_id]) servAgg[s.service_id] = { count: 0, ratingSum: 0 };
        servAgg[s.service_id].count += 1;
        servAgg[s.service_id].ratingSum += pRating;
      }
    });

    const getAvg = (agg: Agg) => agg.count > 0 ? agg.ratingSum / agg.count : 0;

    // Pre-sort IDs by count then avgRating to pick the top 30 candidates to fetch clicks for
    const getTopIds = (agg: Record<string, Agg>) => Object.entries(agg)
      .sort((a,b) => {
        if (b[1].count !== a[1].count) return b[1].count - a[1].count;
        return getAvg(b[1]) - getAvg(a[1]);
      })
      .slice(0, 30)
      .map(e => e[0]);

    const topProdIds = getTopIds(prodAgg);
    const topServIds = getTopIds(servAgg);
    const topSellerIds = getTopIds(sellerAgg);

    let topNegocios = [];
    if (topSellerIds.length > 0) {
      const { data } = await supabase.from('profiles').select('id, name, type, profile_image_url, clicks').in('id', topSellerIds);
      if (data) {
        topNegocios = topSellerIds.map(id => {
          const p = data.find(d => d.id === id);
          if (!p) return null;
          return {
            id: p.id,
            name: p.name || 'Negocio',
            type: p.type || 'Tienda',
            image: p.profile_image_url || '/placeholder.jpg',
            ventas_concretadas: sellerAgg[p.id]?.count || 0,
            avgRating: getAvg(sellerAgg[p.id] || { count: 0, ratingSum: 0 }),
            clicks: p.clicks || 0
          };
        }).filter(Boolean) as any[];

        topNegocios.sort((a, b) => {
          if (b.ventas_concretadas !== a.ventas_concretadas) return b.ventas_concretadas - a.ventas_concretadas;
          if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
          return a.clicks - b.clicks;
        });
        topNegocios = topNegocios.slice(0, 10);
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
            ventas_concretadas: prodAgg[p.id]?.count || 0,
            avgRating: getAvg(prodAgg[p.id] || { count: 0, ratingSum: 0 }),
            clicks: p.clicks || 0
          };
        }).filter(Boolean) as any[];

        topProductos.sort((a, b) => {
          if (b.ventas_concretadas !== a.ventas_concretadas) return b.ventas_concretadas - a.ventas_concretadas;
          if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
          return a.clicks - b.clicks;
        });
        topProductos = topProductos.slice(0, 10);
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
            ventas_concretadas: servAgg[p.id]?.count || 0,
            avgRating: getAvg(servAgg[p.id] || { count: 0, ratingSum: 0 }),
            clicks: p.clicks || 0
          };
        }).filter(Boolean) as any[];

        topServicios.sort((a, b) => {
          if (b.ventas_concretadas !== a.ventas_concretadas) return b.ventas_concretadas - a.ventas_concretadas;
          if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
          return a.clicks - b.clicks;
        });
        topServicios = topServicios.slice(0, 10);
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
