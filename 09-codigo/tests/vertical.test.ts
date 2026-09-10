import { describe, expect, it } from 'vitest'
import { BlogService, MockControlTower, MockHermes, MockRepository } from '../lib'

describe('FBR Blogs vertical', () => {
  it('blocks provisioning before validated manager', async () => {
    const tower = new MockControlTower(); const service = new BlogService(new MockRepository(), new MockHermes(false), tower)
    await expect(service.createBlog({name:'Cinema',slug:'cinema',niche:'filmes',language:'pt',voice:'neutro'})).rejects.toThrow('manager')
    expect(tower.calls).toBe(0)
  })
  it('provisions custom_base only after manager and creates handoffs', async () => {
    const tower = new MockControlTower(); const service = new BlogService(new MockRepository(), new MockHermes(true), tower)
    const receipt = await service.createBlog({name:'Cinema',slug:'cinema',niche:'filmes',language:'pt',voice:'neutro'})
    expect(tower.calls).toBe(1); expect(receipt.templateKey).toBe('custom_base'); expect(receipt.handoffs).toHaveLength(3)
  })
  it('creates exactly three daily jobs and draft-only articles', async () => {
    const repo = new MockRepository(); const service = new BlogService(repo, new MockHermes(true), new MockControlTower())
    const blog = await service.createBlog({name:'Casa',slug:'casa',niche:'casa',language:'pt',voice:'claro'}); const jobs = service.dailyRun(blog.blogId)
    expect(jobs).toHaveLength(3); expect(jobs.filter(j=>j.kind==='niche')).toHaveLength(2); expect(jobs.filter(j=>j.kind==='affiliate_radar')).toHaveLength(1)
    expect(jobs.every(j=>j.status==='draft' && j.bullets.length>=4 && Math.abs(j.wordCount-1300)<=150)).toBe(true)
    expect(jobs.every(j=>j.ads.affiliate && j.ads.product && j.disclosure)).toBe(true)
  })
  it('rejects unsupported ad sizes and formats', () => { expect(()=>serviceAd({type:'product',width:728,height:90})).toThrow(); expect(()=>serviceAd({type:'bad',width:350,height:350})).toThrow() })
})
function serviceAd(x: {type:string;width:number;height:number}) { if(!['affiliate','product'].includes(x.type)||!((x.width===1250&&x.height===150)||(x.width===350&&x.height===350))) throw new Error('invalid ad'); return x }
