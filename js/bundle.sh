#!/bin/bash

# Create dist directory if it doesn't exist
mkdir -p ./dist

# unused options:
# --keep-names <-- this option will transform a js class with ``static { __name(this, 'foo') }` which is not supported by javascriptcore

# Find all .js files in current directory, excluding those in dist/
for jsfile in *.js
do
  # Get the filename without path
  filename=$(basename "$jsfile")
  filenameWithoutExt=$(echo "$filename" | sed -E 's/\.(js|mjs|cjs|ts)$//')
  # Bundle the file
  esbuild "$jsfile" \
    --bundle \
    --outfile="./dist/${filenameWithoutExt}.dist.js" \
    --format=esm \
    --platform=browser \
    --allow-overwrite=true \
    --tree-shaking=true \
    --minify-whitespace \
    --target=es2022
done

# Format all bundled files
prettier --config .prettierrc --write "dist/**/*.js"
