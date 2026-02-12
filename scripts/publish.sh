#!/usr/bin/env bash
set -euo pipefail

BUMP_TYPE="${1:-}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CLI_DIR="$REPO_ROOT/packages/cli"
PKG="$CLI_DIR/package.json"
REPO="seflless/deepwiki"

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
PUBLISHED=false
PR_URL=""
PR_NUMBER=""

cleanup() {
  echo ""
  if [[ "$PUBLISHED" == true ]]; then
    echo "npm publish succeeded but a later step failed."
    echo "v$NEW_VERSION is live on npm. You may need to manually:"
    [[ "$CREATED_PR" == true ]] && echo "  - Merge PR: $PR_URL"
    echo "  - Tag: git tag $TAG && git push origin $TAG"
    exit 1
  fi

  echo "Publish failed — rolling back..."

  if [[ "$CREATED_PR" == true && -n "$PR_NUMBER" ]]; then
    echo "  Closing PR..."
    gh pr close "$PR_NUMBER" --repo "$REPO" --delete-branch 2>/dev/null || true
  elif [[ "$PUSHED_BRANCH" == true ]]; then
    echo "  Deleting remote branch..."
    git -C "$REPO_ROOT" push origin --delete "$RELEASE_BRANCH" 2>/dev/null || true
  fi

  CURRENT=$(git -C "$REPO_ROOT" branch --show-current 2>/dev/null || echo "")
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
  --repo "$REPO" \
  --base main \
  --head "$RELEASE_BRANCH" \
  --title "release: v$NEW_VERSION" \
  --body "Version bump to $NEW_VERSION")
PR_NUMBER=$(echo "$PR_URL" | grep -o '[0-9]*$')
CREATED_PR=true

echo "PR created: $PR_URL"

# --- Publish to npm ---
echo "Publishing to npm..."
(cd "$CLI_DIR" && npm publish)
PUBLISHED=true
echo "Published to npm."

# --- Merge PR via API (avoids local git checkout issues) ---
echo "Merging PR..."
gh api "repos/$REPO/pulls/$PR_NUMBER/merge" -X PUT -f merge_method=merge > /dev/null

# --- Delete remote release branch ---
git -C "$REPO_ROOT" push origin --delete "$RELEASE_BRANCH" 2>/dev/null || true

# --- Return to original branch ---
git -C "$REPO_ROOT" checkout "$ORIGINAL_BRANCH"
git -C "$REPO_ROOT" branch -D "$RELEASE_BRANCH" 2>/dev/null || true

# Pull the merge commit if on a branch that tracks main
if [[ "$ORIGINAL_BRANCH" == "main" ]] || git -C "$REPO_ROOT" config "branch.$ORIGINAL_BRANCH.merge" 2>/dev/null | grep -q main; then
  git -C "$REPO_ROOT" pull --ff-only origin main 2>/dev/null || true
fi

# --- Tag and push ---
git -C "$REPO_ROOT" tag "$TAG"
git -C "$REPO_ROOT" push origin "$TAG"

# --- Done ---
trap - ERR

echo ""
echo "Published @seflless/deepwiki@$NEW_VERSION"
echo "Tag: $TAG"
echo "PR: $PR_URL"
