import { getSettings } from "@/lib/api/settings";
import { updateFeeSettings } from "./actions";
import { Save, DollarSign } from "lucide-react";

export default async function SettingsPage() {
    const settings = await getSettings();

    return (
        <div className="space-y-8">
            <div className="bg-white border-3 border-neo-black p-8 shadow-hard relative">
                <div className="absolute top-0 right-0 bg-neo-yellow px-4 py-1 border-l-3 border-b-3 border-neo-black font-bold text-xs uppercase transform translate-x-1 -translate-y-1">
                    Configuration
                </div>

                <h1 className="text-4xl font-black uppercase mb-2">Settings</h1>
                <p className="font-mono text-gray-600 mb-8 border-b-2 border-gray-100 pb-4">
                    Manage global platform configuration and fees.
                </p>

                <form action={updateFeeSettings} className="space-y-6 max-w-xl">

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
                                            defaultValue={settings['application_fee'] || '2000'}
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
                                            defaultValue={settings['xendit_fee'] || '2000'}
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
                            className="w-full flex justify-center items-center gap-2 bg-neo-green text-neo-black font-black py-4 px-8 border-3 border-neo-black shadow-hard hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all uppercase tracking-wider"
                        >
                            <Save className="w-5 h-5" />
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
