import { BlogService } from '../index'
import { getBlogRuntime } from '../runtime'
export function createDailyRunService(): BlogService { return getBlogRuntime().service }
export async function dailyRun(blogId: string) { return createDailyRunService().dailyRun(blogId) }
