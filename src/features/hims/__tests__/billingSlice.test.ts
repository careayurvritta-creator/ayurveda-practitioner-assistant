import { configureStore } from '@reduxjs/toolkit';
import billingReducer, { fetchInvoices, createInvoice } from '../slices/billingSlice';

jest.mock('../db/InvoiceRepository', () => ({
  default: {
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockImplementation((inv) => Promise.resolve({ ...inv, id: 'test-inv-id', createdAt: new Date().toISOString() })),
    generateInvoiceNumber: jest.fn().mockResolvedValue('INV-00001'),
  },
}));

function createTestStore() {
  return configureStore({
    reducer: { billing: billingReducer },
  });
}

describe('billingSlice', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  it('should return the initial state', () => {
    const state = store.getState().billing;
    expect(state).toEqual({
      isLoading: false,
      invoices: [],
      todayRevenue: 0,
      totalRevenue: 0,
      selectedInvoice: null,
      error: null,
    });
  });

  it('should handle fetchInvoices.fulfilled', async () => {
    const InvoiceRepository = require('../db/InvoiceRepository').default;
    InvoiceRepository.findAll.mockResolvedValue([
      {
        id: 'inv1', invoiceNumber: 'INV-00001', patientId: 'p1', patientName: 'Test',
        items: [], subtotal: 500, discount: 0, total: 500, paymentMethod: 'cash',
        paymentStatus: 'paid', paidAmount: 500, createdAt: new Date().toISOString(),
      },
    ]);

    await store.dispatch(fetchInvoices());
    const state = store.getState().billing;
    expect(state.invoices).toHaveLength(1);
    expect(state.totalRevenue).toBe(500);
  });

  it('should handle createInvoice.fulfilled', async () => {
    const InvoiceRepository = require('../db/InvoiceRepository').default;
    InvoiceRepository.create.mockResolvedValue({
      id: 'new-inv', invoiceNumber: 'INV-00002', patientId: 'p1', patientName: 'New Patient',
      items: [], subtotal: 1000, discount: 100, total: 900, paymentMethod: 'upi',
      paymentStatus: 'paid', paidAmount: 900, createdAt: new Date().toISOString(),
    });

    await store.dispatch(createInvoice({
      patientId: 'p1', patientName: 'New Patient', items: [],
      subtotal: 1000, discount: 100, total: 900, paymentMethod: 'upi',
      paymentStatus: 'paid', paidAmount: 900,
    }));

    const state = store.getState().billing;
    expect(state.invoices).toHaveLength(1);
    expect(state.invoices[0].total).toBe(900);
  });
});
