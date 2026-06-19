#!/bin/bash

# Define output file name
ZIP_FILE="collection_miner.zip"

echo "🧹 Cleaning up old zip files..."
rm -f "$ZIP_FILE"

echo "📦 Packaging Collection Miner extension..."

# Compress only the files required for Chrome Extension production
zip -r "$ZIP_FILE" \
    manifest.json \
    newtab.html \
    newtab.css \
    newtab.js \
    service-worker.js \
    tips.html \
    icons/

if [ $? -eq 0 ]; then
    echo "✅ Successfully packaged extension into $ZIP_FILE!"
    echo "🔍 Contents of the zip file:"
    unzip -l "$ZIP_FILE"
else
    echo "❌ Failed to package extension."
    exit 1
fi
