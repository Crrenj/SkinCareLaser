#!/bin/bash

echo "🔧 Résolution du problème de port..."

# Tuer les processus sur le port 3000
echo "📍 Libération du port 3000..."
lsof -ti :3000 | xargs kill -9 2>/dev/null || echo "Port 3000 déjà libre"

# Tuer tous les processus Next.js
echo "🛑 Arrêt de tous les serveurs Next.js..."
pkill -f "next dev" || echo "Aucun serveur Next.js en cours"

# Attendre un peu
sleep 2

echo "✅ Ports libérés!"
echo ""
echo "🚀 Relancez le serveur avec:"
echo "   npm run dev"
echo ""
echo "📱 Puis accédez à:"
echo "   http://localhost:3000/login" 