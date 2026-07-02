import { useState } from 'react';
import { Plus, Receipt, IndianRupee } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useBilling } from '../contexts/BillingContext';
import { CreateInvoiceModal } from '../components/CreateInvoiceModal';

export default function HimsBilling() {
  const { invoices, todayRevenue, totalRevenue } = useBilling();
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending'>('all');

  const filteredInvoices = filter === 'all' ? invoices : invoices.filter((inv) => inv.paymentStatus === filter);

  return (
    <div className="h-full flex flex-col">
      <div className="sticky top-0 z-10 bg-white/50 dark:bg-surface-900/50 backdrop-blur-sm border-b border-surface-200 dark:border-surface-700 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <h1 className="text-lg font-semibold text-surface-900 dark:text-white">
            Billing
            <span className="ml-2 text-sm font-normal text-surface-500">
              ({invoices.length} invoices)
            </span>
          </h1>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" />
            New Invoice
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* Revenue Cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
              <div className="flex items-center gap-2 mb-2">
                <IndianRupee className="w-4 h-4 text-emerald-500" />
                <span className="text-sm text-surface-500">Today's Revenue</span>
              </div>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                ₹{todayRevenue.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Receipt className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-surface-500">Total Revenue</span>
              </div>
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                ₹{totalRevenue.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-4">
            {(['all', 'paid', 'pending'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[40px] ${
                  filter === f
                    ? 'bg-emerald-600 text-white'
                    : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Invoice List */}
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12 text-surface-500">
              <p className="text-lg mb-2">No invoices yet</p>
              <Button size="sm" onClick={() => setShowCreate(true)}>
                Create First Invoice
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-surface-500">{inv.invoiceNumber}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            inv.paymentStatus === 'paid'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}
                        >
                          {inv.paymentStatus}
                        </span>
                      </div>
                      <div className="font-medium text-surface-900 dark:text-white text-sm">
                        {inv.patientName}
                      </div>
                      <div className="text-xs text-surface-500 mt-0.5">
                        {inv.items.length} item(s) · {inv.paymentMethod}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-surface-900 dark:text-white">
                        ₹{inv.total.toLocaleString('en-IN')}
                      </div>
                      {inv.discount > 0 && (
                        <div className="text-xs text-surface-500">
                          -₹{inv.discount} discount
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreate && <CreateInvoiceModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
