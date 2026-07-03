import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AppointmentRepository, { AppointmentRecord } from '../db/AppointmentRepository';

interface AppointmentState {
  isLoading: boolean;
  appointments: AppointmentRecord[];
  todayAppointments: AppointmentRecord[];
  selectedAppointment: AppointmentRecord | null;
  availableSlots: Array<{ time: string; available: boolean }>;
  error: string | null;
}

const initialState: AppointmentState = {
  isLoading: false,
  appointments: [],
  todayAppointments: [],
  selectedAppointment: null,
  availableSlots: [],
  error: null,
};

export const fetchAppointments = createAsyncThunk(
  'hims/appointments/fetchAll',
  async (date?: string) => {
    if (date) return await AppointmentRepository.findByDate(date);
    return await AppointmentRepository.findAll({ orderBy: 'appointment_date', ascending: false });
  }
);

export const fetchAppointmentsByDoctor = createAsyncThunk(
  'hims/appointments/fetchByDoctor',
  async ({ doctorName, date }: { doctorName: string; date?: string }) => {
    return await AppointmentRepository.findByDoctor(doctorName, date);
  }
);

export const fetchAvailableSlots = createAsyncThunk(
  'hims/appointments/fetchSlots',
  async ({ date, doctorName }: { date: string; doctorName: string }) => {
    return await AppointmentRepository.generateTimeSlots(date, doctorName);
  }
);

export const createAppointment = createAsyncThunk(
  'hims/appointments/create',
  async (appointment: Omit<AppointmentRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    return await AppointmentRepository.create(appointment);
  }
);

export const updateAppointment = createAsyncThunk(
  'hims/appointments/update',
  async ({ id, updates }: { id: string; updates: Partial<AppointmentRecord> }) => {
    return await AppointmentRepository.update(id, updates);
  }
);

export const cancelAppointment = createAsyncThunk(
  'hims/appointments/cancel',
  async (id: string) => {
    return await AppointmentRepository.update(id, { status: 'cancelled' });
  }
);

export const checkInAppointment = createAsyncThunk(
  'hims/appointments/checkIn',
  async (appointmentId: string) => {
    return await AppointmentRepository.checkIn(appointmentId);
  }
);

export const deleteAppointment = createAsyncThunk(
  'hims/appointments/delete',
  async (id: string) => {
    await AppointmentRepository.delete(id);
    return id;
  }
);

const appointmentSlice = createSlice({
  name: 'hims/appointments',
  initialState,
  reducers: {
    setSelectedAppointment(state, action: PayloadAction<AppointmentRecord | null>) {
      state.selectedAppointment = action.payload;
    },
    clearAvailableSlots(state) {
      state.availableSlots = [];
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAppointments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.appointments = action.payload;
        const today = new Date().toISOString().split('T')[0];
        state.todayAppointments = action.payload.filter(
          (a) => a.appointmentDate === today
        );
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch appointments';
      })
      .addCase(fetchAppointmentsByDoctor.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAppointmentsByDoctor.fulfilled, (state, action) => {
        state.isLoading = false;
        state.appointments = action.payload;
      })
      .addCase(fetchAppointmentsByDoctor.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch appointments';
      })
      .addCase(fetchAvailableSlots.fulfilled, (state, action) => {
        state.availableSlots = action.payload;
      })
      .addCase(createAppointment.fulfilled, (state, action) => {
        state.appointments.unshift(action.payload);
        const today = new Date().toISOString().split('T')[0];
        if (action.payload.appointmentDate === today) {
          state.todayAppointments.unshift(action.payload);
        }
      })
      .addCase(updateAppointment.fulfilled, (state, action) => {
        const index = state.appointments.findIndex((a) => a.id === action.payload.id);
        if (index !== -1) state.appointments[index] = action.payload;
        const todayIndex = state.todayAppointments.findIndex(
          (a) => a.id === action.payload.id
        );
        if (todayIndex !== -1) state.todayAppointments[todayIndex] = action.payload;
      })
      .addCase(cancelAppointment.fulfilled, (state, action) => {
        const index = state.appointments.findIndex((a) => a.id === action.payload.id);
        if (index !== -1) state.appointments[index] = action.payload;
        const todayIndex = state.todayAppointments.findIndex(
          (a) => a.id === action.payload.id
        );
        if (todayIndex !== -1) state.todayAppointments[todayIndex] = action.payload;
      })
      .addCase(checkInAppointment.fulfilled, (state, action) => {
        const appointment = action.payload.appointment;
        const index = state.appointments.findIndex((a) => a.id === appointment.id);
        if (index !== -1) state.appointments[index] = appointment;
        const todayIndex = state.todayAppointments.findIndex(
          (a) => a.id === appointment.id
        );
        if (todayIndex !== -1) state.todayAppointments[todayIndex] = appointment;
      })
      .addCase(deleteAppointment.fulfilled, (state, action) => {
        state.appointments = state.appointments.filter((a) => a.id !== action.payload);
        state.todayAppointments = state.todayAppointments.filter(
          (a) => a.id !== action.payload
        );
      });
  },
});

export const { setSelectedAppointment, clearAvailableSlots, clearError } =
  appointmentSlice.actions;
export default appointmentSlice.reducer;
