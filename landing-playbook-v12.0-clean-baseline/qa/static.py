import sys,json,hashlib,os,re
from pathlib import Path
import html5lib,tinycss2
from bs4 import BeautifulSoup
base=Path(os.environ.get('BASELINE_DIR','/workspace/baseline/landing-playbook-v11.46-CODEX-HANDOFF'));clean=Path(__file__).resolve().parents[1]
results={}
p=html5lib.HTMLParser(strict=False);p.parse((clean/'index.html').read_text());results['html_parse_errors']=p.errors
s=BeautifulSoup((clean/'index.html').read_text(),'html.parser');old=BeautifulSoup((base/'index.html').read_text(),'html.parser')
# Baseline preserved except the invisible span and user-authorized price update.
expected=(base/'index.html').read_text().replace('              <span class="purchase-shine" aria-hidden="true"></span>\n','')
expected=expected.replace('$179','$349').replace('$499','$999').replace('"price": "179"','"price": "349"').replace('Precio especial 179 pesos','Precio especial 349 pesos').replace('data-d="1"','data-d="3"').replace('data-d="7"','data-d="4"')
expected=expected.replace('https://lanzatufranquicia.com/img/og-playbook.jpg','https://lanzatufranquicia.com/img/embedded-3.png').replace('property="og:image:width" content="1200"','property="og:image:width" content="1346"').replace('property="og:image:height" content="630"','property="og:image:height" content="1920"').replace('property="og:image:type" content="image/jpeg"','property="og:image:type" content="image/png"')
actual=(clean/'index.html').read_text().replace('<span aria-hidden="true" class="offer-status__dot"></span>', '<span aria-hidden="true">✨</span>')
def remove_authorized_sticky(html):
 return re.sub(r'<!-- Mobile sticky conversion bar -->.*?(?=<footer)', '', html, flags=re.S)
results['html_only_authorized_changes']=remove_authorized_sticky(expected)==remove_authorized_sticky(actual)
results['ids_unique']=len(s.select('[id]'))==len({x['id'] for x in s.select('[id]')});results['body_children']=s.footer.parent.name=='body' and s.select_one('[data-mobile-offer-bar]').parent.name=='body'
results['assets_identical']=all(hashlib.sha256(f.read_bytes()).digest()==hashlib.sha256((clean/f.relative_to(base)).read_bytes()).digest() for f in [*(base/'img').glob('*'),base/'robots.txt',base/'sitemap.xml'])
manifest=json.loads((base/'SOURCE_SHA256.json').read_text());results['baseline_checksums']=all(hashlib.sha256((base/name).read_bytes()).hexdigest()==sha for name,sha in manifest.items())
errors=[]
def walk(nodes,file):
 for n in nodes:
  if n.type=='error':errors.append([file,n.source_line,n.message])
  if getattr(n,'content',None) is not None:
   if n.type=='at-rule' and n.lower_at_keyword in ['media','supports','layer','keyframes']:
    walk(tinycss2.parse_rule_list(n.content,skip_whitespace=True,skip_comments=True),file)
   else:
    for d in tinycss2.parse_declaration_list(n.content,skip_whitespace=True,skip_comments=True):
     if d.type=='error':errors.append([file,d.source_line,d.message])
for f in (clean/'css').glob('*.css'):walk(tinycss2.parse_stylesheet(f.read_text(),skip_whitespace=True,skip_comments=True),f.name)
results['css_parse_errors']=errors
(clean/'qa').mkdir(exist_ok=True);(clean/'qa/results').mkdir(exist_ok=True);(clean/'qa/results/static.json').write_text(json.dumps(results,indent=2));print(json.dumps(results,indent=2))
assert not p.errors and not errors and all(v for k,v in results.items() if k not in ['html_parse_errors','css_parse_errors'])
