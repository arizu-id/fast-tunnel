import os
import json
import re

reconstructed_dir = r"C:\Users\Arief Zufar Hilmi\.gemini\antigravity-ide\brain\58aeea26-cb53-4852-9604-082c0b2a756a\scratch\reconstructed"
dest_dir = r"c:\xampp\htdocs"

def clean_js_content(content):
    output = []
    i = 0
    n = len(content)
    state = "normal"
    while i < n:
        char = content[i]
        next_char = content[i+1] if i + 1 < n else ""
        if state == "normal":
            if char == '"':
                state = "string_double"
                output.append(char)
            elif char == "'":
                state = "string_single"
                output.append(char)
            elif char == "`":
                state = "template_literal"
                output.append(char)
            elif char == "/" and next_char == "/":
                state = "comment_single"
                i += 1
            elif char == "/" and next_char == "*":
                state = "comment_multi"
                i += 1
            elif char == "/":
                prev_text = "".join(output[-20:]).strip()
                if prev_text and (prev_text[-1] in "=,(+:!&|~^[" or prev_text.endswith("return") or prev_text.endswith("throw")):
                    state = "regex"
                output.append(char)
            else:
                output.append(char)
        elif state == "string_double":
            output.append(char)
            if char == "\\":
                if i + 1 < n:
                    output.append(content[i+1])
                    i += 1
            elif char == '"':
                state = "normal"
        elif state == "string_single":
            output.append(char)
            if char == "\\":
                if i + 1 < n:
                    output.append(content[i+1])
                    i += 1
            elif char == "'":
                state = "normal"
        elif state == "template_literal":
            output.append(char)
            if char == "\\":
                if i + 1 < n:
                    output.append(content[i+1])
                    i += 1
            elif char == "`":
                state = "normal"
        elif state == "regex":
            output.append(char)
            if char == "\\":
                if i + 1 < n:
                    output.append(content[i+1])
                    i += 1
            elif char == "/":
                state = "normal"
        elif state == "comment_single":
            if char == "\n" or char == "\r":
                state = "normal"
                output.append(char)
        elif state == "comment_multi":
            if char == "*" and next_char == "/":
                state = "normal"
                i += 1
        i += 1
    js_code = "".join(output)
    lines = js_code.splitlines()
    cleaned = [line for line in lines if line.strip() != ""]
    return "\n".join(cleaned)

def process_file(src_path, dest_path):
    with open(src_path, "r", encoding="utf-8") as f:
        content = f.read().strip()
    if content.startswith('"') and content.endswith('"'):
        try:
            content = json.loads(content)
        except Exception as e:
            print(f"JSON load failed for {src_path}: {e}")
            if content.startswith('"') and content.endswith('"'):
                content = content[1:-1]
    cleaned = clean_js_content(content)
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    with open(dest_path, "w", encoding="utf-8") as f:
        f.write(cleaned)
    print(f"Restored and optimized {dest_path}")

def main():
    for root, dirs, files in os.walk(reconstructed_dir):
        for file in files:
            src_path = os.path.join(root, file)
            rel = os.path.relpath(src_path, reconstructed_dir)
            dest_path = os.path.join(dest_dir, rel)
            process_file(src_path, dest_path)

if __name__ == "__main__":
    main()
