/**
 * LuxeStay API Bridge
 * Decouples the application from Supabase, providing a unified interface
 * for all data operations.
 */

import { supabase } from "@/integrations/supabase/client";
import { encryptWithKey, decryptWithKey, deriveKey } from "@/utils/encryption";

// Toggle between Supabase and Custom Backend
const USE_CUSTOM_BACKEND = false; // Set to true to switch to the new architecture
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
    // In a real app, this would be derived from the user's password or a stored secret
    return await deriveKey("master-password-123", "system-salt");
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
  async from(tableName: string) {
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
          return {
            select: () => {
              return {
                single: async () => {
                  const response = await fetch(`${BACKEND_URL}/database/tables/${tableName}`, {
                    method: 'POST',
                    body: JSON.stringify(item),
                    headers: { 'Content-Type': 'application/json' }
                  });
                  const data = await response.json();
                  return { data, error: null };
                }
              };
            }
          };
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

            const response = await fetch(`${BACKEND_URL}/database/tables/${tableName}?${queryString}`);
            const data = await response.json();
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
        const response = await fetch(`${BACKEND_URL}/auth/me`);
        return await response.json();
      } else {
        return await supabase.auth.getUser();
      }
    }
  },

  /**
   * Real-time Subscriptions
   */
  channel(name: string) {
    if (USE_CUSTOM_BACKEND) {
      // Logic for Socket.io (skeleton)
      const mockChannel = {
        on: function(event: string, filter: any, callback: Function) {
          console.log(`Subscribed to custom channel ${name} for event ${event}`);
          return this;
        },
        subscribe: () => {
          console.log(`Channel ${name} subscribed`);
          return { unsubscribe: () => console.log(`Channel ${name} unsubscribed`) };
        }
      };
      return mockChannel;
    } else {
      return supabase.channel(name);
    }
  },

  removeChannel(channel: any) {
    if (USE_CUSTOM_BACKEND) {
      console.log(`Removed custom channel`);
      return;
    } else {
      return supabase.removeChannel(channel);
    }
  }
};
