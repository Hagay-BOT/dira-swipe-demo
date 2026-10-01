"""מאחד את הדמו לקובץ אחד: dist/index.html ל-/v3/, ו-dist/root/index.html לקישור הראשי. og.png לצידם.
הרצה: python build.py
"""
import pathlib
import re
import shutil

root = pathlib.Path(__file__).parent
html = (root / 'index.html').read_text(encoding='utf-8')


def inline_css(m):
    return '<style>\n' + (root / m.group(1)).read_text(encoding='utf-8') + '\n</style>'


def inline_js(m):
    code = (root / m.group(1)).read_text(encoding='utf-8').replace('</script>', '<\\/script>')
    return '<script>\n' + code + '\n</script>'


html, n_css = re.subn(r'<link rel="stylesheet" href="(css/[^"]+)">', inline_css, html)
html, n_js = re.subn(r'<script src="(js/[^"]+)"></script>', inline_js, html)
assert n_css == 2 and n_js >= 20, (n_css, n_js)
assert 'src="js/' not in html and 'href="css/' not in html

out = root / 'dist'
out.mkdir(exist_ok=True)
(out / 'index.html').write_text(html, encoding='utf-8')
shutil.copyfile(root / 'og.png', out / 'og.png')
# תמונות הדירות (Unsplash, ראו photos/CREDITS.tsv) יושבות ליד העמוד
shutil.copytree(root / 'photos', out / 'photos', dirs_exist_ok=True)

# אותו עמוד לקישור הראשי: רק כתובות התצוגה המקדימה (og) משתנות
V3 = 'https://hagay-bot.github.io/dira-swipe-demo/v3/'
assert html.count(V3) == 2, html.count(V3)
(out / 'root').mkdir(exist_ok=True)
(out / 'root' / 'index.html').write_text(html.replace(V3, 'https://hagay-bot.github.io/dira-swipe-demo/'), encoding='utf-8')
# גרסת Artifact: המעטפת (doctype, html, head, body, charset, viewport) נוספת בפרסום, ולכן יורדת כאן.
# השם בלי «· דמו», וגובה האפליקציה 100% כדי לכבד את שולי ה-safe-area שהמעטפת מוסיפה
head = re.search(r'<head>(.*?)</head>', html, re.S).group(1)
body = re.search(r'<body>(.*?)</body>', html, re.S).group(1)
head = re.sub(r'<meta (charset|name="viewport"|name="theme-color"|property="og:[^"]+"|name="twitter:card")[^>]*>\s*', '', head)
head = head.replace('<title>דירה בהחלקה · דמו</title>', '<title>דירה בהחלקה</title>')
art = head.strip() + '\n' + body.strip() + '\n'
APP_H = 'block-size: 100vh; block-size: 100dvh;'
assert art.count(APP_H) == 1 and '<title>דירה בהחלקה</title>' in art and '<html' not in art
art = art.replace(APP_H, 'block-size: 100%;')
(out / 'artifact.html').write_text(art, encoding='utf-8')
print(f'dist/index.html {len(html.encode("utf-8")):,} bytes · {n_css} css · {n_js} js · og.png · dist/root/index.html · dist/artifact.html')
