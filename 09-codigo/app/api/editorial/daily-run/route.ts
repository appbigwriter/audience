import { NextResponse } from 'next/server'
import { getBlogRuntime } from '@/lib/runtime'
export async function POST(request: Request) { try { const { blogId } = await request.json(); const jobs = await getBlogRuntime().service.dailyRun(blogId); return NextResponse.json({ blogId, jobs, count: jobs.length }, { status: 201 }) } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'request failed' }, { status: 400 }) } }
