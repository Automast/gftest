
const fs = require('fs');
const path = require('path');

// Configuration
const files = {
    html: 'c:/Users/Anullar/Downloads/New folder/index.html',
    css: [
        'c:/Users/Anullar/Downloads/New folder/css/zveBCoI0S0zP.css',
        'c:/Users/Anullar/Downloads/New folder/css/MJuGUqvQjGNU.css'
    ]
};

// Regex to tokenize CSS: Strings, URLs, or Classes
// Matches:
// 1. Double quoted strings
// 2. Single quoted strings
// 3. url(...)
// 4. .classname (Group 2)
const cssTokenRegex = /("(?:\\[\s\S]|[^"])*"|'(?:\\[\s\S]|[^'])*'|url\((?:[^)(]|\((?:[^)(]+)*\))*\)|\.(-?[_a-zA-Z][_a-zA-Z0-9-]*))/g;

// 1. Scan definitions
const definedClasses = new Set();
const cssContents = {};

console.log("Scanning CSS files...");
for (const cssPath of files.css) {
    if (fs.existsSync(cssPath)) {
        const content = fs.readFileSync(cssPath, 'utf8');
        cssContents[cssPath] = content;

        // Use loop to find all matches
        let match;
        // Reset lastIndex just in case, though simple replace doesn't use it, exec does
        while ((match = cssTokenRegex.exec(content)) !== null) {
            if (match[2]) {
                // It's a class!
                definedClasses.add(match[2]);
            }
        }
    } else {
        console.log(`File not found: ${cssPath}`);
    }
}

console.log(`Found ${definedClasses.size} unique classes.`);

// 2. Generate Map
const sortedClasses = Array.from(definedClasses).sort((a, b) => b.length - a.length);
const classMap = {};
let counter = 1;
// Helper for short names: c1, c2, ...
for (const cls of sortedClasses) {
    classMap[cls] = `c${counter++}`;
}

console.log("Map generated. Applying to CSS...");

// 3. Replace in CSS
for (const cssPath of files.css) {
    if (!cssContents[cssPath]) continue;

    const original = cssContents[cssPath];
    const replaced = original.replace(cssTokenRegex, (match, strOrUrl, className) => {
        if (className && classMap[className]) {
            return "." + classMap[className];
        }
        return match;
    });

    fs.writeFileSync(cssPath, replaced, 'utf8');
    console.log(`Updated ${cssPath}`);
}

// 4. Replace in HTML
console.log("Applying to HTML...");
if (fs.existsSync(files.html)) {
    const htmlContent = fs.readFileSync(files.html, 'utf8');

    // Regex for class attributes
    const htmlClassRegex = /class=(["'])([\s\S]*?)\1/g;

    const replacedHtml = htmlContent.replace(htmlClassRegex, (match, quote, content) => {
        const tokens = content.split(/\s+/);
        const newTokens = tokens.map(t => {
            if (classMap[t]) return classMap[t];
            return t; // Keep external classes as is
        });
        return `class=${quote}${newTokens.join(' ')}${quote}`;
    });

    fs.writeFileSync(files.html, replacedHtml, 'utf8');
    console.log(`Updated ${files.html}`);
}

console.log("Refactor Complete.");
