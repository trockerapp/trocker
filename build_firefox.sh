#!/bin/bash

# Define directories
SRC_DIR="chrome"
DIST_DIR="firefox"

# Create output directory
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# Copy all files from src to dist
cp -r "$SRC_DIR/"* "$DIST_DIR/"

# Remove the chrome manifest from dist (we will overwrite it with the generated one)
rm "$DIST_DIR/manifest.json"
rm -f "$DIST_DIR/manifest.firefox.json" # Clean up if it exists in source

# Generate Firefox manifest using Python
python3 convert_manifest_for_firefox.py "$SRC_DIR/manifest.json" "$DIST_DIR/manifest.json"

echo "Firefox build created in directory: $DIST_DIR"
