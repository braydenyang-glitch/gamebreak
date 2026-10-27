import urllib.request, json, pathlib, concurrent.futures, subprocess
ROOT=pathlib.Path(__file__).resolve().parent
GAMES=[('genshin','Genshin Impact'),('starrail','Honkai: Star Rail'),('minecraft','Minecraft'),('gta','Grand Theft Auto V'),('delta','Delta Force (2025 video game)'),('fortnite','Fortnite Battle Royale'),('roblox','Roblox'),('pubg','PUBG: Battlegrounds'),('brawl','Brawl Stars'),('wuwa','Wuthering Waves')]
from urllib.parse import urlencode

def load(entry):
 id,title=entry
 url='https://en.wikipedia.org/w/api.php?'+urlencode(dict(action='query',prop='pageimages|extracts|info',titles=title,format='json',formatversion=2,piprop='thumbnail|name',pilicense='any',pithumbsize=700,exintro=1,explaintext=1,exsentences=2,inprop='url',redirects=1,origin='*'))
 req=urllib.request.Request(url,headers={'User-Agent':'GameBreak/1.0 (school project; https://gamebreak-brayden.early-ash-2742.chatgpt.site)'})
 try:
  data=json.loads(subprocess.check_output(['/usr/bin/curl','--fail','--silent','--show-error','--max-time','35','-A','GameBreak/1.0 (school project)',url],text=True))
  page=data['query']['pages'][0]
  return id,dict(title=page.get('title'),extract=page.get('extract',''),thumbnail=page.get('thumbnail',{}).get('source'),source=page.get('fullurl'),missing=page.get('missing',False))
 except Exception as e:return id,{'error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as ex:
 data=dict(ex.map(load,GAMES))
(ROOT/'metadata.json').write_text(json.dumps(data,indent=2,ensure_ascii=False))
for key,value in data.items():print(key,json.dumps(value,ensure_ascii=False))
