import { NextResponse } from 'next/server'
import { getBlogRuntime } from '@/lib/runtime'
export async function POST(request: Request) { try { const body = await request.json(); const receipt = await getBlogRuntime().service.createBlog(body); return NextResponse.json(receipt, { status: 201 }) } catch (error) { const message = error instanceof Error ? error.message : 'request failed'; const status = message.includes('duplicate') ? 409 : message.includes('not configured') || message.includes('required') ? 503 : 400; return NextResponse.json({ error: message }, { status }) } }
