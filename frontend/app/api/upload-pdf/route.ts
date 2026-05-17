import { NextRequest, NextResponse } from 'next/server';

// pdf-parse v2 uses a class-based API
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFParse } = require('pdf-parse') as {
  PDFParse: new (opts: { data: Buffer }) => { getText(): Promise<{ text: string }> };
};

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    const text = result.text?.trim();

    if (!text || text.length < 10) {
      return NextResponse.json({ message: 'Could not extract text from PDF' }, { status: 400 });
    }

    const res = await fetch(`${BACKEND_URL}/ingestion/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: text,
        source_type: 'pdf',
        metadata: { fileName: file.name },
      }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ message }, { status: 500 });
  }
}
