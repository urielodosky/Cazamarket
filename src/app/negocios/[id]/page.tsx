import type { Metadata, ResolvingMetadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import NegocioPageClient from './NegocioPageClient';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = (await params).id;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('store_name, full_name, store_description, avatar_url')
    .eq('id', id)
    .single();

  if (!profile) {
    return {
      title: 'Negocio no encontrado | CazaMarket',
      description: 'El negocio que buscas no existe o fue eliminado.',
    };
  }

  const storeName = profile.store_name || profile.full_name || 'Negocio en CazaMarket';
  const desc = profile.store_description || `Visitá la tienda de ${storeName} en CazaMarket.`;

  return {
    title: `${storeName} | CazaMarket`,
    description: desc,
    openGraph: {
      title: `${storeName} en CazaMarket`,
      description: desc,
      images: profile.avatar_url ? [profile.avatar_url] : [],
    },
  };
}

export default function Page(props: Props) {
  return <NegocioPageClient params={props.params} />;
}
