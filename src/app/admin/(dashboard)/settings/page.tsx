import { getSettings } from "@/lib/api/settings";
import SettingsForm from "./settings-form";

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

                <SettingsForm
                    defaultApplicationFee={settings['application_fee'] || '2000'}
                    defaultXenditFee={settings['xendit_fee'] || '2000'}
                />
            </div>
        </div>
    );
}
