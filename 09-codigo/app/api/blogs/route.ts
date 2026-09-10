import { BlogService, MockControlTower, MockHermes, MockRepository } from '@/lib'
const repo=new MockRepository(); const service=new BlogService(repo,new MockHermes(true),new MockControlTower())
export async function POST(request:Request){try{const body=await request.json();const receipt=await service.createBlog(body);return Response.json(receipt,{status:201})}catch(e){return Response.json({error:e instanceof Error?e.message:'invalid request'},{status:400})}}
