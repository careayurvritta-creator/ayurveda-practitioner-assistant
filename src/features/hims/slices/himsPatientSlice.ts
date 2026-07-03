import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import PatientRepository, { PatientRecord } from '../db/PatientRepository';

interface HimsPatientState {
  isLoading: boolean;
  patients: PatientRecord[];
  selectedPatient: PatientRecord | null;
  count: number;
  error: string | null;
}

const initialState: HimsPatientState = {
  isLoading: false,
  patients: [],
  selectedPatient: null,
  count: 0,
  error: null,
};

export const fetchPatients = createAsyncThunk(
  'hims/patients/fetchAll',
  async () => {
    return await PatientRepository.findAll({ orderBy: 'createdAt', ascending: false });
  }
);

export const searchPatients = createAsyncThunk(
  'hims/patients/search',
  async (query: string) => {
    if (!query.trim()) return await PatientRepository.findAll({ orderBy: 'createdAt', ascending: false });
    return await PatientRepository.searchByName(query);
  }
);

export const createPatient = createAsyncThunk(
  'hims/patients/create',
  async (patient: Omit<PatientRecord, 'id' | 'mrn' | 'createdAt' | 'updatedAt'>) => {
    const mrn = await PatientRepository.generateUHID();
    return await PatientRepository.create({ ...patient, mrn });
  }
);

export const updatePatient = createAsyncThunk(
  'hims/patients/update',
  async ({ id, updates }: { id: string; updates: Partial<PatientRecord> }) => {
    return await PatientRepository.update(id, updates);
  }
);

export const deletePatient = createAsyncThunk(
  'hims/patients/delete',
  async (id: string) => {
    await PatientRepository.delete(id);
    return id;
  }
);

const himsPatientSlice = createSlice({
  name: 'hims/patients',
  initialState,
  reducers: {
    setSelectedPatient(state, action: PayloadAction<PatientRecord | null>) {
      state.selectedPatient = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPatients.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPatients.fulfilled, (state, action) => {
        state.isLoading = false;
        state.patients = action.payload;
        state.count = action.payload.length;
      })
      .addCase(fetchPatients.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch patients';
      })
      .addCase(searchPatients.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(searchPatients.fulfilled, (state, action) => {
        state.isLoading = false;
        state.patients = action.payload;
        state.count = action.payload.length;
      })
      .addCase(searchPatients.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Search failed';
      })
      .addCase(createPatient.fulfilled, (state, action) => {
        state.patients.unshift(action.payload);
        state.count += 1;
      })
      .addCase(updatePatient.fulfilled, (state, action) => {
        const index = state.patients.findIndex(p => p.id === action.payload.id);
        if (index !== -1) state.patients[index] = action.payload;
        if (state.selectedPatient?.id === action.payload.id) {
          state.selectedPatient = action.payload;
        }
      })
      .addCase(deletePatient.fulfilled, (state, action) => {
        state.patients = state.patients.filter(p => p.id !== action.payload);
        state.count -= 1;
        if (state.selectedPatient?.id === action.payload) {
          state.selectedPatient = null;
        }
      });
  },
});

export const { setSelectedPatient, clearError } = himsPatientSlice.actions;
export default himsPatientSlice.reducer;
