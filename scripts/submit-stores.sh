#!/usr/bin/env bash
set -euo pipefail

version=$(node -p "require('./package.json').version")
package="dist/magic-image-viewer-$version"
args=()

if [[ -n "${CHROME_PUBLISHER_ID:-}" && -n "${CHROME_SERVICE_ACCOUNT_KEY:-}" ]]; then
    export CHROME_API_VERSION=v2
    CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL=$(jq -r .client_email <<< "$CHROME_SERVICE_ACCOUNT_KEY")
    CHROME_SERVICE_ACCOUNT_PRIVATE_KEY=$(jq -r .private_key <<< "$CHROME_SERVICE_ACCOUNT_KEY")
    export CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL CHROME_SERVICE_ACCOUNT_PRIVATE_KEY
    args+=(--chrome-zip "$package-chrome.zip")
    echo "Chrome Web Store: submitting"
else
    echo "Chrome Web Store: skipped, secrets not set"
fi

if [[ -n "${FIREFOX_JWT_ISSUER:-}" && -n "${FIREFOX_JWT_SECRET:-}" ]]; then
    args+=(--firefox-zip "$package-firefox.zip" --firefox-sources-zip "$package-sources.zip")
    echo "Firefox Add-ons: submitting"
else
    echo "Firefox Add-ons: skipped, secrets not set"
fi

if [[ -n "${EDGE_PRODUCT_ID:-}" && -n "${EDGE_CLIENT_ID:-}" && -n "${EDGE_API_KEY:-}" ]]; then
    args+=(--edge-zip "$package-chrome.zip")
    echo "Edge Add-ons: submitting"
else
    echo "Edge Add-ons: skipped, secrets not set"
fi

if [[ ${#args[@]} -eq 0 ]]; then
    exit 0
fi

npx wxt submit "${args[@]}"
