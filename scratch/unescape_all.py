import os, json
src_dir = r"C:\Users\Arief Zufar Hilmi\.gemini\antigravity-ide\brain\58aeea26-cb53-4852-9604-082c0b2a756a\scratch\reconstructed"
dest_dir = r"c:\xampp\htdocs\scratch\restored_clean"
for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith(".js"):
            src_path = os.path.join(root, file)
            rel = os.path.relpath(src_path, src_dir)
            dest_path = os.path.join(dest_dir, rel)
            with open(src_path, "r", encoding="utf-8") as f:
                content = f.read().strip()
            if (content.startswith('"') and content.endswith('"')) or (content.startswith("'") and content.endswith("'")):
                try:
                    decoded = json.loads(content)
                    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
                    with open(dest_path, "w", encoding="utf-8") as f_out:
                        f_out.write(decoded)
                    print(f"Successfully decoded {rel}")
                except Exception as e:
                    print(f"Failed decode {rel}: {e}")
            else:
                os.makedirs(os.path.dirname(dest_path), exist_ok=True)
                with open(dest_path, "w", encoding="utf-8") as f_out:
                    f_out.write(content)
                print(f"Copied as-is {rel}")
