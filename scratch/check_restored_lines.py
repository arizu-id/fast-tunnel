import os
base_dir = r"c:\xampp\htdocs\scratch\restored_views_struct"
for root, dirs, files in os.walk(base_dir):
    for file in files:
        if file.endswith(".js"):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8") as f:
                lines = f.read().splitlines()
            empty = sum(1 for l in lines if l.strip() == "")
            print(f"{file}: total lines={len(lines)}, empty lines={empty}")
