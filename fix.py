import re 
files = ['frontend/src/pages/AssetDetailPage.tsx', 'frontend/src/pages/admin/AssetsPage.tsx', 'frontend/src/pages/user/BrowseAssetsPage.tsx'] 
for f in files: 
    c = open(f).read() 
    c = c.replace('sc.bg, sc.color', 'sc.bg') 
    open(f, 'w').write(c) 
    print(f + ' fixed!') 
