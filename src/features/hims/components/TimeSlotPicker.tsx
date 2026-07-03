import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchAvailableSlots } from '../slices/appointmentSlice';

interface TimeSlotPickerProps {
  date: string;
  doctorName: string;
  selectedSlot: string;
  onSelectSlot: (slot: string) => void;
}

export function TimeSlotPicker({ date, doctorName, selectedSlot, onSelectSlot }: TimeSlotPickerProps) {
  const dispatch = useAppDispatch();
  const { availableSlots, isLoading } = useAppSelector((state) => state.hims.appointments);

  useEffect(() => {
    if (date && doctorName) {
      dispatch(fetchAvailableSlots({ date, doctorName }));
    }
  }, [date, doctorName, dispatch]);

  if (isLoading) {
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
          Available Time Slots
        </label>
        <div className="flex items-center justify-center py-8 text-surface-500">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
        Available Time Slots
      </label>
      <div className="grid grid-cols-4 gap-2">
        {availableSlots.map((slot) => (
          <button
            key={slot.time}
            type="button"
            onClick={() => slot.available && onSelectSlot(slot.time)}
            disabled={!slot.available}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors min-h-[40px] ${
              selectedSlot === slot.time
                ? 'bg-emerald-600 text-white shadow-md'
                : slot.available
                ? 'bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-400'
                : 'bg-surface-50 dark:bg-surface-800 text-surface-400 dark:text-surface-500 cursor-not-allowed line-through'
            }`}
          >
            {slot.time}
          </button>
        ))}
      </div>
    </div>
  );
}
