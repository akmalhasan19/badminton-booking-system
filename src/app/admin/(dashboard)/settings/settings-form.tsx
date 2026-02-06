'use client'

import { useActionState } from "react";
import { updateFeeSettings } from "./actions";
import { Save, DollarSign, Loader2 } from "lucide-react";
import { useEffect } from "react";

const initialState = {
    message: '',
    error: '',
    success: false
}

export default function SettingsForm({
    defaultApplicationFee,
    defaultXenditFee
}: {
    defaultApplicationFee: string,
    defaultXenditFee: string
}) {
    const [state, formAction, isPending] = useActionState(updateFeeSettings, initialState);

    return (
        <form action={formAction} className="space-y-6 max-w-xl">

            {/* Status Messages */}
            {state?.error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 font-mono text-sm" role="alert">
                    <p>{state.error}</p>
                </div>
            )}

            {state?.success && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 font-mono text-sm" role="alert">
                    <p>Settings saved successfully!</p>
                </div>
            )}

            {/* Fee Section */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold uppercase flex items-center gap-2">
                    <DollarSign className="w-6 h-6" />
                    Fee Structure
                </h2>

                <div className="bg-neo-bg p-6 border-2 border-neo-black">
                    <div className="grid gap-6">
                        {/* Application Fee */}
                        <div className="space-y-2">
                            <label htmlFor="application_fee" className="block font-bold text-sm uppercase">
                                Website Link Fee (IDR)
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 font-bold">Rp</span>
                                </div>
                                <input
                                    type="number"
                                    name="application_fee"
                                    id="application_fee"
                                    defaultValue={defaultApplicationFee}
                                    className="block w-full pl-12 pr-4 py-3 border-2 border-neo-black focus:ring-0 focus:border-neo-blue focus:shadow-hard-sm transition-all font-mono font-bold"
                                    placeholder="2000"
                                />
                            </div>
                            <p className="text-xs text-gray-500 font-mono">
                                Fee deducted from the Venue's revenue (Application Fee).
                            </p>
                        </div>

                        {/* Xendit Fee */}
                        <div className="space-y-2">
                            <label htmlFor="xendit_fee" className="block font-bold text-sm uppercase">
                                Xendit Payment Fee (IDR)
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 font-bold">Rp</span>
                                </div>
                                <input
                                    type="number"
                                    name="xendit_fee"
                                    id="xendit_fee"
                                    defaultValue={defaultXenditFee}
                                    className="block w-full pl-12 pr-4 py-3 border-2 border-neo-black focus:ring-0 focus:border-neo-blue focus:shadow-hard-sm transition-all font-mono font-bold"
                                    placeholder="2000"
                                />
                            </div>
                            <p className="text-xs text-gray-500 font-mono">
                                Fee charged to the User on top of the calculated price.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-4">
                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full flex justify-center items-center gap-2 bg-neo-green text-neo-black font-black py-4 px-8 border-3 border-neo-black shadow-hard hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            Save Changes
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
