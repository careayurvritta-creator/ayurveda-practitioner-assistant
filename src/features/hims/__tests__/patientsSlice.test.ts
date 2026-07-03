import { configureStore } from '@reduxjs/toolkit';
import patientsReducer, {
  fetchPatients,
  createPatient,
  updatePatient,
  deletePatient,
} from '../slices/himsPatientSlice';

// Mock repositories
jest.mock('../db/PatientRepository', () => ({
  default: {
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockImplementation((p) => Promise.resolve({ ...p, id: 'test-id', createdAt: new Date().toISOString() })),
    update: jest.fn().mockImplementation((id, updates) => Promise.resolve({ id, ...updates })),
    delete: jest.fn().mockResolvedValue(undefined),
    searchByName: jest.fn().mockResolvedValue([]),
  },
}));

function createTestStore() {
  return configureStore({
    reducer: {
      patients: patientsReducer,
    },
  });
}

describe('himsPatientSlice', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  it('should return the initial state', () => {
    const state = store.getState().patients;
    expect(state).toEqual({
      isLoading: false,
      patients: [],
      selectedPatient: null,
      count: 0,
      error: null,
    });
  });

  it('should handle fetchPatients.fulfilled', async () => {
    const PatientRepository = require('../db/PatientRepository').default;
    PatientRepository.findAll.mockResolvedValue([
      { id: '1', name: 'Test Patient', mrn: 'MRN-001', age: 30, gender: 'Male', phone: '1234567890', createdAt: new Date().toISOString() },
    ]);

    await store.dispatch(fetchPatients());
    const state = store.getState().patients;
    expect(state.patients).toHaveLength(1);
    expect(state.patients[0].name).toBe('Test Patient');
    expect(state.count).toBe(1);
  });

  it('should handle createPatient.fulfilled', async () => {
    const PatientRepository = require('../db/PatientRepository').default;
    PatientRepository.create.mockResolvedValue({
      id: 'new-id', name: 'New Patient', mrn: 'MRN-123', age: 25, gender: 'Female',
      phone: '9876543210', createdAt: new Date().toISOString(),
    });

    await store.dispatch(createPatient({
      name: 'New Patient', age: 25, gender: 'Female', phone: '9876543210',
    }));
    const state = store.getState().patients;
    expect(state.patients).toHaveLength(1);
    expect(state.patients[0].name).toBe('New Patient');
  });

  it('should handle deletePatient.fulfilled', async () => {
    const PatientRepository = require('../db/PatientRepository').default;
    PatientRepository.findAll.mockResolvedValue([
      { id: '1', name: 'Patient 1', mrn: 'MRN-001', age: 30, gender: 'Male', phone: '1234567890', createdAt: new Date().toISOString() },
    ]);
    await store.dispatch(fetchPatients());

    await store.dispatch(deletePatient('1'));
    const state = store.getState().patients;
    expect(state.patients).toHaveLength(0);
  });

  it('should handle updatePatient.fulfilled', async () => {
    const PatientRepository = require('../db/PatientRepository').default;
    PatientRepository.findAll.mockResolvedValue([
      { id: '1', name: 'Old Name', mrn: 'MRN-001', age: 30, gender: 'Male', phone: '1234567890', createdAt: new Date().toISOString() },
    ]);
    await store.dispatch(fetchPatients());

    PatientRepository.update.mockResolvedValue({
      id: '1', name: 'New Name', mrn: 'MRN-001', age: 30, gender: 'Male', phone: '1234567890', createdAt: new Date().toISOString(),
    });

    await store.dispatch(updatePatient({ id: '1', updates: { name: 'New Name' } }));
    const state = store.getState().patients;
    expect(state.patients[0].name).toBe('New Name');
  });
});
