import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CalendarPlus, Clock, User, Stethoscope, CheckCircle, XCircle, AlertCircle, Calendar } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchAppointments, checkInAppointment, cancelAppointment } from '../slices/appointmentSlice';
import { fetchPatients } from '../slices/himsPatientSlice';
import { AppointmentFormModal } from '../components/AppointmentFormModal';
import { AppointmentCalendar } from '../components/AppointmentCalendar';
import { Breadcrumbs } from '../../../components/ui/Breadcrumb';
import { PageHeader } from '../../../components/ui/PageHeader';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';
import { useToast } from '../../../contexts/ToastContext';
import { APPOINTMENT_STATUS_COLORS, APPOINTMENT_TYPE_LABELS } from '../types/appointment';

export default function HimsAppointments() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { appointments, isLoading } = useAppSelector((state) => state.hims.appointments);
  const { showToast } = useToast();

  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [cancelingAppointment, setCancelingAppointment] = useState<string | null>(null);

  const preSelectedPatient = location.state as {
    patientId: string;
    patientName: string;
    uhid: string;
  } | null;

  useEffect(() => {
    dispatch(fetchAppointments());
    dispatch(fetchPatients());
  }, [dispatch]);

  useEffect(() => {
    if (preSelectedPatient) {
      setShowNewAppointment(true);
    }
  }, [preSelectedPatient]);

  const selectedDateAppointments = appointments.filter(
    (apt) => apt.appointmentDate === selectedDate
  );

  const handleCheckIn = async (appointmentId: string) => {
    try {
      await dispatch(checkInAppointment(appointmentId)).unwrap();
      showToast('Patient checked in. OPD visit created.', 'success');
      navigate('/hims/opd');
    } catch {
      showToast('Failed to check in patient.', 'error');
    }
  };

  const handleCancel = async () => {
    if (!cancelingAppointment) return;
    try {
      await dispatch(cancelAppointment(cancelingAppointment)).unwrap();
      showToast('Appointment cancelled', 'success');
    } catch {
      showToast('Failed to cancel appointment.', 'error');
    }
    setCancelingAppointment(null);
  };

  const formatTime = (time: string) => {
    const [hours, mins] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${String(mins).padStart(2, '0')} ${period}`;
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Breadcrumbs items={[{ label: 'Appointments' }]} />
        <PageHeader
          title="Appointments"
          subtitle={`${selectedDateAppointments.length} appointments today`}
          actions={
            <Button onClick={() => setShowNewAppointment(true)}>
              <CalendarPlus className="w-4 h-4" />
              New Appointment
            </Button>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar — 2 cols */}
          <div className="lg:col-span-2">
            <AppointmentCalendar
              appointments={appointments}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </div>

          {/* Day's appointments */}
          <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200/60 dark:border-surface-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-800">
              <h3 className="font-semibold text-surface-900 dark:text-white text-sm">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </h3>
              <p className="text-xs text-surface-500 mt-0.5">
                {selectedDateAppointments.length} appointments
              </p>
            </div>

            <div className="divide-y divide-surface-100 dark:divide-surface-800 max-h-[600px] overflow-y-auto">
              {selectedDateAppointments.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No appointments"
                  description="No appointments scheduled for this date"
                  action={
                    <Button size="sm" onClick={() => setShowNewAppointment(true)}>
                      Book Appointment
                    </Button>
                  }
                />
              ) : (
                selectedDateAppointments.map((apt) => (
                  <div key={apt.id} className="px-4 py-3 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-surface-400" />
                        <span className="text-sm font-medium text-surface-900 dark:text-white">
                          {formatTime(apt.startTime)} - {formatTime(apt.endTime)}
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${APPOINTMENT_STATUS_COLORS[apt.status] || ''}`}>
                        {apt.status}
                      </span>
                    </div>

                    <div className="space-y-1 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-3.5 h-3.5 text-surface-400" />
                        <span className="text-surface-700 dark:text-surface-300">
                          {apt.patientName}
                        </span>
                        <span className="text-xs text-surface-500">{apt.uhid}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Stethoscope className="w-3.5 h-3.5 text-surface-400" />
                        <span className="text-surface-600 dark:text-surface-400">
                          {apt.doctorName}
                        </span>
                      </div>
                    </div>

                    {apt.reason && (
                      <p className="text-xs text-surface-500 mb-3 line-clamp-2">
                        {apt.reason}
                      </p>
                    )}

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-surface-500 bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded">
                        {APPOINTMENT_TYPE_LABELS[apt.type] || apt.type}
                      </span>

                      {apt.status === 'scheduled' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleCheckIn(apt.id)}
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Check-in
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setCancelingAppointment(apt.id)}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}

                      {apt.status === 'checked-in' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => navigate('/hims/opd')}
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          View OPD
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {showNewAppointment && (
        <AppointmentFormModal
          onClose={() => {
            setShowNewAppointment(false);
            navigate(location.pathname, { replace: true });
          }}
          preSelectedPatient={preSelectedPatient || undefined}
        />
      )}

      <ConfirmationDialog
        isOpen={!!cancelingAppointment}
        onClose={() => setCancelingAppointment(null)}
        onConfirm={handleCancel}
        title="Cancel Appointment"
        message="Are you sure you want to cancel this appointment? This action cannot be undone."
        confirmLabel="Cancel Appointment"
        cancelLabel="Keep"
      />
    </div>
  );
}
