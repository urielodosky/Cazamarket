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
    console.error('[SECURITY LOG] Falta configurar API Key de CUIT en el servidor.');
    return NextResponse.json({ 
      error: 'API_KEY_MISSING',
      message: 'Servicio de validación temporalmente inactivo.' 
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
        return NextResponse.json({ error: 'NOT_FOUND', message: 'El CUIT no existe o no es válido' }, { status: 404 });
      }
      console.error(`[SECURITY LOG] Error remoto API CUIT (Status: ${response.status})`);
      return NextResponse.json({ error: 'API_ERROR', message: 'Error al consultar validación' }, { status: response.status });
    }

    const data = await response.json();
    const razonSocial = data.nombre || data.denominacion || (data.data && data.data.denominacion) || (data.data && data.data.nombre);
    const tipo = data.tipoPersona || (data.data && data.data.tipoPersona);

    return NextResponse.json({
      success: true,
      razonSocial: typeof razonSocial === 'string' ? razonSocial.replace(/[<>]/g, '') : '',
      tipo: typeof tipo === 'string' ? tipo.replace(/[<>]/g, '') : ''
    });

  } catch (error: any) {
    console.error('[SECURITY LOG] Error interno consultando CUIT:', error?.message || 'Unknown error');
    return NextResponse.json({ error: 'INTERNAL_ERROR', message: 'Error interno del servidor' }, { status: 500 });
  }
}
