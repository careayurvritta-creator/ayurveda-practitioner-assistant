import { configureStore } from '@reduxjs/toolkit';
import opdReducer, { fetchVisits, createVisit, updateVisitStatus, deleteVisit } from '../slices/opdSlice';

jest.mock('../db/VisitRepository', () => ({
  default: {
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockImplementation((v) => Promise.resolve({ ...v, id: 'test-visit-id', createdAt: new Date().toISOString() })),
    update: jest.fn().mockImplementation((id, updates) => Promise.resolve({ id, ...updates })),
    delete: jest.fn().mockResolvedValue(undefined),
    findByDate: jest.fn().mockResolvedValue([]),
  },
}));

function createTestStore() {
  return configureStore({
    reducer: { opd: opdReducer },
  });
}

describe('opdSlice', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  it('should return the initial state', () => {
    const state = store.getState().opd;
    expect(state).toEqual({
      isLoading: false,
      visits: [],
      todayVisits: [],
      selectedVisit: null,
      error: null,
    });
  });

  it('should handle fetchVisits.fulfilled', async () => {
    const VisitRepository = require('../db/VisitRepository').default;
    const now = new Date().toISOString();
    VisitRepository.findAll.mockResolvedValue([
      { id: 'v1', patientId: 'p1', patientName: 'Test', doctorName: 'Dr. Test', visitDate: now, chiefComplaint: 'Fever', diagnosis: '', prescription: [], status: 'waiting', consultationFee: 500, createdAt: now },
    ]);

    await store.dispatch(fetchVisits());
    const state = store.getState().opd;
    expect(state.visits).toHaveLength(1);
    expect(state.visits[0].patientName).toBe('Test');
  });

  it('should handle createVisit.fulfilled', async () => {
    const VisitRepository = require('../db/VisitRepository').default;
    VisitRepository.create.mockResolvedValue({
      id: 'new-visit', patientId: 'p1', patientName: 'New Patient', doctorName: 'Dr. Test',
      visitDate: new Date().toISOString(), chiefComplaint: 'Headache', diagnosis: '',
      prescription: [], status: 'waiting', consultationFee: 500, createdAt: new Date().toISOString(),
    });

    await store.dispatch(createVisit({
      patientId: 'p1', patientName: 'New Patient', doctorName: 'Dr. Test',
      chiefComplaint: 'Headache', diagnosis: '', prescription: [],
      status: 'waiting', consultationFee: 500,
    }));

    const state = store.getState().opd;
    expect(state.visits).toHaveLength(1);
    expect(state.visits[0].chiefComplaint).toBe('Headache');
  });

  it('should handle deleteVisit.fulfilled', async () => {
    const VisitRepository = require('../db/VisitRepository').default;
    VisitRepository.findAll.mockResolvedValue([
      { id: 'v1', patientId: 'p1', patientName: 'Test', doctorName: 'Dr. Test', visitDate: new Date().toISOString(), chiefComplaint: 'Fever', diagnosis: '', prescription: [], status: 'waiting', consultationFee: 500, createdAt: new Date().toISOString() },
    ]);
    await store.dispatch(fetchVisits());

    await store.dispatch(deleteVisit('v1'));
    const state = store.getState().opd;
    expect(state.visits).toHaveLength(0);
  });

  it('should handle updateVisitStatus.fulfilled', async () => {
    const VisitRepository = require('../db/VisitRepository').default;
    VisitRepository.findAll.mockResolvedValue([
      { id: 'v1', patientId: 'p1', patientName: 'Test', doctorName: 'Dr. Test', visitDate: new Date().toISOString(), chiefComplaint: 'Fever', diagnosis: '', prescription: [], status: 'waiting', consultationFee: 500, createdAt: new Date().toISOString() },
    ]);
    await store.dispatch(fetchVisits());

    VisitRepository.update.mockResolvedValue({
      id: 'v1', patientId: 'p1', patientName: 'Test', doctorName: 'Dr. Test', visitDate: new Date().toISOString(), chiefComplaint: 'Fever', diagnosis: '', prescription: [], status: 'completed', consultationFee: 500, createdAt: new Date().toISOString(),
    });

    await store.dispatch(updateVisitStatus({ id: 'v1', status: 'completed' }));
    const state = store.getState().opd;
    expect(state.visits[0].status).toBe('completed');
  });
});
