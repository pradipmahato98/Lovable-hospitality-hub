/**
 * LuxeStay API Bridge
 * Decouples the application from Supabase, providing a unified interface
 * for all data operations.
 */

import { supabase } from "@/integrations/supabase/client";
import { io as socketIO } from "socket.io-client";
import { encryptWithKey, decryptWithKey, deriveKey } from "@/utils/encryption";

// Toggle between Supabase and Custom Backend
const USE_CUSTOM_BACKEND = true; // Set to true to switch to the new architecture
const BACKEND_URL = "http://localhost:3001/api";

export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}

export const api = {
  /**
   * Security & E2EE
   */
  async getEncryptionKey() {
    // These should be set in environment variables
    const secret = import.meta.env.VITE_ENCRYPTION_SECRET || "fallback-secret-for-dev";
    const salt = import.meta.env.VITE_ENCRYPTION_SALT || "fallback-salt-for-dev";
    return await deriveKey(secret, salt);
  },

  async encryptSensitive(data: string) {
    const key = await this.getEncryptionKey();
    return await encryptWithKey(data, key);
  },

  async decryptSensitive(prefixedData: string) {
    const key = await this.getEncryptionKey();
    return await decryptWithKey(prefixedData, key);
  },

  /**
   * Data Operations
   */
  from(tableName: string) {
    if (USE_CUSTOM_BACKEND) {
      // Logic for custom backend with chainable query builder
      const builder = {
        query: {
          select: "*",
          filters: [] as { type: string; column: string; value: any }[],
          order: null as { column: string; ascending: boolean } | null,
          limit: null as number | null,
          single: false
        },
        select(query = "*") {
          this.query.select = query;
          return this;
        },
        eq(column: string, value: any) {
          this.query.filters.push({ type: 'eq', column, value });
          return this;
        },
        gte(column: string, value: any) {
          this.query.filters.push({ type: 'gte', column, value });
          return this;
        },
        lte(column: string, value: any) {
          this.query.filters.push({ type: 'lte', column, value });
          return this;
        },
        order(column: string, { ascending = true } = {}) {
          this.query.order = { column, ascending };
          return this;
        },
        limit(count: number) {
          this.query.limit = count;
          return this;
        },
        single() {
          this.query.single = true;
          return this;
        },
        update(item: any) {
          return {
            eq: (col: string, val: any) => {
              this.query.filters.push({ type: 'eq', column: col, value: val });
              return {
                select: () => {
                  return {
                    single: async () => {
                      const response = await fetch(`${BACKEND_URL}/database/tables/${tableName}`, {
                        method: 'PATCH',
                        body: JSON.stringify({ updates: item, filters: this.query.filters }),
                        headers: { 'Content-Type': 'application/json' }
                      });
                      const data = await response.json();
                      return { data, error: null };
                    }
                  };
                }
              };
            }
          };
        },
        delete() {
          return {
            eq: (col: string, val: any) => {
              this.query.filters.push({ type: 'eq', column: col, value: val });
              return {
                then: async (resolve: any, reject: any) => {
                  try {
                    const response = await fetch(`${BACKEND_URL}/database/tables/${tableName}`, {
                      method: 'DELETE',
                      body: JSON.stringify({ filters: this.query.filters }),
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                      }
                    });
                    const data = await response.json();
                    resolve({ data, error: null });
                  } catch (error) {
                    resolve({ data: null, error });
                  }
                }
              };
            }
          };
        },
        insert(item: any) {
          const runInsert = async () => {
            const response = await fetch(`${BACKEND_URL}/database/tables/${tableName}`, {
              method: 'POST',
              body: JSON.stringify(item),
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            const data = await response.json();
            return { data, error: response.ok ? null : data.error };
          };
          return {
            select: () => ({
              single: runInsert,
              maybeSingle: runInsert,
              then: (resolve: any) => runInsert().then(resolve)
            }),
            then: (resolve: any) => runInsert().then(resolve)
          };
        },
        range(from: number, to: number) {
          this.query.limit = to - from + 1;
          // In a real app, you'd also send the offset
          return this;
        },
        maybeSingle() {
          this.query.single = true;
          return this;
        },
        // Terminal then/awaitable
        then: async (resolve: any, reject: any) => {
          try {
            const queryString = new URLSearchParams({
              select: this.query.select,
              filters: JSON.stringify(this.query.filters),
              order: JSON.stringify(this.query.order),
              limit: String(this.query.limit || ""),
              single: String(this.query.single)
            }).toString();

            const response = await fetch(`${BACKEND_URL}/database/tables/${tableName}?${queryString}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error?.message || data.error || 'Fetch failed');
            resolve({ data, error: null });
          } catch (error) {
            resolve({ data: null, error });
          }
        }
      };
      return builder;
    } else {
      // Fallback to Supabase
      return supabase.from(tableName as any);
    }
  },

  /**
   * Authentication
   */
  auth: {
    async signIn(credentials: any) {
      if (USE_CUSTOM_BACKEND) {
        const response = await fetch(`${BACKEND_URL}/auth/login`, {
          method: 'POST',
          body: JSON.stringify(credentials),
          headers: { 'Content-Type': 'application/json' }
        });
        return await response.json();
      } else {
        return await supabase.auth.signInWithPassword(credentials);
      }
    },

    async signOut() {
      if (USE_CUSTOM_BACKEND) {
        await fetch(`${BACKEND_URL}/auth/logout`, { method: 'POST' });
        return { error: null };
      } else {
        return await supabase.auth.signOut();
      }
    },

    async getUser() {
      if (USE_CUSTOM_BACKEND) {
        const response = await fetch(`${BACKEND_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        return { data: { user: data }, error: response.ok ? null : data.error };
      } else {
        return await supabase.auth.getUser();
      }
    },

    async signUp(data: any) {
      if (USE_CUSTOM_BACKEND) {
        const response = await fetch(`${BACKEND_URL}/auth/signup`, {
          method: 'POST',
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' }
        });
        return await response.json();
      } else {
        return await supabase.auth.signUp(data);
      }
    },

    async verifyOtp(data: any) {
      if (USE_CUSTOM_BACKEND) {
        const response = await fetch(`${BACKEND_URL}/auth/verify-otp`, {
          method: 'POST',
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' }
        });
        return await response.json();
      } else {
        return await supabase.auth.verifyOtp(data);
      }
    },

    async resetPassword(email: string) {
      if (USE_CUSTOM_BACKEND) {
        const response = await fetch(`${BACKEND_URL}/auth/reset-password`, {
          method: 'POST',
          body: JSON.stringify({ email }),
          headers: { 'Content-Type': 'application/json' }
        });
        return await response.json();
      } else {
        return await supabase.auth.resetPasswordForEmail(email);
      }
    },

    async getSession() {
      if (USE_CUSTOM_BACKEND) {
        const token = localStorage.getItem('token');
        if (!token) return { data: { session: null }, error: null };
        const { data: user, error } = await this.getUser();
        return { data: { session: user ? { user, access_token: token } : null }, error };
      }
      return await supabase.auth.getSession();
    },

    onAuthStateChange(callback: (event: string, session: any) => void) {
      if (USE_CUSTOM_BACKEND) {
        // Simple mock for now - in real app, use an event emitter
        this.getSession().then(({ data }) => {
          callback('INITIAL_SESSION', data.session);
        });
        return { data: { subscription: { unsubscribe: () => {} } } };
      }
      return supabase.auth.onAuthStateChange(callback);
    },

    async updateUser(attributes: any) {
      if (USE_CUSTOM_BACKEND) {
        const response = await fetch(`${BACKEND_URL}/auth/update`, {
          method: 'POST',
          body: JSON.stringify(attributes),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        return { data, error: response.ok ? null : data.error };
      }
      return await supabase.auth.updateUser(attributes);
    }
  },

  /**
   * Real-time Subscriptions
   */
  _socket: null as any,
  getSocket() {
    if (!this._socket && USE_CUSTOM_BACKEND) {
      this._socket = socketIO("http://localhost:3001");
      this._socket.on('connect', () => console.log('Connected to real-time service'));
    }
    return this._socket;
  },

  channel(name: string) {
    if (USE_CUSTOM_BACKEND) {
      const socket = this.getSocket();
      socket.emit('subscribe', name);

      const channel = {
        on: function(event: string, filter: any, callback: Function) {
          socket.on('postgres_changes', (payload: any) => {
             // Basic implementation: check if the table name matches the channel name or if payload has table info
             if (payload.table === name || name.includes(payload.table)) {
                callback(payload);
             }
          });
          return this;
        },
        subscribe: (cb?: (status: string) => void) => {
          if (cb) cb('SUBSCRIBED');
          return {
            unsubscribe: () => {
              socket.emit('unsubscribe', name);
            }
          };
        }
      };
      return channel;
    } else {
      return supabase.channel(name);
    }
  },

  removeChannel(channel: any) {
    if (USE_CUSTOM_BACKEND) {
      if (channel && typeof channel.unsubscribe === 'function') {
        channel.unsubscribe();
      }
      return;
    } else {
      return supabase.removeChannel(channel);
    }
  },

  /**
   * Storage Operations
   */
  async rpc(fnName: string, params: any = {}) {
    if (USE_CUSTOM_BACKEND) {
      const response = await fetch(`${BACKEND_URL}/database/rpc/${fnName}`, {
        method: 'POST',
        body: JSON.stringify(params),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      return { data, error: response.ok ? null : data.error };
    } else {
      return await (supabase as any).rpc(fnName, params);
    }
  },

  storage: {
    async listBuckets() {
      if (USE_CUSTOM_BACKEND) {
        const response = await fetch(`${BACKEND_URL}/storage/buckets`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        return { data, error: response.ok ? null : data.error };
      } else {
        return await supabase.storage.listBuckets();
      }
    },

    async createBucket(name: string, options?: any) {
      if (USE_CUSTOM_BACKEND) {
        const response = await fetch(`${BACKEND_URL}/storage/buckets`, {
          method: 'POST',
          body: JSON.stringify({ name, ...options }),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        return { data, error: response.ok ? null : data.error };
      } else {
        return await supabase.storage.createBucket(name, options);
      }
    },

    from(bucketName: string) {
      if (USE_CUSTOM_BACKEND) {
        return {
          upload: async (path: string, file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('path', path);

            const response = await fetch(`${BACKEND_URL}/storage/buckets/${bucketName}/upload`, {
              method: 'POST',
              body: formData,
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            const data = await response.json();
            return { data, error: response.ok ? null : data.error };
          },
          getPublicUrl: (path: string) => {
            return {
              data: {
                publicUrl: `${BACKEND_URL}/storage/buckets/${bucketName}/files/${path}`
              }
            };
          }
        };
      } else {
        return supabase.storage.from(bucketName);
      }
    }
  }
};
