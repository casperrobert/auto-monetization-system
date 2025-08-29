#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/create_pr.sh feat/streams-validation-tests "validation: add schema subschemas, tests, exportable app"
# Requires: git and gh (GitHub CLI) installed and authenticated (gh auth login)

BRANCH=${1:-feat/streams-validation-tests}
TITLE=${2:-"validation: add schema subschemas, tests, exportable app"}
BASE=${3:-main}

echo "Creating branch $BRANCH from $BASE"

git fetch origin ${BASE}

git checkout -b ${BRANCH}

echo "Staging changes..."
git add -A

if git diff --cached --quiet; then
  echo "No changes to commit. Ensure you've saved edits."
else
  git commit -m "$TITLE"
  echo "Pushing branch to origin..."
  git push -u origin ${BRANCH}
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "gh (GitHub CLI) not found. Install it or create the PR manually using the GitHub web UI."
  exit 0
fi

echo "Creating PR via gh..."
PR_URL=$(gh pr create --fill --base ${BASE} --head ${BRANCH} --title "$TITLE" --body-file PULL_REQUEST_TEMPLATE.md)

echo "PR created: $PR_URL"

echo "You can watch CI at: https://github.com/$(git remote get-url origin | sed -E 's#(git@github.com:|https://github.com/)##;s/\.git$//')/actions"

echo "Done."
