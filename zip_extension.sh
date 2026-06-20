#!/bin/bash

# Package Collection Miner for Chrome Web Store submission
# Usage: ./zip_extension.sh
# Output: collection_miner-vX.X.X.zip

VERSION=$(node -p "require('./manifest.json').version" 2>/dev/null || grep '"version"' manifest.json | sed 's/.*: "\(.*\)".*/\1/')
ZIP_FILE="collection_miner-v${VERSION}.zip"

echo "🧹 Cleaning up old zip files..."
rm -f collection_miner-v*.zip

echo "📦 Packaging Collection Miner v${VERSION}..."

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
    SIZE=$(du -h "$ZIP_FILE" | cut -f1)
    echo ""
    echo "✅ Successfully packaged: $ZIP_FILE ($SIZE)"
    echo ""
    echo "📋 Contents:"
    unzip -l "$ZIP_FILE"
    echo ""
    echo "🚀 Next step: Upload $ZIP_FILE to Chrome Web Store Developer Dashboard"
    echo "   https://chrome.google.com/webstore/devconsole"
else
    echo "❌ Failed to package extension."
    exit 1
fi
