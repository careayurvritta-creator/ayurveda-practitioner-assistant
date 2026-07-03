import { configureStore, combineReducers } from '@reduxjs/toolkit';
import himsPatientReducer from '../features/hims/slices/himsPatientSlice';
import opdReducer from '../features/hims/slices/opdSlice';
import billingReducer from '../features/hims/slices/billingSlice';
import pharmacyReducer from '../features/hims/slices/pharmacySlice';
import appointmentReducer from '../features/hims/slices/appointmentSlice';

const rootReducer = combineReducers({
  hims: combineReducers({
    patients: himsPatientReducer,
    opd: opdReducer,
    billing: billingReducer,
    pharmacy: pharmacyReducer,
    appointments: appointmentReducer,
  }),
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefault) => getDefault(),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
