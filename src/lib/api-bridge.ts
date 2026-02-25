/**
 * LuxeStay API Bridge
 * Decouples the application from Supabase, providing a unified interface
 * for all data operations.
 */

import { supabase } from "@/integrations/supabase/client";
import { encryptData, decryptData, deriveKey } from "@/utils/encryption";

// Toggle between Supabase and Custom Backend
const USE_CUSTOM_BACKEND = false; // Set to true to switch to the new architecture
const BACKEND_URL = "http://localhost:3001/api";

export interface ApiResponse<T> {
  data: T | null;
  error: any;
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
    return await encryptData(data, key);
  },

  async decryptSensitive(encrypted: string, iv: string) {
    const key = await this.getEncryptionKey();
    return await decryptData(encrypted, iv, key);
  },

  /**
   * Data Operations
   */
  async from(tableName: string) {
    if (USE_CUSTOM_BACKEND) {
      // Logic for custom backend
      return {
        select: async (query = "*") => {
          const response = await fetch(`${BACKEND_URL}/database/tables/${tableName}?select=${query}`);
          const data = await response.json();
          return { data, error: null };
        },
        insert: async (item: any) => {
          const response = await fetch(`${BACKEND_URL}/database/tables/${tableName}`, {
            method: 'POST',
            body: JSON.stringify(item),
            headers: { 'Content-Type': 'application/json' }
          });
          const data = await response.json();
          return { data, error: null };
        }
      };
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
      return {
        on: (event: string, callback: Function) => {
          console.log(`Subscribed to custom channel ${name} for event ${event}`);
          return { subscribe: () => {} };
        }
      };
    } else {
      return supabase.channel(name);
    }
  }
};
