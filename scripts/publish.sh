#!/usr/bin/env bash
set -euo pipefail

BUMP_TYPE="${1:-}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CLI_DIR="$REPO_ROOT/packages/cli"
PKG="$CLI_DIR/package.json"

# --- Validate args ---
if [[ ! "$BUMP_TYPE" =~ ^(patch|minor|major)$ ]]; then
  echo "Usage: publish.sh <patch|minor|major>"
  exit 2
fi

# --- Check working tree is clean ---
if [[ -n $(git -C "$REPO_ROOT" status --porcelain) ]]; then
  echo "Error: Working directory is not clean. Commit or stash changes first."
  exit 1
fi

ORIGINAL_BRANCH=$(git -C "$REPO_ROOT" branch --show-current)

# --- Warn if not on main ---
if [[ "$ORIGINAL_BRANCH" != "main" ]]; then
  echo "You're on '$ORIGINAL_BRANCH', not main."
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
  fi
fi

# --- Compute new version ---
CURRENT_VERSION=$(node -p "require('$PKG').version")
IFS='.' read -r V_MAJOR V_MINOR V_PATCH <<< "$CURRENT_VERSION"

case "$BUMP_TYPE" in
  patch) NEW_VERSION="$V_MAJOR.$V_MINOR.$((V_PATCH + 1))" ;;
  minor) NEW_VERSION="$V_MAJOR.$((V_MINOR + 1)).0" ;;
  major) NEW_VERSION="$((V_MAJOR + 1)).0.0" ;;
esac

RELEASE_BRANCH="release/v$NEW_VERSION"
TAG="v$NEW_VERSION"

echo "Publishing $CURRENT_VERSION → $NEW_VERSION"

# --- Rollback tracking ---
CREATED_BRANCH=false
PUSHED_BRANCH=false
CREATED_PR=false
PR_URL=""

cleanup() {
  echo ""
  echo "Publish failed — rolling back..."

  if [[ "$CREATED_PR" == true && -n "$PR_URL" ]]; then
    echo "  Closing PR..."
    gh pr close "$PR_URL" --delete-branch 2>/dev/null || true
  fi

  if [[ "$PUSHED_BRANCH" == true && "$CREATED_PR" != true ]]; then
    echo "  Deleting remote branch..."
    git -C "$REPO_ROOT" push origin --delete "$RELEASE_BRANCH" 2>/dev/null || true
  fi

  # Return to original branch and delete local release branch
  CURRENT=$(git -C "$REPO_ROOT" branch --show-current)
  if [[ "$CURRENT" == "$RELEASE_BRANCH" ]]; then
    git -C "$REPO_ROOT" checkout "$ORIGINAL_BRANCH" 2>/dev/null || true
  fi

  if [[ "$CREATED_BRANCH" == true ]]; then
    echo "  Deleting local branch..."
    git -C "$REPO_ROOT" branch -D "$RELEASE_BRANCH" 2>/dev/null || true
  fi

  echo "Rolled back cleanly."
}

trap cleanup ERR

# --- Create release branch ---
git -C "$REPO_ROOT" checkout -b "$RELEASE_BRANCH"
CREATED_BRANCH=true

# --- Bump version ---
node -e "
  const fs = require('fs');
  const path = '$PKG';
  const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
  pkg.version = '$NEW_VERSION';
  fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
"

# --- Commit and push ---
git -C "$REPO_ROOT" add "$PKG"
git -C "$REPO_ROOT" commit -m "release: v$NEW_VERSION"
git -C "$REPO_ROOT" push -u origin "$RELEASE_BRANCH"
PUSHED_BRANCH=true

# --- Create PR ---
PR_URL=$(gh pr create \
  --repo seflless/deep-wiki \
  --base main \
  --head "$RELEASE_BRANCH" \
  --title "release: v$NEW_VERSION" \
  --body "Version bump to $NEW_VERSION")
CREATED_PR=true

echo "PR created: $PR_URL"

# --- Publish to npm ---
echo "Publishing to npm..."
cd "$CLI_DIR"
npm publish
cd "$REPO_ROOT"

# --- Merge PR ---
echo "Merging PR..."
gh pr merge "$PR_URL" --merge --delete-branch

# --- Return to original branch and pull ---
git -C "$REPO_ROOT" checkout "$ORIGINAL_BRANCH"
git -C "$REPO_ROOT" pull

# --- Tag and push ---
git -C "$REPO_ROOT" tag "$TAG"
git -C "$REPO_ROOT" push origin "$TAG"

# --- Disable the trap since we succeeded ---
trap - ERR

echo ""
echo "Published @seflless/deep-wiki@$NEW_VERSION"
echo "Tag: $TAG"
echo "PR: $PR_URL"
