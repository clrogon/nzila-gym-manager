#!/bin/bash

################################################################################
# UAT Script - Documentation Data Quality Verification
# Nzila Gym Manager - Documentation Remediation UAT
# Date: January 11, 2026
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Output directory for results
UAT_RESULTS_DIR="uat_results"
mkdir -p "$UAT_RESULTS_DIR"

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo ""
    echo -e "${BLUE}======================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}======================================${NC}"
    echo ""
}

print_test() {
    echo -e "${YELLOW}TEST $1: $2${NC}"
}

print_pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((TESTS_PASSED++))
    ((TESTS_TOTAL++))
    echo "$1: PASS" >> "$UAT_RESULTS_DIR/test_results.txt"
}

print_fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((TESTS_FAILED++))
    ((TESTS_TOTAL++))
    echo "$1: FAIL - $2" >> "$UAT_RESULTS_DIR/test_results.txt"
}

print_info() {
    echo -e "${BLUE}ℹ️  INFO${NC}: $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️  WARNING${NC}: $1"
}

################################################################################
# UAT Test Functions
################################################################################

test_fake_emails() {
    print_test "01" "Fake Email Addresses Removal"
    
    local email_count=$(grep -rh "nzila\.ao" *.md docs/*.md CONTRIBUTING.md 2>/dev/null | grep -v "node_modules" | grep -v ".git" | wc -l | tr -d ' ')
    
    if [ "$email_count" -eq 0 ]; then
        print_pass "No fake nzila.ao emails found"
        echo "Fake emails found: 0" >> "$UAT_RESULTS_DIR/test_01_emails.log"
    else
        print_fail "Found $email_count fake nzila.ao emails"
        grep -rh "nzila\.ao" *.md docs/*.md CONTRIBUTING.md 2>/dev/null | grep -v "node_modules" | grep -v ".git" > "$UAT_RESULTS_DIR/test_01_emails.log"
    fi
}

test_fake_testimonials() {
    print_test "02" "Fake Testimonials Removal"
    
    local testimonial_count=$(grep -rih "Testemunhos\|testimonials\|João Manuel\|Maria Costa\|Luanda Elite Fit\|The Talatona Club\|Who Trusts Us\|Quem Confia" *.md docs/*.md 2>/dev/null | grep -v "node_modules" | grep -v ".git" | grep -v "archived" | wc -l | tr -d ' ')
    
    if [ "$testimonial_count" -eq 0 ]; then
        print_pass "No fake testimonials found"
        echo "Fake testimonials found: 0" >> "$UAT_RESULTS_DIR/test_02_testimonials.log"
    else
        print_fail "Found $testimonial_count fake testimonial references"
        grep -rih "Testemunhos\|testimonials\|João Manuel\|Maria Costa\|Luanda Elite Fit\|The Talatona Club\|Who Trusts Us\|Quem Confia" *.md docs/*.md 2>/dev/null | grep -v "node_modules" | grep -v ".git" | grep -v "archived" > "$UAT_RESULTS_DIR/test_02_testimonials.log"
    fi
}

test_fake_pricing() {
    print_test "03" "Fake Commercial Pricing Removal"
    
    local pricing_count=$(grep -rih "Planos Flexíveis\|Flexible Plans\|35\.000 Kz\|75\.000 Kz\|Sob Consulta\|Starter.*Kz/mês\|Pro.*Kz/mês" *.md docs/*.md 2>/dev/null | grep -v "node_modules" | grep -v ".git" | grep -v "archived" | wc -l | tr -d ' ')
    
    if [ "$pricing_count" -eq 0 ]; then
        print_pass "No fake commercial pricing found"
        echo "Fake pricing found: 0" >> "$UAT_RESULTS_DIR/test_03_pricing.log"
    else
        print_fail "Found $pricing_count fake pricing references"
        grep -rih "Planos Flexíveis\|Flexible Plans\|35\.000 Kz\|75\.000 Kz\|Sob Consulta" *.md docs/*.md 2>/dev/null | grep -v "node_modules" | grep -v ".git" | grep -v "archived" > "$UAT_RESULTS_DIR/test_03_pricing.log"
    fi
}

test_fake_phones() {
    print_test "04" "Fake Phone Numbers Removal"
    
    local phone_count=$(grep -rh "XXX" *.md docs/*.md 2>/dev/null | grep -v "node_modules" | grep -v ".git" | wc -l | tr -d ' ')
    
    if [ "$phone_count" -eq 0 ]; then
        print_pass "No fake phone numbers (XXX) found"
        echo "Fake phones found: 0" >> "$UAT_RESULTS_DIR/test_04_phones.log"
    else
        print_fail "Found $phone_count fake phone numbers"
        grep -rh "XXX" *.md docs/*.md 2>/dev/null | grep -v "node_modules" | grep -v ".git" > "$UAT_RESULTS_DIR/test_04_phones.log"
    fi
}

test_fake_domains() {
    print_test "05" "Fake Domain Names Removal"
    
    local domain_count=$(grep -rh "gymmanager\.local\|gym\.ao" *.md docs/*.md 2>/dev/null | grep -v "node_modules" | grep -v ".git" | wc -l | tr -d ' ')
    
    if [ "$domain_count" -eq 0 ]; then
        print_pass "No fake domain names found"
        echo "Fake domains found: 0" >> "$UAT_RESULTS_DIR/test_05_domains.log"
    else
        print_fail "Found $domain_count fake domain references"
        grep -rh "gymmanager\.local\|gym\.ao" *.md docs/*.md 2>/dev/null | grep -v "node_modules" | grep -v ".git" > "$UAT_RESULTS_DIR/test_05_domains.log"
    fi
}

test_hardware_claims_qualified() {
    print_test "06" "Hardware Integration Claims Qualification"
    
    local marker_count=$(grep -ch "📋" ROADMAP.md 2>/dev/null | wc -l | tr -d ' ')
    
    if [ "$marker_count" -ge 4 ]; then
        print_pass "Hardware claims properly qualified with 📋 markers ($marker_count found)"
        grep -h "📋" ROADMAP.md > "$UAT_RESULTS_DIR/test_06_hardware.log"
    else
        print_fail "Hardware claims not properly qualified (only $marker_count markers found)"
        grep -h "📋" ROADMAP.md > "$UAT_RESULTS_DIR/test_06_hardware.log"
    fi
}

test_placeholder_consistency() {
    print_test "07" "Placeholder Pattern Consistency"
    
    local placeholder_count=$(grep -rh "\[your-.*@example\.com\]" *.md docs/*.md CONTRIBUTING.md 2>/dev/null | grep -v "node_modules" | grep -v ".git" | wc -l | tr -d ' ')
    
    if [ "$placeholder_count" -ge 10 ]; then
        print_pass "Placeholder patterns consistently used ($placeholder_count placeholders)"
        grep -rh "\[your-.*@example\.com\]" *.md docs/*.md CONTRIBUTING.md 2>/dev/null | grep -v "node_modules" | grep -v ".git" > "$UAT_RESULTS_DIR/test_07_placeholders.log"
    else
        print_fail "Placeholder patterns not consistently used (only $placeholder_count found)"
        grep -rh "\[your-.*@example\.com\]" *.md docs/*.md CONTRIBUTING.md 2>/dev/null | grep -v "node_modules" | grep -v ".git" > "$UAT_RESULTS_DIR/test_07_placeholders.log"
    fi
}

test_github_links() {
    print_test "08" "GitHub Links Usage"
    
    local github_count=$(grep -rh "github.com/clrogon/nzila-gym-manager" *.md docs/*.md CONTRIBUTING.md 2>/dev/null | grep -v "node_modules" | grep -v ".git" | wc -l | tr -d ' ')
    
    if [ "$github_count" -ge 30 ]; then
        print_pass "GitHub links properly used for support ($github_count links)"
        grep -rh "github.com/clrogon/nzila-gym-manager" *.md docs/*.md CONTRIBUTING.md 2>/dev/null | grep -v "node_modules" | grep -v ".git" > "$UAT_RESULTS_DIR/test_08_github.log"
    else
        print_fail "GitHub links not sufficiently used (only $github_count found)"
        grep -rh "github.com/clrogon/nzila-gym-manager" *.md docs/*.md CONTRIBUTING.md 2>/dev/null | grep -v "node_modules" | grep -v ".git" > "$UAT_RESULTS_DIR/test_08_github.log"
    fi
}

test_opensource_consistency() {
    print_test "09" "Open-Source Consistency"
    
    local os_count=$(grep -rih "open-source\|código aberto" README.md ROADMAP.md AUTHORS.md 2>/dev/null | wc -l | tr -d ' ')
    
    if [ "$os_count" -ge 2 ]; then
        print_pass "Open-source references present ($os_count references)"
        grep -rih "open-source\|código aberto" README.md ROADMAP.md AUTHORS.md 2>/dev/null > "$UAT_RESULTS_DIR/test_09_opensource.log"
    else
        print_fail "Open-source references insufficient (only $os_count found)"
        grep -rih "open-source\|código aberto" README.md ROADMAP.md AUTHORS.md 2>/dev/null > "$UAT_RESULTS_DIR/test_09_opensource.log"
    fi
}

test_file_integrity() {
    print_test "10" "File Integrity"
    
    local expected_files=("README.md" "ROADMAP.md" "DOCUMENTATION.md" "CONTRIBUTING.md" "docs/README.md" "docs/USER_GUIDE.md" "docs/ADMIN_GUIDE.md" "docs/STAFF_GUIDE.md")
    local missing_count=0
    local missing_files=""
    
    for file in "${expected_files[@]}"; do
        if [ ! -f "$file" ]; then
            ((missing_count++))
            missing_files="$missing_files $file"
        fi
    done
    
    if [ "$missing_count" -eq 0 ]; then
        print_pass "All expected files present and accessible"
        echo "All files checked: OK" >> "$UAT_RESULTS_DIR/test_10_integrity.log"
    else
        print_fail "Missing $missing_count critical files: $missing_files"
        echo "Missing files: $missing_files" >> "$UAT_RESULTS_DIR/test_10_integrity.log"
    fi
}

test_no_empty_placeholders() {
    print_test "11" "Empty/Broken Placeholders"
    
    local empty_count=$(grep -rh "\[.*\]" *.md docs/*.md CONTRIBUTING.md 2>/dev/null | grep -v "node_modules" | grep -v ".git" | grep -v "archived" | grep "\[your-.*\]" | grep -v "@" | wc -l | tr -d ' ')
    
    if [ "$empty_count" -eq 0 ]; then
        print_pass "No empty placeholder brackets found"
        echo "Empty placeholders: 0" >> "$UAT_RESULTS_DIR/test_11_empty.log"
    else
        print_fail "Found $empty_count empty placeholder brackets"
        grep -rh "\[.*\]" *.md docs/*.md CONTRIBUTING.md 2>/dev/null | grep -v "node_modules" | grep -v ".git" | grep -v "archived" | grep "\[your-.*\]" | grep -v "@" > "$UAT_RESULTS_DIR/test_11_empty.log"
    fi
}

################################################################################
# UAT Execution
################################################################################

main() {
    print_header "Nzila Gym Manager - Documentation UAT"
    print_info "Started at: $(date '+%Y-%m-%d %H:%M:%S')"
    print_info "Results directory: $UAT_RESULTS_DIR"
    
    # Initialize results file
    echo "UAT Test Results - $(date '+%Y-%m-%d %H:%M:%S')" > "$UAT_RESULTS_DIR/test_results.txt"
    echo "===========================================" >> "$UAT_RESULTS_DIR/test_results.txt"
    
    # Run all tests
    print_header "Running UAT Tests"
    
    test_fake_emails
    sleep 0.5
    
    test_fake_testimonials
    sleep 0.5
    
    test_fake_pricing
    sleep 0.5
    
    test_fake_phones
    sleep 0.5
    
    test_fake_domains
    sleep 0.5
    
    test_hardware_claims_qualified
    sleep 0.5
    
    test_placeholder_consistency
    sleep 0.5
    
    test_github_links
    sleep 0.5
    
    test_opensource_consistency
    sleep 0.5
    
    test_file_integrity
    sleep 0.5
    
    test_no_empty_placeholders
    
    # Print summary
    print_header "UAT Summary"
    
    echo -e "Total Tests Run: ${BLUE}$TESTS_TOTAL${NC}"
    echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
    echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
    echo ""
    
    # Calculate pass rate
    if [ "$TESTS_TOTAL" -gt 0 ]; then
        local pass_rate=$((TESTS_PASSED * 100 / TESTS_TOTAL))
        echo -e "Pass Rate: ${GREEN}${pass_rate}%${NC}"
    fi
    
    # Write summary to file
    {
        echo "==========================================="
        echo "UAT Summary"
        echo "==========================================="
        echo "Total Tests Run: $TESTS_TOTAL"
        echo "Tests Passed: $TESTS_PASSED"
        echo "Tests Failed: $TESTS_FAILED"
        echo "Pass Rate: $pass_rate%"
        echo "Completed at: $(date '+%Y-%m-%d %H:%M:%S')"
    } >> "$UAT_RESULTS_DIR/test_results.txt"
    
    # Determine overall result
    echo ""
    if [ "$TESTS_FAILED" -eq 0 ]; then
        print_pass "ALL TESTS PASSED - UAT SUCCESSFUL"
        echo -e "${GREEN}======================================${NC}"
        echo -e "${GREEN}UAT STATUS: ✅ PASSED${NC}"
        echo -e "${GREEN}Recommendation: APPROVED FOR PRODUCTION${NC}"
        echo -e "${GREEN}======================================${NC}"
        return 0
    else
        print_fail "UAT FAILED - $TESTS_FAILED test(s) failed"
        echo -e "${RED}======================================${NC}"
        echo -e "${RED}UAT STATUS: ❌ FAILED${NC}"
        echo -e "${RED}Recommendation: REWORK REQUIRED${NC}"
        echo -e "${RED}======================================${NC}"
        return 1
    fi
}

################################################################################
# Script Execution
################################################################################

# Parse command line arguments
case "${1:-}" in
    --clean)
        print_info "Cleaning previous UAT results..."
        rm -rf "$UAT_RESULTS_DIR"
        print_pass "UAT results directory cleaned"
        exit 0
        ;;
    --help|-h)
        echo "Usage: $0 [OPTION]"
        echo ""
        echo "Options:"
        echo "  --clean    Clean previous UAT results directory"
        echo "  --help     Show this help message"
        echo "  (none)    Run full UAT test suite"
        echo ""
        exit 0
        ;;
esac

# Run main function
main "$@"
