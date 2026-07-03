import { useState, useEffect } from 'react';
import { Plus, Receipt, IndianRupee, Download, TrendingUp, CreditCard, Clock, CheckCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchInvoices } from '../slices/billingSlice';
import { CreateInvoiceModal } from '../components/CreateInvoiceModal';
import { exportInvoices } from '../utils/export';
import { Breadcrumbs } from '../../../components/ui/Breadcrumb';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { HimsStatsCard } from '../layout/HimsStatsCard';

export default function HimsBilling() {
  const dispatch = useAppDispatch();
  const { invoices, todayRevenue, totalRevenue, isLoading } = useAppSelector((state) => state.hims.billing);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending'>('all');

  useEffect(() => {
    dispatch(fetchInvoices());
  }, [dispatch]);

  const filteredInvoices = filter === 'all' ? invoices : invoices.filter((inv) => inv.paymentStatus === filter);
  const pendingCount = invoices.filter((inv) => inv.paymentStatus === 'pending').length;
  const paidCount = invoices.filter((inv) => inv.paymentStatus === 'paid').length;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Breadcrumbs items={[{ label: 'Billing' }]} />

        <PageHeader
          title="Billing"
          subtitle={`${invoices.length} invoices`}
          actions={
            <>
              <Button size="sm" variant="secondary" onClick={() => exportInvoices(invoices)}>
                <Download className="w-4 h-4" /> Export
              </Button>
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4" /> New Invoice
              </Button>
            </>
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <HimsStatsCard
            label="Today's Revenue"
            value={`₹${todayRevenue.toLocaleString('en-IN')}`}
            icon={IndianRupee}
            color="emerald"
          />
          <HimsStatsCard
            label="Total Revenue"
            value={`₹${totalRevenue.toLocaleString('en-IN')}`}
            icon={TrendingUp}
            color="blue"
          />
          <HimsStatsCard
            label="Paid Invoices"
            value={paidCount}
            icon={CheckCircle}
            color="emerald"
          />
          <HimsStatsCard
            label="Pending"
            value={pendingCount}
            icon={Clock}
            color={pendingCount > 0 ? 'amber' : 'emerald'}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-5">
          {(['all', 'paid', 'pending'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all min-h-[36px] border ${
                filter === f
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white dark:bg-surface-900 text-surface-600 dark:text-surface-400 border-surface-200 dark:border-surface-800 hover:bg-surface-50'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                filter === f ? 'bg-white/20' : 'bg-surface-100 dark:bg-surface-800'
              }`}>
                {f === 'all' ? invoices.length : f === 'paid' ? paidCount : pendingCount}
              </span>
            </button>
          ))}
        </div>

        {/* Invoice Table */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-surface-500">Loading invoices...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No invoices yet"
            description="Create your first invoice to get started"
            action={
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4" /> Create First Invoice
              </Button>
            }
          />
        ) : (
          <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200/60 dark:border-surface-800 overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-100 dark:border-surface-800">
                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-surface-500">Invoice</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-surface-500">Patient</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-surface-500 hidden lg:table-cell">Items</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-surface-500 hidden lg:table-cell">Method</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-surface-500">Status</th>
                    <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-surface-500">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-mono px-2 py-1 rounded-md bg-surface-50 dark:bg-surface-800 text-surface-600 dark:text-surface-400">
                          {inv.invoiceNumber}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-medium text-surface-900 dark:text-white">{inv.patientName}</span>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <span className="text-sm text-surface-500">{inv.items.length} item(s)</span>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <span className="text-xs px-2 py-1 rounded-full bg-surface-50 dark:bg-surface-800 text-surface-600 dark:text-surface-400 capitalize font-medium">
                          {inv.paymentMethod}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge
                          label={inv.paymentStatus}
                          variant={inv.paymentStatus === 'paid' ? 'success' : 'warning'}
                          dot
                        />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div>
                          <span className="text-sm font-bold text-surface-900 dark:text-white">
                            ₹{inv.total.toLocaleString('en-IN')}
                          </span>
                          {inv.discount > 0 && (
                            <p className="text-[10px] text-surface-400">-{inv.discount} discount</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-surface-100 dark:divide-surface-800">
              {filteredInvoices.map((inv) => (
                <div key={inv.id} className="px-4 py-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-surface-500">{inv.invoiceNumber}</span>
                    <StatusBadge
                      label={inv.paymentStatus}
                      variant={inv.paymentStatus === 'paid' ? 'success' : 'warning'}
                      dot
                    />
                  </div>
                  <p className="text-sm font-medium text-surface-900 dark:text-white">{inv.patientName}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs text-surface-500">{inv.items.length} item(s) &middot; {inv.paymentMethod}</span>
                    <span className="text-sm font-bold text-surface-900 dark:text-white">₹{inv.total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showCreate && <CreateInvoiceModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
