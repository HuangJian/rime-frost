#!/bin/bash

# Create dist directory if it doesn't exist
mkdir -p ./dist

# Find all .js files in current directory, excluding those in dist/
for jsfile in *.js
do
  # Get the filename without path
  filename=$(basename "$jsfile")
  # Bundle the file
  esbuild "$jsfile" \
    --bundle \
    --outfile="./dist/$filename" \
    --format=esm \
    --platform=browser \
    --allow-overwrite=true \
    --tree-shaking=true \
    --minify-whitespace \
    --keep-names \
    --target=chrome58
done

# Format all bundled files
prettier --config .prettierrc --write "dist/**/*.js"
