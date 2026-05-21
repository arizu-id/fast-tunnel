import os

for root, dirs, files in os.walk(r'c:\xampp\htdocs\assets\js'):
    for f in files:
        if f.endswith('.js'):
            p = os.path.join(root, f)
            with open(p, 'r', encoding='utf-8', errors='ignore') as file:
                content = file.read()
                if 'truncated' in content:
                    print(f'Active file {f} contains "truncated"')
                else:
                    print(f'Active file {f} is clean (length {len(content)})')
