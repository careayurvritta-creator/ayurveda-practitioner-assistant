import { HimsPermissions } from '../permissions';

export function usePermissions() {
  const permissions: HimsPermissions[] = [];

  const hasPermission = (permission: HimsPermissions): boolean => {
    return permissions.includes(permission);
  };

  return {
    permissions,
    hasPermission,
    canReadPatients: true,
    canWritePatients: true,
    canDeletePatient: true,
    canReadVisits: true,
    canWriteVisits: true,
    canUpdateVisitStatus: true,
    canCancelVisit: true,
    canReadInvoices: true,
    canWriteInvoices: true,
    canUpdatePayment: true,
    canReadMedicines: true,
    canWriteMedicines: true,
    canDeleteMedicine: true,
    canDispenseMedicine: true,
    canViewReports: true,
    canExportData: true,
  };
}
