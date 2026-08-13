import os
import re

directory = "src/app/ceo"
bento_replacement = 'className="bento-card rounded-3xl bg-white p-lg overflow-hidden border border-outline-variant shadow-sm hover:shadow-md transition-shadow"'

for root, _, files in os.walk(directory):
    for file in files:
        if file == "page.js" and root != "src/app/ceo/dashboard":
            path = os.path.join(root, file)
            with open(path, "r") as f:
                content = f.read()
            
            original_content = content
            # Replace bento-card classes
            content = re.sub(r'className="bento-card[^"]*"', bento_replacement, content)
            
            # Update typical headers
            # Old pattern: <h1 className="font-headline-lg text-primary">TITLE</h1>
            # New pattern: <div className="flex items-center gap-sm mb-xs"><span className="material-symbols-outlined text-primary text-3xl">dashboard</span><h1 className="font-display-sm md:font-display-md text-on-surface">TITLE</h1></div>
            
            if content != original_content:
                with open(path, "w") as f:
                    f.write(content)
                print(f"Updated {path}")
