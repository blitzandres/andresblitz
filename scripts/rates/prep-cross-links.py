# Adds cross-links for a new rates page: dolar-* "otros" + footer, /tasa-bcv/ footer only, sitemap.xml, build-ai EXTRA + llms line.
# Usage (repo root): python3 scripts/rates/prep-cross-links.py <slug> x "<short name>" "<long link text>" "<topics js array>" "<note>"
import sys,re,glob
slug,live,name,long_,topics,note=sys.argv[1],sys.argv[2],sys.argv[3],sys.argv[4],sys.argv[5],sys.argv[6]
for f in glob.glob('dolar-*/index.html'):
    if f.startswith(slug+'/') or f.startswith('dolar-cripto/'):continue
    s=open(f).read()
    if f'href="/{slug}/"' in s: continue
    s,n1=re.subn(r'( · )(<a href="/tasa-bcv/">Tasa BCV hoy)',rf'\1<a href="/{slug}/">{long_}</a> · \2',s,count=1)
    s,n2=re.subn(r'(<a href="/tasa-bcv/">Tasa BCV \(Venezuela\)</a></nav>)',rf'<a href="/{slug}/">{name}</a> · \1',s,count=1)
    assert n1 and n2,f
    open(f,'w').write(s)
f='tasa-bcv/index.html';s=open(f).read()
a='<a href="/dolar-colombia/">Dólar hoy en Colombia</a>'
assert a in s
if f'href="/{slug}/"' not in s:
    import subprocess
    prev=[m for m in re.findall(r'<a href="/[a-z-]+/">[^<]+</a>(?=</nav>)',s) if s.index(m)>s.index(a)][0]  # last link of the footer nav that lists the country pages
    s=s.replace(prev+'</nav>',prev+f' · <a href="/{slug}/">{long_.split(":")[0]}</a></nav>',1)
    open(f,'w').write(s)
f='sitemap.xml';s=open(f).read()
if slug not in s:
    s=s.replace("""  <url>
    <loc>https://andresblitz.com/projects/</loc>""",f"""  <url>
    <loc>https://andresblitz.com/{slug}/</loc>
    <lastmod>2026-10-31</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://andresblitz.com/projects/</loc>""",1);open(f,'w').write(s)
f='scripts/build-ai.mjs';s=open(f).read()
if f"'/{slug}/'" not in s:
    s=s.replace("""  '/dolar-colombia/': {""",f"""  '/{slug}/': {{ topics: {topics}, note: '{note}' }},
  '/dolar-colombia/': {{""",1)
    s=s.replace("""${byPath('/dolar-colombia/') ? `- [Dólar Colombia](${byPath('/dolar-colombia/').mdUrl}): ${EXTRA['/dolar-colombia/'].note}` : ''}""","""${byPath('/dolar-colombia/') ? `- [Dólar Colombia](${byPath('/dolar-colombia/').mdUrl}): ${EXTRA['/dolar-colombia/'].note}` : ''}
${byPath('/"""+slug+"""/') ? `- ["""+name+"""](${byPath('/"""+slug+"""/').mdUrl}): ${EXTRA['/"""+slug+"""/'].note}` : ''}""",1)
    open(f,'w').write(s)
