import { useMuleContext } from '@/context/MuleContext';
import { TransactionTable } from '@/components/TransactionTable';
import { motion } from 'framer-motion';
import { TableIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TransactionsPage() {
    const { transactions, result } = useMuleContext();
    const suspiciousIds = new Set(result?.suspicious_accounts.map(a => a.account_id) || []);

    if (transactions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                    <TableIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">No Transactions Loaded</h2>
                <p className="text-muted-foreground max-w-md mb-6">
                    Upload a CSV file on the Dashboard to view transaction analysis here.
                </p>
                <Link
                    to="/"
                    className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
                >
                    Go to Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 flex items-center justify-between"
            >
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
                    <p className="text-muted-foreground mt-1">
                        Analyzing {transactions.length} records · {result?.suspicious_accounts.length || 0} suspicious entities found
                    </p>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <TransactionTable
                    transactions={transactions}
                    suspiciousIds={suspiciousIds}
                    onAccountClick={(id) => console.log('Clicked', id)}
                />
            </motion.div>
        </div>
    );
}
