import { io } from '../index';

export const broadcastChange = (table: string, event: 'INSERT' | 'UPDATE' | 'DELETE', data: any) => {
  const payload = {
    schema: 'public',
    table,
    event,
    new: event === 'DELETE' ? null : data,
    old: event === 'INSERT' ? null : data, // Simplified
  };

  // Broadcast to global channel
  io.emit('postgres_changes', payload);

  // Also broadcast to table-specific channel
  io.to(`table:${table}`).emit('postgres_changes', payload);

  console.log(`Real-time broadcast: ${event} on ${table}`);
};
