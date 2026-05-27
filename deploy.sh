#!/bin/bash
# Alfie Club — 一键部署脚本
# 用法：./deploy.sh "提交说明"  ·  例：./deploy.sh "更新教练介绍"

set -e

MSG="${1:-update content}"
cd "$(dirname "$0")"

echo "🎿 Alfie Club deploy"
echo "—————————————————————"

# 1. 检查改动
if [[ -z "$(git status --porcelain)" ]]; then
  echo "✅ 没有改动，不需要发布。"
  exit 0
fi

echo "📋 改动文件："
git status --short
echo ""

# 2. 提交
git add .
git commit -m "$MSG

Co-authored-by: Alfie Club <alfie-jojo@alfieclub.cn>"

# 3. 推送
if git remote get-url origin > /dev/null 2>&1; then
  echo ""
  echo "📤 推送到 GitHub..."
  git push origin main
  echo ""
  echo "✅ 已推送。Vercel 会在 30-60 秒内自动构建并上线。"
  echo "   查看进度: https://vercel.com/dashboard"
else
  echo "⚠️  尚未设置远程仓库。请先到 https://github.com/new 创建仓库，然后运行："
  echo ""
  echo "   git remote add origin https://github.com/你的用户名/alfie-club.git"
  echo "   git push -u origin main"
fi
