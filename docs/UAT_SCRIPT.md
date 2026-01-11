# UAT Script - Documentation Data Quality Verification

## Overview

Automated User Acceptance Testing (UAT) script for verifying documentation data quality remediation after removing fake testimonials, pricing, and contact information.

## Purpose

- Verify all fake data removed from documentation
- Validate consistency of placeholder patterns
- Ensure open-source nature is accurately reflected
- Generate comprehensive test reports

## Prerequisites

- Bash shell (Linux/macOS) or Git Bash (Windows)
- grep, awk, sed utilities
- Write permissions in project directory

## Usage

### Run Full UAT Suite
```bash
./uat_test.sh
```

### Clean Previous Results
```bash
./uat_test.sh --clean
```

### Show Help
```bash
./uat_test.sh --help
```

## Test Cases

| Test # | Description | Checks |
|--------|-------------|---------|
| 01 | Fake Email Addresses Removal | No `nzila.ao` emails remain |
| 02 | Fake Testimonials Removal | No fabricated testimonials/people/gyms |
| 03 | Fake Commercial Pricing Removal | No fake pricing tiers/Kwanza prices |
| 04 | Fake Phone Numbers Removal | No `XXX` placeholder phones |
| 05 | Fake Domain Names Removal | No `gymmanager.local` or `gym.ao` domains |
| 06 | Hardware Claims Qualification | Integration claims marked with 📋 |
| 07 | Placeholder Consistency | Standard `[your-email@example.com]` patterns used |
| 08 | GitHub Links Usage | Support channels point to GitHub |
| 09 | Open-Source Consistency | References to open-source/MIT present |
| 10 | File Integrity | All critical files exist and accessible |
| 11 | Empty Placeholder Check | No broken `[...]` placeholders |

## Output

### Results Directory

All test results are saved to `uat_results/` directory:

```
uat_results/
├── test_results.txt           # Overall pass/fail summary
├── test_01_emails.log        # Fake email findings
├── test_02_testimonials.log  # Fake testimonial findings
├── test_03_pricing.log       # Fake pricing findings
├── test_04_phones.log        # Fake phone findings
├── test_05_domains.log       # Fake domain findings
├── test_06_hardware.log     # Hardware claim status
├── test_07_placeholders.log   # Placeholder usage
├── test_08_github.log       # GitHub link usage
├── test_09_opensource.log   # Open-source references
├── test_10_integrity.log    # File check results
└── test_11_empty.log        # Empty placeholder check
```

### Console Output

```
======================================
Nzila Gym Manager - Documentation UAT
======================================

ℹ️  INFO: Started at: 2026-01-11 11:45:00
ℹ️  INFO: Results directory: uat_results

======================================
Running UAT Tests
======================================

TEST 01: Fake Email Addresses Removal
✅ PASS: No fake nzila.ao emails found

TEST 02: Fake Testimonials Removal
✅ PASS: No fake testimonials found

[... continues for all tests ...]

======================================
UAT Summary
======================================
Total Tests Run: 11
Tests Passed: 11
Tests Failed: 0
Pass Rate: 100%

✅ PASS: ALL TESTS PASSED - UAT SUCCESSFUL
======================================
UAT STATUS: ✅ PASSED
Recommendation: APPROVED FOR PRODUCTION
======================================
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | UAT PASSED - All tests successful |
| 1 | UAT FAILED - One or more tests failed |

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Documentation UAT

on:
  pull_request:
    paths:
      - '**.md'

jobs:
  uat:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run UAT Suite
        run: |
          chmod +x ./uat_test.sh
          ./uat_test.sh
          
      - name: Upload UAT Results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: uat-results
          path: uat_results/
```

## Maintenance

### Adding New Tests

1. Create test function:
```bash
test_new_feature() {
    print_test "XX" "Test Description"
    
    # Perform test logic
    if [ condition ]; then
        print_pass "Success message"
    else
        print_fail "Failure message" "Details"
    fi
}
```

2. Call function in `main()`:
```bash
test_new_feature
```

3. Update this documentation with new test details

## Troubleshooting

### Permission Denied

```bash
chmod +x uat_test.sh
```

### grep: command not found

Install grep:
- Ubuntu/Debian: `sudo apt-get install grep`
- macOS: Pre-installed

### Results Directory Not Created

```bash
# Manually create
mkdir -p uat_results
```

## Version History

| Version | Date | Changes |
|---------|-------|---------|
| 1.0 | 2026-01-11 | Initial UAT suite with 11 test cases |

## License

MIT License - Same as Nzila Gym Manager project
