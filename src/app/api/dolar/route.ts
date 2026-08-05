import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://dolarapi.com/v1/dolares/blue', {
      next: { revalidate: 300 } // Cache for 5 minutes
    });
    const data = await res.json();
    return NextResponse.json({ venta: data.venta || 1400 });
  } catch {
    return NextResponse.json({ venta: 1400 }); // fallback
  }
}
