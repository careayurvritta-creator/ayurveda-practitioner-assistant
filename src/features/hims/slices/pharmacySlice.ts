import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import MedicineRepository, { MedicineRecord, DispensingRecord } from '../db/MedicineRepository';

interface PharmacyState {
  isLoading: boolean;
  medicines: MedicineRecord[];
  lowStockMedicines: MedicineRecord[];
  dispensingRecords: DispensingRecord[];
  error: string | null;
}

const initialState: PharmacyState = {
  isLoading: false,
  medicines: [],
  lowStockMedicines: [],
  dispensingRecords: [],
  error: null,
};

export const fetchMedicines = createAsyncThunk(
  'hims/pharmacy/fetchAll',
  async () => {
    return await MedicineRepository.findAll({ orderBy: 'name', ascending: true });
  }
);

export const createMedicine = createAsyncThunk(
  'hims/pharmacy/create',
  async (medicine: Omit<MedicineRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    return await MedicineRepository.create(medicine);
  }
);

export const updateMedicine = createAsyncThunk(
  'hims/pharmacy/update',
  async ({ id, updates }: { id: string; updates: Partial<MedicineRecord> }) => {
    return await MedicineRepository.update(id, updates);
  }
);

export const deleteMedicine = createAsyncThunk(
  'hims/pharmacy/delete',
  async (id: string) => {
    await MedicineRepository.delete(id);
    return id;
  }
);

export const dispenseMedicine = createAsyncThunk(
  'hims/pharmacy/dispense',
  async (payload: {
    medicineId: string;
    quantity: number;
    patientId: string;
    patientName: string;
    visitId: string;
    dispensedBy: string;
  }) => {
    const record = await MedicineRepository.dispense({
      patientId: payload.patientId,
      patientName: payload.patientName,
      visitId: payload.visitId,
      medicineId: payload.medicineId,
      medicineName: '',
      quantityDispensed: payload.quantity,
      unit: '',
      dispensedBy: payload.dispensedBy,
      dispensedAt: new Date().toISOString(),
    });
    return record;
  }
);

const pharmacySlice = createSlice({
  name: 'hims/pharmacy',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMedicines.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMedicines.fulfilled, (state, action) => {
        state.isLoading = false;
        state.medicines = action.payload;
        state.lowStockMedicines = action.payload.filter(m => m.quantity <= m.reorderLevel);
      })
      .addCase(fetchMedicines.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch medicines';
      })
      .addCase(createMedicine.fulfilled, (state, action) => {
        state.medicines.push(action.payload);
        if (action.payload.quantity <= action.payload.reorderLevel) {
          state.lowStockMedicines.push(action.payload);
        }
      })
      .addCase(updateMedicine.fulfilled, (state, action) => {
        const index = state.medicines.findIndex(m => m.id === action.payload.id);
        if (index !== -1) state.medicines[index] = action.payload;
        state.lowStockMedicines = state.medicines.filter(m => m.quantity <= m.reorderLevel);
      })
      .addCase(deleteMedicine.fulfilled, (state, action) => {
        state.medicines = state.medicines.filter(m => m.id !== action.payload);
        state.lowStockMedicines = state.lowStockMedicines.filter(m => m.id !== action.payload);
      })
      .addCase(dispenseMedicine.fulfilled, (state, action) => {
        state.dispensingRecords.unshift(action.payload);
        const medIndex = state.medicines.findIndex(m => m.id === action.payload.medicineId);
        if (medIndex !== -1) {
          state.medicines[medIndex].quantity = Math.max(0, state.medicines[medIndex].quantity - action.payload.quantityDispensed);
          state.lowStockMedicines = state.medicines.filter(m => m.quantity <= m.reorderLevel);
        }
      });
  },
});

export default pharmacySlice.reducer;
