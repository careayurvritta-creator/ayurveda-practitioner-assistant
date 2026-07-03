import { HimsPermissions, DEFAULT_PERMISSIONS } from '../permissions';

describe('HimsPermissions', () => {
  it('should have all expected permissions', () => {
    expect(DEFAULT_PERMISSIONS).toContain(HimsPermissions.ReadPatients);
    expect(DEFAULT_PERMISSIONS).toContain(HimsPermissions.WritePatients);
    expect(DEFAULT_PERMISSIONS).toContain(HimsPermissions.DeletePatient);
    expect(DEFAULT_PERMISSIONS).toContain(HimsPermissions.ReadVisits);
    expect(DEFAULT_PERMISSIONS).toContain(HimsPermissions.WriteVisits);
    expect(DEFAULT_PERMISSIONS).toContain(HimsPermissions.UpdateVisitStatus);
    expect(DEFAULT_PERMISSIONS).toContain(HimsPermissions.CancelVisit);
    expect(DEFAULT_PERMISSIONS).toContain(HimsPermissions.ReadInvoices);
    expect(DEFAULT_PERMISSIONS).toContain(HimsPermissions.WriteInvoices);
    expect(DEFAULT_PERMISSIONS).toContain(HimsPermissions.UpdatePayment);
    expect(DEFAULT_PERMISSIONS).toContain(HimsPermissions.ReadMedicines);
    expect(DEFAULT_PERMISSIONS).toContain(HimsPermissions.WriteMedicines);
    expect(DEFAULT_PERMISSIONS).toContain(HimsPermissions.DeleteMedicine);
    expect(DEFAULT_PERMISSIONS).toContain(HimsPermissions.DispenseMedicine);
    expect(DEFAULT_PERMISSIONS).toContain(HimsPermissions.ViewReports);
    expect(DEFAULT_PERMISSIONS).toContain(HimsPermissions.ExportData);
  });

  it('should have 16 permissions total', () => {
    expect(DEFAULT_PERMISSIONS).toHaveLength(16);
  });

  it('should have correct permission string format', () => {
    expect(HimsPermissions.ReadPatients).toBe('read:hims:patients');
    expect(HimsPermissions.WritePatients).toBe('write:hims:patients');
    expect(HimsPermissions.DeletePatient).toBe('delete:hims:patient');
    expect(HimsPermissions.DispenseMedicine).toBe('dispense:hims:medicine');
  });
});
