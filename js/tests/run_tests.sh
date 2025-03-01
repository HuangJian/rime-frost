#!/bin/bash

# Colors for output
GREEN="\033[0;32m"
RED="\033[0;31m"
NC="\033[0m" # No Color
BOLD="\033[1m"

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Initialize counters
total_tests=0
passed_tests=0
failed_tests=0

echo -e "${BOLD}Running all tests in ${SCRIPT_DIR}...${NC}\n"

# Find all test files and run them
for test_file in "$SCRIPT_DIR"/*.test.js; do
    if [ -f "$test_file" ]; then
        test_name=$(basename "$test_file")
        echo -e "${BOLD}Running $test_name...${NC}"
        
        # Run the test with qjs
        if "$SCRIPT_DIR"/qjs "$test_file"; then
            echo -e "${GREEN}✓ $test_name passed${NC}\n"
            ((passed_tests++))
        else
            echo -e "${RED}✗ $test_name failed${NC}\n"
            ((failed_tests++))
        fi
        ((total_tests++))
    fi
done

# Print summary
echo -e "${BOLD}Test Summary:${NC}"
echo -e "Total tests run: $total_tests"
echo -e "${GREEN}Tests passed: $passed_tests${NC}"
if [ $failed_tests -gt 0 ]; then
    echo -e "${RED}Tests failed: $failed_tests${NC}"
fi

# Exit with failure if any tests failed
[ $failed_tests -eq 0 ]