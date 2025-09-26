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

# Create a temp dir to store per-test outputs
TMPDIR=$(mktemp -d -t run_tests.XXXXXX)
trap 'rm -rf "$TMPDIR"' EXIT

# Arrays to hold test names
declare -a passed_names
declare -a failed_names

# Ensure the glob expands to nothing if no matches
shopt -s nullglob

for test_file in "$SCRIPT_DIR"/*.test.js; do
    if [ -f "$test_file" ]; then
        test_name=$(basename "$test_file")
        ((total_tests++))

        # Capture stdout/stderr to a per-test file
        out_file="$TMPDIR/$test_name.out"
        if "$SCRIPT_DIR"/../qjs "$test_file" >"$out_file" 2>&1; then
            passed_names+=("$test_name")
            ((passed_tests++))
        else
            failed_names+=("$test_name")
            ((failed_tests++))
        fi
    fi
done

echo -e "${BOLD}Test Summary:${NC}"
echo -e "Total tests run: $total_tests"

if [ $failed_tests -gt 0 ]; then
    # If any tests failed, print only the failed tests and their outputs
    echo -e "${RED}Tests failed: $failed_tests${NC}\n"
    for name in "${failed_names[@]}"; do
        echo -e "${BOLD}${RED}--- FAILED: $name ---${NC}"
        cat "$TMPDIR/$name.out"
        echo -e "\n"
    done
    # Exit non-zero to indicate failure
    exit 1
else
    # All passed: print passed counts and nice per-test messages
    echo -e "${GREEN}Tests passed: $passed_tests${NC}\n"
    for name in "${passed_names[@]}"; do
        echo -e "${GREEN}✓ $name passed${NC}"
    done
    echo
    exit 0
fi
