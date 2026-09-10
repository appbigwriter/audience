export interface HermesProfileAdapter { create(input: { slug: string; niche: string; voice: string }): Promise<{ id: string }>; health(id: string): Promise<boolean> }
