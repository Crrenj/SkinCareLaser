#!/bin/bash

echo "🔧 Correction du problème de port..."

# Tuer les processus sur le port 3000
echo "1. Libération du port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "   Port 3000 déjà libre"

# Tuer les processus sur le port 3001
echo "2. Libération du port 3001..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || echo "   Port 3001 déjà libre"

# Attendre un peu
sleep 2

echo "3. Redémarrage du serveur sur le port 3000..."
npm run dev -- --port 3000 