import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import VisitRepository, { VisitRecord } from '../db/VisitRepository';
import { canTransition } from '../types';

interface OpdState {
  isLoading: boolean;
  visits: VisitRecord[];
  todayVisits: VisitRecord[];
  selectedVisit: VisitRecord | null;
  error: string | null;
}

const initialState: OpdState = {
  isLoading: false,
  visits: [],
  todayVisits: [],
  selectedVisit: null,
  error: null,
};

export const fetchVisits = createAsyncThunk(
  'hims/opd/fetchAll',
  async (date?: string) => {
    if (date) return await VisitRepository.findByDate(date);
    return await VisitRepository.findAll({ orderBy: 'visitDate', ascending: false });
  }
);

export const createVisit = createAsyncThunk(
  'hims/opd/create',
  async (visit: Omit<VisitRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    return await VisitRepository.create(visit);
  }
);

export const updateVisitStatus = createAsyncThunk(
  'hims/opd/updateStatus',
  async ({ id, status }: { id: string; status: VisitRecord['status'] }) => {
    const now = new Date().toISOString();
    const updates: Partial<VisitRecord> = { status };
    if (status === 'in-progress') updates.startedAt = now;
    if (status === 'completed') updates.completedAt = now;
    if (status === 'cancelled') updates.cancelledAt = now;
    return await VisitRepository.update(id, updates);
  }
);

export const updateVisit = createAsyncThunk(
  'hims/opd/update',
  async ({ id, updates }: { id: string; updates: Partial<VisitRecord> }) => {
    return await VisitRepository.update(id, updates);
  }
);

export const deleteVisit = createAsyncThunk(
  'hims/opd/delete',
  async (id: string) => {
    await VisitRepository.delete(id);
    return id;
  }
);

const opdSlice = createSlice({
  name: 'hims/opd',
  initialState,
  reducers: {
    setSelectedVisit(state, action: PayloadAction<VisitRecord | null>) {
      state.selectedVisit = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVisits.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchVisits.fulfilled, (state, action) => {
        state.isLoading = false;
        state.visits = action.payload;
        const today = new Date().toISOString().split('T')[0];
        state.todayVisits = action.payload.filter(v => v.visitDate.startsWith(today));
      })
      .addCase(fetchVisits.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch visits';
      })
      .addCase(createVisit.fulfilled, (state, action) => {
        state.visits.unshift(action.payload);
        const today = new Date().toISOString().split('T')[0];
        if (action.payload.visitDate.startsWith(today)) {
          state.todayVisits.unshift(action.payload);
        }
      })
      .addCase(updateVisitStatus.fulfilled, (state, action) => {
        const index = state.visits.findIndex(v => v.id === action.payload.id);
        if (index !== -1) state.visits[index] = action.payload;
        const todayIndex = state.todayVisits.findIndex(v => v.id === action.payload.id);
        if (todayIndex !== -1) state.todayVisits[todayIndex] = action.payload;
      })
      .addCase(updateVisit.fulfilled, (state, action) => {
        const index = state.visits.findIndex(v => v.id === action.payload.id);
        if (index !== -1) state.visits[index] = action.payload;
        const todayIndex = state.todayVisits.findIndex(v => v.id === action.payload.id);
        if (todayIndex !== -1) state.todayVisits[todayIndex] = action.payload;
      })
      .addCase(deleteVisit.fulfilled, (state, action) => {
        state.visits = state.visits.filter(v => v.id !== action.payload);
        state.todayVisits = state.todayVisits.filter(v => v.id !== action.payload);
      });
  },
});

export const { setSelectedVisit } = opdSlice.actions;
export default opdSlice.reducer;
