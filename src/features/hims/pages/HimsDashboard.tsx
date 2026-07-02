import { Users, Stethoscope, IndianRupee, Pill, AlertTriangle } from 'lucide-react';
import { useHimsPatients } from '../contexts/HimsPatientContext';
import { useOpd } from '../contexts/OpdContext';
import { useBilling } from '../contexts/BillingContext';
import { usePharmacy } from '../contexts/PharmacyContext';
import { HimsStatsCard } from '../layout/HimsStatsCard';

export default function HimsDashboard() {
  const { patients } = useHimsPatients();
  const { todayVisits, visits } = useOpd();
  const { todayRevenue, totalRevenue } = useBilling();
  const { lowStockMedicines, medicines } = usePharmacy();

  const recentVisits = visits.slice(0, 5);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="text-lg font-semibold text-surface-900 dark:text-white mb-6">
          Dashboard
        </h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <HimsStatsCard
            label="OPD Today"
            value={todayVisits.length}
            icon={Stethoscope}
            color="emerald"
          />
          <HimsStatsCard
            label="Total Patients"
            value={patients.length}
            icon={Users}
            color="blue"
          />
          <HimsStatsCard
            label="Today's Revenue"
            value={`₹${todayRevenue.toLocaleString('en-IN')}`}
            icon={IndianRupee}
            color="amber"
          />
          <HimsStatsCard
            label="Low Stock Items"
            value={lowStockMedicines.length}
            icon={AlertTriangle}
            color="red"
            trend={`${medicines.length} total medicines`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent OPD Visits */}
          <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
            <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700">
              <h2 className="font-medium text-surface-900 dark:text-white">Recent OPD Visits</h2>
            </div>
            <div className="divide-y divide-surface-100 dark:divide-surface-700">
              {recentVisits.length === 0 ? (
                <div className="px-4 py-8 text-center text-surface-500 text-sm">
                  No visits today
                </div>
              ) : (
                recentVisits.map((visit) => (
                  <div key={visit.id} className="px-4 py-3 flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-surface-900 dark:text-white truncate">
                        {visit.patientName}
                      </div>
                      <div className="text-xs text-surface-500">
                        {visit.doctorName} · {visit.chiefComplaint}
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        visit.status === 'completed'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : visit.status === 'in-progress'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : visit.status === 'waiting'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-surface-100 text-surface-500 dark:bg-surface-800'
                      }`}
                    >
                      {visit.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Low Stock Alert */}
          <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
            <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="font-medium text-surface-900 dark:text-white">Low Stock Alert</h2>
            </div>
            <div className="divide-y divide-surface-100 dark:divide-surface-700">
              {lowStockMedicines.length === 0 ? (
                <div className="px-4 py-8 text-center text-surface-500 text-sm">
                  All medicines well stocked
                </div>
              ) : (
                lowStockMedicines.slice(0, 5).map((med) => (
                  <div key={med.id} className="px-4 py-3 flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-surface-900 dark:text-white truncate">
                        {med.name}
                      </div>
                      <div className="text-xs text-surface-500">{med.category}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-red-600 dark:text-red-400">
                        {med.quantity} {med.unit}
                      </div>
                      <div className="text-xs text-surface-500">
                        Reorder: {med.reorderLevel}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Revenue Summary */}
        <div className="mt-6 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium text-surface-900 dark:text-white">Total Revenue</h2>
              <p className="text-xs text-surface-500 mt-1">All time collected payments</p>
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
