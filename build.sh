#!/bin/sh
# Build minified static site from src/ into dist/ (dist/ is what gets deployed)
# Tool versions are pinned so a CI build is reproducible; bump them by hand.
set -e
CLEANCSS=clean-css-cli@5.6.3
TERSER=terser@5.44.0
HTMLMIN=html-minifier-terser@7.2.0

rm -rf dist && mkdir dist
cp src/data.json src/robots.txt src/sitemap.xml dist/
npx --yes $CLEANCSS -o dist/style.css src/style.css
npx --yes $TERSER src/script.js -c -m -o dist/script.js
npx --yes $TERSER src/render.js -c -m -o dist/render.js
npx --yes $HTMLMIN --collapse-whitespace --remove-comments \
    --minify-css true --minify-js true -o dist/index.html src/index.html
