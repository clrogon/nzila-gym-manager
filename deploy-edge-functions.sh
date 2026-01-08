#!/bin/bash

# ============================================================================
# SUPABASE EDGE FUNCTIONS DEPLOYMENT SCRIPT
# ============================================================================
# This script deploys all Edge Functions to Supabase
# Usage: ./deploy-edge-functions.sh
# ============================================================================

set -e

echo "🚀 Starting Supabase Edge Functions Deployment"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI is not installed${NC}"
    echo "Please install it: npm install -g supabase"
    exit 1
fi

# Check if user is logged in
echo "🔍 Checking Supabase authentication..."
if ! supabase status &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Supabase${NC}"
    echo "Please login: supabase login"
    exit 1
fi

echo -e "${GREEN}✅ Authenticated${NC}"

# List of functions to deploy
FUNCTIONS=(
    "auth-with-rate-limit"
    "create-user-account"
    "pre-register-gym-owner"
    "seed-super-admin"
    "seed-test-users"
    "send-email"
    "send-welcome-email"
)

# Check for required environment variables
echo ""
echo "🔍 Checking required environment variables..."

REQUIRED_VARS=(
    "RESEND_API_KEY"
    "FROM_EMAIL"
    "SITE_URL"
)

for var in "${REQUIRED_VARS[@]}"; do
    if supabase secrets list | grep -q "$var"; then
        echo -e "${GREEN}✅ $var is set${NC}"
    else
        echo -e "${YELLOW}⚠️  $var is NOT set${NC}"
        echo "   Please set it: supabase secrets set $var=<value>"
    fi
done

echo ""

# Deploy each function
echo "📦 Deploying Edge Functions..."
echo "========================================"

FAILED_FUNCTIONS=()
SUCCESS_COUNT=0

for func in "${FUNCTIONS[@]}"; do
    echo -n "🚀 Deploying $func..."
    if supabase functions deploy $func --no-verify-jwt; then
        echo -e " ${GREEN}✅ SUCCESS${NC}"
        ((SUCCESS_COUNT++))
    else
        echo -e " ${RED}❌ FAILED${NC}"
        FAILED_FUNCTIONS+=("$func")
    fi
done

echo ""
echo "========================================"
echo "📊 Deployment Summary"
echo "========================================"
echo -e "Total Functions: ${#FUNCTIONS[@]}"
echo -e "${GREEN}Success: $SUCCESS_COUNT${NC}"

if [ ${#FAILED_FUNCTIONS[@]} -gt 0 ]; then
    echo -e "${RED}Failed: ${#FAILED_FUNCTIONS[@]}${NC}"
    echo "Failed functions:"
    for func in "${FAILED_FUNCTIONS[@]}"; do
        echo "  - $func"
    done
    echo ""
    echo "🔍 Check logs for failed functions:"
    echo "   supabase functions logs <function-name>"
    exit 1
else
    echo -e "${GREEN}All functions deployed successfully! 🎉${NC}"
fi

echo ""
echo "📝 Next Steps:"
echo "========================================"
echo "1. Test each function locally: supabase functions serve"
echo "2. Monitor function logs: supabase functions logs --all"
echo "3. View deployed functions: supabase functions list"
echo ""
echo "🔗 Useful Commands:"
echo "   supabase functions logs --all           # View all logs"
echo "   supabase functions logs <name>        # View specific function logs"
echo "   supabase functions list               # List all deployed functions"
echo "   supabase functions delete <name>      # Delete a function"
echo ""

exit 0
