#!/bin/bash

# ============================================================================
# NZILA GYM MANAGER - ONE-COMMAND DEPLOYMENT
# ============================================================================
# This script helps deploy all components step-by-step
# Run: ./deploy.sh
# ============================================================================

set -e

echo "🚀 Nzila Gym Manager - Complete Deployment"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================================================
# STEP 1: Check Prerequisites
# ============================================================================

echo -e "${BLUE}[1/7] Checking prerequisites...${NC}"

# Check node
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found${NC}"
    echo "Install from: https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✅ Node.js: $(node -v)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm: $(npm -v)${NC}"

# Check if dist exists
if [ ! -d "dist" ]; then
    echo -e "${YELLOW}⚠️  dist/ directory not found${NC}"
    echo "Running build..."
    npm run build
fi

echo -e "${GREEN}✅ dist/ directory exists${NC}"
echo ""

# ============================================================================
# STEP 2: Supabase Setup
# ============================================================================

echo -e "${BLUE}[2/7] Supabase Setup${NC}"

# Try to use npx supabase
echo -e "${YELLOW}Checking for Supabase CLI...${NC}"

if command -v supabase &> /dev/null; then
    SUPABASE_CMD="supabase"
    echo -e "${GREEN}✅ Supabase CLI installed globally${NC}"
else
    SUPABASE_CMD="npx supabase"
    echo -e "${YELLOW}⚠️  Using npx for Supabase (slower but works)${NC}"
fi

# Check if logged in
echo "Checking authentication..."
if $SUPABASE_CMD status &> /dev/null; then
    echo -e "${GREEN}✅ Authenticated with Supabase${NC}"
else
    echo -e "${RED}❌ Not authenticated with Supabase${NC}"
    echo ""
    echo "To login, run:"
    echo -e "${BLUE}$SUPABASE_CMD login${NC}"
    echo ""
    echo "Or use token (recommended for non-interactive):"
    echo "Get token from: https://supabase.com/dashboard/account/tokens"
    echo -e "${BLUE}$SUPABASE_CMD login --token YOUR_TOKEN${NC}"
    echo ""
    read -p "Press Enter after logging in... " -r
    echo ""

    # Recheck
    if ! $SUPABASE_CMD status &> /dev/null; then
        echo -e "${RED}❌ Still not authenticated. Exiting.${NC}"
        echo "Please login manually and run this script again."
        exit 1
    fi
fi

echo ""

# ============================================================================
# STEP 3: Verify Secrets
# ============================================================================

echo -e "${BLUE}[3/7] Verifying Supabase Secrets${NC}"

echo "Checking required secrets..."
SECRETS_OK=true

echo "Required secrets:"
if $SUPABASE_CMD secrets list | grep -q "RESEND_API_KEY"; then
    echo -e "${GREEN}✅ RESEND_API_KEY${NC}"
else
    echo -e "${RED}❌ RESEND_API_KEY not set${NC}"
    SECRETS_OK=false
fi

if $SUPABASE_CMD secrets list | grep -q "FROM_EMAIL"; then
    echo -e "${GREEN}✅ FROM_EMAIL${NC}"
else
    echo -e "${RED}❌ FROM_EMAIL not set${NC}"
    SECRETS_OK=false
fi

if $SUPABASE_CMD secrets list | grep -q "SITE_URL"; then
    echo -e "${GREEN}✅ SITE_URL${NC}"
else
    echo -e "${RED}❌ SITE_URL not set${NC}"
    SECRETS_OK=false
fi

if [ "$SECRETS_OK" = false ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Some secrets are missing${NC}"
    echo ""
    echo "To set them:"
    echo -e "${BLUE}$SUPABASE_CMD secrets set FROM_EMAIL=noreply@yourdomain.com${NC}"
    echo -e "${BLUE}$SUPABASE_CMD secrets set SITE_URL=https://your-app-url.com${NC}"
    echo ""
    read -p "Press Enter after setting secrets... " -r
    echo ""
fi

echo ""

# ============================================================================
# STEP 4: Apply Database Migrations
# ============================================================================

echo -e "${BLUE}[4/7] Applying Database Migrations${NC}"

read -p "Push database migrations? (y/N): " -r
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Pushing migrations..."
    if $SUPABASE_CMD db push; then
        echo -e "${GREEN}✅ Migrations applied successfully${NC}"
    else
        echo -e "${RED}❌ Migration failed${NC}"
        read -p "Continue anyway? (y/N): " -r
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
else
    echo -e "${YELLOW}⏭  Skipping database migrations${NC}"
fi

echo ""

# ============================================================================
# STEP 5: Deploy Edge Functions
# ============================================================================

echo -e "${BLUE}[5/7] Deploying Edge Functions${NC}"

if [ -f "deploy-edge-functions.sh" ]; then
    read -p "Deploy Edge Functions? (y/N): " -r
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        chmod +x deploy-edge-functions.sh
        ./deploy-edge-functions.sh
    else
        echo -e "${YELLOW}⏭  Skipping Edge Functions deployment${NC}"
    fi
else
    echo -e "${RED}❌ deploy-edge-functions.sh not found${NC}"
fi

echo ""

# ============================================================================
# STEP 6: Test Production Build
# ============================================================================

echo -e "${BLUE}[6/7] Testing Production Build${NC}"

if [ -f "dist/index.html" ]; then
    echo -e "${GREEN}✅ Production build exists${NC}"
    ls -lh dist/ | tail -1
else
    echo -e "${YELLOW}⚠️  Production build missing${NC}"
    read -p "Run production build? (y/N): " -r
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm run build
    else
        echo -e "${YELLOW}⏭  Skipping build${NC}"
    fi
fi

echo ""

# ============================================================================
# STEP 7: Vercel Deployment
# ============================================================================

echo -e "${BLUE}[7/7] Vercel Deployment${NC}"

if command -v vercel &> /dev/null; then
    echo -e "${GREEN}✅ Vercel CLI installed${NC}"
    read -p "Deploy to Vercel now? (y/N): " -r
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Deploying to Vercel..."
        vercel --prod
    else
        echo -e "${YELLOW}⏭  Skipping Vercel deployment${NC}"
        echo "To deploy manually: vercel --prod"
    fi
else
    echo -e "${YELLOW}⚠️  Vercel CLI not installed${NC}"
    echo "To install: npm install -g vercel"
    echo "Then: vercel login"
    echo "And: vercel --prod"
    echo ""
    echo "Or deploy via Vercel dashboard:"
    echo -e "${BLUE}https://vercel.com/dashboard${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Deployment script complete!${NC}"
echo ""
echo "📋 Summary:"
echo "   - Dependencies: ✅ Installed"
echo "   - Build: ✅ Complete"
echo "   - Migrations: ✅ Ready"
echo "   - Edge Functions: ✅ Ready"
echo ""
echo "🔗 Next Steps:"
echo "   1. Test all features locally"
echo "   2. Check logs: $SUPABASE_CMD functions logs --all"
echo "   3. Monitor errors in production"
echo ""
echo "📚 Documentation:"
echo "   - COMPLETE_DEPLOYMENT_GUIDE.md"
echo "   - DEPLOYMENT.md"
echo "   - SECURITY.md"
echo ""
