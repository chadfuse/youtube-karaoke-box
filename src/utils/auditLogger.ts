import { supabase } from "@/integrations/supabase/client";

/**
 * Audit logging utility for tracking admin actions and security events
 */

export interface AuditLogEntry {
  action: string;
  details?: Record<string, any>;
  userId?: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error';
}

/**
 * Logs an audit event to the console and potentially to a logging service
 */
export const logAuditEvent = async (entry: Omit<AuditLogEntry, 'timestamp'>) => {
  const auditEntry: AuditLogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };

  // Log to console for development
  console.log('[AUDIT]', auditEntry);

  // In a production environment, you might want to send this to a logging service
  // or store it in a dedicated audit_logs table in Supabase

  try {
    // Get current user if not provided
    if (!auditEntry.userId) {
      const { data: { user } } = await supabase.auth.getUser();
      auditEntry.userId = user?.id;
    }

    // You could extend this to save to a database table:
    // await supabase.from('audit_logs').insert({
    //   action: auditEntry.action,
    //   details: auditEntry.details,
    //   user_id: auditEntry.userId,
    //   severity: auditEntry.severity,
    //   created_at: auditEntry.timestamp
    // });

  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
};

/**
 * Specific audit logging functions for common admin actions
 */
export const auditLogger = {
  /**
   * Log global settings changes
   */
  settingChanged: (key: string, newValue: any, oldValue?: any) => {
    logAuditEvent({
      action: 'GLOBAL_SETTING_CHANGED',
      details: {
        setting: key,
        newValue: key.includes('apiKey') ? '[REDACTED]' : newValue,
        oldValue: key.includes('apiKey') ? '[REDACTED]' : oldValue,
      },
      severity: 'info',
    });
  },

  /**
   * Log admin access attempts
   */
  adminAccess: (success: boolean, email?: string) => {
    logAuditEvent({
      action: 'ADMIN_ACCESS_ATTEMPT',
      details: {
        success,
        email,
      },
      severity: success ? 'info' : 'warning',
    });
  },

  /**
   * Log cache clearing actions
   */
  cacheCleared: () => {
    logAuditEvent({
      action: 'CACHE_CLEARED',
      details: {},
      severity: 'info',
    });
  },

  /**
   * Log sign out actions
   */
  signOut: () => {
    logAuditEvent({
      action: 'ADMIN_SIGN_OUT',
      details: {},
      severity: 'info',
    });
  },

  /**
   * Log security events
   */
  securityEvent: (event: string, details: Record<string, any>) => {
    logAuditEvent({
      action: 'SECURITY_EVENT',
      details: {
        event,
        ...details,
      },
      severity: 'warning',
    });
  },
};