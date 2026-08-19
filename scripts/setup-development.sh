#!/usr/bin/env bash
set -euo pipefail

required_node_major=24
required_npm_major=11

if ! command -v node >/dev/null 2>&1; then
  echo "Node.jsが見つかりません。.node-versionに記載されたNode.jsをインストールしてください。" >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npmが見つかりません。npm ${required_npm_major}をインストールしてください。" >&2
  exit 1
fi

node_major="$(node --version | sed -E 's/^v([0-9]+).*/\1/')"
npm_major="$(npm --version | sed -E 's/^([0-9]+).*/\1/')"

if [[ "${node_major}" != "${required_node_major}" ]]; then
  echo "Node.js ${required_node_major}が必要です（現在: $(node --version)）。" >&2
  exit 1
fi

if [[ "${npm_major}" != "${required_npm_major}" ]]; then
  echo "npm ${required_npm_major}が必要です（現在: $(npm --version)）。" >&2
  exit 1
fi

npm ci
npm run check

echo "開発環境の準備と検証が完了しました。"
