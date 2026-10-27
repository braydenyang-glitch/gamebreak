#!/usr/bin/env python3
"""Cache and decode catalog imagery, with provenance and exact-entity alternatives.

Requires Python 3, Pillow and curl. Run from any directory. No API keys are used.
Repeated runs reuse already decoded WebP files. --refresh rechecks upstream URLs.
"""
from __future__ import annotations
import argparse, concurrent.futures, hashlib, io, json, re, subprocess, time
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'dist/assets/catalog'
REPORT = ROOT.parent / 'output/catalog-image-audit'
RAW = ROOT.parent / 'output/api-research'
Image.MAX_IMAGE_PIXELS = 45_000_000

def read(path, default=None):
    try: return json.loads(path.read_text())
    except (FileNotFoundError, json.JSONDecodeError): return default

def image_urls(obj):
    return [v for v in obj.values() if isinstance(v, str) and v.startswith('https://')]

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--workers', type=int, default=8)
    parser.add_argument('--refresh', action='store_true')
    parser.add_argument('--limit', type=int, default=0)
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True); REPORT.mkdir(parents=True, exist_ok=True)
    now = datetime.now(timezone.utc).isoformat()
    jobs, entities, empty = {}, {}, []
    def public_json(url):
        return json.loads(subprocess.check_output(['curl', '-fsS', '--max-time', '25', url], text=True))
    texture_tree = read(REPORT / 'minecraft-texture-tree.json') or read(RAW / 'minecraft-texture-tree.json', {})
    if not texture_tree:
        # Inspect exact filenames in this documented asset version. Generated
        # item indexes omit some valid names; never infer a different block.
        try:
            listing = public_json('https://api.github.com/repos/PrismarineJS/minecraft-assets/contents/data/1.21.8')
            for directory in listing:
                if directory['name'] in ['blocks', 'items']:
                    texture_tree[directory['name']] = [x['path'] for x in public_json(directory['git_url'])['tree'] if x['type'] == 'blob']
        except (subprocess.SubprocessError, ValueError, KeyError) as error:
            print(json.dumps({'textureInventoryWarning': str(error)}), flush=True)
    if texture_tree: (REPORT / 'minecraft-texture-tree.json').write_text(json.dumps(texture_tree))
    raw_lookup = {}
    for file in RAW.glob('*.json'):
        data = read(file, {})
        records = data if isinstance(data, list) else data.get('list', []) if isinstance(data, dict) else []
        if file.stem == 'fortnite-shop':
            records = [item for offer in data.get('data', {}).get('entries', []) for item in offer.get('brItems', [])]
        raw_lookup[file.stem] = {str(x.get('id')): x for x in records if isinstance(x, dict)}
    # A clean checkout may not have the research directory. Rebuild only the
    # small lookups needed for documented, same-entity alternate image URLs.
    raw_sources = {
        'genshin-characters': 'https://genshin-db-api.vercel.app/api/v5/characters?query=names&matchCategories=true&verboseCategories=true',
        'genshin-weapons': 'https://genshin-db-api.vercel.app/api/v5/weapons?query=names&matchCategories=true&verboseCategories=true',
        'brawl-brawlers': 'https://api.brawlapi.com/v1/brawlers',
        'brawl-maps': 'https://api.brawlapi.com/v1/maps',
        'brawl-modes': 'https://api.brawlapi.com/v1/gamemodes',
        'fortnite-shop': 'https://fortnite-api.com/v2/shop',
    }
    for key, endpoint in raw_sources.items():
        if raw_lookup.get(key): continue
        try:
            data = public_json(endpoint)
            records = data if isinstance(data, list) else data.get('list', [])
            if key == 'fortnite-shop': records = [item for offer in data.get('data', {}).get('entries', []) for item in offer.get('brItems', [])]
            raw_lookup[key] = {str(x['id']): x for x in records}
        except (subprocess.SubprocessError, ValueError, KeyError) as error:
            print(json.dumps({'alternateLookupWarning': key, 'error': str(error)}), flush=True)
    def add(url, role, context, candidates=()):
        if not isinstance(url, str) or not url.startswith('https://'): return
        job = jobs.setdefault(url, {'url': url, 'roles': [], 'contexts': [], 'alternatives': []})
        if role not in job['roles']: job['roles'].append(role)
        if context not in job['contexts']: job['contexts'].append(context)
        for alt in candidates:
            if alt != url and alt.startswith('https://') and alt not in job['alternatives']: job['alternatives'].append(alt)
    for file in sorted((ROOT / 'dist/catalog').glob('*.json')):
        data = read(file, {})
        for item in data.get('entries', []):
            context = f'{file.stem}:{item["id"]}'
            raw = raw_lookup.get(file.stem, {}).get(str(item['id']), {})
            candidates = []
            imgs = raw.get('images', {})
            # Same entry only: no guessed CDN paths and no unrelated generic art.
            if file.stem.startswith('genshin'):
                candidates = [imgs[k] for k in ['mihoyo_icon', 'hoyowiki_icon', 'hoyolab-avatar', 'icon', 'image', 'card', 'portrait'] if isinstance(imgs.get(k), str) and imgs[k].startswith('https://')]
                # Enka documents UI filename addressing. Match the exact icon
                # filename supplied by this entry, never a guessed character.
                filename = imgs.get('filename_icon', '') or Path(urlparse(item.get('imageFallback') or item.get('image') or '').path).stem
                if re.fullmatch(r'UI_[A-Za-z0-9_]+', filename): candidates.append('https://enka.network/ui/' + filename + '.png')
            elif file.stem.startswith('brawl'):
                candidates = [raw[k] for k in ['imageUrl2', 'imageUrl', 'imageUrl3'] if isinstance(raw.get(k), str)]
            elif file.stem.startswith('fortnite'):
                candidates = [imgs[k] for k in ['icon', 'smallIcon', 'featured'] if isinstance(imgs.get(k), str)]
            elif file.stem.startswith('minecraft') and not item.get('image'):
                identifier = next((v.removeprefix('minecraft:') for k, v in item.get('facts', []) if k == 'Identifier'), '')
                for folder in ['items', 'blocks']:
                    if identifier and identifier + '.png' in texture_tree.get(folder, []):
                        candidates = ['https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.8/' + folder + '/' + identifier + '.png']
                        break
            candidates = list(dict.fromkeys([item.get('imageFallback', '')] + candidates))
            role = 'map' if item.get('kind') == 'Map' else 'texture' if file.stem.startswith('minecraft') else 'portrait'
            entities[context] = {'name': item['name'], 'image': item.get('image', ''), 'fallback': item.get('imageFallback', ''), 'alternatives': [x for x in candidates if x]}
            for field in ['image', 'imageFallback']:
                add(item.get(field), role, context, candidates)
            if not item.get('image'):
                for candidate in candidates: add(candidate, role, context)
            if not item.get('image'): empty.append({'entity': context, 'name': item['name'], 'reason': 'provider supplied no image URL'})
            for ability in item.get('abilities', []): add(ability.get('image'), 'ability', context + ':' + ability['name'])
        for field in ['mapImage', 'mapBlank']: add(data.get('meta', {}).get(field), 'full-map', file.stem + ':meta.' + field)
    previous = read(REPORT / 'results.json', {})
    results = {}
    def fetch(job):
        url = job['url']; prior = previous.get(url, {})
        if not args.refresh and prior.get('localPath'):
            path = ROOT / 'dist' / prior['localPath'].lstrip('/')
            try:
                with Image.open(path) as im: im.verify()
                return url, {**prior, 'reused': True}
            except (OSError, ValueError): pass
        if not args.refresh and prior.get('status') == 'unavailable':
            tried = {a.get('url') for a in prior.get('attempts', [])}
            if set([url] + job.get('alternatives', [])) <= tried: return url, prior
        attempts = []; candidates = [url] + job.get('alternatives', [])
        for candidate in candidates:
            command = ['curl', '-sS', '-L', '--proto', '=https', '--max-time', '16', '--connect-timeout', '6', '--retry', '1', '--retry-delay', '1', '--retry-max-time', '20', '--max-filesize', '15000000', '-A', 'GameBreak-image-cache/1.0 (student reference site)', '-w', '\n__STATUS__%{http_code}', candidate]
            try:
                r = subprocess.run(command, capture_output=True, timeout=38)
                body, _, status = r.stdout.rpartition(b'\n__STATUS__')
                code = int(status or 0)
                if r.returncode or code != 200:
                    attempts.append({'url': candidate, 'http': code, 'error': r.stderr.decode(errors='replace')[:200] or 'HTTP request failed'}); continue
                with Image.open(io.BytesIO(body)) as opened:
                    opened.load(); image = ImageOps.exif_transpose(opened).convert('RGBA')
                    if image.width < 8 or image.height < 8: raise ValueError('image too small to identify an entry')
                    original = [image.width, image.height]
                    size = 1024 if 'full-map' in job['roles'] else 384 if 'map' in job['roles'] else 128 if 'ability' in job['roles'] else 96 if 'texture' in job['roles'] else 288
                    image.thumbnail((size, size), Image.Resampling.LANCZOS)
                    buffer = io.BytesIO(); image.save(buffer, 'WEBP', quality=72 if 'map' in job['roles'] else 78, method=4, lossless='texture' in job['roles'])
                    encoded = buffer.getvalue(); digest = hashlib.sha256(encoded).hexdigest()[:20]
                    destination = OUT / (digest + '.webp')
                    if not destination.exists(): destination.write_bytes(encoded)
                    with Image.open(destination) as verification: verification.verify()
                return url, {'status': 'cached', 'localPath': '/assets/catalog/' + destination.name, 'sourceURL': candidate, 'originalSize': original, 'size': list(image.size), 'bytes': len(encoded), 'checkedAt': now, 'attempts': attempts}
            except (OSError, ValueError, subprocess.TimeoutExpired, Image.DecompressionBombError) as error:
                attempts.append({'url': candidate, 'error': str(error)[:200]})
        return url, {'status': 'unavailable', 'checkedAt': now, 'attempts': attempts}
    selected = list(jobs.values())[:args.limit or None]
    started = time.monotonic()
    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, min(args.workers, 12))) as pool:
        for index, (url, result) in enumerate(pool.map(fetch, selected), 1):
            results[url] = result
            if index % 100 == 0:
                (REPORT / 'results.json').write_text(json.dumps({**previous, **results}, ensure_ascii=False))
                print(json.dumps({'done': index, 'total': len(selected), 'cached': sum(r['status'] == 'cached' for r in results.values()), 'seconds': round(time.monotonic() - started)}), flush=True)
    results = {**previous, **results}
    manifest = {url: result['localPath'] for url, result in results.items() if url in jobs and result.get('localPath')}
    unavailable = [url for url in jobs if not results.get(url, {}).get('localPath')]
    # If a primary URL failed but its recorded same-entity fallback succeeded,
    # map the primary URL to that exact entry's locally cached alternative.
    for url in list(unavailable):
        alternative = next((a for a in jobs[url]['alternatives'] if a in manifest), None)
        if alternative:
            manifest[url] = manifest[alternative]
            results[url] = {**results[url], 'status': 'cached', 'localPath': manifest[alternative], 'sourceURL': alternative, 'viaKnownAlternative': True}
    entity_images = {}
    for context, entity in entities.items():
        # Shared generic Traveler icon must not replace the distinct Aether/Lumine icon.
        preferred = entity['fallback'] if entity['name'] in ['Aether', 'Lumine'] else entity['image']
        candidates = [preferred, entity['image'], entity['fallback']] + entity['alternatives']
        image = next((manifest[u] for u in candidates if u in manifest), None)
        if image: entity_images[context] = image
    local_game_art = []
    for name in ['genshin', 'starrail', 'minecraft', 'gta', 'delta', 'fortnite', 'roblox', 'pubg', 'brawl', 'wuwa']:
        file = ROOT / 'dist/assets' / (name + '.webp')
        try:
            with Image.open(file) as image: image.verify()
            local_game_art.append({'game': name, 'status': 'decoded', 'bytes': file.stat().st_size})
        except OSError as e: local_game_art.append({'game': name, 'status': 'invalid', 'error': str(e)})
    used = {ROOT / 'dist' / v.lstrip('/') for v in manifest.values()}
    total_bytes = sum(p.stat().st_size for p in used)
    audit = {'generatedAt': now, 'uniqueOriginalURLs': len(jobs), 'cachedOriginalURLs': len(manifest), 'uniqueLocalFiles': len(used), 'totalBytes': total_bytes, 'unavailableURLs': [url for url in jobs if url not in manifest], 'entriesWithoutProviderImage': empty, 'recoveredMissingImageEntries': sum(x['entity'] in entity_images for x in empty), 'entriesWithoutCachedImage': [{'entity': k, 'name': v['name']} for k, v in entities.items() if k not in entity_images], 'localGameArtwork': local_game_art, 'sourceOwnership': 'Game artwork belongs to its respective publishers. Data and artwork sources remain attributed in the source register.', 'sizeBudgetExceeded': total_bytes > 40 * 1024 * 1024}
    (REPORT / 'jobs.json').write_text(json.dumps(jobs, ensure_ascii=False))
    (REPORT / 'results.json').write_text(json.dumps(results, ensure_ascii=False))
    (REPORT / 'summary.json').write_text(json.dumps(audit, ensure_ascii=False, indent=2))
    compact_audit = {k: audit[k] for k in ['generatedAt', 'uniqueOriginalURLs', 'cachedOriginalURLs', 'uniqueLocalFiles', 'totalBytes', 'unavailableURLs']}
    contents = '// Generated by scripts/cache-catalog-images.py. Original URLs preserve attribution.\n'
    contents += 'export const IMAGE_MANIFEST = ' + json.dumps(manifest, ensure_ascii=False, separators=(',', ':')) + ';\n'
    contents += 'export const ENTITY_IMAGES = ' + json.dumps(entity_images, ensure_ascii=False, separators=(',', ':')) + ';\n'
    contents += 'export const MISSING_IMAGES = ' + json.dumps(compact_audit['unavailableURLs'], ensure_ascii=False, separators=(',', ':')) + ';\n'
    contents += 'export const IMAGE_AUDIT = ' + json.dumps(compact_audit, ensure_ascii=False, separators=(',', ':')) + ';\n'
    (ROOT / 'dist/image-manifest.js').write_text(contents)
    print(json.dumps({**compact_audit, 'unavailableURLs': len(compact_audit['unavailableURLs']), 'emptyProviderImages': len(empty), 'report': str(REPORT / 'summary.json')}, ensure_ascii=False), flush=True)

if __name__ == '__main__': main()
