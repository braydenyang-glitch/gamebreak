import json,pathlib,subprocess,re,html,concurrent.futures
R=pathlib.Path(__file__).resolve().parent
d=json.loads((R/'art-sources.json').read_text())
replace={'genshin':'https://store.epicgames.com/en-US/p/genshin-impact','fortnite':'https://store.epicgames.com/en-US/p/fortnite','delta':'https://www.playdeltaforce.com/en/'}
for k,u in replace.items():
 try:
  s=subprocess.check_output(['/usr/bin/curl','-L','--fail','-sS','--max-time','25','-A','Mozilla/5.0',u],text=True)
  tags=re.findall(r'<meta\b[^>]*>',s,re.I)
  imgs=[]
  for tag in tags:
   if re.search(r'(og:image|twitter:image)[\s\"\x27]',tag):
    m=re.search(r'content=[\"\x27]([^\"\x27]+)',tag)
    if m: imgs.append(html.unescape(m.group(1)))
  if imgs:d[k]={'page':u,'images':imgs}
 except Exception as e:print(k,str(e))
(R/'art-sources.json').write_text(json.dumps(d,indent=2))
def load(x):
 k,v=x
 if not v.get('images'):return k,'No image'
 u=v['images'][0]
 if u.startswith('//'):u='https:'+u
 if u.startswith('/'):u='https://www.playdeltaforce.com'+u
 dest=R/'dist'/'assets'/f'{k}.jpg'
 try:
  subprocess.run(['/usr/bin/curl','-L','--fail','-sS','--max-time','40',u,'-o',str(dest)],check=True)
  return k,str(dest.stat().st_size)+' bytes '+u
 except Exception as e:return k,str(e)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:
 for k,v in ex.map(load,d.items()):print(k,v)
