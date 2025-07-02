#!/bin/bash
# Script d'upload des images vers Supabase Storage
# Généré le 2025-07-02 12:26:48

# Vérifier que Supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo "Erreur: Supabase CLI n'est pas installé"
    echo "Installer avec: npm install -g supabase"
    exit 1
fi

# Se placer dans le dossier des images
cd db/contenu_bd/image || exit 1

# Créer le bucket s'il n'existe pas
echo "Configuration du bucket product-image..."
supabase storage create product-image --public || true


# Upload des images pour ACM
echo "Upload des images acm..."
for img in acm/*.png acm/*.jpg; do
    if [ -f "$img" ]; then
        filename=$(basename "$img")
        echo "  - $filename"
        supabase storage upload \
            --bucket "product-image" \
            "$img" \
            "acm/$filename" \
            --overwrite
    fi
done

# Upload des images pour A-Derma
echo "Upload des images adrema..."
for img in adrema/*.png adrema/*.jpg; do
    if [ -f "$img" ]; then
        filename=$(basename "$img")
        echo "  - $filename"
        supabase storage upload \
            --bucket "product-image" \
            "$img" \
            "adrema/$filename" \
            --overwrite
    fi
done

# Upload des images pour Ataché
echo "Upload des images atache..."
for img in atache/*.png atache/*.jpg; do
    if [ -f "$img" ]; then
        filename=$(basename "$img")
        echo "  - $filename"
        supabase storage upload \
            --bucket "product-image" \
            "$img" \
            "atache/$filename" \
            --overwrite
    fi
done

# Upload des images pour Avène
echo "Upload des images avene..."
for img in avene/*.png avene/*.jpg; do
    if [ -f "$img" ]; then
        filename=$(basename "$img")
        echo "  - $filename"
        supabase storage upload \
            --bucket "product-image" \
            "$img" \
            "avene/$filename" \
            --overwrite
    fi
done

# Upload des images pour Babé
echo "Upload des images babe..."
for img in babe/*.png babe/*.jpg; do
    if [ -f "$img" ]; then
        filename=$(basename "$img")
        echo "  - $filename"
        supabase storage upload \
            --bucket "product-image" \
            "$img" \
            "babe/$filename" \
            --overwrite
    fi
done

# Upload des images pour Dermo Genové
echo "Upload des images demo-genove..."
for img in demo-genove/*.png demo-genove/*.jpg; do
    if [ -f "$img" ]; then
        filename=$(basename "$img")
        echo "  - $filename"
        supabase storage upload \
            --bucket "product-image" \
            "$img" \
            "demo-genove/$filename" \
            --overwrite
    fi
done

# Upload des images pour Ducray
echo "Upload des images ducray..."
for img in ducray/*.png ducray/*.jpg; do
    if [ -f "$img" ]; then
        filename=$(basename "$img")
        echo "  - $filename"
        supabase storage upload \
            --bucket "product-image" \
            "$img" \
            "ducray/$filename" \
            --overwrite
    fi
done

# Upload des images pour EltaMD
echo "Upload des images elta-md..."
for img in elta-md/*.png elta-md/*.jpg; do
    if [ -f "$img" ]; then
        filename=$(basename "$img")
        echo "  - $filename"
        supabase storage upload \
            --bucket "product-image" \
            "$img" \
            "elta-md/$filename" \
            --overwrite
    fi
done

# Upload des images pour Filorga
echo "Upload des images filorga..."
for img in filorga/*.png filorga/*.jpg; do
    if [ -f "$img" ]; then
        filename=$(basename "$img")
        echo "  - $filename"
        supabase storage upload \
            --bucket "product-image" \
            "$img" \
            "filorga/$filename" \
            --overwrite
    fi
done

# Upload des images pour ISDIN
echo "Upload des images isdin..."
for img in isdin/*.png isdin/*.jpg; do
    if [ -f "$img" ]; then
        filename=$(basename "$img")
        echo "  - $filename"
        supabase storage upload \
            --bucket "product-image" \
            "$img" \
            "isdin/$filename" \
            --overwrite
    fi
done

# Upload des images pour ISIS Pharma
echo "Upload des images isispharma..."
for img in isispharma/*.png isispharma/*.jpg; do
    if [ -f "$img" ]; then
        filename=$(basename "$img")
        echo "  - $filename"
        supabase storage upload \
            --bucket "product-image" \
            "$img" \
            "isispharma/$filename" \
            --overwrite
    fi
done

# Upload des images pour Levissime
echo "Upload des images levissime..."
for img in levissime/*.png levissime/*.jpg; do
    if [ -f "$img" ]; then
        filename=$(basename "$img")
        echo "  - $filename"
        supabase storage upload \
            --bucket "product-image" \
            "$img" \
            "levissime/$filename" \
            --overwrite
    fi
done

# Upload des images pour Uriage
echo "Upload des images uriage..."
for img in uriage/*.png uriage/*.jpg; do
    if [ -f "$img" ]; then
        filename=$(basename "$img")
        echo "  - $filename"
        supabase storage upload \
            --bucket "product-image" \
            "$img" \
            "uriage/$filename" \
            --overwrite
    fi
done

echo "Upload terminé!"
