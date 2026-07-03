export enum HimsPermissions {
  ReadPatients = 'read:hims:patients',
  WritePatients = 'write:hims:patients',
  DeletePatient = 'delete:hims:patient',
  ReadVisits = 'read:hims:visits',
  WriteVisits = 'write:hims:visits',
  UpdateVisitStatus = 'update:hims:visit:status',
  CancelVisit = 'cancel:hims:visit',
  ReadInvoices = 'read:hims:invoices',
  WriteInvoices = 'write:hims:invoices',
  UpdatePayment = 'update:hims:invoice:payment',
  ReadMedicines = 'read:hims:medicines',
  WriteMedicines = 'write:hims:medicines',
  DeleteMedicine = 'delete:hims:medicine',
  DispenseMedicine = 'dispense:hims:medicine',
  ViewReports = 'read:hims:reports',
  ExportData = 'export:hims:data',
}

export const DEFAULT_PERMISSIONS: HimsPermissions[] = Object.values(HimsPermissions);
