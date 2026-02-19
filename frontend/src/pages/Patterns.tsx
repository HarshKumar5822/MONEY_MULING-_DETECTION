import { motion } from 'framer-motion';
import { Network, GitBranch, ShieldAlert, Layers } from 'lucide-react';

export default function Patterns() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10 text-center"
            >
                <h1 className="text-3xl font-bold text-foreground mb-4">Money Muling Patterns</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    Our engine detects specific graph topologies and temporal behaviors associated with financial crime.
                    Here are the core patterns we identify.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cycle Detection */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Network className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground">Circular Routing (Cycles)</h2>
                    </div>
                    <div className="space-y-3 text-sm text-muted-foreground">
                        <p>
                            Money flows in a loop to obscure its origin. A criminal sends funds through a chain of accounts
                            (A → B → C) only for them to return to a controlled account (C → A).
                        </p>
                        <div className="bg-muted p-4 rounded-lg font-mono text-xs my-3 border border-border">
                            Pattern: A → B → C → A (Length 3)<br />
                            Risk Score: +50 points
                        </div>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Detects cycles of length 3, 4, and 5.</li>
                            <li>Often used to create fake transaction volume.</li>
                        </ul>
                    </div>
                </motion.div>

                {/* Smurfing */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center text-warning">
                            <GitBranch className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground">Smurfing (Fan-in / Fan-out)</h2>
                    </div>
                    <div className="space-y-3 text-sm text-muted-foreground">
                        <p>
                            Structuring large amounts of cash into multiple small transactions to evade reporting thresholds.
                        </p>
                        <div className="grid grid-cols-2 gap-4 my-3">
                            <div className="bg-muted p-3 rounded-lg border border-border">
                                <span className="font-semibold block mb-1 text-foreground">Fan-In</span>
                                Many accounts sending to one receiver.
                            </div>
                            <div className="bg-muted p-3 rounded-lg border border-border">
                                <span className="font-semibold block mb-1 text-foreground">Fan-Out</span>
                                One account dispersing to many receivers.
                            </div>
                        </div>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Temporal Window: 72 hours.</li>
                            <li>Threshold: &gt;10 unique connections.</li>
                        </ul>
                    </div>
                </motion.div>

                {/* Shell Accounts */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-6 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-foreground">
                            <Layers className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground">Shell Layers</h2>
                    </div>
                    <div className="space-y-3 text-sm text-muted-foreground">
                        <p>
                            Intermediary accounts with low apparent economic activity that exist solely to pass money along.
                        </p>
                        <div className="bg-muted p-4 rounded-lg font-mono text-xs my-3 border border-border">
                            Behavior: In ≈ Out (Balance ≈ 0)<br />
                            Transaction Count: Very Low
                        </div>
                    </div>
                </motion.div>

                {/* Suspicion Scoring */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="p-6 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-suspicious/10 flex items-center justify-center text-suspicious">
                            <ShieldAlert className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground">Suspicion Scoring</h2>
                    </div>
                    <div className="space-y-3 text-sm text-muted-foreground">
                        <p>
                            Each account receives a risk score (0-100) based on its participation in identified patterns.
                        </p>
                        <div className="space-y-2 my-3">
                            <div className="flex justify-between items-center text-xs">
                                <span>Cycle Member</span>
                                <span className="font-mono text-suspicious bg-suspicious-dim px-2 py-0.5 rounded">+50</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span>Smurfing Activity</span>
                                <span className="font-mono text-warning bg-warning-dim px-2 py-0.5 rounded">+30</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span>High Velocity</span>
                                <span className="font-mono text-safe bg-safe-dim px-2 py-0.5 rounded">+10</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
