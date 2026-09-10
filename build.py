"""מאחד את הדמו לקובץ אחד.
dist/index.html    — עמוד שלם, לכל אחסון (GitHub Pages וכו')
dist/artifact.html — אותו תוכן בלי עטיפת html/head/body, לפרסום כ-Artifact
"""
import pathlib
import re

root = pathlib.Path(__file__).parent
html = (root / 'index.html').read_text(encoding='utf-8')
css = (root / 'style.css').read_text(encoding='utf-8')

html = html.replace('<link rel="stylesheet" href="style.css">', '<style>\n' + css + '\n</style>')
for name in ['data.js', 'scenes.js', 'core.js', 'seeker.js', 'owner.js']:
    code = (root / name).read_text(encoding='utf-8').replace('</script>', '<\\/script>')
    tag = f'<script src="{name}"></script>'
    assert tag in html, tag
    html = html.replace(tag, '<script>\n' + code + '\n</script>')

out = root / 'dist'
out.mkdir(exist_ok=True)
(out / 'index.html').write_text(html, encoding='utf-8')

head = re.search(r'<head>(.*?)</head>', html, re.S).group(1)
body = re.search(r'<body>(.*?)</body>', html, re.S).group(1)
head = re.sub(r'<meta charset[^>]*>\s*', '', head)
head = re.sub(r'<meta name="viewport"[^>]*>\s*', '', head)
(out / 'artifact.html').write_text(head.strip() + '\n' + body.strip() + '\n', encoding='utf-8')

print('index.html', len(html), 'bytes')
