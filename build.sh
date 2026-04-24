#!/bin/bash
set -e

echo "🔨 Building ComparEdge Blog..."
echo ""

echo "📄 Step 1: Generating articles..."
node generate.js

echo ""
echo "📚 Step 2: Generating playbooks..."
node generate-playbooks.js

echo ""
TOTAL=$(ls *.html playbooks/*.html 2>/dev/null | wc -l)
echo "✅ Done: ${TOTAL} pages total"
echo "   📁 $(ls *.html 2>/dev/null | wc -l) articles"
echo "   📚 $(ls playbooks/*.html 2>/dev/null | wc -l) playbooks"
