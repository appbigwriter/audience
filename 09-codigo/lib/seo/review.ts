export function reviewSeo(article:{title:string;meta:string;headings:string[];canonical:string;altText:string;keywords:string[]}) {
  const checks={
    title: article.title.length>=20 && article.title.length<=65,
    meta: article.meta.length>=120 && article.meta.length<=170,
    headings: article.headings.length>=2,
    canonical: Boolean(article.canonical),
    altText: Boolean(article.altText),
    keywords: article.keywords.length>0
  }
  return {checks, score:Object.values(checks).filter(Boolean).length, passed:Object.values(checks).every(Boolean)}
}
