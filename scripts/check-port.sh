#!/bin/bash

# Script pour vérifier et libérer le port 3000

echo "🔍 Vérification du port 3000..."

# Vérifier ce qui utilise le port 3000
PORT_PROCESS=$(lsof -ti:3000)

if [ -z "$PORT_PROCESS" ]; then
    echo "✅ Le port 3000 est libre !"
else
    echo "⚠️  Le port 3000 est utilisé par le processus PID: $PORT_PROCESS"
    
    # Afficher les détails du processus
    echo "📋 Détails du processus :"
    ps -p $PORT_PROCESS -o pid,ppid,user,comm
    
    # Demander confirmation
    read -p "Voulez-vous tuer ce processus ? (y/n) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill -9 $PORT_PROCESS
        echo "✅ Processus tué ! Le port 3000 est maintenant libre."
        echo "🚀 Vous pouvez maintenant lancer : npm run dev"
    else
        echo "⚠️  Le processus n'a pas été tué."
        echo "📌 Next.js utilisera probablement le port 3001."
        echo "🔗 Accédez à : http://localhost:3001"
    fi
fi

echo ""
echo "💡 Astuce : Pour forcer un port spécifique :"
echo "   npm run dev -- -p 3002" 