#!/bin/bash

echo "🚀 Setting up Netlify deployment..."

# Install function dependencies
echo "📦 Installing function dependencies..."
cd netlify/functions
npm install
cd ../..

# Install Netlify CLI if not already installed
if ! command -v netlify &> /dev/null
then
    echo "📥 Installing Netlify CLI..."
    npm install -g netlify-cli
fi

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Run: netlify login"
echo "2. Run: netlify init"
echo "3. Set environment variables:"
echo "   netlify env:set GEMINI_API_KEY 'your-key'"
echo "   netlify env:set JWT_SECRET 'your-secret'"
echo "4. Run: netlify deploy --prod"
echo ""
echo "Or use GitHub integration (see NETLIFY_DEPLOYMENT.md)"
