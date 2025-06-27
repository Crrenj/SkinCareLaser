import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import CartClient from '@/components/CartClient'

export default function CartPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[color:var(--background)]">
      <NavBar />
      <main className="flex-grow p-6">
        <CartClient />
      </main>
      <Footer />
    </div>
  )
} 