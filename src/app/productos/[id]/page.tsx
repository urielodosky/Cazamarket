import type { Metadata, ResolvingMetadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import ProductPageClient from './ProductPageClient';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = (await params).id;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from('products')
    .select('name, description, image, price, profiles!user_id(store_name, full_name)')
    .eq('id', id)
    .single();

  if (!product) {
    return {
      title: 'Producto no encontrado | CazaMarket',
      description: 'El producto que buscas no existe o fue eliminado.',
    };
  }

  const profile = Array.isArray(product.profiles) ? product.profiles[0] : product.profiles;
  const sellerName = profile?.store_name || profile?.full_name || 'Un negocio de CazaMarket';

  return {
    title: `${product.name} | ${sellerName} | CazaMarket`,
    description: product.description || `Comprá ${product.name} en CazaMarket.`,
    openGraph: {
      title: `${product.name} - ${sellerName}`,
      description: product.description || `Comprá ${product.name} en CazaMarket.`,
      images: product.image ? [product.image] : [],
    },
  };
}

export default async function Page(props: Props) {
  const id = (await props.params).id;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from('products')
    .select('name, description, image, price')
    .eq('id', id)
    .single();

  const jsonLd = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.image,
    description: product.description,
    offers: {
      '@type': 'Offer',
      price: product.price || 0,
      priceCurrency: 'ARS',
      availability: 'https://schema.org/InStock'
    }
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductPageClient params={props.params} />
    </>
  );
}
