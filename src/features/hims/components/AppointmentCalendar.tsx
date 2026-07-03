import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import type { AppointmentRecord } from '../db/AppointmentRepository';

interface AppointmentCalendarProps {
  appointments: AppointmentRecord[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const STATUS_DOT_COLORS: Record<string, string> = {
  'scheduled': 'bg-blue-500',
  'confirmed': 'bg-emerald-500',
  'checked-in': 'bg-amber-500',
  'completed': 'bg-green-500',
  'cancelled': 'bg-surface-400',
  'no-show': 'bg-red-500',
};

export function AppointmentCalendar({ appointments, selectedDate, onSelectDate }: AppointmentCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = new Date().toISOString().split('T')[0];

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days: Array<{ date: string; isCurrentMonth: boolean; isToday: boolean }> = [];

    const prevMonth = new Date(year, month, 0);
    for (let i = startPadding - 1; i >= 0; i--) {
      const d = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevMonth.getDate() - i);
      days.push({
        date: d.toISOString().split('T')[0],
        isCurrentMonth: false,
        isToday: d.toISOString().split('T')[0] === today,
      });
    }

    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      days.push({
        date: d.toISOString().split('T')[0],
        isCurrentMonth: true,
        isToday: d.toISOString().split('T')[0] === today,
      });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d.toISOString().split('T')[0],
        isCurrentMonth: false,
        isToday: d.toISOString().split('T')[0] === today,
      });
    }

    return days;
  }, [currentMonth, today]);

  const appointmentsByDate = useMemo(() => {
    const map: Record<string, AppointmentRecord[]> = {};
    appointments.forEach((apt) => {
      if (!map[apt.appointmentDate]) {
        map[apt.appointmentDate] = [];
      }
      map[apt.appointmentDate].push(apt);
    });
    return map;
  }, [appointments]);

  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    onSelectDate(today);
  };

  return (
    <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200/60 dark:border-surface-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100 dark:border-surface-800">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-emerald-500" />
          <h3 className="font-semibold text-surface-900 dark:text-white text-sm">
            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={goToToday}
            className="px-2 py-1 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md transition-colors"
          >
            Today
          </button>
          <button
            onClick={goToPrevMonth}
            className="p-1 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-md transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-surface-600 dark:text-surface-400" />
          </button>
          <button
            onClick={goToNextMonth}
            className="p-1 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-md transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-surface-600 dark:text-surface-400" />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-surface-100 dark:border-surface-800">
        {DAYS.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-surface-500 dark:text-surface-400"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day) => {
          const dayAppointments = appointmentsByDate[day.date] || [];
          const statusCounts = dayAppointments.reduce(
            (acc, apt) => {
              acc[apt.status] = (acc[apt.status] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          );

          return (
            <button
              key={day.date}
              onClick={() => onSelectDate(day.date)}
              className={`relative p-2 min-h-[72px] border-b border-r border-surface-100 dark:border-surface-800 transition-colors ${
                selectedDate === day.date
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 ring-2 ring-inset ring-emerald-500'
                  : day.isToday
                  ? 'bg-surface-50 dark:bg-surface-800/50'
                  : 'hover:bg-surface-50 dark:hover:bg-surface-800/30'
              } ${!day.isCurrentMonth ? 'opacity-40' : ''}`}
            >
              <span
                className={`text-sm font-medium ${
                  day.isToday
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                    : selectedDate === day.date
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-surface-700 dark:text-surface-300'
                }`}
              >
                {new Date(day.date + 'T00:00:00').getDate()}
              </span>

              {/* Appointment dots */}
              {dayAppointments.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1 justify-center">
                  {Object.entries(statusCounts).map(([status, count]) => (
                    <div
                      key={status}
                      className="flex items-center gap-0.5"
                      title={`${count} ${status}`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT_COLORS[status] || 'bg-surface-400'}`}
                      />
                      {count > 1 && (
                        <span className="text-[9px] text-surface-500">{count}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {dayAppointments.length > 3 && (
                <div className="absolute bottom-1 right-1">
                  <span className="text-[9px] text-surface-500 font-medium">
                    +{dayAppointments.length - 3}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
