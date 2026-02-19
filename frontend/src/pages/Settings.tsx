import { useMuleContext } from '@/context/MuleContext';
import { motion } from 'framer-motion';
import { Sliders, Zap, Moon, Sun, Shield } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

export default function Settings() {
    const { settings, updateSettings } = useMuleContext();

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground mt-1">Configure detection parameters and application preferences.</p>
            </motion.div>

            <div className="space-y-6">

                {/* Detection Toggles */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 rounded-xl border border-border bg-card shadow-sm"
                >
                    <div className="flex items-center gap-2 mb-6 text-foreground">
                        <Zap className="w-5 h-5 text-warning" />
                        <h2 className="text-lg font-semibold">Detection Modules</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium">Cycle Detection</div>
                                <div className="text-sm text-muted-foreground">Detect circular fund routing loops (3-5 hops).</div>
                            </div>
                            <Switch
                                checked={settings.detectCycles}
                                onCheckedChange={(c) => updateSettings({ detectCycles: c })}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium">Smurfing Detection</div>
                                <div className="text-sm text-muted-foreground">Detect Fan-in and Fan-out smurfing patterns.</div>
                            </div>
                            <Switch
                                checked={settings.detectSmurfing}
                                onCheckedChange={(c) => updateSettings({ detectSmurfing: c })}
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Thresholds */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 rounded-xl border border-border bg-card shadow-sm"
                >
                    <div className="flex items-center gap-2 mb-6 text-foreground">
                        <Shield className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold">Risk Thresholds</h2>
                    </div>

                    <div className="space-y-8">
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="font-medium text-sm">Critical Risk Threshold</span>
                                <span className="text-sm px-2 py-0.5 rounded bg-suspicious-dim text-suspicious font-mono">{settings.highRiskThreshold}</span>
                            </div>
                            <Slider
                                value={[settings.highRiskThreshold]}
                                min={50}
                                max={95}
                                step={1}
                                onValueChange={(vals) => updateSettings({ highRiskThreshold: vals[0] })}
                                className="py-2"
                            />
                            <p className="text-xs text-muted-foreground">Accounts with a score above this value are flagged as Critical.</p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="font-medium text-sm">High Risk Threshold</span>
                                <span className="text-sm px-2 py-0.5 rounded bg-warning-dim text-warning font-mono">{settings.mediumRiskThreshold}</span>
                            </div>
                            <Slider
                                value={[settings.mediumRiskThreshold]}
                                min={30}
                                max={80}
                                step={1}
                                onValueChange={(vals) => updateSettings({ mediumRiskThreshold: vals[0] })}
                                className="py-2"
                            />
                            <p className="text-xs text-muted-foreground">Accounts above this (but below Critical) are High Risk.</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-6 rounded-xl border border-border bg-card shadow-sm"
                >
                    <div className="flex items-center gap-2 mb-4 text-foreground">
                        <Moon className="w-5 h-5 text-indigo-500" />
                        <h2 className="text-lg font-semibold">Appearance</h2>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-medium">Dark Mode</div>
                            <div className="text-sm text-muted-foreground">Toggle application theme.</div>
                        </div>
                        <Switch
                            checked={settings.enableDarkTheme}
                            onCheckedChange={(c) => updateSettings({ enableDarkTheme: c })}
                        />
                    </div>
                </motion.div>

            </div>
        </div>
    );
}
