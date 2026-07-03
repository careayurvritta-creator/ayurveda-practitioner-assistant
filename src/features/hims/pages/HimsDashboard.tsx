import { useEffect } from 'react';
import { Users, Stethoscope, IndianRupee, Pill, AlertTriangle, TrendingUp, Clock, ArrowRight, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchPatients } from '../slices/himsPatientSlice';
import { fetchVisits } from '../slices/opdSlice';
import { fetchInvoices } from '../slices/billingSlice';
import { fetchMedicines } from '../slices/pharmacySlice';
import { HimsStatsCard } from '../layout/HimsStatsCard';
import { Breadcrumbs } from '../../../components/ui/Breadcrumb';
import { StatusBadge, getStatusVariant } from '../../../components/ui/StatusBadge';

export default function HimsDashboard() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { patients } = useAppSelector((state) => state.hims.patients);
  const { todayVisits, visits } = useAppSelector((state) => state.hims.opd);
  const { todayRevenue, totalRevenue, invoices } = useAppSelector((state) => state.hims.billing);
  const { lowStockMedicines, medicines } = useAppSelector((state) => state.hims.pharmacy);

  useEffect(() => {
    dispatch(fetchPatients());
    dispatch(fetchVisits());
    dispatch(fetchInvoices());
    dispatch(fetchMedicines());
  }, [dispatch]);

  const recentVisits = todayVisits.slice(0, 5);
  const pendingInvoices = invoices.filter((inv) => inv.paymentStatus === 'pending').length;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Breadcrumbs items={[{ label: 'Dashboard' }]} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white tracking-tight">
              Dashboard
            </h1>
            <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
              Welcome back. Here's your practice overview.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/hims/opd')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/25 min-h-[44px]"
            >
              <Stethoscope className="w-4 h-4" />
              New OPD Visit
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <HimsStatsCard
            label="Today's Revenue"
            value={`₹${todayRevenue.toLocaleString('en-IN')}`}
            icon={IndianRupee}
            color="emerald"
            trend={`${totalRevenue.toLocaleString('en-IN')} total`}
          />
          <HimsStatsCard
            label="OPD Visits Today"
            value={todayVisits.length}
            icon={Stethoscope}
            color="blue"
            trend={`${visits.length} all time`}
          />
          <HimsStatsCard
            label="Total Patients"
            value={patients.length}
            icon={Users}
            color="purple"
            trend="Registered patients"
          />
          <HimsStatsCard
            label="Low Stock Items"
            value={lowStockMedicines.length}
            icon={AlertTriangle}
            color={lowStockMedicines.length > 0 ? 'red' : 'amber'}
            trend={`${medicines.length} total medicines`}
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Recent OPD Visits — 2 cols */}
          <div className="lg:col-span-2 bg-white dark:bg-surface-900 rounded-xl border border-surface-200/60 dark:border-surface-800 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100 dark:border-surface-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                <h2 className="font-semibold text-surface-900 dark:text-white text-sm">Recent OPD Visits</h2>
              </div>
              <button
                onClick={() => navigate('/hims/opd')}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-medium flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-surface-100 dark:divide-surface-800">
              {recentVisits.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <Clock className="w-8 h-8 mx-auto text-surface-300 dark:text-surface-600 mb-2" />
                  <p className="text-sm text-surface-500">No visits today</p>
                  <button
                    onClick={() => navigate('/hims/opd')}
                    className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
                  >
                    Create a visit
                  </button>
                </div>
              ) : (
                recentVisits.map((visit) => (
                  <div key={visit.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-surface-900 dark:text-white truncate">
                          {visit.patientName}
                        </span>
                        <StatusBadge label={visit.status} variant={getStatusVariant(visit.status)} dot />
                      </div>
                      <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 truncate">
                        {visit.doctorName} &middot; {visit.chiefComplaint}
                      </p>
                    </div>
                    <span className="text-xs text-surface-400 dark:text-surface-500 ml-3 shrink-0">
                      ₹{visit.consultationFee}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right column: Low Stock + Quick Actions */}
          <div className="space-y-4 sm:space-y-6">
            {/* Low Stock Alert */}
            <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200/60 dark:border-surface-800 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100 dark:border-surface-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <h2 className="font-semibold text-surface-900 dark:text-white text-sm">Low Stock</h2>
                </div>
                <button
                  onClick={() => navigate('/hims/pharmacy')}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-medium flex items-center gap-1"
                >
                  View <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="divide-y divide-surface-100 dark:divide-surface-800">
                {lowStockMedicines.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <Pill className="w-6 h-6 mx-auto text-surface-300 dark:text-surface-600 mb-2" />
                    <p className="text-xs text-surface-500">All medicines well stocked</p>
                  </div>
                ) : (
                  lowStockMedicines.slice(0, 5).map((med) => (
                    <div key={med.id} className="px-5 py-3 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-surface-900 dark:text-white truncate">{med.name}</p>
                        <p className="text-xs text-surface-400">{med.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                          {med.quantity} {med.unit}
                        </p>
                        <p className="text-[10px] text-surface-400">Reorder: {med.reorderLevel}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Revenue Summary */}
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white shadow-lg shadow-emerald-500/25">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-emerald-100" />
                <span className="text-xs font-medium text-emerald-100">Total Revenue</span>
              </div>
              <p className="text-3xl font-bold tracking-tight">
                ₹{totalRevenue.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-emerald-100 mt-1">
                {invoices.length} invoices &middot; {invoices.filter((i) => i.paymentStatus === 'paid').length} paid
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
