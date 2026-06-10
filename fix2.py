import re 
f = 'frontend/src/pages/user/BrowseAssetsPage.tsx' 
c = open(f, encoding='utf-8').read() 
c = c.replace('sc.bg, sc.color', 'sc.bg') 
open(f, 'w', encoding='utf-8').write(c) 
print('Done!') 
