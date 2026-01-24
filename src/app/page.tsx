import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-white selection:bg-gray-900 selection:text-white">
      <Navbar />
      <Hero />

      {/* Placeholder content for scrolling */}
      <section id="fasilitas" className="py-24 px-6 md:px-12 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 text-center">
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-primary mb-4">Standar Baru Kenyamanan</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Kami menyediakan lebih dari sekadar lapangan. Kami menyediakan lingkungan atletik yang sesungguhnya.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-slate-100 rounded-xl mb-6 flex items-center justify-center">
                <span className="text-2xl">🏸</span>
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">Karpet Vinyl Pro</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Lantai standar turnamen BWF untuk traksi maksimal dan pencegahan cedera.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-slate-100 rounded-xl mb-6 flex items-center justify-center">
                <span className="text-2xl">💡</span>
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">Pencahayaan Anti-Glare</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Sistem pencahayaan LED presisi yang tidak menyilaukan mata saat smash.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-slate-100 rounded-xl mb-6 flex items-center justify-center">
                <span className="text-2xl">❄️</span>
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">Sirkulasi Udara Premium</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Sistem ventilasi industrial dan AC untuk menjaga suhu lapangan tetap ideal.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
