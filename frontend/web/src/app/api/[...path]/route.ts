import { NextRequest, NextResponse } from 'next/server';

// URL interna da EC2 — nunca exposta ao browser (sem NEXT_PUBLIC_)
const EC2_URL = process.env.EC2_URL ?? 'http://localhost:3000';

async function proxy(req: NextRequest, params: { path: string[] }) {
  const path = params.path.join('/');
  const target = `${EC2_URL}/${path}${req.nextUrl.search}`;

  const headers: HeadersInit = {
    'content-type': 'application/json',
  };

  const auth = req.headers.get('authorization');
  if (auth) headers['authorization'] = auth;

  const xBarbershopId = req.headers.get('x-barbershop-id');
  if (xBarbershopId) headers['x-barbershop-id'] = xBarbershopId;

  const body = req.method !== 'GET' && req.method !== 'HEAD'
    ? await req.text()
    : undefined;

  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body,
  });

  const data = await upstream.text();

  return new NextResponse(data, {
    status: upstream.status,
    headers: { 'content-type': 'application/json' },
  });
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params);
}
export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params);
}
export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params);
}
export async function PATCH(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params);
}
export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params);
}
