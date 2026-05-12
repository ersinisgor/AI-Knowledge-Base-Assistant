import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

export async function GET() {
  const res = await fetch(`${BACKEND_URL}/chat/sessions`);
  const data = await res.json();
  return NextResponse.json(data);
}
