"use client"

import { PageHeader } from "@/components/PageHeader"
import { CreditCard, Plus, Trash2, Smartphone } from "lucide-react"
import { motion } from "framer-motion"

const paymentMethods = [
    {
        id: "pm_1",
        type: "credit_card",
        brand: "Visa",
        last4: "4242",
        expiry: "12/28",
        holder: "AKMAL HASAN",
        color: "bg-pastel-mint"
    },
    {
        id: "pm_2",
        type: "ewallet",
        brand: "GoPay",
        phone: "0812****7890",
        color: "bg-pastel-pink"
    }
]

export default function PaymentMethodsPage() {
    return (
        <main className="min-h-screen bg-white pt-24 pb-12">
            <div className="max-w-3xl mx-auto px-4">
                <PageHeader
                    title="Metode Pembayaran"
                    description="Atur metode pembayaran tersimpan untuk proses booking yang lebih cepat."
                />

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Add New Method Card */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-black hover:text-black hover:bg-gray-50 transition-all font-bold group"
                    >
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-pastel-yellow transition-colors border-2 border-transparent group-hover:border-black">
                            <Plus className="w-6 h-6" />
                        </div>
                        Tambah Metode Baru
                    </motion.button>

                    {/* Existing Methods */}
                    {paymentMethods.map((method, index) => (
                        <motion.div
                            key={method.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className={`h-48 ${method.color} border-2 border-black rounded-xl p-6 relative shadow-hard flex flex-col justify-between overflow-hidden group`}
                        >
                            {/* Decorative Pattern */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-10 -mt-10 blur-xl"></div>

                            <div className="flex justify-between items-start z-10">
                                {method.type === 'credit_card' ? (
                                    <CreditCard className="w-8 h-8 opacity-75" />
                                ) : (
                                    <Smartphone className="w-8 h-8 opacity-75" />
                                )}
                                <span className="font-display font-black text-xl italic opacity-50">{method.brand}</span>
                            </div>

                            <div className="z-10">
                                {method.type === 'credit_card' ? (
                                    <>
                                        <div className="flex gap-2 mb-4">
                                            <div className="w-2 h-2 bg-black rounded-full"></div>
                                            <div className="w-2 h-2 bg-black rounded-full"></div>
                                            <div className="w-2 h-2 bg-black rounded-full"></div>
                                            <div className="w-2 h-2 bg-black rounded-full"></div>
                                            <span className="font-mono text-lg font-bold ml-2">{method.last4}</span>
                                        </div>
                                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider opacity-60">
                                            <span>{method.holder}</span>
                                            <span>{method.expiry}</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <p className="font-mono text-lg font-bold mb-1">{method.phone}</p>
                                        <p className="text-xs font-bold uppercase tracking-wider opacity-60">Connected E-Wallet</p>
                                    </>
                                )}
                            </div>

                            <button className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white rounded-lg border-2 border-transparent hover:border-black opacity-0 group-hover:opacity-100 transition-all text-red-500 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex gap-4 items-start">
                    <div className="bg-blue-100 p-2 rounded-lg">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-blue-800">Pembayaran Aman</h4>
                        <p className="text-sm text-blue-600 leading-relaxed">
                            Semua transaksi dienkripsi dan diproses melalui payment gateway terpercaya. Kami tidak menyimpan detail lengkap kartu kredit Anda.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    )
}
