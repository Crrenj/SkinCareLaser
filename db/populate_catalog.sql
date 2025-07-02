-- ======================================================================
-- 📦 Script de peuplement du catalogue Skincare
-- Généré le 2025-07-02 12:26:48
-- ======================================================================
-- Ce script utilise INSERT ... ON CONFLICT DO NOTHING pour être idempotent
-- ======================================================================

BEGIN;

-- ----------------------------------------------------------------------
-- 1. Insertion des marques
-- ----------------------------------------------------------------------

INSERT INTO public.brands (id, name, slug)
VALUES (gen_random_uuid(), 'ACM', 'acm')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.brands (id, name, slug)
VALUES (gen_random_uuid(), 'A-Derma', 'adrema')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.brands (id, name, slug)
VALUES (gen_random_uuid(), 'Ataché', 'atache')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.brands (id, name, slug)
VALUES (gen_random_uuid(), 'Avène', 'avene')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.brands (id, name, slug)
VALUES (gen_random_uuid(), 'Babé', 'babe')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.brands (id, name, slug)
VALUES (gen_random_uuid(), 'Dermo Genové', 'demo-genove')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.brands (id, name, slug)
VALUES (gen_random_uuid(), 'Ducray', 'ducray')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.brands (id, name, slug)
VALUES (gen_random_uuid(), 'EltaMD', 'elta-md')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.brands (id, name, slug)
VALUES (gen_random_uuid(), 'Filorga', 'filorga')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.brands (id, name, slug)
VALUES (gen_random_uuid(), 'ISDIN', 'isdin')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.brands (id, name, slug)
VALUES (gen_random_uuid(), 'ISIS Pharma', 'isispharma')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.brands (id, name, slug)
VALUES (gen_random_uuid(), 'Levissime', 'levissime')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.brands (id, name, slug)
VALUES (gen_random_uuid(), 'Uriage', 'uriage')
ON CONFLICT (slug) DO NOTHING;


-- ----------------------------------------------------------------------
-- 2. Insertion des gammes
-- ----------------------------------------------------------------------

INSERT INTO public.ranges (id, brand_id, name, slug)
SELECT 
    gen_random_uuid(),
    b.id,
    'Sébionex',
    'sébionex'
FROM public.brands b
WHERE b.slug = 'acm'
ON CONFLICT (brand_id, slug) DO NOTHING;

INSERT INTO public.ranges (id, brand_id, name, slug)
SELECT 
    gen_random_uuid(),
    b.id,
    'Dépiwhite',
    'dépiwhite'
FROM public.brands b
WHERE b.slug = 'acm'
ON CONFLICT (brand_id, slug) DO NOTHING;

INSERT INTO public.ranges (id, brand_id, name, slug)
SELECT 
    gen_random_uuid(),
    b.id,
    'Novophane',
    'novophane'
FROM public.brands b
WHERE b.slug = 'acm'
ON CONFLICT (brand_id, slug) DO NOTHING;

INSERT INTO public.ranges (id, brand_id, name, slug)
SELECT 
    gen_random_uuid(),
    b.id,
    'Exomega',
    'exomega'
FROM public.brands b
WHERE b.slug = 'adrema'
ON CONFLICT (brand_id, slug) DO NOTHING;

INSERT INTO public.ranges (id, brand_id, name, slug)
SELECT 
    gen_random_uuid(),
    b.id,
    'Epitheliale',
    'epitheliale'
FROM public.brands b
WHERE b.slug = 'adrema'
ON CONFLICT (brand_id, slug) DO NOTHING;

INSERT INTO public.ranges (id, brand_id, name, slug)
SELECT 
    gen_random_uuid(),
    b.id,
    'Dermalibour',
    'dermalibour'
FROM public.brands b
WHERE b.slug = 'adrema'
ON CONFLICT (brand_id, slug) DO NOTHING;

INSERT INTO public.ranges (id, brand_id, name, slug)
SELECT 
    gen_random_uuid(),
    b.id,
    'C Vital',
    'c-vital'
FROM public.brands b
WHERE b.slug = 'atache'
ON CONFLICT (brand_id, slug) DO NOTHING;

INSERT INTO public.ranges (id, brand_id, name, slug)
SELECT 
    gen_random_uuid(),
    b.id,
    'Soft Derm',
    'soft-derm'
FROM public.brands b
WHERE b.slug = 'atache'
ON CONFLICT (brand_id, slug) DO NOTHING;

INSERT INTO public.ranges (id, brand_id, name, slug)
SELECT 
    gen_random_uuid(),
    b.id,
    'Retinol',
    'retinol'
FROM public.brands b
WHERE b.slug = 'atache'
ON CONFLICT (brand_id, slug) DO NOTHING;

INSERT INTO public.ranges (id, brand_id, name, slug)
SELECT 
    gen_random_uuid(),
    b.id,
    'Cleanance',
    'cleanance'
FROM public.brands b
WHERE b.slug = 'avene'
ON CONFLICT (brand_id, slug) DO NOTHING;

INSERT INTO public.ranges (id, brand_id, name, slug)
SELECT 
    gen_random_uuid(),
    b.id,
    'Hydrance',
    'hydrance'
FROM public.brands b
WHERE b.slug = 'avene'
ON CONFLICT (brand_id, slug) DO NOTHING;

INSERT INTO public.ranges (id, brand_id, name, slug)
SELECT 
    gen_random_uuid(),
    b.id,
    'Cicalfate',
    'cicalfate'
FROM public.brands b
WHERE b.slug = 'avene'
ON CONFLICT (brand_id, slug) DO NOTHING;

INSERT INTO public.ranges (id, brand_id, name, slug)
SELECT 
    gen_random_uuid(),
    b.id,
    'Antirougeurs',
    'antirougeurs'
FROM public.brands b
WHERE b.slug = 'avene'
ON CONFLICT (brand_id, slug) DO NOTHING;

INSERT INTO public.ranges (id, brand_id, name, slug)
SELECT 
    gen_random_uuid(),
    b.id,
    'Pediatric',
    'pediatric'
FROM public.brands b
WHERE b.slug = 'babe'
ON CONFLICT (brand_id, slug) DO NOTHING;

INSERT INTO public.ranges (id, brand_id, name, slug)
SELECT 
    gen_random_uuid(),
    b.id,
    'Essentials',
    'essentials'
FROM public.brands b
WHERE b.slug = 'babe'
ON CONFLICT (brand_id, slug) DO NOTHING;

INSERT INTO public.ranges (id, brand_id, name, slug)
SELECT 
    gen_random_uuid(),
    b.id,
    'Stop AKN',
    'stop-akn'
FROM public.brands b
WHERE b.slug = 'babe'
ON CONFLICT (brand_id, slug) DO NOTHING;

INSERT INTO public.ranges (id, brand_id, name, slug)
SELECT 
    gen_random_uuid(),
    b.id,
    'Genomask',
    'genomask'
FROM public.brands b
WHERE b.slug = 'demo-genove'
ON CONFLICT (brand_id, slug) DO NOTHING;

INSERT INTO public.ranges (id, brand_id, name, slug)
SELECT 
    gen_random_uuid(),
    b.id,
    'Sesgen 32',
    'sesgen-32'
FROM public.brands b
WHERE b.slug = 'demo-genove'
ON CONFLICT (brand_id, slug) DO NOTHING;

INSERT INTO public.ranges (id, brand_id, name, slug)
SELECT 
    gen_random_uuid(),
    b.id,
    'Acnises',
    'acnises'
FROM public.brands b
WHERE b.slug = 'demo-genove'
ON CONFLICT (brand_id, slug) DO NOTHING;

INSERT INTO public.ranges (id, brand_id, name, slug)
SELECT 
    gen_random_uuid(),
    b.id,
    'Keracnyl',
    'keracnyl'
FROM public.brands b
WHERE b.slug = 'ducray'
ON CONFLICT (brand_id, slug) DO NOTHING;

INSERT INTO public.ranges (id, brand_id, name, slug)
SELECT 
    gen_random_uuid(),
    b.id,
    'Ictyane',
    'ictyane'
FROM public.brands b
WHERE b.slug = 'ducray'
ON CONFLICT (brand_id, slug) DO NOTHING;

INSERT INTO public.ranges (id, brand_id, name, slug)
SELECT 
    gen_random_uuid(),
    b.id,
    'Melascreen',
    'melascreen'
FROM public.brands b
WHERE b.slug = 'ducray'
ON CONFLICT (brand_id, slug) DO NOTHING;

INSERT INTO public.ranges (id, brand_id, name, slug)
SELECT 
    gen_random_uuid(),
    b.id,
    'UV Clear',
    'uv-clear'
FROM public.brands b
WHERE b.slug = 'elta-md'
ON CONFLICT (brand_id, slug) DO NOTHING;

INSERT INTO public.ranges (id, brand_id, name, slug)
SELECT 
    gen_random_uuid(),
    b.id,
    'UV Daily',
    'uv-daily'
FROM public.brands b
WHERE b.slug = 'elta-md'
ON CONFLICT (brand_id, slug) DO NOTHING;

INSERT INTO public.ranges (id, brand_id, name, slug)
SELECT 
    gen_random_uuid(),
    b.id,
    'Foaming Facial',
    'foaming-facial'
FROM public.brands b
WHERE b.slug = 'elta-md'
ON CONFLICT (brand_id, slug) DO NOTHING;

INSERT INTO public.ranges (id, brand_id, name, slug)
SELECT 
    gen_random_uuid(),
    b.id,
    'Time-Filler',
    'time-filler'
FROM public.brands b
WHERE b.slug = 'filorga'
ON CONFLICT (brand_id, slug) DO NOTHING;

INSERT INTO public.ranges (id, brand_id, name, slug)
SELECT 
    gen_random_uuid(),
    b.id,
    'NCEF',
    'ncef'
FROM public.brands b
WHERE b.slug = 'filorga'
ON CONFLICT (brand_id, slug) DO NOTHING;

INSERT INTO public.ranges (id, brand_id, name, slug)
SELECT 
    gen_random_uuid(),
    b.id,
    'Oxygen-Glow',
    'oxygen-glow'
FROM public.brands b
WHERE b.slug = 'filorga'
ON CONFLICT (brand_id, slug) DO NOTHING;

INSERT INTO public.ranges (id, brand_id, name, slug)
SELECT 
    gen_random_uuid(),
    b.id,
    'Fotoprotetor',
    'fotoprotetor'
FROM public.brands b
WHERE b.slug = 'isdin'
ON CONFLICT (brand_id, slug) DO NOTHING;

INSERT INTO public.ranges (id, brand_id, name, slug)
SELECT 
    gen_random_uuid(),
    b.id,
    'Acniben',
    'acniben'
FROM public.brands b
WHERE b.slug = 'isdin'
ON CONFLICT (brand_id, slug) DO NOTHING;

INSERT INTO public.ranges (id, brand_id, name, slug)
SELECT 
    gen_random_uuid(),
    b.id,
    'Isdinceutics',
    'isdinceutics'
FROM public.brands b
WHERE b.slug = 'isdin'
ON CONFLICT (brand_id, slug) DO NOTHING;

INSERT INTO public.ranges (id, brand_id, name, slug)
SELECT 
    gen_random_uuid(),
    b.id,
    'Neotone',
    'neotone'
FROM public.brands b
WHERE b.slug = 'isispharma'
ON CONFLICT (brand_id, slug) DO NOTHING;

INSERT INTO public.ranges (id, brand_id, name, slug)
SELECT 
    gen_random_uuid(),
    b.id,
    'Glyco-A',
    'glyco-a'
FROM public.brands b
WHERE b.slug = 'isispharma'
ON CONFLICT (brand_id, slug) DO NOTHING;

INSERT INTO public.ranges (id, brand_id, name, slug)
SELECT 
    gen_random_uuid(),
    b.id,
    'Ruboril',
    'ruboril'
FROM public.brands b
WHERE b.slug = 'isispharma'
ON CONFLICT (brand_id, slug) DO NOTHING;

INSERT INTO public.ranges (id, brand_id, name, slug)
SELECT 
    gen_random_uuid(),
    b.id,
    'Alginate Masks',
    'alginate-masks'
FROM public.brands b
WHERE b.slug = 'levissime'
ON CONFLICT (brand_id, slug) DO NOTHING;

INSERT INTO public.ranges (id, brand_id, name, slug)
SELECT 
    gen_random_uuid(),
    b.id,
    'Professional',
    'professional'
FROM public.brands b
WHERE b.slug = 'levissime'
ON CONFLICT (brand_id, slug) DO NOTHING;

INSERT INTO public.ranges (id, brand_id, name, slug)
SELECT 
    gen_random_uuid(),
    b.id,
    'Home Care',
    'home-care'
FROM public.brands b
WHERE b.slug = 'levissime'
ON CONFLICT (brand_id, slug) DO NOTHING;

INSERT INTO public.ranges (id, brand_id, name, slug)
SELECT 
    gen_random_uuid(),
    b.id,
    'Hyséac',
    'hyséac'
FROM public.brands b
WHERE b.slug = 'uriage'
ON CONFLICT (brand_id, slug) DO NOTHING;

INSERT INTO public.ranges (id, brand_id, name, slug)
SELECT 
    gen_random_uuid(),
    b.id,
    'Bariéderm',
    'bariéderm'
FROM public.brands b
WHERE b.slug = 'uriage'
ON CONFLICT (brand_id, slug) DO NOTHING;

INSERT INTO public.ranges (id, brand_id, name, slug)
SELECT 
    gen_random_uuid(),
    b.id,
    'Age Protect',
    'age-protect'
FROM public.brands b
WHERE b.slug = 'uriage'
ON CONFLICT (brand_id, slug) DO NOTHING;


-- ----------------------------------------------------------------------
-- 3. Insertion des tags
-- ----------------------------------------------------------------------

INSERT INTO public.tags (id, name, slug, tag_type)
VALUES (gen_random_uuid(), 'Exfoliant', 'exfoliant', 'category')
ON CONFLICT (tag_type, slug) DO NOTHING;

INSERT INTO public.tags (id, name, slug, tag_type)
VALUES (gen_random_uuid(), 'Hydratant', 'hydratant', 'category')
ON CONFLICT (tag_type, slug) DO NOTHING;

INSERT INTO public.tags (id, name, slug, tag_type)
VALUES (gen_random_uuid(), 'Masque', 'masque', 'category')
ON CONFLICT (tag_type, slug) DO NOTHING;

INSERT INTO public.tags (id, name, slug, tag_type)
VALUES (gen_random_uuid(), 'Nettoyant', 'nettoyant', 'category')
ON CONFLICT (tag_type, slug) DO NOTHING;

INSERT INTO public.tags (id, name, slug, tag_type)
VALUES (gen_random_uuid(), 'Protection Solaire', 'protection-solaire', 'category')
ON CONFLICT (tag_type, slug) DO NOTHING;

INSERT INTO public.tags (id, name, slug, tag_type)
VALUES (gen_random_uuid(), 'Serum', 'serum', 'category')
ON CONFLICT (tag_type, slug) DO NOTHING;

INSERT INTO public.tags (id, name, slug, tag_type)
VALUES (gen_random_uuid(), 'Acne', 'acne', 'need')
ON CONFLICT (tag_type, slug) DO NOTHING;

INSERT INTO public.tags (id, name, slug, tag_type)
VALUES (gen_random_uuid(), 'Anti Age', 'anti-age', 'need')
ON CONFLICT (tag_type, slug) DO NOTHING;

INSERT INTO public.tags (id, name, slug, tag_type)
VALUES (gen_random_uuid(), 'Eclat', 'eclat', 'need')
ON CONFLICT (tag_type, slug) DO NOTHING;

INSERT INTO public.tags (id, name, slug, tag_type)
VALUES (gen_random_uuid(), 'Hydratation', 'hydratation', 'need')
ON CONFLICT (tag_type, slug) DO NOTHING;

INSERT INTO public.tags (id, name, slug, tag_type)
VALUES (gen_random_uuid(), 'Protection', 'protection', 'need')
ON CONFLICT (tag_type, slug) DO NOTHING;

INSERT INTO public.tags (id, name, slug, tag_type)
VALUES (gen_random_uuid(), 'Sensibilite', 'sensibilite', 'need')
ON CONFLICT (tag_type, slug) DO NOTHING;

INSERT INTO public.tags (id, name, slug, tag_type)
VALUES (gen_random_uuid(), 'Taches', 'taches', 'need')
ON CONFLICT (tag_type, slug) DO NOTHING;

INSERT INTO public.tags (id, name, slug, tag_type)
VALUES (gen_random_uuid(), 'Peau Grasse', 'peau-grasse', 'skin_type')
ON CONFLICT (tag_type, slug) DO NOTHING;

INSERT INTO public.tags (id, name, slug, tag_type)
VALUES (gen_random_uuid(), 'Peau Mixte', 'peau-mixte', 'skin_type')
ON CONFLICT (tag_type, slug) DO NOTHING;

INSERT INTO public.tags (id, name, slug, tag_type)
VALUES (gen_random_uuid(), 'Peau Seche', 'peau-seche', 'skin_type')
ON CONFLICT (tag_type, slug) DO NOTHING;

INSERT INTO public.tags (id, name, slug, tag_type)
VALUES (gen_random_uuid(), 'Peau Sensible', 'peau-sensible', 'skin_type')
ON CONFLICT (tag_type, slug) DO NOTHING;

INSERT INTO public.tags (id, name, slug, tag_type)
VALUES (gen_random_uuid(), 'Tous Types', 'tous-types', 'skin_type')
ON CONFLICT (tag_type, slug) DO NOTHING;


-- ----------------------------------------------------------------------
-- 4. Insertion des produits
-- ----------------------------------------------------------------------

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Gel Nettoyant Purifiant ACM',
    'acm-gel-nettoyant-purifiant-1',
    'Gel Nettoyant Purifiant de la marque ACM, gamme Sébionex. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    1850,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Crème Solaire Teintée SPF 30 ACM',
    'acm-crème-solaire-teintée-spf-30-2',
    'Crème Solaire Teintée SPF 30 de la marque ACM, gamme Dépiwhite. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2650,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Fluide Solaire SPF 50+ ACM',
    'acm-fluide-solaire-spf-50-3',
    'Fluide Solaire SPF 50+ de la marque ACM, gamme Novophane. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2850,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Gel Hydratant Matifiant ACM',
    'acm-gel-hydratant-matifiant-4',
    'Gel Hydratant Matifiant de la marque ACM, gamme Sébionex. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2150,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Eau Micellaire ACM',
    'acm-eau-micellaire-5',
    'Eau Micellaire de la marque ACM, gamme Dépiwhite. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    1450,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Sérum Anti-Âge ACM',
    'acm-sérum-anti-âge-6',
    'Sérum Anti-Âge de la marque ACM, gamme Novophane. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    3850,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Gommage Doux Visage ACM',
    'acm-gommage-doux-visage-7',
    'Gommage Doux Visage de la marque ACM, gamme Sébionex. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    1750,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Crème Riche Nourrissante ACM',
    'acm-crème-riche-nourrissante-8',
    'Crème Riche Nourrissante de la marque ACM, gamme Dépiwhite. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2650,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Crème Hydratante Légère A-Derma',
    'adrema-crème-hydratante-légère-1',
    'Crème Hydratante Légère de la marque A-Derma, gamme Exomega. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2250,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Crème Riche Nourrissante A-Derma',
    'adrema-crème-riche-nourrissante-2',
    'Crème Riche Nourrissante de la marque A-Derma, gamme Epitheliale. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2650,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Gel Hydratant Matifiant A-Derma',
    'adrema-gel-hydratant-matifiant-3',
    'Gel Hydratant Matifiant de la marque A-Derma, gamme Dermalibour. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2150,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Masque Purifiant Argile A-Derma',
    'adrema-masque-purifiant-argile-4',
    'Masque Purifiant Argile de la marque A-Derma, gamme Exomega. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    1950,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Gel Nettoyant Purifiant A-Derma',
    'adrema-gel-nettoyant-purifiant-5',
    'Gel Nettoyant Purifiant de la marque A-Derma, gamme Epitheliale. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    1850,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Gommage Doux Visage A-Derma',
    'adrema-gommage-doux-visage-6',
    'Gommage Doux Visage de la marque A-Derma, gamme Dermalibour. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    1750,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Peeling Enzymatique A-Derma',
    'adrema-peeling-enzymatique-7',
    'Peeling Enzymatique de la marque A-Derma, gamme Exomega. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2350,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Crème Solaire Teintée SPF 30 A-Derma',
    'adrema-crème-solaire-teintée-spf-30-8',
    'Crème Solaire Teintée SPF 30 de la marque A-Derma, gamme Epitheliale. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2650,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Peeling Enzymatique Ataché',
    'atache-peeling-enzymatique-1',
    'Peeling Enzymatique de la marque Ataché, gamme C Vital. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2350,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Crème Solaire Teintée SPF 30 Ataché',
    'atache-crème-solaire-teintée-spf-30-2',
    'Crème Solaire Teintée SPF 30 de la marque Ataché, gamme Soft Derm. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2650,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Gel Nettoyant Purifiant Ataché',
    'atache-gel-nettoyant-purifiant-3',
    'Gel Nettoyant Purifiant de la marque Ataché, gamme Retinol. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    1850,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Masque Hydratant Intense Ataché',
    'atache-masque-hydratant-intense-4',
    'Masque Hydratant Intense de la marque Ataché, gamme C Vital. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2150,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Sérum Acide Hyaluronique Ataché',
    'atache-sérum-acide-hyaluronique-5',
    'Sérum Acide Hyaluronique de la marque Ataché, gamme Soft Derm. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    3550,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Crème Hydratante Légère Ataché',
    'atache-crème-hydratante-légère-6',
    'Crème Hydratante Légère de la marque Ataché, gamme Retinol. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2250,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Gel Hydratant Matifiant Ataché',
    'atache-gel-hydratant-matifiant-7',
    'Gel Hydratant Matifiant de la marque Ataché, gamme C Vital. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2150,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Eau Micellaire Ataché',
    'atache-eau-micellaire-8',
    'Eau Micellaire de la marque Ataché, gamme Soft Derm. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    1450,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Sérum Acide Hyaluronique Avène',
    'avene-sérum-acide-hyaluronique-1',
    'Sérum Acide Hyaluronique de la marque Avène, gamme Cleanance. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    3550,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Crème Solaire Teintée SPF 30 Avène',
    'avene-crème-solaire-teintée-spf-30-2',
    'Crème Solaire Teintée SPF 30 de la marque Avène, gamme Hydrance. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2650,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Crème Hydratante Légère Avène',
    'avene-crème-hydratante-légère-3',
    'Crème Hydratante Légère de la marque Avène, gamme Cicalfate. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2250,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Masque Hydratant Intense Avène',
    'avene-masque-hydratant-intense-4',
    'Masque Hydratant Intense de la marque Avène, gamme Antirougeurs. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2150,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Gel Hydratant Matifiant Avène',
    'avene-gel-hydratant-matifiant-5',
    'Gel Hydratant Matifiant de la marque Avène, gamme Cleanance. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2150,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Sérum Anti-Âge Avène',
    'avene-sérum-anti-âge-6',
    'Sérum Anti-Âge de la marque Avène, gamme Hydrance. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    3850,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Gommage Doux Visage Avène',
    'avene-gommage-doux-visage-7',
    'Gommage Doux Visage de la marque Avène, gamme Cicalfate. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    1750,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Mousse Nettoyante Douce Avène',
    'avene-mousse-nettoyante-douce-8',
    'Mousse Nettoyante Douce de la marque Avène, gamme Antirougeurs. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    1650,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Sérum Vitamine C Babé',
    'babe-sérum-vitamine-c-1',
    'Sérum Vitamine C de la marque Babé, gamme Pediatric. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    3250,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Crème Riche Nourrissante Babé',
    'babe-crème-riche-nourrissante-2',
    'Crème Riche Nourrissante de la marque Babé, gamme Essentials. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2650,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Crème Solaire Teintée SPF 30 Babé',
    'babe-crème-solaire-teintée-spf-30-3',
    'Crème Solaire Teintée SPF 30 de la marque Babé, gamme Stop AKN. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2650,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Sérum Anti-Âge Babé',
    'babe-sérum-anti-âge-4',
    'Sérum Anti-Âge de la marque Babé, gamme Pediatric. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    3850,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Mousse Nettoyante Douce Babé',
    'babe-mousse-nettoyante-douce-5',
    'Mousse Nettoyante Douce de la marque Babé, gamme Essentials. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    1650,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Sérum Acide Hyaluronique Babé',
    'babe-sérum-acide-hyaluronique-6',
    'Sérum Acide Hyaluronique de la marque Babé, gamme Stop AKN. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    3550,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Gommage Doux Visage Babé',
    'babe-gommage-doux-visage-7',
    'Gommage Doux Visage de la marque Babé, gamme Pediatric. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    1750,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Fluide Solaire SPF 50+ Babé',
    'babe-fluide-solaire-spf-50-8',
    'Fluide Solaire SPF 50+ de la marque Babé, gamme Essentials. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2850,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Sérum Acide Hyaluronique Dermo Genové',
    'demo-genove-sérum-acide-hyaluronique-1',
    'Sérum Acide Hyaluronique de la marque Dermo Genové, gamme Genomask. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    3550,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Eau Micellaire Dermo Genové',
    'demo-genove-eau-micellaire-2',
    'Eau Micellaire de la marque Dermo Genové, gamme Sesgen 32. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    1450,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Peeling Enzymatique Dermo Genové',
    'demo-genove-peeling-enzymatique-3',
    'Peeling Enzymatique de la marque Dermo Genové, gamme Acnises. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2350,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Mousse Nettoyante Douce Dermo Genové',
    'demo-genove-mousse-nettoyante-douce-4',
    'Mousse Nettoyante Douce de la marque Dermo Genové, gamme Genomask. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    1650,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Crème Hydratante Légère Dermo Genové',
    'demo-genove-crème-hydratante-légère-5',
    'Crème Hydratante Légère de la marque Dermo Genové, gamme Sesgen 32. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2250,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Crème Solaire Teintée SPF 30 Dermo Genové',
    'demo-genove-crème-solaire-teintée-spf-30-6',
    'Crème Solaire Teintée SPF 30 de la marque Dermo Genové, gamme Acnises. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2650,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Masque Hydratant Intense Dermo Genové',
    'demo-genove-masque-hydratant-intense-7',
    'Masque Hydratant Intense de la marque Dermo Genové, gamme Genomask. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2150,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Crème Riche Nourrissante Dermo Genové',
    'demo-genove-crème-riche-nourrissante-8',
    'Crème Riche Nourrissante de la marque Dermo Genové, gamme Sesgen 32. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2650,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Masque Hydratant Intense Ducray',
    'ducray-masque-hydratant-intense-1',
    'Masque Hydratant Intense de la marque Ducray, gamme Keracnyl. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2150,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Gommage Doux Visage Ducray',
    'ducray-gommage-doux-visage-2',
    'Gommage Doux Visage de la marque Ducray, gamme Ictyane. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    1750,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Fluide Solaire SPF 50+ Ducray',
    'ducray-fluide-solaire-spf-50-3',
    'Fluide Solaire SPF 50+ de la marque Ducray, gamme Melascreen. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2850,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Masque Purifiant Argile Ducray',
    'ducray-masque-purifiant-argile-4',
    'Masque Purifiant Argile de la marque Ducray, gamme Keracnyl. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    1950,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Eau Micellaire Ducray',
    'ducray-eau-micellaire-5',
    'Eau Micellaire de la marque Ducray, gamme Ictyane. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    1450,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Crème Solaire Teintée SPF 30 Ducray',
    'ducray-crème-solaire-teintée-spf-30-6',
    'Crème Solaire Teintée SPF 30 de la marque Ducray, gamme Melascreen. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2650,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Sérum Vitamine C Ducray',
    'ducray-sérum-vitamine-c-7',
    'Sérum Vitamine C de la marque Ducray, gamme Keracnyl. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    3250,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Crème Riche Nourrissante Ducray',
    'ducray-crème-riche-nourrissante-8',
    'Crème Riche Nourrissante de la marque Ducray, gamme Ictyane. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2650,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Fluide Solaire SPF 50+ EltaMD',
    'elta-md-fluide-solaire-spf-50-1',
    'Fluide Solaire SPF 50+ de la marque EltaMD, gamme UV Clear. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2850,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Sérum Anti-Âge EltaMD',
    'elta-md-sérum-anti-âge-2',
    'Sérum Anti-Âge de la marque EltaMD, gamme UV Daily. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    3850,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Gommage Doux Visage EltaMD',
    'elta-md-gommage-doux-visage-3',
    'Gommage Doux Visage de la marque EltaMD, gamme Foaming Facial. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    1750,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Mousse Nettoyante Douce EltaMD',
    'elta-md-mousse-nettoyante-douce-4',
    'Mousse Nettoyante Douce de la marque EltaMD, gamme UV Clear. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    1650,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Crème Solaire Teintée SPF 30 EltaMD',
    'elta-md-crème-solaire-teintée-spf-30-5',
    'Crème Solaire Teintée SPF 30 de la marque EltaMD, gamme UV Daily. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2650,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Crème Riche Nourrissante EltaMD',
    'elta-md-crème-riche-nourrissante-6',
    'Crème Riche Nourrissante de la marque EltaMD, gamme Foaming Facial. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2650,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Eau Micellaire EltaMD',
    'elta-md-eau-micellaire-7',
    'Eau Micellaire de la marque EltaMD, gamme UV Clear. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    1450,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Masque Hydratant Intense EltaMD',
    'elta-md-masque-hydratant-intense-8',
    'Masque Hydratant Intense de la marque EltaMD, gamme UV Daily. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2150,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Sérum Anti-Âge Filorga',
    'filorga-sérum-anti-âge-1',
    'Sérum Anti-Âge de la marque Filorga, gamme Time-Filler. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    3850,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Sérum Vitamine C Filorga',
    'filorga-sérum-vitamine-c-2',
    'Sérum Vitamine C de la marque Filorga, gamme NCEF. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    3250,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Gel Hydratant Matifiant Filorga',
    'filorga-gel-hydratant-matifiant-3',
    'Gel Hydratant Matifiant de la marque Filorga, gamme Oxygen-Glow. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2150,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Crème Hydratante Légère Filorga',
    'filorga-crème-hydratante-légère-4',
    'Crème Hydratante Légère de la marque Filorga, gamme Time-Filler. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2250,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Mousse Nettoyante Douce Filorga',
    'filorga-mousse-nettoyante-douce-5',
    'Mousse Nettoyante Douce de la marque Filorga, gamme NCEF. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    1650,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Peeling Enzymatique Filorga',
    'filorga-peeling-enzymatique-6',
    'Peeling Enzymatique de la marque Filorga, gamme Oxygen-Glow. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2350,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Sérum Acide Hyaluronique Filorga',
    'filorga-sérum-acide-hyaluronique-7',
    'Sérum Acide Hyaluronique de la marque Filorga, gamme Time-Filler. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    3550,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Eau Micellaire Filorga',
    'filorga-eau-micellaire-8',
    'Eau Micellaire de la marque Filorga, gamme NCEF. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    1450,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Sérum Acide Hyaluronique ISDIN',
    'isdin-sérum-acide-hyaluronique-1',
    'Sérum Acide Hyaluronique de la marque ISDIN, gamme Fotoprotetor. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    3550,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Crème Hydratante Légère ISDIN',
    'isdin-crème-hydratante-légère-2',
    'Crème Hydratante Légère de la marque ISDIN, gamme Acniben. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2250,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Crème Riche Nourrissante ISDIN',
    'isdin-crème-riche-nourrissante-3',
    'Crème Riche Nourrissante de la marque ISDIN, gamme Isdinceutics. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2650,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Gel Hydratant Matifiant ISDIN',
    'isdin-gel-hydratant-matifiant-4',
    'Gel Hydratant Matifiant de la marque ISDIN, gamme Fotoprotetor. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2150,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Peeling Enzymatique ISDIN',
    'isdin-peeling-enzymatique-5',
    'Peeling Enzymatique de la marque ISDIN, gamme Acniben. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2350,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Eau Micellaire ISDIN',
    'isdin-eau-micellaire-6',
    'Eau Micellaire de la marque ISDIN, gamme Isdinceutics. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    1450,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Masque Hydratant Intense ISDIN',
    'isdin-masque-hydratant-intense-7',
    'Masque Hydratant Intense de la marque ISDIN, gamme Fotoprotetor. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2150,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Mousse Nettoyante Douce ISDIN',
    'isdin-mousse-nettoyante-douce-8',
    'Mousse Nettoyante Douce de la marque ISDIN, gamme Acniben. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    1650,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Mousse Nettoyante Douce ISIS Pharma',
    'isispharma-mousse-nettoyante-douce-1',
    'Mousse Nettoyante Douce de la marque ISIS Pharma, gamme Neotone. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    1650,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Fluide Solaire SPF 50+ ISIS Pharma',
    'isispharma-fluide-solaire-spf-50-2',
    'Fluide Solaire SPF 50+ de la marque ISIS Pharma, gamme Glyco-A. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2850,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Masque Purifiant Argile ISIS Pharma',
    'isispharma-masque-purifiant-argile-3',
    'Masque Purifiant Argile de la marque ISIS Pharma, gamme Ruboril. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    1950,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Eau Micellaire ISIS Pharma',
    'isispharma-eau-micellaire-4',
    'Eau Micellaire de la marque ISIS Pharma, gamme Neotone. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    1450,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Crème Hydratante Légère ISIS Pharma',
    'isispharma-crème-hydratante-légère-5',
    'Crème Hydratante Légère de la marque ISIS Pharma, gamme Glyco-A. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2250,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Sérum Vitamine C ISIS Pharma',
    'isispharma-sérum-vitamine-c-6',
    'Sérum Vitamine C de la marque ISIS Pharma, gamme Ruboril. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    3250,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Sérum Acide Hyaluronique ISIS Pharma',
    'isispharma-sérum-acide-hyaluronique-7',
    'Sérum Acide Hyaluronique de la marque ISIS Pharma, gamme Neotone. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    3550,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Sérum Anti-Âge ISIS Pharma',
    'isispharma-sérum-anti-âge-8',
    'Sérum Anti-Âge de la marque ISIS Pharma, gamme Glyco-A. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    3850,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Masque Hydratant Intense Levissime',
    'levissime-masque-hydratant-intense-1',
    'Masque Hydratant Intense de la marque Levissime, gamme Alginate Masks. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2150,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Sérum Vitamine C Levissime',
    'levissime-sérum-vitamine-c-2',
    'Sérum Vitamine C de la marque Levissime, gamme Professional. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    3250,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Fluide Solaire SPF 50+ Levissime',
    'levissime-fluide-solaire-spf-50-3',
    'Fluide Solaire SPF 50+ de la marque Levissime, gamme Home Care. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2850,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Eau Micellaire Levissime',
    'levissime-eau-micellaire-4',
    'Eau Micellaire de la marque Levissime, gamme Alginate Masks. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    1450,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Masque Purifiant Argile Levissime',
    'levissime-masque-purifiant-argile-5',
    'Masque Purifiant Argile de la marque Levissime, gamme Professional. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    1950,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Peeling Enzymatique Levissime',
    'levissime-peeling-enzymatique-6',
    'Peeling Enzymatique de la marque Levissime, gamme Home Care. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2350,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Crème Solaire Teintée SPF 30 Levissime',
    'levissime-crème-solaire-teintée-spf-30-7',
    'Crème Solaire Teintée SPF 30 de la marque Levissime, gamme Alginate Masks. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2650,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Crème Hydratante Légère Levissime',
    'levissime-crème-hydratante-légère-8',
    'Crème Hydratante Légère de la marque Levissime, gamme Professional. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2250,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Gel Nettoyant Purifiant Uriage',
    'uriage-gel-nettoyant-purifiant-1',
    'Gel Nettoyant Purifiant de la marque Uriage, gamme Hyséac. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    1850,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Sérum Vitamine C Uriage',
    'uriage-sérum-vitamine-c-2',
    'Sérum Vitamine C de la marque Uriage, gamme Bariéderm. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    3250,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Crème Solaire Teintée SPF 30 Uriage',
    'uriage-crème-solaire-teintée-spf-30-3',
    'Crème Solaire Teintée SPF 30 de la marque Uriage, gamme Age Protect. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2650,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Masque Hydratant Intense Uriage',
    'uriage-masque-hydratant-intense-4',
    'Masque Hydratant Intense de la marque Uriage, gamme Hyséac. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2150,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Fluide Solaire SPF 50+ Uriage',
    'uriage-fluide-solaire-spf-50-5',
    'Fluide Solaire SPF 50+ de la marque Uriage, gamme Bariéderm. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    2850,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Eau Micellaire Uriage',
    'uriage-eau-micellaire-6',
    'Eau Micellaire de la marque Uriage, gamme Age Protect. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    1450,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Sérum Anti-Âge Uriage',
    'uriage-sérum-anti-âge-7',
    'Sérum Anti-Âge de la marque Uriage, gamme Hyséac. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    3850,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, name, slug, description, price, currency, stock)
VALUES (
    gen_random_uuid(),
    'Gommage Doux Visage Uriage',
    'uriage-gommage-doux-visage-8',
    'Gommage Doux Visage de la marque Uriage, gamme Bariéderm. Formule douce et efficace adaptée aux besoins spécifiques de votre peau.',
    1750,
    'DOP',
    0
)
ON CONFLICT (slug) DO NOTHING;


-- ----------------------------------------------------------------------
-- 5. Insertion des images produits
-- ----------------------------------------------------------------------

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/acm-gel-nettoyant-purifiant-1/400',
    'Gel Nettoyant Purifiant ACM - Image 1'
FROM public.products p
WHERE p.slug = 'acm-gel-nettoyant-purifiant-1'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/acm-gel-nettoyant-purifiant-1/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/acm-crème-solaire-teintée-spf-30-2/400',
    'Crème Solaire Teintée SPF 30 ACM - Image 1'
FROM public.products p
WHERE p.slug = 'acm-crème-solaire-teintée-spf-30-2'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/acm-crème-solaire-teintée-spf-30-2/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/acm-fluide-solaire-spf-50-3/400',
    'Fluide Solaire SPF 50+ ACM - Image 1'
FROM public.products p
WHERE p.slug = 'acm-fluide-solaire-spf-50-3'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/acm-fluide-solaire-spf-50-3/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/acm-gel-hydratant-matifiant-4/400',
    'Gel Hydratant Matifiant ACM - Image 1'
FROM public.products p
WHERE p.slug = 'acm-gel-hydratant-matifiant-4'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/acm-gel-hydratant-matifiant-4/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/acm-eau-micellaire-5/400',
    'Eau Micellaire ACM - Image 1'
FROM public.products p
WHERE p.slug = 'acm-eau-micellaire-5'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/acm-eau-micellaire-5/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/acm-sérum-anti-âge-6/400',
    'Sérum Anti-Âge ACM - Image 1'
FROM public.products p
WHERE p.slug = 'acm-sérum-anti-âge-6'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/acm-sérum-anti-âge-6/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/acm-gommage-doux-visage-7/400',
    'Gommage Doux Visage ACM - Image 1'
FROM public.products p
WHERE p.slug = 'acm-gommage-doux-visage-7'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/acm-gommage-doux-visage-7/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/acm-crème-riche-nourrissante-8/400',
    'Crème Riche Nourrissante ACM - Image 1'
FROM public.products p
WHERE p.slug = 'acm-crème-riche-nourrissante-8'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/acm-crème-riche-nourrissante-8/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/adrema-crème-hydratante-légère-1/400',
    'Crème Hydratante Légère A-Derma - Image 1'
FROM public.products p
WHERE p.slug = 'adrema-crème-hydratante-légère-1'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/adrema-crème-hydratante-légère-1/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/adrema-crème-riche-nourrissante-2/400',
    'Crème Riche Nourrissante A-Derma - Image 1'
FROM public.products p
WHERE p.slug = 'adrema-crème-riche-nourrissante-2'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/adrema-crème-riche-nourrissante-2/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/adrema-gel-hydratant-matifiant-3/400',
    'Gel Hydratant Matifiant A-Derma - Image 1'
FROM public.products p
WHERE p.slug = 'adrema-gel-hydratant-matifiant-3'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/adrema-gel-hydratant-matifiant-3/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/adrema-masque-purifiant-argile-4/400',
    'Masque Purifiant Argile A-Derma - Image 1'
FROM public.products p
WHERE p.slug = 'adrema-masque-purifiant-argile-4'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/adrema-masque-purifiant-argile-4/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/adrema-gel-nettoyant-purifiant-5/400',
    'Gel Nettoyant Purifiant A-Derma - Image 1'
FROM public.products p
WHERE p.slug = 'adrema-gel-nettoyant-purifiant-5'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/adrema-gel-nettoyant-purifiant-5/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/adrema-gommage-doux-visage-6/400',
    'Gommage Doux Visage A-Derma - Image 1'
FROM public.products p
WHERE p.slug = 'adrema-gommage-doux-visage-6'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/adrema-gommage-doux-visage-6/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/adrema-peeling-enzymatique-7/400',
    'Peeling Enzymatique A-Derma - Image 1'
FROM public.products p
WHERE p.slug = 'adrema-peeling-enzymatique-7'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/adrema-peeling-enzymatique-7/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/adrema-crème-solaire-teintée-spf-30-8/400',
    'Crème Solaire Teintée SPF 30 A-Derma - Image 1'
FROM public.products p
WHERE p.slug = 'adrema-crème-solaire-teintée-spf-30-8'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/adrema-crème-solaire-teintée-spf-30-8/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/atache-peeling-enzymatique-1/400',
    'Peeling Enzymatique Ataché - Image 1'
FROM public.products p
WHERE p.slug = 'atache-peeling-enzymatique-1'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/atache-peeling-enzymatique-1/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/atache-crème-solaire-teintée-spf-30-2/400',
    'Crème Solaire Teintée SPF 30 Ataché - Image 1'
FROM public.products p
WHERE p.slug = 'atache-crème-solaire-teintée-spf-30-2'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/atache-crème-solaire-teintée-spf-30-2/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/atache-gel-nettoyant-purifiant-3/400',
    'Gel Nettoyant Purifiant Ataché - Image 1'
FROM public.products p
WHERE p.slug = 'atache-gel-nettoyant-purifiant-3'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/atache-gel-nettoyant-purifiant-3/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/atache-masque-hydratant-intense-4/400',
    'Masque Hydratant Intense Ataché - Image 1'
FROM public.products p
WHERE p.slug = 'atache-masque-hydratant-intense-4'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/atache-masque-hydratant-intense-4/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/atache-sérum-acide-hyaluronique-5/400',
    'Sérum Acide Hyaluronique Ataché - Image 1'
FROM public.products p
WHERE p.slug = 'atache-sérum-acide-hyaluronique-5'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/atache-sérum-acide-hyaluronique-5/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/atache-crème-hydratante-légère-6/400',
    'Crème Hydratante Légère Ataché - Image 1'
FROM public.products p
WHERE p.slug = 'atache-crème-hydratante-légère-6'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/atache-crème-hydratante-légère-6/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/atache-gel-hydratant-matifiant-7/400',
    'Gel Hydratant Matifiant Ataché - Image 1'
FROM public.products p
WHERE p.slug = 'atache-gel-hydratant-matifiant-7'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/atache-gel-hydratant-matifiant-7/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/atache-eau-micellaire-8/400',
    'Eau Micellaire Ataché - Image 1'
FROM public.products p
WHERE p.slug = 'atache-eau-micellaire-8'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/atache-eau-micellaire-8/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/avene-sérum-acide-hyaluronique-1/400',
    'Sérum Acide Hyaluronique Avène - Image 1'
FROM public.products p
WHERE p.slug = 'avene-sérum-acide-hyaluronique-1'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/avene-sérum-acide-hyaluronique-1/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/avene-crème-solaire-teintée-spf-30-2/400',
    'Crème Solaire Teintée SPF 30 Avène - Image 1'
FROM public.products p
WHERE p.slug = 'avene-crème-solaire-teintée-spf-30-2'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/avene-crème-solaire-teintée-spf-30-2/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/avene-crème-hydratante-légère-3/400',
    'Crème Hydratante Légère Avène - Image 1'
FROM public.products p
WHERE p.slug = 'avene-crème-hydratante-légère-3'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/avene-crème-hydratante-légère-3/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/avene-masque-hydratant-intense-4/400',
    'Masque Hydratant Intense Avène - Image 1'
FROM public.products p
WHERE p.slug = 'avene-masque-hydratant-intense-4'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/avene-masque-hydratant-intense-4/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/avene-gel-hydratant-matifiant-5/400',
    'Gel Hydratant Matifiant Avène - Image 1'
FROM public.products p
WHERE p.slug = 'avene-gel-hydratant-matifiant-5'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/avene-gel-hydratant-matifiant-5/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/avene-sérum-anti-âge-6/400',
    'Sérum Anti-Âge Avène - Image 1'
FROM public.products p
WHERE p.slug = 'avene-sérum-anti-âge-6'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/avene-sérum-anti-âge-6/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/avene-gommage-doux-visage-7/400',
    'Gommage Doux Visage Avène - Image 1'
FROM public.products p
WHERE p.slug = 'avene-gommage-doux-visage-7'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/avene-gommage-doux-visage-7/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/avene-mousse-nettoyante-douce-8/400',
    'Mousse Nettoyante Douce Avène - Image 1'
FROM public.products p
WHERE p.slug = 'avene-mousse-nettoyante-douce-8'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/avene-mousse-nettoyante-douce-8/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/babe-sérum-vitamine-c-1/400',
    'Sérum Vitamine C Babé - Image 1'
FROM public.products p
WHERE p.slug = 'babe-sérum-vitamine-c-1'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/babe-sérum-vitamine-c-1/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/babe-crème-riche-nourrissante-2/400',
    'Crème Riche Nourrissante Babé - Image 1'
FROM public.products p
WHERE p.slug = 'babe-crème-riche-nourrissante-2'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/babe-crème-riche-nourrissante-2/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/babe-crème-solaire-teintée-spf-30-3/400',
    'Crème Solaire Teintée SPF 30 Babé - Image 1'
FROM public.products p
WHERE p.slug = 'babe-crème-solaire-teintée-spf-30-3'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/babe-crème-solaire-teintée-spf-30-3/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/babe-sérum-anti-âge-4/400',
    'Sérum Anti-Âge Babé - Image 1'
FROM public.products p
WHERE p.slug = 'babe-sérum-anti-âge-4'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/babe-sérum-anti-âge-4/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/babe-mousse-nettoyante-douce-5/400',
    'Mousse Nettoyante Douce Babé - Image 1'
FROM public.products p
WHERE p.slug = 'babe-mousse-nettoyante-douce-5'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/babe-mousse-nettoyante-douce-5/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/babe-sérum-acide-hyaluronique-6/400',
    'Sérum Acide Hyaluronique Babé - Image 1'
FROM public.products p
WHERE p.slug = 'babe-sérum-acide-hyaluronique-6'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/babe-sérum-acide-hyaluronique-6/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/babe-gommage-doux-visage-7/400',
    'Gommage Doux Visage Babé - Image 1'
FROM public.products p
WHERE p.slug = 'babe-gommage-doux-visage-7'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/babe-gommage-doux-visage-7/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/babe-fluide-solaire-spf-50-8/400',
    'Fluide Solaire SPF 50+ Babé - Image 1'
FROM public.products p
WHERE p.slug = 'babe-fluide-solaire-spf-50-8'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/babe-fluide-solaire-spf-50-8/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/demo-genove-sérum-acide-hyaluronique-1/400',
    'Sérum Acide Hyaluronique Dermo Genové - Image 1'
FROM public.products p
WHERE p.slug = 'demo-genove-sérum-acide-hyaluronique-1'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/demo-genove-sérum-acide-hyaluronique-1/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/demo-genove-eau-micellaire-2/400',
    'Eau Micellaire Dermo Genové - Image 1'
FROM public.products p
WHERE p.slug = 'demo-genove-eau-micellaire-2'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/demo-genove-eau-micellaire-2/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/demo-genove-peeling-enzymatique-3/400',
    'Peeling Enzymatique Dermo Genové - Image 1'
FROM public.products p
WHERE p.slug = 'demo-genove-peeling-enzymatique-3'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/demo-genove-peeling-enzymatique-3/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/demo-genove-mousse-nettoyante-douce-4/400',
    'Mousse Nettoyante Douce Dermo Genové - Image 1'
FROM public.products p
WHERE p.slug = 'demo-genove-mousse-nettoyante-douce-4'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/demo-genove-mousse-nettoyante-douce-4/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/demo-genove-crème-hydratante-légère-5/400',
    'Crème Hydratante Légère Dermo Genové - Image 1'
FROM public.products p
WHERE p.slug = 'demo-genove-crème-hydratante-légère-5'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/demo-genove-crème-hydratante-légère-5/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/demo-genove-crème-solaire-teintée-spf-30-6/400',
    'Crème Solaire Teintée SPF 30 Dermo Genové - Image 1'
FROM public.products p
WHERE p.slug = 'demo-genove-crème-solaire-teintée-spf-30-6'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/demo-genove-crème-solaire-teintée-spf-30-6/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/demo-genove-masque-hydratant-intense-7/400',
    'Masque Hydratant Intense Dermo Genové - Image 1'
FROM public.products p
WHERE p.slug = 'demo-genove-masque-hydratant-intense-7'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/demo-genove-masque-hydratant-intense-7/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/demo-genove-crème-riche-nourrissante-8/400',
    'Crème Riche Nourrissante Dermo Genové - Image 1'
FROM public.products p
WHERE p.slug = 'demo-genove-crème-riche-nourrissante-8'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/demo-genove-crème-riche-nourrissante-8/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/ducray-masque-hydratant-intense-1/400',
    'Masque Hydratant Intense Ducray - Image 1'
FROM public.products p
WHERE p.slug = 'ducray-masque-hydratant-intense-1'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/ducray-masque-hydratant-intense-1/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/ducray-gommage-doux-visage-2/400',
    'Gommage Doux Visage Ducray - Image 1'
FROM public.products p
WHERE p.slug = 'ducray-gommage-doux-visage-2'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/ducray-gommage-doux-visage-2/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/ducray-fluide-solaire-spf-50-3/400',
    'Fluide Solaire SPF 50+ Ducray - Image 1'
FROM public.products p
WHERE p.slug = 'ducray-fluide-solaire-spf-50-3'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/ducray-fluide-solaire-spf-50-3/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/ducray-masque-purifiant-argile-4/400',
    'Masque Purifiant Argile Ducray - Image 1'
FROM public.products p
WHERE p.slug = 'ducray-masque-purifiant-argile-4'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/ducray-masque-purifiant-argile-4/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/ducray-eau-micellaire-5/400',
    'Eau Micellaire Ducray - Image 1'
FROM public.products p
WHERE p.slug = 'ducray-eau-micellaire-5'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/ducray-eau-micellaire-5/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/ducray-crème-solaire-teintée-spf-30-6/400',
    'Crème Solaire Teintée SPF 30 Ducray - Image 1'
FROM public.products p
WHERE p.slug = 'ducray-crème-solaire-teintée-spf-30-6'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/ducray-crème-solaire-teintée-spf-30-6/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/ducray-sérum-vitamine-c-7/400',
    'Sérum Vitamine C Ducray - Image 1'
FROM public.products p
WHERE p.slug = 'ducray-sérum-vitamine-c-7'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/ducray-sérum-vitamine-c-7/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/ducray-crème-riche-nourrissante-8/400',
    'Crème Riche Nourrissante Ducray - Image 1'
FROM public.products p
WHERE p.slug = 'ducray-crème-riche-nourrissante-8'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/ducray-crème-riche-nourrissante-8/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/elta-md-fluide-solaire-spf-50-1/400',
    'Fluide Solaire SPF 50+ EltaMD - Image 1'
FROM public.products p
WHERE p.slug = 'elta-md-fluide-solaire-spf-50-1'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/elta-md-fluide-solaire-spf-50-1/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/elta-md-sérum-anti-âge-2/400',
    'Sérum Anti-Âge EltaMD - Image 1'
FROM public.products p
WHERE p.slug = 'elta-md-sérum-anti-âge-2'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/elta-md-sérum-anti-âge-2/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/elta-md-gommage-doux-visage-3/400',
    'Gommage Doux Visage EltaMD - Image 1'
FROM public.products p
WHERE p.slug = 'elta-md-gommage-doux-visage-3'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/elta-md-gommage-doux-visage-3/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/elta-md-mousse-nettoyante-douce-4/400',
    'Mousse Nettoyante Douce EltaMD - Image 1'
FROM public.products p
WHERE p.slug = 'elta-md-mousse-nettoyante-douce-4'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/elta-md-mousse-nettoyante-douce-4/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/elta-md-crème-solaire-teintée-spf-30-5/400',
    'Crème Solaire Teintée SPF 30 EltaMD - Image 1'
FROM public.products p
WHERE p.slug = 'elta-md-crème-solaire-teintée-spf-30-5'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/elta-md-crème-solaire-teintée-spf-30-5/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/elta-md-crème-riche-nourrissante-6/400',
    'Crème Riche Nourrissante EltaMD - Image 1'
FROM public.products p
WHERE p.slug = 'elta-md-crème-riche-nourrissante-6'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/elta-md-crème-riche-nourrissante-6/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/elta-md-eau-micellaire-7/400',
    'Eau Micellaire EltaMD - Image 1'
FROM public.products p
WHERE p.slug = 'elta-md-eau-micellaire-7'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/elta-md-eau-micellaire-7/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/elta-md-masque-hydratant-intense-8/400',
    'Masque Hydratant Intense EltaMD - Image 1'
FROM public.products p
WHERE p.slug = 'elta-md-masque-hydratant-intense-8'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/elta-md-masque-hydratant-intense-8/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/filorga-sérum-anti-âge-1/400',
    'Sérum Anti-Âge Filorga - Image 1'
FROM public.products p
WHERE p.slug = 'filorga-sérum-anti-âge-1'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/filorga-sérum-anti-âge-1/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/filorga-sérum-vitamine-c-2/400',
    'Sérum Vitamine C Filorga - Image 1'
FROM public.products p
WHERE p.slug = 'filorga-sérum-vitamine-c-2'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/filorga-sérum-vitamine-c-2/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/filorga-gel-hydratant-matifiant-3/400',
    'Gel Hydratant Matifiant Filorga - Image 1'
FROM public.products p
WHERE p.slug = 'filorga-gel-hydratant-matifiant-3'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/filorga-gel-hydratant-matifiant-3/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/filorga-crème-hydratante-légère-4/400',
    'Crème Hydratante Légère Filorga - Image 1'
FROM public.products p
WHERE p.slug = 'filorga-crème-hydratante-légère-4'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/filorga-crème-hydratante-légère-4/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/filorga-mousse-nettoyante-douce-5/400',
    'Mousse Nettoyante Douce Filorga - Image 1'
FROM public.products p
WHERE p.slug = 'filorga-mousse-nettoyante-douce-5'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/filorga-mousse-nettoyante-douce-5/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/filorga-peeling-enzymatique-6/400',
    'Peeling Enzymatique Filorga - Image 1'
FROM public.products p
WHERE p.slug = 'filorga-peeling-enzymatique-6'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/filorga-peeling-enzymatique-6/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/filorga-sérum-acide-hyaluronique-7/400',
    'Sérum Acide Hyaluronique Filorga - Image 1'
FROM public.products p
WHERE p.slug = 'filorga-sérum-acide-hyaluronique-7'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/filorga-sérum-acide-hyaluronique-7/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/filorga-eau-micellaire-8/400',
    'Eau Micellaire Filorga - Image 1'
FROM public.products p
WHERE p.slug = 'filorga-eau-micellaire-8'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/filorga-eau-micellaire-8/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/isdin-sérum-acide-hyaluronique-1/400',
    'Sérum Acide Hyaluronique ISDIN - Image 1'
FROM public.products p
WHERE p.slug = 'isdin-sérum-acide-hyaluronique-1'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/isdin-sérum-acide-hyaluronique-1/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/isdin-crème-hydratante-légère-2/400',
    'Crème Hydratante Légère ISDIN - Image 1'
FROM public.products p
WHERE p.slug = 'isdin-crème-hydratante-légère-2'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/isdin-crème-hydratante-légère-2/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/isdin-crème-riche-nourrissante-3/400',
    'Crème Riche Nourrissante ISDIN - Image 1'
FROM public.products p
WHERE p.slug = 'isdin-crème-riche-nourrissante-3'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/isdin-crème-riche-nourrissante-3/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/isdin-gel-hydratant-matifiant-4/400',
    'Gel Hydratant Matifiant ISDIN - Image 1'
FROM public.products p
WHERE p.slug = 'isdin-gel-hydratant-matifiant-4'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/isdin-gel-hydratant-matifiant-4/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/isdin-peeling-enzymatique-5/400',
    'Peeling Enzymatique ISDIN - Image 1'
FROM public.products p
WHERE p.slug = 'isdin-peeling-enzymatique-5'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/isdin-peeling-enzymatique-5/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/isdin-eau-micellaire-6/400',
    'Eau Micellaire ISDIN - Image 1'
FROM public.products p
WHERE p.slug = 'isdin-eau-micellaire-6'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/isdin-eau-micellaire-6/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/isdin-masque-hydratant-intense-7/400',
    'Masque Hydratant Intense ISDIN - Image 1'
FROM public.products p
WHERE p.slug = 'isdin-masque-hydratant-intense-7'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/isdin-masque-hydratant-intense-7/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/isdin-mousse-nettoyante-douce-8/400',
    'Mousse Nettoyante Douce ISDIN - Image 1'
FROM public.products p
WHERE p.slug = 'isdin-mousse-nettoyante-douce-8'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/isdin-mousse-nettoyante-douce-8/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/isispharma-mousse-nettoyante-douce-1/400',
    'Mousse Nettoyante Douce ISIS Pharma - Image 1'
FROM public.products p
WHERE p.slug = 'isispharma-mousse-nettoyante-douce-1'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/isispharma-mousse-nettoyante-douce-1/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/isispharma-fluide-solaire-spf-50-2/400',
    'Fluide Solaire SPF 50+ ISIS Pharma - Image 1'
FROM public.products p
WHERE p.slug = 'isispharma-fluide-solaire-spf-50-2'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/isispharma-fluide-solaire-spf-50-2/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/isispharma-masque-purifiant-argile-3/400',
    'Masque Purifiant Argile ISIS Pharma - Image 1'
FROM public.products p
WHERE p.slug = 'isispharma-masque-purifiant-argile-3'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/isispharma-masque-purifiant-argile-3/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/isispharma-eau-micellaire-4/400',
    'Eau Micellaire ISIS Pharma - Image 1'
FROM public.products p
WHERE p.slug = 'isispharma-eau-micellaire-4'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/isispharma-eau-micellaire-4/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/isispharma-crème-hydratante-légère-5/400',
    'Crème Hydratante Légère ISIS Pharma - Image 1'
FROM public.products p
WHERE p.slug = 'isispharma-crème-hydratante-légère-5'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/isispharma-crème-hydratante-légère-5/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/isispharma-sérum-vitamine-c-6/400',
    'Sérum Vitamine C ISIS Pharma - Image 1'
FROM public.products p
WHERE p.slug = 'isispharma-sérum-vitamine-c-6'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/isispharma-sérum-vitamine-c-6/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/isispharma-sérum-acide-hyaluronique-7/400',
    'Sérum Acide Hyaluronique ISIS Pharma - Image 1'
FROM public.products p
WHERE p.slug = 'isispharma-sérum-acide-hyaluronique-7'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/isispharma-sérum-acide-hyaluronique-7/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/isispharma-sérum-anti-âge-8/400',
    'Sérum Anti-Âge ISIS Pharma - Image 1'
FROM public.products p
WHERE p.slug = 'isispharma-sérum-anti-âge-8'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/isispharma-sérum-anti-âge-8/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/levissime-masque-hydratant-intense-1/400',
    'Masque Hydratant Intense Levissime - Image 1'
FROM public.products p
WHERE p.slug = 'levissime-masque-hydratant-intense-1'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/levissime-masque-hydratant-intense-1/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/levissime-sérum-vitamine-c-2/400',
    'Sérum Vitamine C Levissime - Image 1'
FROM public.products p
WHERE p.slug = 'levissime-sérum-vitamine-c-2'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/levissime-sérum-vitamine-c-2/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/levissime-fluide-solaire-spf-50-3/400',
    'Fluide Solaire SPF 50+ Levissime - Image 1'
FROM public.products p
WHERE p.slug = 'levissime-fluide-solaire-spf-50-3'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/levissime-fluide-solaire-spf-50-3/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/levissime-eau-micellaire-4/400',
    'Eau Micellaire Levissime - Image 1'
FROM public.products p
WHERE p.slug = 'levissime-eau-micellaire-4'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/levissime-eau-micellaire-4/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/levissime-masque-purifiant-argile-5/400',
    'Masque Purifiant Argile Levissime - Image 1'
FROM public.products p
WHERE p.slug = 'levissime-masque-purifiant-argile-5'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/levissime-masque-purifiant-argile-5/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/levissime-peeling-enzymatique-6/400',
    'Peeling Enzymatique Levissime - Image 1'
FROM public.products p
WHERE p.slug = 'levissime-peeling-enzymatique-6'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/levissime-peeling-enzymatique-6/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/levissime-crème-solaire-teintée-spf-30-7/400',
    'Crème Solaire Teintée SPF 30 Levissime - Image 1'
FROM public.products p
WHERE p.slug = 'levissime-crème-solaire-teintée-spf-30-7'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/levissime-crème-solaire-teintée-spf-30-7/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/levissime-crème-hydratante-légère-8/400',
    'Crème Hydratante Légère Levissime - Image 1'
FROM public.products p
WHERE p.slug = 'levissime-crème-hydratante-légère-8'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/levissime-crème-hydratante-légère-8/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/uriage-gel-nettoyant-purifiant-1/400',
    'Gel Nettoyant Purifiant Uriage - Image 1'
FROM public.products p
WHERE p.slug = 'uriage-gel-nettoyant-purifiant-1'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/uriage-gel-nettoyant-purifiant-1/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/uriage-sérum-vitamine-c-2/400',
    'Sérum Vitamine C Uriage - Image 1'
FROM public.products p
WHERE p.slug = 'uriage-sérum-vitamine-c-2'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/uriage-sérum-vitamine-c-2/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/uriage-crème-solaire-teintée-spf-30-3/400',
    'Crème Solaire Teintée SPF 30 Uriage - Image 1'
FROM public.products p
WHERE p.slug = 'uriage-crème-solaire-teintée-spf-30-3'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/uriage-crème-solaire-teintée-spf-30-3/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/uriage-masque-hydratant-intense-4/400',
    'Masque Hydratant Intense Uriage - Image 1'
FROM public.products p
WHERE p.slug = 'uriage-masque-hydratant-intense-4'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/uriage-masque-hydratant-intense-4/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/uriage-fluide-solaire-spf-50-5/400',
    'Fluide Solaire SPF 50+ Uriage - Image 1'
FROM public.products p
WHERE p.slug = 'uriage-fluide-solaire-spf-50-5'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/uriage-fluide-solaire-spf-50-5/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/uriage-eau-micellaire-6/400',
    'Eau Micellaire Uriage - Image 1'
FROM public.products p
WHERE p.slug = 'uriage-eau-micellaire-6'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/uriage-eau-micellaire-6/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/uriage-sérum-anti-âge-7/400',
    'Sérum Anti-Âge Uriage - Image 1'
FROM public.products p
WHERE p.slug = 'uriage-sérum-anti-âge-7'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/uriage-sérum-anti-âge-7/400'
    );

INSERT INTO public.product_images (id, product_id, url, alt)
SELECT 
    gen_random_uuid(),
    p.id,
    'https://picsum.photos/seed/uriage-gommage-doux-visage-8/400',
    'Gommage Doux Visage Uriage - Image 1'
FROM public.products p
WHERE p.slug = 'uriage-gommage-doux-visage-8'
    AND NOT EXISTS (
        SELECT 1 FROM public.product_images pi 
        WHERE pi.product_id = p.id AND pi.url = 'https://picsum.photos/seed/uriage-gommage-doux-visage-8/400'
    );


-- ----------------------------------------------------------------------
-- 6. Liens produits-gammes
-- ----------------------------------------------------------------------

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'sébionex'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'acm'
WHERE p.slug = 'acm-gel-nettoyant-purifiant-1'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'dépiwhite'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'acm'
WHERE p.slug = 'acm-crème-solaire-teintée-spf-30-2'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'novophane'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'acm'
WHERE p.slug = 'acm-fluide-solaire-spf-50-3'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'sébionex'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'acm'
WHERE p.slug = 'acm-gel-hydratant-matifiant-4'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'dépiwhite'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'acm'
WHERE p.slug = 'acm-eau-micellaire-5'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'novophane'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'acm'
WHERE p.slug = 'acm-sérum-anti-âge-6'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'sébionex'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'acm'
WHERE p.slug = 'acm-gommage-doux-visage-7'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'dépiwhite'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'acm'
WHERE p.slug = 'acm-crème-riche-nourrissante-8'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'exomega'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'adrema'
WHERE p.slug = 'adrema-crème-hydratante-légère-1'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'epitheliale'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'adrema'
WHERE p.slug = 'adrema-crème-riche-nourrissante-2'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'dermalibour'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'adrema'
WHERE p.slug = 'adrema-gel-hydratant-matifiant-3'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'exomega'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'adrema'
WHERE p.slug = 'adrema-masque-purifiant-argile-4'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'epitheliale'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'adrema'
WHERE p.slug = 'adrema-gel-nettoyant-purifiant-5'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'dermalibour'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'adrema'
WHERE p.slug = 'adrema-gommage-doux-visage-6'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'exomega'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'adrema'
WHERE p.slug = 'adrema-peeling-enzymatique-7'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'epitheliale'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'adrema'
WHERE p.slug = 'adrema-crème-solaire-teintée-spf-30-8'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'c-vital'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'atache'
WHERE p.slug = 'atache-peeling-enzymatique-1'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'soft-derm'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'atache'
WHERE p.slug = 'atache-crème-solaire-teintée-spf-30-2'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'retinol'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'atache'
WHERE p.slug = 'atache-gel-nettoyant-purifiant-3'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'c-vital'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'atache'
WHERE p.slug = 'atache-masque-hydratant-intense-4'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'soft-derm'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'atache'
WHERE p.slug = 'atache-sérum-acide-hyaluronique-5'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'retinol'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'atache'
WHERE p.slug = 'atache-crème-hydratante-légère-6'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'c-vital'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'atache'
WHERE p.slug = 'atache-gel-hydratant-matifiant-7'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'soft-derm'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'atache'
WHERE p.slug = 'atache-eau-micellaire-8'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'cleanance'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'avene'
WHERE p.slug = 'avene-sérum-acide-hyaluronique-1'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'hydrance'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'avene'
WHERE p.slug = 'avene-crème-solaire-teintée-spf-30-2'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'cicalfate'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'avene'
WHERE p.slug = 'avene-crème-hydratante-légère-3'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'antirougeurs'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'avene'
WHERE p.slug = 'avene-masque-hydratant-intense-4'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'cleanance'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'avene'
WHERE p.slug = 'avene-gel-hydratant-matifiant-5'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'hydrance'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'avene'
WHERE p.slug = 'avene-sérum-anti-âge-6'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'cicalfate'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'avene'
WHERE p.slug = 'avene-gommage-doux-visage-7'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'antirougeurs'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'avene'
WHERE p.slug = 'avene-mousse-nettoyante-douce-8'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'pediatric'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'babe'
WHERE p.slug = 'babe-sérum-vitamine-c-1'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'essentials'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'babe'
WHERE p.slug = 'babe-crème-riche-nourrissante-2'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'stop-akn'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'babe'
WHERE p.slug = 'babe-crème-solaire-teintée-spf-30-3'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'pediatric'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'babe'
WHERE p.slug = 'babe-sérum-anti-âge-4'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'essentials'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'babe'
WHERE p.slug = 'babe-mousse-nettoyante-douce-5'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'stop-akn'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'babe'
WHERE p.slug = 'babe-sérum-acide-hyaluronique-6'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'pediatric'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'babe'
WHERE p.slug = 'babe-gommage-doux-visage-7'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'essentials'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'babe'
WHERE p.slug = 'babe-fluide-solaire-spf-50-8'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'genomask'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'demo-genove'
WHERE p.slug = 'demo-genove-sérum-acide-hyaluronique-1'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'sesgen-32'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'demo-genove'
WHERE p.slug = 'demo-genove-eau-micellaire-2'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'acnises'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'demo-genove'
WHERE p.slug = 'demo-genove-peeling-enzymatique-3'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'genomask'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'demo-genove'
WHERE p.slug = 'demo-genove-mousse-nettoyante-douce-4'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'sesgen-32'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'demo-genove'
WHERE p.slug = 'demo-genove-crème-hydratante-légère-5'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'acnises'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'demo-genove'
WHERE p.slug = 'demo-genove-crème-solaire-teintée-spf-30-6'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'genomask'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'demo-genove'
WHERE p.slug = 'demo-genove-masque-hydratant-intense-7'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'sesgen-32'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'demo-genove'
WHERE p.slug = 'demo-genove-crème-riche-nourrissante-8'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'keracnyl'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'ducray'
WHERE p.slug = 'ducray-masque-hydratant-intense-1'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'ictyane'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'ducray'
WHERE p.slug = 'ducray-gommage-doux-visage-2'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'melascreen'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'ducray'
WHERE p.slug = 'ducray-fluide-solaire-spf-50-3'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'keracnyl'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'ducray'
WHERE p.slug = 'ducray-masque-purifiant-argile-4'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'ictyane'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'ducray'
WHERE p.slug = 'ducray-eau-micellaire-5'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'melascreen'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'ducray'
WHERE p.slug = 'ducray-crème-solaire-teintée-spf-30-6'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'keracnyl'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'ducray'
WHERE p.slug = 'ducray-sérum-vitamine-c-7'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'ictyane'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'ducray'
WHERE p.slug = 'ducray-crème-riche-nourrissante-8'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'uv-clear'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'elta-md'
WHERE p.slug = 'elta-md-fluide-solaire-spf-50-1'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'uv-daily'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'elta-md'
WHERE p.slug = 'elta-md-sérum-anti-âge-2'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'foaming-facial'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'elta-md'
WHERE p.slug = 'elta-md-gommage-doux-visage-3'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'uv-clear'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'elta-md'
WHERE p.slug = 'elta-md-mousse-nettoyante-douce-4'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'uv-daily'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'elta-md'
WHERE p.slug = 'elta-md-crème-solaire-teintée-spf-30-5'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'foaming-facial'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'elta-md'
WHERE p.slug = 'elta-md-crème-riche-nourrissante-6'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'uv-clear'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'elta-md'
WHERE p.slug = 'elta-md-eau-micellaire-7'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'uv-daily'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'elta-md'
WHERE p.slug = 'elta-md-masque-hydratant-intense-8'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'time-filler'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'filorga'
WHERE p.slug = 'filorga-sérum-anti-âge-1'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'ncef'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'filorga'
WHERE p.slug = 'filorga-sérum-vitamine-c-2'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'oxygen-glow'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'filorga'
WHERE p.slug = 'filorga-gel-hydratant-matifiant-3'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'time-filler'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'filorga'
WHERE p.slug = 'filorga-crème-hydratante-légère-4'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'ncef'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'filorga'
WHERE p.slug = 'filorga-mousse-nettoyante-douce-5'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'oxygen-glow'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'filorga'
WHERE p.slug = 'filorga-peeling-enzymatique-6'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'time-filler'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'filorga'
WHERE p.slug = 'filorga-sérum-acide-hyaluronique-7'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'ncef'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'filorga'
WHERE p.slug = 'filorga-eau-micellaire-8'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'fotoprotetor'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'isdin'
WHERE p.slug = 'isdin-sérum-acide-hyaluronique-1'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'acniben'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'isdin'
WHERE p.slug = 'isdin-crème-hydratante-légère-2'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'isdinceutics'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'isdin'
WHERE p.slug = 'isdin-crème-riche-nourrissante-3'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'fotoprotetor'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'isdin'
WHERE p.slug = 'isdin-gel-hydratant-matifiant-4'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'acniben'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'isdin'
WHERE p.slug = 'isdin-peeling-enzymatique-5'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'isdinceutics'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'isdin'
WHERE p.slug = 'isdin-eau-micellaire-6'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'fotoprotetor'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'isdin'
WHERE p.slug = 'isdin-masque-hydratant-intense-7'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'acniben'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'isdin'
WHERE p.slug = 'isdin-mousse-nettoyante-douce-8'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'neotone'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'isispharma'
WHERE p.slug = 'isispharma-mousse-nettoyante-douce-1'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'glyco-a'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'isispharma'
WHERE p.slug = 'isispharma-fluide-solaire-spf-50-2'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'ruboril'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'isispharma'
WHERE p.slug = 'isispharma-masque-purifiant-argile-3'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'neotone'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'isispharma'
WHERE p.slug = 'isispharma-eau-micellaire-4'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'glyco-a'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'isispharma'
WHERE p.slug = 'isispharma-crème-hydratante-légère-5'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'ruboril'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'isispharma'
WHERE p.slug = 'isispharma-sérum-vitamine-c-6'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'neotone'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'isispharma'
WHERE p.slug = 'isispharma-sérum-acide-hyaluronique-7'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'glyco-a'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'isispharma'
WHERE p.slug = 'isispharma-sérum-anti-âge-8'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'alginate-masks'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'levissime'
WHERE p.slug = 'levissime-masque-hydratant-intense-1'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'professional'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'levissime'
WHERE p.slug = 'levissime-sérum-vitamine-c-2'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'home-care'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'levissime'
WHERE p.slug = 'levissime-fluide-solaire-spf-50-3'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'alginate-masks'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'levissime'
WHERE p.slug = 'levissime-eau-micellaire-4'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'professional'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'levissime'
WHERE p.slug = 'levissime-masque-purifiant-argile-5'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'home-care'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'levissime'
WHERE p.slug = 'levissime-peeling-enzymatique-6'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'alginate-masks'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'levissime'
WHERE p.slug = 'levissime-crème-solaire-teintée-spf-30-7'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'professional'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'levissime'
WHERE p.slug = 'levissime-crème-hydratante-légère-8'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'hyséac'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'uriage'
WHERE p.slug = 'uriage-gel-nettoyant-purifiant-1'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'bariéderm'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'uriage'
WHERE p.slug = 'uriage-sérum-vitamine-c-2'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'age-protect'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'uriage'
WHERE p.slug = 'uriage-crème-solaire-teintée-spf-30-3'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'hyséac'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'uriage'
WHERE p.slug = 'uriage-masque-hydratant-intense-4'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'bariéderm'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'uriage'
WHERE p.slug = 'uriage-fluide-solaire-spf-50-5'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'age-protect'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'uriage'
WHERE p.slug = 'uriage-eau-micellaire-6'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'hyséac'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'uriage'
WHERE p.slug = 'uriage-sérum-anti-âge-7'
ON CONFLICT (product_id, range_id) DO NOTHING;

INSERT INTO public.product_ranges (product_id, range_id)
SELECT p.id, r.id
FROM public.products p
JOIN public.ranges r ON r.slug = 'bariéderm'
JOIN public.brands b ON b.id = r.brand_id AND b.slug = 'uriage'
WHERE p.slug = 'uriage-gommage-doux-visage-8'
ON CONFLICT (product_id, range_id) DO NOTHING;


-- ----------------------------------------------------------------------
-- 7. Liens produits-tags
-- ----------------------------------------------------------------------

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'nettoyant' AND t.tag_type = 'category'
WHERE p.slug = 'acm-gel-nettoyant-purifiant-1'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'acne' AND t.tag_type = 'need'
WHERE p.slug = 'acm-gel-nettoyant-purifiant-1'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-grasse' AND t.tag_type = 'skin_type'
WHERE p.slug = 'acm-gel-nettoyant-purifiant-1'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'protection-solaire' AND t.tag_type = 'category'
WHERE p.slug = 'acm-crème-solaire-teintée-spf-30-2'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'protection' AND t.tag_type = 'need'
WHERE p.slug = 'acm-crème-solaire-teintée-spf-30-2'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'acm-crème-solaire-teintée-spf-30-2'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'protection-solaire' AND t.tag_type = 'category'
WHERE p.slug = 'acm-fluide-solaire-spf-50-3'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'protection' AND t.tag_type = 'need'
WHERE p.slug = 'acm-fluide-solaire-spf-50-3'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'acm-fluide-solaire-spf-50-3'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratant' AND t.tag_type = 'category'
WHERE p.slug = 'acm-gel-hydratant-matifiant-4'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'acne' AND t.tag_type = 'need'
WHERE p.slug = 'acm-gel-hydratant-matifiant-4'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-grasse' AND t.tag_type = 'skin_type'
WHERE p.slug = 'acm-gel-hydratant-matifiant-4'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'nettoyant' AND t.tag_type = 'category'
WHERE p.slug = 'acm-eau-micellaire-5'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'sensibilite' AND t.tag_type = 'need'
WHERE p.slug = 'acm-eau-micellaire-5'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'acm-eau-micellaire-5'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'serum' AND t.tag_type = 'category'
WHERE p.slug = 'acm-sérum-anti-âge-6'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'anti-age' AND t.tag_type = 'need'
WHERE p.slug = 'acm-sérum-anti-âge-6'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'acm-sérum-anti-âge-6'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'exfoliant' AND t.tag_type = 'category'
WHERE p.slug = 'acm-gommage-doux-visage-7'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'eclat' AND t.tag_type = 'need'
WHERE p.slug = 'acm-gommage-doux-visage-7'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'acm-gommage-doux-visage-7'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratant' AND t.tag_type = 'category'
WHERE p.slug = 'acm-crème-riche-nourrissante-8'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratation' AND t.tag_type = 'need'
WHERE p.slug = 'acm-crème-riche-nourrissante-8'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-seche' AND t.tag_type = 'skin_type'
WHERE p.slug = 'acm-crème-riche-nourrissante-8'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratant' AND t.tag_type = 'category'
WHERE p.slug = 'adrema-crème-hydratante-légère-1'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratation' AND t.tag_type = 'need'
WHERE p.slug = 'adrema-crème-hydratante-légère-1'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-mixte' AND t.tag_type = 'skin_type'
WHERE p.slug = 'adrema-crème-hydratante-légère-1'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratant' AND t.tag_type = 'category'
WHERE p.slug = 'adrema-crème-riche-nourrissante-2'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratation' AND t.tag_type = 'need'
WHERE p.slug = 'adrema-crème-riche-nourrissante-2'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-seche' AND t.tag_type = 'skin_type'
WHERE p.slug = 'adrema-crème-riche-nourrissante-2'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratant' AND t.tag_type = 'category'
WHERE p.slug = 'adrema-gel-hydratant-matifiant-3'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'acne' AND t.tag_type = 'need'
WHERE p.slug = 'adrema-gel-hydratant-matifiant-3'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-grasse' AND t.tag_type = 'skin_type'
WHERE p.slug = 'adrema-gel-hydratant-matifiant-3'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'masque' AND t.tag_type = 'category'
WHERE p.slug = 'adrema-masque-purifiant-argile-4'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'acne' AND t.tag_type = 'need'
WHERE p.slug = 'adrema-masque-purifiant-argile-4'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-grasse' AND t.tag_type = 'skin_type'
WHERE p.slug = 'adrema-masque-purifiant-argile-4'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'nettoyant' AND t.tag_type = 'category'
WHERE p.slug = 'adrema-gel-nettoyant-purifiant-5'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'acne' AND t.tag_type = 'need'
WHERE p.slug = 'adrema-gel-nettoyant-purifiant-5'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-grasse' AND t.tag_type = 'skin_type'
WHERE p.slug = 'adrema-gel-nettoyant-purifiant-5'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'exfoliant' AND t.tag_type = 'category'
WHERE p.slug = 'adrema-gommage-doux-visage-6'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'eclat' AND t.tag_type = 'need'
WHERE p.slug = 'adrema-gommage-doux-visage-6'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'adrema-gommage-doux-visage-6'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'exfoliant' AND t.tag_type = 'category'
WHERE p.slug = 'adrema-peeling-enzymatique-7'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'eclat' AND t.tag_type = 'need'
WHERE p.slug = 'adrema-peeling-enzymatique-7'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-sensible' AND t.tag_type = 'skin_type'
WHERE p.slug = 'adrema-peeling-enzymatique-7'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'protection-solaire' AND t.tag_type = 'category'
WHERE p.slug = 'adrema-crème-solaire-teintée-spf-30-8'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'protection' AND t.tag_type = 'need'
WHERE p.slug = 'adrema-crème-solaire-teintée-spf-30-8'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'adrema-crème-solaire-teintée-spf-30-8'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'exfoliant' AND t.tag_type = 'category'
WHERE p.slug = 'atache-peeling-enzymatique-1'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'eclat' AND t.tag_type = 'need'
WHERE p.slug = 'atache-peeling-enzymatique-1'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-sensible' AND t.tag_type = 'skin_type'
WHERE p.slug = 'atache-peeling-enzymatique-1'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'protection-solaire' AND t.tag_type = 'category'
WHERE p.slug = 'atache-crème-solaire-teintée-spf-30-2'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'protection' AND t.tag_type = 'need'
WHERE p.slug = 'atache-crème-solaire-teintée-spf-30-2'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'atache-crème-solaire-teintée-spf-30-2'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'nettoyant' AND t.tag_type = 'category'
WHERE p.slug = 'atache-gel-nettoyant-purifiant-3'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'acne' AND t.tag_type = 'need'
WHERE p.slug = 'atache-gel-nettoyant-purifiant-3'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-grasse' AND t.tag_type = 'skin_type'
WHERE p.slug = 'atache-gel-nettoyant-purifiant-3'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'masque' AND t.tag_type = 'category'
WHERE p.slug = 'atache-masque-hydratant-intense-4'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratation' AND t.tag_type = 'need'
WHERE p.slug = 'atache-masque-hydratant-intense-4'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-seche' AND t.tag_type = 'skin_type'
WHERE p.slug = 'atache-masque-hydratant-intense-4'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'serum' AND t.tag_type = 'category'
WHERE p.slug = 'atache-sérum-acide-hyaluronique-5'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratation' AND t.tag_type = 'need'
WHERE p.slug = 'atache-sérum-acide-hyaluronique-5'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'atache-sérum-acide-hyaluronique-5'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratant' AND t.tag_type = 'category'
WHERE p.slug = 'atache-crème-hydratante-légère-6'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratation' AND t.tag_type = 'need'
WHERE p.slug = 'atache-crème-hydratante-légère-6'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-mixte' AND t.tag_type = 'skin_type'
WHERE p.slug = 'atache-crème-hydratante-légère-6'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratant' AND t.tag_type = 'category'
WHERE p.slug = 'atache-gel-hydratant-matifiant-7'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'acne' AND t.tag_type = 'need'
WHERE p.slug = 'atache-gel-hydratant-matifiant-7'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-grasse' AND t.tag_type = 'skin_type'
WHERE p.slug = 'atache-gel-hydratant-matifiant-7'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'nettoyant' AND t.tag_type = 'category'
WHERE p.slug = 'atache-eau-micellaire-8'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'sensibilite' AND t.tag_type = 'need'
WHERE p.slug = 'atache-eau-micellaire-8'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'atache-eau-micellaire-8'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'serum' AND t.tag_type = 'category'
WHERE p.slug = 'avene-sérum-acide-hyaluronique-1'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratation' AND t.tag_type = 'need'
WHERE p.slug = 'avene-sérum-acide-hyaluronique-1'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'avene-sérum-acide-hyaluronique-1'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'protection-solaire' AND t.tag_type = 'category'
WHERE p.slug = 'avene-crème-solaire-teintée-spf-30-2'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'protection' AND t.tag_type = 'need'
WHERE p.slug = 'avene-crème-solaire-teintée-spf-30-2'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'avene-crème-solaire-teintée-spf-30-2'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratant' AND t.tag_type = 'category'
WHERE p.slug = 'avene-crème-hydratante-légère-3'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratation' AND t.tag_type = 'need'
WHERE p.slug = 'avene-crème-hydratante-légère-3'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-mixte' AND t.tag_type = 'skin_type'
WHERE p.slug = 'avene-crème-hydratante-légère-3'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'masque' AND t.tag_type = 'category'
WHERE p.slug = 'avene-masque-hydratant-intense-4'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratation' AND t.tag_type = 'need'
WHERE p.slug = 'avene-masque-hydratant-intense-4'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-seche' AND t.tag_type = 'skin_type'
WHERE p.slug = 'avene-masque-hydratant-intense-4'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratant' AND t.tag_type = 'category'
WHERE p.slug = 'avene-gel-hydratant-matifiant-5'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'acne' AND t.tag_type = 'need'
WHERE p.slug = 'avene-gel-hydratant-matifiant-5'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-grasse' AND t.tag_type = 'skin_type'
WHERE p.slug = 'avene-gel-hydratant-matifiant-5'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'serum' AND t.tag_type = 'category'
WHERE p.slug = 'avene-sérum-anti-âge-6'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'anti-age' AND t.tag_type = 'need'
WHERE p.slug = 'avene-sérum-anti-âge-6'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'avene-sérum-anti-âge-6'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'exfoliant' AND t.tag_type = 'category'
WHERE p.slug = 'avene-gommage-doux-visage-7'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'eclat' AND t.tag_type = 'need'
WHERE p.slug = 'avene-gommage-doux-visage-7'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'avene-gommage-doux-visage-7'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'nettoyant' AND t.tag_type = 'category'
WHERE p.slug = 'avene-mousse-nettoyante-douce-8'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'sensibilite' AND t.tag_type = 'need'
WHERE p.slug = 'avene-mousse-nettoyante-douce-8'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-sensible' AND t.tag_type = 'skin_type'
WHERE p.slug = 'avene-mousse-nettoyante-douce-8'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'serum' AND t.tag_type = 'category'
WHERE p.slug = 'babe-sérum-vitamine-c-1'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'taches' AND t.tag_type = 'need'
WHERE p.slug = 'babe-sérum-vitamine-c-1'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'babe-sérum-vitamine-c-1'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratant' AND t.tag_type = 'category'
WHERE p.slug = 'babe-crème-riche-nourrissante-2'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratation' AND t.tag_type = 'need'
WHERE p.slug = 'babe-crème-riche-nourrissante-2'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-seche' AND t.tag_type = 'skin_type'
WHERE p.slug = 'babe-crème-riche-nourrissante-2'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'protection-solaire' AND t.tag_type = 'category'
WHERE p.slug = 'babe-crème-solaire-teintée-spf-30-3'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'protection' AND t.tag_type = 'need'
WHERE p.slug = 'babe-crème-solaire-teintée-spf-30-3'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'babe-crème-solaire-teintée-spf-30-3'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'serum' AND t.tag_type = 'category'
WHERE p.slug = 'babe-sérum-anti-âge-4'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'anti-age' AND t.tag_type = 'need'
WHERE p.slug = 'babe-sérum-anti-âge-4'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'babe-sérum-anti-âge-4'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'nettoyant' AND t.tag_type = 'category'
WHERE p.slug = 'babe-mousse-nettoyante-douce-5'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'sensibilite' AND t.tag_type = 'need'
WHERE p.slug = 'babe-mousse-nettoyante-douce-5'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-sensible' AND t.tag_type = 'skin_type'
WHERE p.slug = 'babe-mousse-nettoyante-douce-5'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'serum' AND t.tag_type = 'category'
WHERE p.slug = 'babe-sérum-acide-hyaluronique-6'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratation' AND t.tag_type = 'need'
WHERE p.slug = 'babe-sérum-acide-hyaluronique-6'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'babe-sérum-acide-hyaluronique-6'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'exfoliant' AND t.tag_type = 'category'
WHERE p.slug = 'babe-gommage-doux-visage-7'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'eclat' AND t.tag_type = 'need'
WHERE p.slug = 'babe-gommage-doux-visage-7'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'babe-gommage-doux-visage-7'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'protection-solaire' AND t.tag_type = 'category'
WHERE p.slug = 'babe-fluide-solaire-spf-50-8'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'protection' AND t.tag_type = 'need'
WHERE p.slug = 'babe-fluide-solaire-spf-50-8'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'babe-fluide-solaire-spf-50-8'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'serum' AND t.tag_type = 'category'
WHERE p.slug = 'demo-genove-sérum-acide-hyaluronique-1'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratation' AND t.tag_type = 'need'
WHERE p.slug = 'demo-genove-sérum-acide-hyaluronique-1'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'demo-genove-sérum-acide-hyaluronique-1'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'nettoyant' AND t.tag_type = 'category'
WHERE p.slug = 'demo-genove-eau-micellaire-2'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'sensibilite' AND t.tag_type = 'need'
WHERE p.slug = 'demo-genove-eau-micellaire-2'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'demo-genove-eau-micellaire-2'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'exfoliant' AND t.tag_type = 'category'
WHERE p.slug = 'demo-genove-peeling-enzymatique-3'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'eclat' AND t.tag_type = 'need'
WHERE p.slug = 'demo-genove-peeling-enzymatique-3'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-sensible' AND t.tag_type = 'skin_type'
WHERE p.slug = 'demo-genove-peeling-enzymatique-3'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'nettoyant' AND t.tag_type = 'category'
WHERE p.slug = 'demo-genove-mousse-nettoyante-douce-4'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'sensibilite' AND t.tag_type = 'need'
WHERE p.slug = 'demo-genove-mousse-nettoyante-douce-4'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-sensible' AND t.tag_type = 'skin_type'
WHERE p.slug = 'demo-genove-mousse-nettoyante-douce-4'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratant' AND t.tag_type = 'category'
WHERE p.slug = 'demo-genove-crème-hydratante-légère-5'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratation' AND t.tag_type = 'need'
WHERE p.slug = 'demo-genove-crème-hydratante-légère-5'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-mixte' AND t.tag_type = 'skin_type'
WHERE p.slug = 'demo-genove-crème-hydratante-légère-5'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'protection-solaire' AND t.tag_type = 'category'
WHERE p.slug = 'demo-genove-crème-solaire-teintée-spf-30-6'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'protection' AND t.tag_type = 'need'
WHERE p.slug = 'demo-genove-crème-solaire-teintée-spf-30-6'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'demo-genove-crème-solaire-teintée-spf-30-6'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'masque' AND t.tag_type = 'category'
WHERE p.slug = 'demo-genove-masque-hydratant-intense-7'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratation' AND t.tag_type = 'need'
WHERE p.slug = 'demo-genove-masque-hydratant-intense-7'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-seche' AND t.tag_type = 'skin_type'
WHERE p.slug = 'demo-genove-masque-hydratant-intense-7'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratant' AND t.tag_type = 'category'
WHERE p.slug = 'demo-genove-crème-riche-nourrissante-8'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratation' AND t.tag_type = 'need'
WHERE p.slug = 'demo-genove-crème-riche-nourrissante-8'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-seche' AND t.tag_type = 'skin_type'
WHERE p.slug = 'demo-genove-crème-riche-nourrissante-8'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'masque' AND t.tag_type = 'category'
WHERE p.slug = 'ducray-masque-hydratant-intense-1'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratation' AND t.tag_type = 'need'
WHERE p.slug = 'ducray-masque-hydratant-intense-1'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-seche' AND t.tag_type = 'skin_type'
WHERE p.slug = 'ducray-masque-hydratant-intense-1'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'exfoliant' AND t.tag_type = 'category'
WHERE p.slug = 'ducray-gommage-doux-visage-2'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'eclat' AND t.tag_type = 'need'
WHERE p.slug = 'ducray-gommage-doux-visage-2'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'ducray-gommage-doux-visage-2'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'protection-solaire' AND t.tag_type = 'category'
WHERE p.slug = 'ducray-fluide-solaire-spf-50-3'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'protection' AND t.tag_type = 'need'
WHERE p.slug = 'ducray-fluide-solaire-spf-50-3'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'ducray-fluide-solaire-spf-50-3'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'masque' AND t.tag_type = 'category'
WHERE p.slug = 'ducray-masque-purifiant-argile-4'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'acne' AND t.tag_type = 'need'
WHERE p.slug = 'ducray-masque-purifiant-argile-4'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-grasse' AND t.tag_type = 'skin_type'
WHERE p.slug = 'ducray-masque-purifiant-argile-4'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'nettoyant' AND t.tag_type = 'category'
WHERE p.slug = 'ducray-eau-micellaire-5'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'sensibilite' AND t.tag_type = 'need'
WHERE p.slug = 'ducray-eau-micellaire-5'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'ducray-eau-micellaire-5'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'protection-solaire' AND t.tag_type = 'category'
WHERE p.slug = 'ducray-crème-solaire-teintée-spf-30-6'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'protection' AND t.tag_type = 'need'
WHERE p.slug = 'ducray-crème-solaire-teintée-spf-30-6'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'ducray-crème-solaire-teintée-spf-30-6'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'serum' AND t.tag_type = 'category'
WHERE p.slug = 'ducray-sérum-vitamine-c-7'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'taches' AND t.tag_type = 'need'
WHERE p.slug = 'ducray-sérum-vitamine-c-7'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'ducray-sérum-vitamine-c-7'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratant' AND t.tag_type = 'category'
WHERE p.slug = 'ducray-crème-riche-nourrissante-8'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratation' AND t.tag_type = 'need'
WHERE p.slug = 'ducray-crème-riche-nourrissante-8'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-seche' AND t.tag_type = 'skin_type'
WHERE p.slug = 'ducray-crème-riche-nourrissante-8'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'protection-solaire' AND t.tag_type = 'category'
WHERE p.slug = 'elta-md-fluide-solaire-spf-50-1'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'protection' AND t.tag_type = 'need'
WHERE p.slug = 'elta-md-fluide-solaire-spf-50-1'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'elta-md-fluide-solaire-spf-50-1'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'serum' AND t.tag_type = 'category'
WHERE p.slug = 'elta-md-sérum-anti-âge-2'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'anti-age' AND t.tag_type = 'need'
WHERE p.slug = 'elta-md-sérum-anti-âge-2'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'elta-md-sérum-anti-âge-2'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'exfoliant' AND t.tag_type = 'category'
WHERE p.slug = 'elta-md-gommage-doux-visage-3'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'eclat' AND t.tag_type = 'need'
WHERE p.slug = 'elta-md-gommage-doux-visage-3'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'elta-md-gommage-doux-visage-3'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'nettoyant' AND t.tag_type = 'category'
WHERE p.slug = 'elta-md-mousse-nettoyante-douce-4'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'sensibilite' AND t.tag_type = 'need'
WHERE p.slug = 'elta-md-mousse-nettoyante-douce-4'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-sensible' AND t.tag_type = 'skin_type'
WHERE p.slug = 'elta-md-mousse-nettoyante-douce-4'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'protection-solaire' AND t.tag_type = 'category'
WHERE p.slug = 'elta-md-crème-solaire-teintée-spf-30-5'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'protection' AND t.tag_type = 'need'
WHERE p.slug = 'elta-md-crème-solaire-teintée-spf-30-5'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'elta-md-crème-solaire-teintée-spf-30-5'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratant' AND t.tag_type = 'category'
WHERE p.slug = 'elta-md-crème-riche-nourrissante-6'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratation' AND t.tag_type = 'need'
WHERE p.slug = 'elta-md-crème-riche-nourrissante-6'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-seche' AND t.tag_type = 'skin_type'
WHERE p.slug = 'elta-md-crème-riche-nourrissante-6'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'nettoyant' AND t.tag_type = 'category'
WHERE p.slug = 'elta-md-eau-micellaire-7'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'sensibilite' AND t.tag_type = 'need'
WHERE p.slug = 'elta-md-eau-micellaire-7'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'elta-md-eau-micellaire-7'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'masque' AND t.tag_type = 'category'
WHERE p.slug = 'elta-md-masque-hydratant-intense-8'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratation' AND t.tag_type = 'need'
WHERE p.slug = 'elta-md-masque-hydratant-intense-8'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-seche' AND t.tag_type = 'skin_type'
WHERE p.slug = 'elta-md-masque-hydratant-intense-8'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'serum' AND t.tag_type = 'category'
WHERE p.slug = 'filorga-sérum-anti-âge-1'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'anti-age' AND t.tag_type = 'need'
WHERE p.slug = 'filorga-sérum-anti-âge-1'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'filorga-sérum-anti-âge-1'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'serum' AND t.tag_type = 'category'
WHERE p.slug = 'filorga-sérum-vitamine-c-2'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'taches' AND t.tag_type = 'need'
WHERE p.slug = 'filorga-sérum-vitamine-c-2'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'filorga-sérum-vitamine-c-2'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratant' AND t.tag_type = 'category'
WHERE p.slug = 'filorga-gel-hydratant-matifiant-3'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'acne' AND t.tag_type = 'need'
WHERE p.slug = 'filorga-gel-hydratant-matifiant-3'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-grasse' AND t.tag_type = 'skin_type'
WHERE p.slug = 'filorga-gel-hydratant-matifiant-3'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratant' AND t.tag_type = 'category'
WHERE p.slug = 'filorga-crème-hydratante-légère-4'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratation' AND t.tag_type = 'need'
WHERE p.slug = 'filorga-crème-hydratante-légère-4'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-mixte' AND t.tag_type = 'skin_type'
WHERE p.slug = 'filorga-crème-hydratante-légère-4'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'nettoyant' AND t.tag_type = 'category'
WHERE p.slug = 'filorga-mousse-nettoyante-douce-5'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'sensibilite' AND t.tag_type = 'need'
WHERE p.slug = 'filorga-mousse-nettoyante-douce-5'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-sensible' AND t.tag_type = 'skin_type'
WHERE p.slug = 'filorga-mousse-nettoyante-douce-5'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'exfoliant' AND t.tag_type = 'category'
WHERE p.slug = 'filorga-peeling-enzymatique-6'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'eclat' AND t.tag_type = 'need'
WHERE p.slug = 'filorga-peeling-enzymatique-6'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-sensible' AND t.tag_type = 'skin_type'
WHERE p.slug = 'filorga-peeling-enzymatique-6'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'serum' AND t.tag_type = 'category'
WHERE p.slug = 'filorga-sérum-acide-hyaluronique-7'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratation' AND t.tag_type = 'need'
WHERE p.slug = 'filorga-sérum-acide-hyaluronique-7'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'filorga-sérum-acide-hyaluronique-7'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'nettoyant' AND t.tag_type = 'category'
WHERE p.slug = 'filorga-eau-micellaire-8'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'sensibilite' AND t.tag_type = 'need'
WHERE p.slug = 'filorga-eau-micellaire-8'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'filorga-eau-micellaire-8'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'serum' AND t.tag_type = 'category'
WHERE p.slug = 'isdin-sérum-acide-hyaluronique-1'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratation' AND t.tag_type = 'need'
WHERE p.slug = 'isdin-sérum-acide-hyaluronique-1'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'isdin-sérum-acide-hyaluronique-1'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratant' AND t.tag_type = 'category'
WHERE p.slug = 'isdin-crème-hydratante-légère-2'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratation' AND t.tag_type = 'need'
WHERE p.slug = 'isdin-crème-hydratante-légère-2'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-mixte' AND t.tag_type = 'skin_type'
WHERE p.slug = 'isdin-crème-hydratante-légère-2'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratant' AND t.tag_type = 'category'
WHERE p.slug = 'isdin-crème-riche-nourrissante-3'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratation' AND t.tag_type = 'need'
WHERE p.slug = 'isdin-crème-riche-nourrissante-3'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-seche' AND t.tag_type = 'skin_type'
WHERE p.slug = 'isdin-crème-riche-nourrissante-3'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratant' AND t.tag_type = 'category'
WHERE p.slug = 'isdin-gel-hydratant-matifiant-4'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'acne' AND t.tag_type = 'need'
WHERE p.slug = 'isdin-gel-hydratant-matifiant-4'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-grasse' AND t.tag_type = 'skin_type'
WHERE p.slug = 'isdin-gel-hydratant-matifiant-4'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'exfoliant' AND t.tag_type = 'category'
WHERE p.slug = 'isdin-peeling-enzymatique-5'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'eclat' AND t.tag_type = 'need'
WHERE p.slug = 'isdin-peeling-enzymatique-5'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-sensible' AND t.tag_type = 'skin_type'
WHERE p.slug = 'isdin-peeling-enzymatique-5'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'nettoyant' AND t.tag_type = 'category'
WHERE p.slug = 'isdin-eau-micellaire-6'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'sensibilite' AND t.tag_type = 'need'
WHERE p.slug = 'isdin-eau-micellaire-6'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'isdin-eau-micellaire-6'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'masque' AND t.tag_type = 'category'
WHERE p.slug = 'isdin-masque-hydratant-intense-7'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratation' AND t.tag_type = 'need'
WHERE p.slug = 'isdin-masque-hydratant-intense-7'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-seche' AND t.tag_type = 'skin_type'
WHERE p.slug = 'isdin-masque-hydratant-intense-7'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'nettoyant' AND t.tag_type = 'category'
WHERE p.slug = 'isdin-mousse-nettoyante-douce-8'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'sensibilite' AND t.tag_type = 'need'
WHERE p.slug = 'isdin-mousse-nettoyante-douce-8'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-sensible' AND t.tag_type = 'skin_type'
WHERE p.slug = 'isdin-mousse-nettoyante-douce-8'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'nettoyant' AND t.tag_type = 'category'
WHERE p.slug = 'isispharma-mousse-nettoyante-douce-1'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'sensibilite' AND t.tag_type = 'need'
WHERE p.slug = 'isispharma-mousse-nettoyante-douce-1'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-sensible' AND t.tag_type = 'skin_type'
WHERE p.slug = 'isispharma-mousse-nettoyante-douce-1'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'protection-solaire' AND t.tag_type = 'category'
WHERE p.slug = 'isispharma-fluide-solaire-spf-50-2'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'protection' AND t.tag_type = 'need'
WHERE p.slug = 'isispharma-fluide-solaire-spf-50-2'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'isispharma-fluide-solaire-spf-50-2'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'masque' AND t.tag_type = 'category'
WHERE p.slug = 'isispharma-masque-purifiant-argile-3'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'acne' AND t.tag_type = 'need'
WHERE p.slug = 'isispharma-masque-purifiant-argile-3'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-grasse' AND t.tag_type = 'skin_type'
WHERE p.slug = 'isispharma-masque-purifiant-argile-3'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'nettoyant' AND t.tag_type = 'category'
WHERE p.slug = 'isispharma-eau-micellaire-4'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'sensibilite' AND t.tag_type = 'need'
WHERE p.slug = 'isispharma-eau-micellaire-4'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'isispharma-eau-micellaire-4'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratant' AND t.tag_type = 'category'
WHERE p.slug = 'isispharma-crème-hydratante-légère-5'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratation' AND t.tag_type = 'need'
WHERE p.slug = 'isispharma-crème-hydratante-légère-5'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-mixte' AND t.tag_type = 'skin_type'
WHERE p.slug = 'isispharma-crème-hydratante-légère-5'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'serum' AND t.tag_type = 'category'
WHERE p.slug = 'isispharma-sérum-vitamine-c-6'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'taches' AND t.tag_type = 'need'
WHERE p.slug = 'isispharma-sérum-vitamine-c-6'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'isispharma-sérum-vitamine-c-6'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'serum' AND t.tag_type = 'category'
WHERE p.slug = 'isispharma-sérum-acide-hyaluronique-7'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratation' AND t.tag_type = 'need'
WHERE p.slug = 'isispharma-sérum-acide-hyaluronique-7'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'isispharma-sérum-acide-hyaluronique-7'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'serum' AND t.tag_type = 'category'
WHERE p.slug = 'isispharma-sérum-anti-âge-8'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'anti-age' AND t.tag_type = 'need'
WHERE p.slug = 'isispharma-sérum-anti-âge-8'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'isispharma-sérum-anti-âge-8'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'masque' AND t.tag_type = 'category'
WHERE p.slug = 'levissime-masque-hydratant-intense-1'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratation' AND t.tag_type = 'need'
WHERE p.slug = 'levissime-masque-hydratant-intense-1'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-seche' AND t.tag_type = 'skin_type'
WHERE p.slug = 'levissime-masque-hydratant-intense-1'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'serum' AND t.tag_type = 'category'
WHERE p.slug = 'levissime-sérum-vitamine-c-2'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'taches' AND t.tag_type = 'need'
WHERE p.slug = 'levissime-sérum-vitamine-c-2'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'levissime-sérum-vitamine-c-2'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'protection-solaire' AND t.tag_type = 'category'
WHERE p.slug = 'levissime-fluide-solaire-spf-50-3'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'protection' AND t.tag_type = 'need'
WHERE p.slug = 'levissime-fluide-solaire-spf-50-3'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'levissime-fluide-solaire-spf-50-3'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'nettoyant' AND t.tag_type = 'category'
WHERE p.slug = 'levissime-eau-micellaire-4'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'sensibilite' AND t.tag_type = 'need'
WHERE p.slug = 'levissime-eau-micellaire-4'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'levissime-eau-micellaire-4'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'masque' AND t.tag_type = 'category'
WHERE p.slug = 'levissime-masque-purifiant-argile-5'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'acne' AND t.tag_type = 'need'
WHERE p.slug = 'levissime-masque-purifiant-argile-5'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-grasse' AND t.tag_type = 'skin_type'
WHERE p.slug = 'levissime-masque-purifiant-argile-5'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'exfoliant' AND t.tag_type = 'category'
WHERE p.slug = 'levissime-peeling-enzymatique-6'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'eclat' AND t.tag_type = 'need'
WHERE p.slug = 'levissime-peeling-enzymatique-6'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-sensible' AND t.tag_type = 'skin_type'
WHERE p.slug = 'levissime-peeling-enzymatique-6'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'protection-solaire' AND t.tag_type = 'category'
WHERE p.slug = 'levissime-crème-solaire-teintée-spf-30-7'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'protection' AND t.tag_type = 'need'
WHERE p.slug = 'levissime-crème-solaire-teintée-spf-30-7'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'levissime-crème-solaire-teintée-spf-30-7'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratant' AND t.tag_type = 'category'
WHERE p.slug = 'levissime-crème-hydratante-légère-8'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratation' AND t.tag_type = 'need'
WHERE p.slug = 'levissime-crème-hydratante-légère-8'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-mixte' AND t.tag_type = 'skin_type'
WHERE p.slug = 'levissime-crème-hydratante-légère-8'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'nettoyant' AND t.tag_type = 'category'
WHERE p.slug = 'uriage-gel-nettoyant-purifiant-1'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'acne' AND t.tag_type = 'need'
WHERE p.slug = 'uriage-gel-nettoyant-purifiant-1'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-grasse' AND t.tag_type = 'skin_type'
WHERE p.slug = 'uriage-gel-nettoyant-purifiant-1'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'serum' AND t.tag_type = 'category'
WHERE p.slug = 'uriage-sérum-vitamine-c-2'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'taches' AND t.tag_type = 'need'
WHERE p.slug = 'uriage-sérum-vitamine-c-2'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'uriage-sérum-vitamine-c-2'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'protection-solaire' AND t.tag_type = 'category'
WHERE p.slug = 'uriage-crème-solaire-teintée-spf-30-3'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'protection' AND t.tag_type = 'need'
WHERE p.slug = 'uriage-crème-solaire-teintée-spf-30-3'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'uriage-crème-solaire-teintée-spf-30-3'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'masque' AND t.tag_type = 'category'
WHERE p.slug = 'uriage-masque-hydratant-intense-4'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'hydratation' AND t.tag_type = 'need'
WHERE p.slug = 'uriage-masque-hydratant-intense-4'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'peau-seche' AND t.tag_type = 'skin_type'
WHERE p.slug = 'uriage-masque-hydratant-intense-4'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'protection-solaire' AND t.tag_type = 'category'
WHERE p.slug = 'uriage-fluide-solaire-spf-50-5'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'protection' AND t.tag_type = 'need'
WHERE p.slug = 'uriage-fluide-solaire-spf-50-5'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'uriage-fluide-solaire-spf-50-5'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'nettoyant' AND t.tag_type = 'category'
WHERE p.slug = 'uriage-eau-micellaire-6'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'sensibilite' AND t.tag_type = 'need'
WHERE p.slug = 'uriage-eau-micellaire-6'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'uriage-eau-micellaire-6'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'serum' AND t.tag_type = 'category'
WHERE p.slug = 'uriage-sérum-anti-âge-7'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'anti-age' AND t.tag_type = 'need'
WHERE p.slug = 'uriage-sérum-anti-âge-7'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'uriage-sérum-anti-âge-7'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'exfoliant' AND t.tag_type = 'category'
WHERE p.slug = 'uriage-gommage-doux-visage-8'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'eclat' AND t.tag_type = 'need'
WHERE p.slug = 'uriage-gommage-doux-visage-8'
ON CONFLICT (product_id, tag_id) DO NOTHING;

INSERT INTO public.product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM public.products p
JOIN public.tags t ON t.slug = 'tous-types' AND t.tag_type = 'skin_type'
WHERE p.slug = 'uriage-gommage-doux-visage-8'
ON CONFLICT (product_id, tag_id) DO NOTHING;


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
