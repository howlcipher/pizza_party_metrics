#!/usr/bin/env bash
# This script installs a git pre-push hook that runs 'make check' before pushing.

HOOK_DIR=".git/hooks"
HOOK_FILE="${HOOK_DIR}/pre-push"

if [ ! -d "${HOOK_DIR}" ]; then
    echo "Error: .git/hooks directory not found. Are you in the root of the repository?"
    exit 1
fi

cat << 'EOF' > "${HOOK_FILE}"
#!/usr/bin/env bash
#
# Pre-push hook that runs tests and linters before allowing a push.
# If this script exits with a non-zero status, the push will be aborted.

echo "Running pre-push checks (linting & testing)..."

# Run make check
if ! make check; then
    echo "========================================================================"
    echo "❌ PRE-PUSH HOOK FAILED"
    echo "Make check (flake8 + pytest) failed. Please fix the errors before pushing."
    echo "To bypass this check, use 'git push --no-verify'."
    echo "========================================================================"
    exit 1
fi

echo "✅ Pre-push checks passed! Pushing to remote..."
exit 0
EOF

chmod +x "${HOOK_FILE}"
echo "Successfully installed pre-push hook at ${HOOK_FILE}."
