import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cuit = searchParams.get('cuit');

  if (!cuit) {
    return NextResponse.json({ error: 'CUIT es requerido' }, { status: 400 });
  }

  const cleanCuit = cuit.replace(/\D/g, '');

  const apiKey = process.env.APICUIT_KEY;

  if (!apiKey) {
    // Si no hay API Key configurada, no fallamos, pero devolvemos un mensaje de error controlado
    // para que el frontend lo sepa y permita al usuario ingresar la razón social a mano.
    return NextResponse.json({ 
      error: 'API_KEY_MISSING',
      message: 'Falta configurar la API Key de apicuit.com en el archivo .env.local' 
    }, { status: 503 });
  }

  try {
    const response = await fetch(`https://afip.apicuit.com/api/v1/cuit/${cleanCuit}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'NOT_FOUND', message: 'El CUIT no existe en AFIP' }, { status: 404 });
      }
      return NextResponse.json({ error: 'API_ERROR', message: 'Error al consultar la API de CUIT' }, { status: response.status });
    }

    const data = await response.json();
    
    // Apicuit.com usually returns: { success: true, data: { denominacion: "...", ... } }
    // We will extract the business name (Razón social)
    
    // In case the API format changes, we check multiple common fields:
    const razonSocial = data.nombre || data.denominacion || (data.data && data.data.denominacion) || (data.data && data.data.nombre);
    const tipo = data.tipoPersona || (data.data && data.data.tipoPersona);

    return NextResponse.json({
      success: true,
      razonSocial: razonSocial || '',
      tipo: tipo || ''
    });

  } catch (error) {
    console.error('Error fetching CUIT API:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR', message: 'Error interno del servidor' }, { status: 500 });
  }
}
