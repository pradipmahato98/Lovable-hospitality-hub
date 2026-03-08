/**
 * LuxeStay API Bridge
 * Decouples the application from Supabase, providing a unified interface
 * for all data operations.
 */

import { supabase } from "@/integrations/supabase/client";
import { encryptWithKey, decryptWithKey, deriveKey } from "@/utils/encryption";

// Toggle between Supabase and Custom Backend
// 🚀 Switching to Custom Backend to use the production-grade isolated system
export const USE_CUSTOM_BACKEND = true;
const BACKEND_URL = "http://localhost:3000/api/v1";

export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}

export const api = {
  /**
   * Security & E2EE
   */
  async getEncryptionKey() {
    const secret = import.meta.env.VITE_E2EE_MASTER_KEY || "dev-master-password-do-not-use-in-prod";
    const salt = import.meta.env.VITE_E2EE_SYSTEM_SALT || "system-salt-fallback";
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
   * Centralized Guest ID Encryption/Decryption
   */
  async encryptGuestId(idNumber: string): Promise<string> {
    if (!idNumber) return idNumber;
    const encryptedString = await this.encryptSensitive(idNumber);
    const [_, iv, encrypted] = encryptedString.split(":");
    return `e2ee:${iv}:${encrypted}`;
  },

  async decryptGuestId(prefixedId: string | null): Promise<string | null> {
    if (!prefixedId || !prefixedId.startsWith("e2ee:")) return prefixedId;
    try {
      const [_, iv, encrypted] = prefixedId.split(":");
      return await this.decryptSensitive(`enc:${iv}:${encrypted}`);
    } catch (error) {
      console.error("🛡️ Sentinel: Decryption failed for ID:", prefixedId, error);
      return prefixedId;
    }
  },

  /**
   * Data Operations
   */
  async from(tableName: string) {
    if (USE_CUSTOM_BACKEND) {
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
        in(column: string, values: any[]) {
          this.query.filters.push({ type: 'in', column, value: values });
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
        maybeSingle() {
          this.query.single = true;
          return this;
        },
        single() {
          this.query.single = true;
          return this;
        },
        update(item: any) {
          const execute = async () => {
             const response = await fetch(`${BACKEND_URL}/${tableName}`, {
                method: 'PATCH',
                body: JSON.stringify({ updates: item, filters: this.query.filters }),
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              });
              const data = await response.json();
              return { data, error: response.ok ? null : new Error(data.error) };
          };

          return {
            eq: (col: string, val: any) => {
              this.query.filters.push({ type: 'eq', column: col, value: val });
              return {
                select: () => ({ single: execute, execute }),
                execute
              };
            }
          };
        },
        delete() {
          return {
            eq: (col: string, val: any) => {
              this.query.filters.push({ type: 'eq', column: col, value: val });
              return {
                then: async (resolve: any) => {
                  try {
                    const response = await fetch(`${BACKEND_URL}/${tableName}`, {
                      method: 'DELETE',
                      body: JSON.stringify({ filters: this.query.filters }),
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                      }
                    });
                    const data = await response.json();
                    resolve({ data, error: response.ok ? null : new Error(data.error) });
                  } catch (error) {
                    resolve({ data: null, error });
                  }
                }
              };
            }
          };
        },
        insert(item: any) {
          const execute = async () => {
             const response = await fetch(`${BACKEND_URL}/${tableName}`, {
                method: 'POST',
                body: JSON.stringify(item),
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              });
              const data = await response.json();
              return { data, error: response.ok ? null : new Error(data.error) };
          };

          return {
            select: () => ({
              single: execute,
              maybeSingle: execute,
              execute
            }),
            execute
          };
        },
        then: async (resolve: any) => {
          try {
            const queryString = new URLSearchParams({
              select: this.query.select,
              limit: String(this.query.limit || ""),
              filters: JSON.stringify(this.query.filters),
              order: JSON.stringify(this.query.order),
            }).toString();

            const response = await fetch(`${BACKEND_URL}/${tableName}?${queryString}`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            const result = Array.isArray(data) ? data : data.data || [];
            resolve({
              data: this.query.single ? (Array.isArray(result) ? result[0] : result) || null : result,
              error: response.ok ? null : new Error("Fetch failed")
            });
          } catch (error) {
            resolve({ data: this.query.single ? null : [], error });
          }
        }
      };
      return builder;
    } else {
      return (supabase as any).from(tableName);
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
        const result = await response.json();
        if (result.accessToken) {
          localStorage.setItem('token', result.accessToken);
        }
        return { data: { user: result.user, session: { access_token: result.accessToken } }, error: response.ok ? null : new Error(result.error) };
      } else {
        return await supabase.auth.signInWithPassword(credentials);
      }
    },

    async signOut() {
      if (USE_CUSTOM_BACKEND) {
        localStorage.removeItem('token');
        return { error: null };
      } else {
        return await supabase.auth.signOut();
      }
    },

    async getUser() {
       if (USE_CUSTOM_BACKEND) {
         const token = localStorage.getItem('token');
         if (!token) return { data: { user: null }, error: null };

         try {
           const response = await fetch(`${BACKEND_URL}/auth/me`, {
             headers: { 'Authorization': `Bearer ${token}` }
           });
           const result = await response.json();
           return { data: { user: result.user }, error: response.ok ? null : new Error(result.error) };
         } catch (e) {
           return { data: { user: null }, error: e as Error };
         }
       }
       return await supabase.auth.getUser();
    }
  },

  /**
   * Storage Operations
   */
  storage: {
    from(bucketName: string) {
      if (USE_CUSTOM_BACKEND) {
        return {
          upload: async (path: string, file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('path', path);

            const response = await fetch(`${BACKEND_URL}/storage/upload?bucket=${bucketName}`, {
              method: 'POST',
              body: formData,
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            return { data, error: response.ok ? null : new Error(data.error) };
          },
          getPublicUrl: (path: string) => {
            return {
              data: {
                publicUrl: `${BACKEND_URL}/storage/url/${bucketName}/${path}`
              }
            };
          }
        };
      } else {
        return supabase.storage.from(bucketName);
      }
    }
  },

  channel(name: string) {
    return {
      on: function() { return this; },
      subscribe: () => ({ unsubscribe: () => {} })
    };
  },
  removeChannel: (c: any) => {}
};
