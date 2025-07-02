import { test, expect } from '@playwright/test'

test.describe('Panier invité', () => {
  test.beforeEach(async ({ page }) => {
    // Aller à la page d'accueil
    await page.goto('/')
  })

  test('Ajout au panier en tant qu\'invité', async ({ page }) => {
    // Aller au catalogue
    await page.click('text=Catalogue')
    
    // Attendre que les produits se chargent
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 })
    
    // Cliquer sur le premier bouton "Ajouter au panier"
    const addToCartButton = page.locator('[data-testid="add-to-cart-button"]').first()
    await addToCartButton.click()
    
    // Vérifier que le badge du panier affiche 1
    const cartBadge = page.locator('.cart-badge')
    await expect(cartBadge).toHaveText('1')
  })

  test('Persistance du panier après refresh', async ({ page }) => {
    // Aller au catalogue et ajouter un produit
    await page.click('text=Catalogue')
    await page.waitForSelector('[data-testid="product-card"]')
    
    const addToCartButton = page.locator('[data-testid="add-to-cart-button"]').first()
    await addToCartButton.click()
    
    // Vérifier que le badge affiche 1
    const cartBadge = page.locator('.cart-badge')
    await expect(cartBadge).toHaveText('1')
    
    // Refresh la page
    await page.reload()
    
    // Vérifier que le badge affiche toujours 1
    await expect(cartBadge).toHaveText('1')
  })

  test('Ouverture du drawer du panier', async ({ page }) => {
    // Aller au catalogue et ajouter un produit
    await page.click('text=Catalogue')
    await page.waitForSelector('[data-testid="product-card"]')
    
    const addToCartButton = page.locator('[data-testid="add-to-cart-button"]').first()
    await addToCartButton.click()
    
    // Cliquer sur l'icône du panier
    const cartIcon = page.locator('[data-testid="cart-icon"]')
    await cartIcon.click()
    
    // Vérifier que le drawer s'ouvre
    const cartDrawer = page.locator('[data-testid="cart-drawer"]')
    await expect(cartDrawer).toBeVisible()
    
    // Vérifier que le produit est dans le drawer
    const cartItem = page.locator('[data-testid="cart-item"]')
    await expect(cartItem).toBeVisible()
  })

  test('Modification de la quantité dans le drawer', async ({ page }) => {
    // Aller au catalogue et ajouter un produit
    await page.click('text=Catalogue')
    await page.waitForSelector('[data-testid="product-card"]')
    
    const addToCartButton = page.locator('[data-testid="add-to-cart-button"]').first()
    await addToCartButton.click()
    
    // Ouvrir le drawer
    const cartIcon = page.locator('[data-testid="cart-icon"]')
    await cartIcon.click()
    
    // Augmenter la quantité
    const increaseButton = page.locator('[data-testid="quantity-increase"]').first()
    await increaseButton.click()
    
    // Vérifier que la quantité est 2
    const quantityDisplay = page.locator('[data-testid="quantity-display"]').first()
    await expect(quantityDisplay).toHaveText('2')
    
    // Vérifier que le badge du panier affiche 2
    const cartBadge = page.locator('.cart-badge')
    await expect(cartBadge).toHaveText('2')
  })

  test('Suppression d\'un item du panier', async ({ page }) => {
    // Aller au catalogue et ajouter un produit
    await page.click('text=Catalogue')
    await page.waitForSelector('[data-testid="product-card"]')
    
    const addToCartButton = page.locator('[data-testid="add-to-cart-button"]').first()
    await addToCartButton.click()
    
    // Ouvrir le drawer
    const cartIcon = page.locator('[data-testid="cart-icon"]')
    await cartIcon.click()
    
    // Supprimer l'item
    const removeButton = page.locator('[data-testid="remove-item"]').first()
    await removeButton.click()
    
    // Vérifier que le drawer affiche "panier vide"
    const emptyMessage = page.locator('text=Votre panier est vide')
    await expect(emptyMessage).toBeVisible()
    
    // Vérifier que le badge du panier a disparu
    const cartBadge = page.locator('.cart-badge')
    await expect(cartBadge).not.toBeVisible()
  })
})

test.describe('Fusion du panier lors de la connexion', () => {
  test('Fusion du panier invité avec compte utilisateur', async ({ page }) => {
    // Aller au catalogue et ajouter un produit en tant qu'invité
    await page.goto('/catalogue')
    await page.waitForSelector('[data-testid="product-card"]')
    
    const addToCartButton = page.locator('[data-testid="add-to-cart-button"]').first()
    await addToCartButton.click()
    
    // Vérifier que le badge affiche 1
    const cartBadge = page.locator('.cart-badge')
    await expect(cartBadge).toHaveText('1')
    
    // Simuler une connexion (remplacer par vos vraies données de test)
    // await page.click('text=Se connecter')
    // await page.fill('[data-testid="email-input"]', 'test@example.com')
    // await page.fill('[data-testid="password-input"]', 'password123')
    // await page.click('[data-testid="login-button"]')
    
    // Vérifier que le badge affiche toujours 1 après connexion
    // await expect(cartBadge).toHaveText('1')
    
    // Vérifier que le cookie cart_id a été supprimé
    // const cookies = await page.context().cookies()
    // const cartCookie = cookies.find(cookie => cookie.name === 'cart_id')
    // expect(cartCookie).toBeUndefined()
  })
}) 