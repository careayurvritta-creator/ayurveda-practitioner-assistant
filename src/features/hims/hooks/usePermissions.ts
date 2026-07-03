import { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { HimsPermissions } from '../permissions';

type UserRole = 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'pharmacist';

const ROLE_PERMISSIONS: Record<UserRole, HimsPermissions[]> = {
  admin: Object.values(HimsPermissions),
  doctor: [
    HimsPermissions.ReadPatients,
    HimsPermissions.WritePatients,
    HimsPermissions.ReadVisits,
    HimsPermissions.WriteVisits,
    HimsPermissions.UpdateVisitStatus,
    HimsPermissions.CancelVisit,
    HimsPermissions.ReadInvoices,
    HimsPermissions.ReadMedicines,
    HimsPermissions.ReadMedicines,
    HimsPermissions.DispenseMedicine,
    HimsPermissions.ViewReports,
    HimsPermissions.ExportData,
  ],
  nurse: [
    HimsPermissions.ReadPatients,
    HimsPermissions.ReadVisits,
    HimsPermissions.UpdateVisitStatus,
    HimsPermissions.ReadMedicines,
    HimsPermissions.DispenseMedicine,
  ],
  receptionist: [
    HimsPermissions.ReadPatients,
    HimsPermissions.WritePatients,
    HimsPermissions.ReadVisits,
    HimsPermissions.WriteVisits,
    HimsPermissions.ReadInvoices,
    HimsPermissions.WriteInvoices,
    HimsPermissions.UpdatePayment,
  ],
  pharmacist: [
    HimsPermissions.ReadPatients,
    HimsPermissions.ReadMedicines,
    HimsPermissions.WriteMedicines,
    HimsPermissions.DeleteMedicine,
    HimsPermissions.DispenseMedicine,
  ],
};

export function usePermissions() {
  const { currentUser } = useAuth();
  const [role, setRole] = useState<UserRole>('doctor');
  const [permissions, setPermissions] = useState<HimsPermissions[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    const fetchRole = async () => {
      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', currentUser.id)
          .single();

        if (data) {
          const userRole = data.role as UserRole;
          setRole(userRole);
          setPermissions(ROLE_PERMISSIONS[userRole] || []);
        } else {
          setRole('doctor');
          setPermissions(ROLE_PERMISSIONS.doctor);
        }
      } catch {
        setRole('doctor');
        setPermissions(ROLE_PERMISSIONS.doctor);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRole();
  }, [currentUser]);

  const hasPermission = (permission: HimsPermissions): boolean => {
    return permissions.includes(permission);
  };

  return {
    role,
    permissions,
    hasPermission,
    isLoading,
    canReadPatients: hasPermission(HimsPermissions.ReadPatients),
    canWritePatients: hasPermission(HimsPermissions.WritePatients),
    canDeletePatient: hasPermission(HimsPermissions.DeletePatient),
    canReadVisits: hasPermission(HimsPermissions.ReadVisits),
    canWriteVisits: hasPermission(HimsPermissions.WriteVisits),
    canUpdateVisitStatus: hasPermission(HimsPermissions.UpdateVisitStatus),
    canCancelVisit: hasPermission(HimsPermissions.CancelVisit),
    canReadInvoices: hasPermission(HimsPermissions.ReadInvoices),
    canWriteInvoices: hasPermission(HimsPermissions.WriteInvoices),
    canUpdatePayment: hasPermission(HimsPermissions.UpdatePayment),
    canReadMedicines: hasPermission(HimsPermissions.ReadMedicines),
    canWriteMedicines: hasPermission(HimsPermissions.WriteMedicines),
    canDeleteMedicine: hasPermission(HimsPermissions.DeleteMedicine),
    canDispenseMedicine: hasPermission(HimsPermissions.DispenseMedicine),
    canViewReports: hasPermission(HimsPermissions.ViewReports),
    canExportData: hasPermission(HimsPermissions.ExportData),
  };
}
