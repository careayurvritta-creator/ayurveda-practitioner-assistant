import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import InvoiceRepository, { InvoiceRecord } from '../db/InvoiceRepository';

interface BillingState {
  isLoading: boolean;
  invoices: InvoiceRecord[];
  todayRevenue: number;
  totalRevenue: number;
  selectedInvoice: InvoiceRecord | null;
  error: string | null;
}

const initialState: BillingState = {
  isLoading: false,
  invoices: [],
  todayRevenue: 0,
  totalRevenue: 0,
  selectedInvoice: null,
  error: null,
};

export const fetchInvoices = createAsyncThunk(
  'hims/billing/fetchAll',
  async () => {
    return await InvoiceRepository.findAll({ orderBy: 'createdAt', ascending: false });
  }
);

export const createInvoice = createAsyncThunk(
  'hims/billing/create',
  async (invoice: Omit<InvoiceRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    return await InvoiceRepository.create(invoice);
  }
);

export const updateInvoicePayment = createAsyncThunk(
  'hims/billing/updatePayment',
  async ({ id, paidAmount, status }: { id: string; paidAmount: number; status: InvoiceRecord['paymentStatus'] }) => {
    return await InvoiceRepository.update(id, { paidAmount, paymentStatus: status });
  }
);

const billingSlice = createSlice({
  name: 'hims/billing',
  initialState,
  reducers: {
    setSelectedInvoice(state, action: PayloadAction<InvoiceRecord | null>) {
      state.selectedInvoice = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoices.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.isLoading = false;
        state.invoices = action.payload;
        const today = new Date().toISOString().split('T')[0];
        state.todayRevenue = action.payload
          .filter(inv => inv.createdAt.startsWith(today) && inv.paymentStatus === 'paid')
          .reduce((sum, inv) => sum + inv.paidAmount, 0);
        state.totalRevenue = action.payload
          .filter(inv => inv.paymentStatus === 'paid')
          .reduce((sum, inv) => sum + inv.paidAmount, 0);
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch invoices';
      })
      .addCase(createInvoice.fulfilled, (state, action) => {
        state.invoices.unshift(action.payload);
      })
      .addCase(updateInvoicePayment.fulfilled, (state, action) => {
        const index = state.invoices.findIndex(inv => inv.id === action.payload.id);
        if (index !== -1) state.invoices[index] = action.payload;
        const today = new Date().toISOString().split('T')[0];
        state.todayRevenue = state.invoices
          .filter(inv => inv.createdAt.startsWith(today) && inv.paymentStatus === 'paid')
          .reduce((sum, inv) => sum + inv.paidAmount, 0);
        state.totalRevenue = state.invoices
          .filter(inv => inv.paymentStatus === 'paid')
          .reduce((sum, inv) => sum + inv.paidAmount, 0);
      });
  },
});

export const { setSelectedInvoice } = billingSlice.actions;
export default billingSlice.reducer;
