import { Repository, BaseEntity } from './Repository';
import { supabase } from '../../../supabase';

export interface AppointmentRecord extends BaseEntity {
  patientId: string;
  patientName: string;
  uhid: string;
  doctorName: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  type: 'consultation' | 'follow-up' | 'therapy' | 'panchakarma' | 'emergency' | 'walk-in';
  status: 'scheduled' | 'confirmed' | 'checked-in' | 'completed' | 'cancelled' | 'no-show';
  reason?: string;
  notes?: string;
  chamber?: string;
  visitId?: string;
}

export interface DoctorScheduleRecord extends BaseEntity {
  doctorName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  maxPatients: number;
  isActive: boolean;
}

class AppointmentRepository extends Repository<AppointmentRecord> {
  constructor() {
    super('hims_appointments');
  }

  async findByDate(date: string): Promise<AppointmentRecord[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('appointment_date', date)
      .order('start_time', { ascending: true });
    if (error) throw error;
    return (data || []) as AppointmentRecord[];
  }

  async findByDoctor(doctorName: string, date?: string): Promise<AppointmentRecord[]> {
    let query = supabase
      .from(this.tableName)
      .select('*')
      .eq('doctor_name', doctorName);
    if (date) {
      query = query.eq('appointment_date', date);
    }
    const { data, error } = await query.order('start_time', { ascending: true });
    if (error) throw error;
    return (data || []) as AppointmentRecord[];
  }

  async findByPatient(patientId: string): Promise<AppointmentRecord[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('patient_id', patientId)
      .order('appointment_date', { ascending: false });
    if (error) throw error;
    return (data || []) as AppointmentRecord[];
  }

  async findConflicts(
    doctorName: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): Promise<AppointmentRecord[]> {
    let query = supabase
      .from(this.tableName)
      .select('*')
      .eq('doctor_name', doctorName)
      .eq('appointment_date', date)
      .not('status', 'in', ['cancelled', 'no-show'])
      .lt('start_time', endTime)
      .gt('end_time', startTime);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as AppointmentRecord[];
  }

  async findConflictsCount(
    doctorName: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): Promise<number> {
    const conflicts = await this.findConflicts(doctorName, date, startTime, endTime, excludeId);
    return conflicts.length;
  }

  async generateTimeSlots(
    date: string,
    doctorName: string
  ): Promise<Array<{ time: string; available: boolean }>> {
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();

    const { data: scheduleData, error: scheduleError } = await supabase
      .from('hims_doctor_schedules')
      .select('*')
      .eq('doctor_name', doctorName)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .single();

    if (scheduleError || !scheduleData) {
      return this.generateDefaultSlots();
    }

    const existingAppointments = await this.findByDate(date);
    const doctorAppointments = existingAppointments.filter(
      (a) => a.doctorName === doctorName && !['cancelled', 'no-show'].includes(a.status)
    );

    const slots: Array<{ time: string; available: boolean }> = [];
    const [startHour, startMin] = scheduleData.start_time.split(':').map(Number);
    const [endHour, endMin] = scheduleData.end_time.split(':').map(Number);
    const slotDuration = scheduleData.slotDuration || 30;

    let currentMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    while (currentMinutes < endMinutes) {
      const hours = Math.floor(currentMinutes / 60);
      const mins = currentMinutes % 60;
      const timeStr = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;

      const slotEndMinutes = currentMinutes + slotDuration;
      const slotEndStr = `${String(Math.floor(slotEndMinutes / 60)).padStart(2, '0')}:${String(slotEndMinutes % 60).padStart(2, '0')}`;

      const isBooked = doctorAppointments.some(
        (a) => a.startTime < slotEndStr && a.endTime > timeStr
      );

      slots.push({
        time: timeStr,
        available: !isBooked,
      });

      currentMinutes += slotDuration;
    }

    return slots;
  }

  private generateDefaultSlots(): Array<{ time: string; available: boolean }> {
    const slots: Array<{ time: string; available: boolean }> = [];
    let currentMinutes = 10 * 60;
    const endMinutes = 19 * 60;

    while (currentMinutes < endMinutes) {
      const hours = Math.floor(currentMinutes / 60);
      const mins = currentMinutes % 60;
      slots.push({
        time: `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`,
        available: true,
      });
      currentMinutes += 30;
    }

    return slots;
  }

  async checkIn(appointmentId: string): Promise<{ appointment: AppointmentRecord; visitId: string }> {
    const appointment = await this.findById(appointmentId);
    if (!appointment) throw new Error('Appointment not found');

    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const { count } = await supabase
      .from('hims_visits')
      .select('*', { count: 'exact', head: true })
      .like('visit_id', `${appointment.uhid}/OPD/${today}%`);
    const seq = (count || 0) + 1;
    const visitId = `${appointment.uhid}/OPD/${today}/${String(seq).padStart(2, '0')}`;

    const { data: visitData, error: visitError } = await supabase
      .from('hims_visits')
      .insert({
        id: crypto.randomUUID(),
        uhid: appointment.uhid,
        visit_id: visitId,
        patient_id: appointment.patientId,
        patient_name: appointment.patientName,
        doctor_name: appointment.doctorName,
        visit_date: new Date().toISOString(),
        chief_complaint: appointment.reason || 'Follow-up consultation',
        diagnosis: '',
        prescription: '[]',
        notes: appointment.notes || '',
        status: 'waiting',
        consultation_fee: 500,
        appointment_id: appointmentId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (visitError) throw visitError;

    await this.update(appointmentId, {
      status: 'checked-in',
      visitId: visitData.id,
    });

    return { appointment, visitId };
  }

  async generateVisitId(uhid: string, type: 'OPD' | 'IPD'): Promise<string> {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const { count } = await supabase
      .from('hims_visits')
      .select('*', { count: 'exact', head: true })
      .like('visit_id', `${uhid}/${type}/${date}%`);
    const seq = (count || 0) + 1;
    return `${uhid}/${type}/${date}/${String(seq).padStart(2, '0')}`;
  }
}

export default new AppointmentRepository();
