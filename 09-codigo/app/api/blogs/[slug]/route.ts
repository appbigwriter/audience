import { BlogService, MockControlTower, MockHermes, MockRepository } from '@/lib'
const repo=new MockRepository(); const service=new BlogService(repo,new MockHermes(true),new MockControlTower())
export async function POST(request:Request,{params}:{params:{slug:string}}){try{const blogId=[...repo.blogs.entries()].find(([,blog])=>blog.slug===params.slug)?.[0]; if(!blogId) throw new Error('blog not found'); const jobs=service.dailyRun(blogId);return Response.json(jobs)}catch(e){return Response.json({error:e instanceof Error?e.message:'not found'},{status:404})}}
