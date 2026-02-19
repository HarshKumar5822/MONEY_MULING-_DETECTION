import { useMuleContext } from '@/context/MuleContext';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { AlertCircle, TrendingUp, PieChart as PieIcon } from 'lucide-react';

export default function Analytics() {
    const { result, transactions, settings } = useMuleContext();

    if (!result || transactions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                    <TrendingUp className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">No Analysis Data</h2>
                <p className="text-muted-foreground">Upload a CSV on the dashboard to generate analytics.</p>
            </div>
        );
    }

    // Data Preparation
    const riskDistribution = [
        { name: 'Critical', value: result.suspicious_accounts.filter(a => a.suspicion_score >= settings.highRiskThreshold).length, color: '#EF4444' }, // Red
        { name: 'High', value: result.suspicious_accounts.filter(a => a.suspicion_score >= settings.mediumRiskThreshold && a.suspicion_score < settings.highRiskThreshold).length, color: '#F59E0B' }, // Amber
        { name: 'Medium', value: result.suspicious_accounts.filter(a => a.suspicion_score > 0 && a.suspicion_score < settings.mediumRiskThreshold).length, color: '#3B82F6' }, // Blue
    ].filter(d => d.value > 0);

    const patternCounts = result.suspicious_accounts.reduce((acc, curr) => {
        curr.detected_patterns.forEach(p => {
            // Group patterns for cleaner chart
            let key = p;
            if (p.includes('cycle')) key = 'Cycles';
            else if (p.includes('fan')) key = 'Smurfing';
            else if (p.includes('shell')) key = 'Shell Accounts';
            else key = 'Other';

            acc[key] = (acc[key] || 0) + 1;
        });
        return acc;
    }, {} as Record<string, number>);

    const patternData = Object.entries(patternCounts).map(([name, value]) => ({ name, value }));
    const COLORS = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B'];

    // Transaction Volume over Time (Grouped by Date)
    // Simple approximation if timestamp string format varies, assumes roughly ISO-like or sortable
    // For demo, we just take the first 20 for a trend line or group by hour/day
    const volumeData = transactions.slice(0, 50).map((t, i) => ({
        name: i, // index as proxy for time in this simple view
        amount: t.amount
    }));

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold text-foreground">Analytics Overview</h1>
                <p className="text-muted-foreground mt-1">Deep dive into the detected financial patterns.</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Risk Distribution Chart */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 rounded-xl border border-border bg-card shadow-sm"
                >
                    <div className="flex items-center gap-2 mb-6">
                        <AlertCircle className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-foreground">Risk Severity Distribution</h3>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={riskDistribution}>
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {riskDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Pattern Distribution Pie */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 rounded-xl border border-border bg-card shadow-sm"
                >
                    <div className="flex items-center gap-2 mb-6">
                        <PieIcon className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-foreground">Detected Pattern Types</h3>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={patternData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {patternData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-4 justify-center mt-4">
                        {patternData.map((entry, index) => (
                            <div key={entry.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                {entry.name}
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Transaction Velocity (Line) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="lg:col-span-2 p-6 rounded-xl border border-border bg-card shadow-sm"
                >
                    <div className="flex items-center gap-2 mb-6">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-foreground">Transaction Sample Volume</h3>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={volumeData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" vertical={false} />
                                <XAxis dataKey="name" hide />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                                />
                                <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

            </div>
        </div>
    );
}
