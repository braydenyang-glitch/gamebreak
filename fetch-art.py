import json, pathlib, subprocess, re, concurrent.futures, html
R=pathlib.Path(__file__).resolve().parent
sources={
'genshin':'https://genshin.hoyoverse.com/en/',
'starrail':'https://hsr.hoyoverse.com/en-us/',
'minecraft':'https://www.minecraft.net/en-us/about-minecraft',
'gta':'https://store.steampowered.com/app/3240220/Grand_Theft_Auto_V_Enhanced/',
'delta':'https://store.steampowered.com/app/2507950/Delta_Force/',
'fortnite':'https://www.fortnite.com/',
'roblox':'https://www.roblox.com/games/6516141723/DOORS',
'pubg':'https://store.steampowered.com/app/578080/PUBG_BATTLEGROUNDS/',
'brawl':'https://supercell.com/en/games/brawlstars/',
'wuwa':'https://store.steampowered.com/app/3513350/Wuthering_Waves/'
}
def get(x):
 k,u=x
 try:
  raw=subprocess.check_output(['/usr/bin/curl','-L','--fail','-sS','--max-time','35','-A','Mozilla/5.0',u],text=True)
  tags=re.findall(r'<meta\b[^>]*>',raw,re.I)
  images=[]
  for tag in tags:
   if re.search(r'(og:image|twitter:image)[\s\"\x27]',tag):
    m=re.search(r'content=[\"\x27]([^\"\x27]+)',tag)
    if m: images.append(html.unescape(m.group(1)))
  return k,{'page':u,'images':images[:5]}
 except Exception as e:return k,{'page':u,'error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:d=dict(ex.map(get,sources.items()))
(R/'art-sources.json').write_text(json.dumps(d,indent=2))
for k,v in d.items():print(k,json.dumps(v))
