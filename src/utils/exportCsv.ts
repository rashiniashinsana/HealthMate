import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { getAllRecords } from '../database/db';
import { HealthRecord } from '../types/health';
import { getTodayISO } from './dateUtils';
import { showAlert } from './platformAlert';

const CSV_HEADER = 'ID,Date,Steps,Calories Burned (kcal),Water Intake (ml)';

function formatRecordsAsCsv(records: HealthRecord[]): string {
  const rows = records.map(
    (r) => `${r.id},${r.date},${r.steps},${r.calories},${r.water}`
  );
  return [CSV_HEADER, ...rows].join('\n');
}

export async function exportHealthRecordsToCsv(): Promise<void> {
  try {
    const records = await getAllRecords();
    if (records.length === 0) {
      showAlert(
        'Nothing to Export',
        'There are no health records stored yet. Log an entry first.'
      );
      return;
    }

    const csvPayload = formatRecordsAsCsv(records);
    const fileName = `healthmate_records_${getTodayISO()}.csv`;

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const blob = new Blob([csvPayload], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    }

    const targetDir =
      FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
    if (!targetDir) {
      showAlert(
        'Export Unavailable',
        'No writable local directory is available on this device.'
      );
      return;
    }

    // Write CSV into app cache so the OS share sheet can read it without extra permissions.
    const fileUri = `${targetDir}${fileName}`;
    await FileSystem.writeAsStringAsync(fileUri, csvPayload, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      showAlert(
        'Sharing Unavailable',
        `File saved locally to ${fileName}, but native sharing is not supported on this device.`
      );
      return;
    }

    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export HealthMate Records',
      UTI: 'public.comma-separated-values-text',
    });
  } catch (err) {
    showAlert(
      'Export Failed',
      err instanceof Error ? err.message : 'Unable to export health records.'
    );
  }
}
