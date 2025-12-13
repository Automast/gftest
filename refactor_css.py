
import re
import os

# Files to process
html_file = 'c:/Users/Anullar/Downloads/New folder/index.html'
css_files = [
    'c:/Users/Anullar/Downloads/New folder/css/zveBCoI0S0zP.css',
    'c:/Users/Anullar/Downloads/New folder/css/MJuGUqvQjGNU.css'
]

# 1. Identify all defined classes in the CSS files
defined_classes = set()

# Regex to find class selectors in CSS
# Matches .classname followed by space, comma, dot, :, pseudo, or open brace
# We use a negative lookahead to exclude things that don't look like selectors end
# A simplified heuristic: .name followed by non-word char (and not inside a url() which is hard to detect, 
# but usually url('...') contains extensions. Minimal risk for .png etc if followed by boundary)
# We stick to valid CSS identifiers: -?[_a-zA-Z]+[_a-zA-Z0-9-]*
css_class_pattern = re.compile(r'\.(-?[_a-zA-Z][_a-zA-Z0-9-]*)')

print("Scanning CSS files for class definitions...")
for css_path in css_files:
    if not os.path.exists(css_path):
        print(f"File not found: {css_path}")
        continue
        
    with open(css_path, 'r', encoding='utf-8') as f:
        content = f.read()
        # remove comments to avoid false positives ? /* ... */
        # (Simple comment removal)
        content_no_comments = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
        matches = css_class_pattern.findall(content_no_comments)
        for m in matches:
            defined_classes.add(m)

print(f"Found {len(defined_classes)} unique classes defined in CSS files.")

# 2. Identify used classes in HTML to double check (optional but good for debugging)
# We will only rename classes that are in defined_classes.
# External classes (like fa-solid) won't be in defined_classes (since we don't scan all.min.css),
# so they will naturally be excluded from the map.

# 3. Create mapping
sorted_classes = sorted(list(defined_classes), key=len, reverse=True)
class_map = {}
counter = 1
for cls in sorted_classes:
    cleaned_name = cls
    class_map[cls] = f"c{counter}"
    counter += 1

print("Mapping generated.")

# 4. Replacer Functions

def replace_in_css(content, mapping):
    # Iterate over classes and replace
    # We must replace .classname boundary
    # Use regex substitution
    
    # We invoke a callback for every match of \.([identifier])
    # checking if identifier is in mapping.
    
    def repl(match):
        original = match.group(1)
        if original in mapping:
            return "." + mapping[original]
        return match.group(0) # No change
        
    pattern = re.compile(r'\.(-?[_a-zA-Z][_a-zA-Z0-9-]*)')
    new_content = pattern.sub(repl, content)
    return new_content

def replace_in_html(content, mapping):
    # Regex for class="..."
    # We need to handle single and double quotes.
    # pattern: class=["']...["']
    
    def class_attr_repl(match):
        quote = match.group(1)
        classes_str = match.group(2)
        # Split by whitespace
        classes = classes_str.split()
        new_classes = []
        for c in classes:
            if c in mapping:
                new_classes.append(mapping[c])
            else:
                new_classes.append(c)
        return f'class={quote}{" ".join(new_classes)}{quote}'

    # Match class="value" or class='value'
    # group 1: quote, group 2: content
    # Use [\s\S]*? to match across newlines
    pattern = re.compile(r'class=(["\'])([\s\S]*?)\1')
    return pattern.sub(class_attr_repl, content)

# 5. Execute replacement
print("Applying changes...")

# Update CSS files
for css_path in css_files:
    if not os.path.exists(css_path):
        continue
    with open(css_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = replace_in_css(content, class_map)
    
    with open(css_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Updated {css_path}")

# Update HTML file
if os.path.exists(html_file):
    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = replace_in_html(content, class_map)

    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Updated {html_file}")

print("Done. Refactor complete.")
