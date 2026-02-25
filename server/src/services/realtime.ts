import { io } from '../index';

export const broadcastChange = (table: string, event: string, payload: any) => {
  io.to(table).emit('change', { table, event, payload });
  io.emit('all_changes', { table, event, payload });
};

export const setupRealtimeListeners = () => {
  // In a real Postgres environment, we would use LISTEN/NOTIFY
  console.log('Realtime listeners established');
};
