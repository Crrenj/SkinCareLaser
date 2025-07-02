#!/usr/bin/env python3
import os
import re
from pathlib import Path
from datetime import datetime

def slugify(text):
    """Convertir un texte en slug URL-friendly"""
    if not text:
        return ""
    text = str(text).lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text.strip('-')

def get_brands_from_folders():
    """Obtenir la liste des marques depuis les dossiers d'images"""
    # Mapping des slugs vers les noms corrects
    brand_names = {
        'acm': 'ACM',
        'adrema': 'A-Derma',
        'atache': 'Ataché',
        'avene': 'Avène',
        'babe': 'Babé',
        'demo-genove': 'Dermo Genové',
        'ducray': 'Ducray',
        'elta-md': 'EltaMD',
        'filorga': 'Filorga',
        'isdin': 'ISDIN',
        'isispharma': 'ISIS Pharma',
        'levissime': 'Levissime',
        'uriage': 'Uriage'
    }
    
    brands = {}
    image_dir = Path('db/contenu_bd/image')
    
    # Si le dossier existe, parcourir ses sous-dossiers
    if image_dir.exists():
        for folder in image_dir.iterdir():
            if folder.is_dir() and not folder.name.startswith('.'):
                slug = folder.name
                name = brand_names.get(slug, slug.replace('-', ' ').title())
                brands[slug] = name
    
    # Si aucune marque trouvée, utiliser les marques par défaut
    if not brands:
        brands = brand_names
    
    return brands

def create_sample_products(brands):
    """Créer des produits exemples pour chaque marque"""
    products = []
    product_templates = [
        # Nettoyants
        {'name': 'Gel Nettoyant Purifiant', 'price': 1850, 'category': 'nettoyant', 'need': 'acne', 'skin_type': 'peau-grasse'},
        {'name': 'Mousse Nettoyante Douce', 'price': 1650, 'category': 'nettoyant', 'need': 'sensibilite', 'skin_type': 'peau-sensible'},
        {'name': 'Eau Micellaire', 'price': 1450, 'category': 'nettoyant', 'need': 'sensibilite', 'skin_type': 'tous-types'},
        
        # Hydratants
        {'name': 'Crème Hydratante Légère', 'price': 2250, 'category': 'hydratant', 'need': 'hydratation', 'skin_type': 'peau-mixte'},
        {'name': 'Crème Riche Nourrissante', 'price': 2650, 'category': 'hydratant', 'need': 'hydratation', 'skin_type': 'peau-seche'},
        {'name': 'Gel Hydratant Matifiant', 'price': 2150, 'category': 'hydratant', 'need': 'acne', 'skin_type': 'peau-grasse'},
        
        # Sérums
        {'name': 'Sérum Anti-Âge', 'price': 3850, 'category': 'serum', 'need': 'anti-age', 'skin_type': 'tous-types'},
        {'name': 'Sérum Vitamine C', 'price': 3250, 'category': 'serum', 'need': 'taches', 'skin_type': 'tous-types'},
        {'name': 'Sérum Acide Hyaluronique', 'price': 3550, 'category': 'serum', 'need': 'hydratation', 'skin_type': 'tous-types'},
        
        # Protection solaire
        {'name': 'Fluide Solaire SPF 50+', 'price': 2850, 'category': 'protection-solaire', 'need': 'protection', 'skin_type': 'tous-types'},
        {'name': 'Crème Solaire Teintée SPF 30', 'price': 2650, 'category': 'protection-solaire', 'need': 'protection', 'skin_type': 'tous-types'},
        
        # Masques
        {'name': 'Masque Purifiant Argile', 'price': 1950, 'category': 'masque', 'need': 'acne', 'skin_type': 'peau-grasse'},
        {'name': 'Masque Hydratant Intense', 'price': 2150, 'category': 'masque', 'need': 'hydratation', 'skin_type': 'peau-seche'},
        
        # Exfoliants
        {'name': 'Gommage Doux Visage', 'price': 1750, 'category': 'exfoliant', 'need': 'eclat', 'skin_type': 'tous-types'},
        {'name': 'Peeling Enzymatique', 'price': 2350, 'category': 'exfoliant', 'need': 'eclat', 'skin_type': 'peau-sensible'}
    ]
    
    # Gammes par marque
    ranges_by_brand = {
        'acm': ['Sébionex', 'Dépiwhite', 'Novophane'],
        'adrema': ['Exomega', 'Epitheliale', 'Dermalibour'],
        'atache': ['C Vital', 'Soft Derm', 'Retinol'],
        'avene': ['Cleanance', 'Hydrance', 'Cicalfate', 'Antirougeurs'],
        'babe': ['Pediatric', 'Essentials', 'Stop AKN'],
        'demo-genove': ['Genomask', 'Sesgen 32', 'Acnises'],
        'ducray': ['Keracnyl', 'Ictyane', 'Melascreen'],
        'elta-md': ['UV Clear', 'UV Daily', 'Foaming Facial'],
        'filorga': ['Time-Filler', 'NCEF', 'Oxygen-Glow'],
        'isdin': ['Fotoprotetor', 'Acniben', 'Isdinceutics'],
        'isispharma': ['Neotone', 'Glyco-A', 'Ruboril'],
        'levissime': ['Alginate Masks', 'Professional', 'Home Care'],
        'uriage': ['Hyséac', 'Bariéderm', 'Age Protect']
    }
    
    import random
    
    for brand_slug, brand_name in brands.items():
        ranges = ranges_by_brand.get(brand_slug, ['Ligne Principale'])
        
        # Sélectionner un sous-ensemble de produits pour chaque marque
        selected_templates = random.sample(product_templates, min(len(product_templates), 8))
        
        for i, template in enumerate(selected_templates):
            # Assigner une gamme
            range_name = ranges[i % len(ranges)]
            
            product = {
                'id': f"{brand_slug}-{slugify(template['name'])}-{i+1}",
                'name': f"{template['name']} {brand_name}",
                'slug': f"{brand_slug}-{slugify(template['name'])}-{i+1}",
                'description': f"{template['name']} de la marque {brand_name}, gamme {range_name}. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.",
                'price': template['price'],
                'currency': 'DOP',
                'stock': 0,
                'brand_slug': brand_slug,
                'brand_name': brand_name,
                'range_name': range_name,
                'range_slug': slugify(range_name),
                'tags': [
                    ('category', template['category'], template['category'].replace('-', ' ').title()),
                    ('need', template['need'], template['need'].replace('-', ' ').title()),
                    ('skin_type', template['skin_type'], template['skin_type'].replace('-', ' ').title())
                ]
            }
            products.append(product)
    
    return products

def find_product_images(product_slug, brand_slug):
    """Trouver les images pour un produit"""
    image_dir = Path(f'db/contenu_bd/image/{brand_slug}')
    images = []
    
    if image_dir.exists():
        # Prendre les premières images disponibles
        image_files = sorted(image_dir.glob('image*.png'))[:2]
        for img_file in image_files:
            images.append(f"https://gfhofqjqpbwhewyqsgjq.supabase.co/storage/v1/object/public/product-image/{brand_slug}/{img_file.name}")
    
    # Image par défaut si nécessaire
    if not images:
        images.append(f"https://picsum.photos/seed/{product_slug}/400")
    
    return images

def generate_sql():
    """Générer le script SQL complet"""
    brands = get_brands_from_folders()
    products = create_sample_products(brands)
    
    sql_lines = []
    
    # En-tête
    sql_lines.append(f"""-- ======================================================================
-- 📦 Script de peuplement du catalogue Skincare
-- Généré le {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
-- ======================================================================
-- Ce script utilise INSERT ... ON CONFLICT DO NOTHING pour être idempotent
-- ======================================================================

BEGIN;

-- ----------------------------------------------------------------------
-- 1. Insertion des marques
-- ----------------------------------------------------------------------""")
    
    # Marques
    for slug, name in sorted(brands.items()):
        sql_lines.append(f"""
INSERT INTO public.brands (id, name, slug)
VALUES (gen_random_uuid(), '{name.replace("'", "''")}', '{slug}')
ON CONFLICT (slug) DO NOTHING;""")
    
    # Gammes
    sql_lines.append("""

-- ----------------------------------------------------------------------
-- 2. Insertion des gammes
-- ----------------------------------------------------------------------""")
    
    ranges_inserted = set()
    for product in products:
        key = (product['brand_slug'], product['range_slug'])
        if key not in ranges_inserted:
            sql_lines.append(f"""
INSERT INTO public.ranges (id, brand_id, name, slug)
SELECT 
    gen_random_uuid(),
    b.id,
    '{product['range_name'].replace("'", "''")}',
    '{product['range_slug']}'
FROM public.brands b
WHERE b.slug = '{product['brand_slug']}'
ON CONFLICT (brand_id, slug) DO NOTHING;""")
            ranges_inserted.add(key)
    
    # Tags
    sql_lines.append("""

-- ----------------------------------------------------------------------
-- 3. Insertion des tags
-- ----------------------------------------------------------------------""")
    
    all_tags = set()
    for product in products:
        for tag_type, tag_slug, tag_name in product['tags']:
            all_tags.add((tag_type, tag_slug, tag_name))
    
    for tag_type, tag_slug, tag_name in sorted(all_tags):
        sql_lines.append(f"""
INSERT INTO public.tags (id, name, slug, tag_type)
VALUES (gen_random_uuid(), '{tag_name.replace("'", "''")}', '{tag_slug}', '{tag_type}')
ON CONFLICT (tag_type, slug) DO NOTHING;""")
    
    # Produits
    sql_lines.append("""

-- ----------------------------------------------------------------------
-- 4. Insertion des produits
-- ----------------------------------------------------------------------""")
    
    for product in products:
        sql_lines.append(f"""
INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    '{product['name'].replace("'", "''")}',
    '{product['slug']}',
    '{product['description'].replace("'", "''")}',
    {product['price']},
    '{product['currency']}',
    {product['stock']}
)
ON CONFLICT (slug) DO NOTHING;""")
    
    # Images produits
    sql_lines.append("""

-- ----------------------------------------------------------------------
-- 5. Insertion des images produits
-- ----------------------------------------------------------------------""")
    
    for product in products:
        images = find_product_images(product['slug'], product['brand_slug'])
        for i, image_url in enumerate(images):
            alt_text = f"{product['name']} - Image {i+1}"
            sql_lines.append(f"""
INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    '{image_url}',
    '{alt_text.replace("'", "''")}'
FROM public.products p
WHERE p.slug = '{product['slug']}'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = '{image_url}'
    );""")
    
    # Liens produit-gamme
    sql_lines.append("""

-- ----------------------------------------------------------------------
-- 6. Liens produits-gammes
-- ----------------------------------------------------------------------""")
    
    for product in products:
        sql_lines.append(f"""
INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = '{product['range_slug']}'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = '{product['brand_slug']}'
WHERE p.slug = '{product['slug']}'
ON CONFLICT (product_id, range_id) DO NOTHING;""")
    
    # Liens produit-tags
    sql_lines.append("""

-- ----------------------------------------------------------------------
-- 7. Liens produits-tags
-- ----------------------------------------------------------------------""")
    
    for product in products:
        for tag_type, tag_slug, _ in product['tags']:
            sql_lines.append(f"""
INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = '{tag_slug}' AND t.tag_type = '{tag_type}'
WHERE p.slug = '{product['slug']}'
ON CONFLICT (product_id, tag_id) DO NOTHING;""")
    
    # Fin de transaction
    sql_lines.append("""

COMMIT;

-- ======================================================================
-- Statistiques
-- ======================================================================
SELECT 'Marques:' as type, COUNT(*) as count FROM public.brands
UNION ALL
SELECT 'Gammes:', COUNT(*) FROM public.ranges
UNION ALL
SELECT 'Produits:', COUNT(*) FROM public.products
UNION ALL
SELECT 'Tags:', COUNT(*) FROM public.tags
UNION ALL
SELECT 'Images:', COUNT(*) FROM public.product_images;
""")
    
    return '\n'.join(sql_lines)

def generate_upload_script():
    """Générer le script shell pour uploader les images"""
    brands = get_brands_from_folders()
    
    script_lines = [
        "#!/bin/bash",
        "# Script d'upload des images vers Supabase Storage",
        f"# Généré le {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "",
        "# Vérifier que Supabase CLI est installé",
        "if ! command -v supabase &> /dev/null; then",
        '    echo "Erreur: Supabase CLI n\'est pas installé"',
        '    echo "Installer avec: npm install -g supabase"',
        "    exit 1",
        "fi",
        "",
        "# Se placer dans le dossier des images",
        "cd db/contenu_bd/image || exit 1",
        "",
        "# Créer le bucket s'il n'existe pas",
        'echo "Configuration du bucket product-image..."',
        "supabase storage create product-image --public || true",
        ""
    ]
    
    for brand_slug in sorted(brands.keys()):
        script_lines.append(f"""
# Upload des images pour {brands[brand_slug]}
echo "Upload des images {brand_slug}..."
for img in {brand_slug}/*.png {brand_slug}/*.jpg; do
    if [ -f "$img" ]; then
        filename=$(basename "$img")
        echo "  - $filename"
        supabase storage upload \\
            --bucket "product-image" \\
            "$img" \\
            "{brand_slug}/$filename" \\
            --overwrite
    fi
done""")
    
    script_lines.append("""
echo "Upload terminé!"
""")
    
    return '\n'.join(script_lines)

if __name__ == "__main__":
    # Générer le SQL
    sql_content = generate_sql()
    with open('db/populate_catalog.sql', 'w', encoding='utf-8') as f:
        f.write(sql_content)
    print("✅ Fichier SQL généré: db/populate_catalog.sql")
    
    # Générer le script d'upload
    upload_script = generate_upload_script()
    with open('scripts/upload_images.sh', 'w', encoding='utf-8') as f:
        f.write(upload_script)
    os.chmod('scripts/upload_images.sh', 0o755)
    print("✅ Script d'upload généré: scripts/upload_images.sh") 