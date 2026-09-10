import { BlogService, MockControlTower, MockHermes, MockRepository } from '../index'
export const repository=new MockRepository(); export const blogService=new BlogService(repository,new MockHermes(true),new MockControlTower())
export async function dailyRun(blogId:string){return blogService.dailyRun(blogId)}
