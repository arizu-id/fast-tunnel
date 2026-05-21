import os
import re

restored_dir = r"C:\Users\Arief Zufar Hilmi\.gemini\antigravity-ide\brain\58aeea26-cb53-4852-9604-082c0b2a756a\scratch\restored"
dest_dir = r"c:\xampp\htdocs\assets\js"

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

def main():
    for file in os.listdir(restored_dir):
        src_path = os.path.join(restored_dir, file)
        if not os.path.isfile(src_path):
            continue
        if file == "app.js":
            dest_path = os.path.join(dest_dir, "app.js")
        else:
            dest_path = os.path.join(dest_dir, "modules", file)
        with open(src_path, "r", encoding="utf-8") as f:
            content = f.read()
        cleaned = clean_js_content(content)
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        with open(dest_path, "w", encoding="utf-8") as f:
            f.write(cleaned)
        print(f"Cleaned and wrote {file} to {dest_path}")

    # Write custom loading-bar.js
    loading_bar_code = """
const bar = document.getElementById('globalLoadingBar');
let activeRequests = 0;
let fillTimer = null;
let currentWidth = 0;
function startLoading() {
    activeRequests++;
    if (activeRequests === 1) {
        clearTimeout(fillTimer);
        currentWidth = 0;
        bar.style.transition = 'width 0.1s ease, opacity 0.2s ease';
        bar.style.opacity = '1';
        bar.style.width = '0%';
        bar.classList.add('active');
        animateTo(85, 900);
    }
}
function stopLoading() {
    activeRequests = Math.max(0, activeRequests - 1);
    if (activeRequests === 0) {
        clearTimeout(fillTimer);
        bar.style.transition = 'width 0.15s ease, opacity 0.4s ease 0.15s';
        bar.style.width = '100%';
        bar.classList.remove('active');
        setTimeout(() => {
            bar.style.opacity = '0';
            setTimeout(() => {
                bar.style.transition = 'none';
                bar.style.width = '0%';
                currentWidth = 0;
            }, 420);
        }, 150);
    }
}
function animateTo(target, duration) {
    const start = currentWidth;
    const range = target - start;
    const startTime = performance.now();
    function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        currentWidth = start + range * eased;
        bar.style.width = currentWidth + '%';
        if (progress < 1) {
            fillTimer = requestAnimationFrame(step);
        }
    }
    fillTimer = requestAnimationFrame(step);
}
const originalFetch = window.fetch;
window.fetch = function(...args) {
    startLoading();
    return originalFetch(...args).then(
        response => {
            stopLoading();
            return response;
        },
        error => {
            stopLoading();
            throw error;
        }
    );
};
if (window.jQuery) {
    $(document).ajaxStart(startLoading).ajaxStop(stopLoading);
}
""".strip()
    dest_path = os.path.join(dest_dir, "modules", "loading-bar.js")
    with open(dest_path, "w", encoding="utf-8") as f:
        f.write(loading_bar_code)
    print(f"Wrote loading-bar.js to {dest_path}")

if __name__ == "__main__":
    main()
