import { useState } from 'react';
import { Calendar, Check, Loader } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useGoogleCalendar } from '../../../contexts/GoogleCalendarContext';
import { useToast } from '../../../contexts/ToastContext';
import type { OpdVisit } from '../types';

interface CalendarSyncButtonProps {
  visit: OpdVisit;
  onSynced?: (eventId: string) => void;
}

export function CalendarSyncButton({ visit, onSynced }: CalendarSyncButtonProps) {
  const { isConnected, createCalendarEvent } = useGoogleCalendar();
  const { showToast } = useToast();
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  if (!isConnected) return null;

  const handleSync = async () => {
    setSyncing(true);
    try {
      const visitDate = new Date(visit.visitDate);
      const endTime = new Date(visitDate.getTime() + 30 * 60 * 1000);

      const eventId = await createCalendarEvent({
        summary: `${visit.patientName} - ${visit.doctorName}`,
        description: `Chief Complaint: ${visit.chiefComplaint}\nDiagnosis: ${visit.diagnosis || 'N/A'}`,
        startDateTime: visitDate.toISOString(),
        endDateTime: endTime.toISOString(),
      });

      if (eventId) {
        setSynced(true);
        onSynced?.(eventId);
        showToast('Synced to Google Calendar', 'success');
      }
    } catch (error) {
      showToast('Failed to sync to calendar', 'error');
    } finally {
      setSyncing(false);
    }
  };

  if (synced) {
    return (
      <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
        <Check className="w-3 h-3" />
        Synced
      </span>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSync}
      disabled={syncing}
      className="text-xs px-2 py-1"
    >
      {syncing ? (
        <Loader className="w-3 h-3 animate-spin" />
      ) : (
        <Calendar className="w-3 h-3" />
      )}
      <span className="ml-1">Sync</span>
    </Button>
  );
}
