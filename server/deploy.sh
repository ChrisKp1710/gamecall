#!/bin/bash
# Script deploy automatico per GameCall Backend

set -e

echo "🚀 Deploy GameCall Backend"
echo ""

# Menu selezione piattaforma
echo "Scegli piattaforma:"
echo "1) Railway"
echo "2) Fly.io"
echo "3) Docker locale"
read -p "Scelta (1-3): " choice

case $choice in
  1)
    echo ""
    echo "📦 Deploy su Railway..."

    # Check Railway CLI
    if ! command -v railway &> /dev/null; then
        echo "❌ Railway CLI non installato!"
        echo "Installa con: npm install -g @railway/cli"
        exit 1
    fi

    railway login
    railway link
    railway up

    echo "✅ Deploy completato su Railway!"
    ;;

  2)
    echo ""
    echo "✈️  Deploy su Fly.io..."

    # Check Fly CLI
    if ! command -v fly &> /dev/null; then
        echo "❌ Fly CLI non installato!"
        echo "Installa da: https://fly.io/docs/hands-on/install-flyctl/"
        exit 1
    fi

    fly auth login
    fly launch --now

    echo "✅ Deploy completato su Fly.io!"
    ;;

  3)
    echo ""
    echo "🐳 Build Docker locale..."

    docker build -t gamecall-backend .
    docker run -d \
      --name gamecall-api \
      -p 3000:8080 \
      -e DATABASE_URL="$DATABASE_URL" \
      -e JWT_SECRET="$JWT_SECRET" \
      gamecall-backend

    echo "✅ Container avviato!"
    echo "   URL: http://localhost:3000"
    ;;

  *)
    echo "❌ Scelta non valida"
    exit 1
    ;;
esac

echo ""
echo "🎉 Fatto!"
