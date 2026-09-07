import { useEffect, useRef, useState, useCallback } from 'react';
import { UserProfile } from '../types';

export interface DeveloperMember {
  id?: number | null;
  invitation_id?: number | null;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MEMBER' | string;
  status: 'ACCEPTED' | 'PENDING' | string;
  presence: 'ONLINE' | 'OFFLINE' | 'PENDING' | 'PRE_AUTHORIZED' | string;
  is_primary_owner?: boolean;
  created_at?: string | null;
}

interface UseDeveloperTeamSocketOptions {
  userProfile?: UserProfile | null;
  onDeveloperRevokedSelf?: () => void;
  onEventNotification?: (message: string, type: 'info' | 'success' | 'warning') => void;
}

export function useDeveloperTeamSocket({
  userProfile,
  onDeveloperRevokedSelf,
  onEventNotification
}: UseDeveloperTeamSocketOptions) {
  const [developers, setDevelopers] = useState<DeveloperMember[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const onRevokedRef = useRef(onDeveloperRevokedSelf);
  onRevokedRef.current = onDeveloperRevokedSelf;

  const onNotifyRef = useRef(onEventNotification);
  onNotifyRef.current = onEventNotification;

  const isSuperuser = userProfile?.is_superuser;
  const userEmail = userProfile?.email;

  const connect = useCallback(() => {
    if (!isSuperuser || !isMountedRef.current) return;

    if (
      socketRef.current &&
      (socketRef.current.readyState === WebSocket.OPEN ||
        socketRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:2001';
    const wsUrl = backendUrl.replace(/^http/, 'ws') + '/ws/developer-team';

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) {
          ws.close();
          return;
        }
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          const data = JSON.parse(event.data);
          const type = data.type;
          const payload = data.payload;

          switch (type) {
            case 'TEAM_STATE': {
              if (Array.isArray(payload.developers)) {
                setDevelopers(payload.developers);
              }
              break;
            }

            case 'DEVELOPER_INVITED': {
              const invitedEmail = payload.email;
              setDevelopers((prev) => {
                const exists = prev.some((d) => d.email.toLowerCase() === invitedEmail.toLowerCase());
                if (exists) {
                  return prev.map((d) =>
                    d.email.toLowerCase() === invitedEmail.toLowerCase()
                      ? { ...d, ...payload }
                      : d
                  );
                }
                return [payload, ...prev];
              });

              if (onNotifyRef.current && payload.invited_by) {
                const roleName = payload.role === 'ADMIN' ? 'Admin' : 'Member';
                onNotifyRef.current(`Invitation link sent to ${invitedEmail} as ${roleName}`, 'success');
              }
              break;
            }

            case 'DEVELOPER_JOINED': {
              const joinedEmail = payload.email;
              setDevelopers((prev) => {
                return prev.map((d) =>
                  d.email.toLowerCase() === joinedEmail.toLowerCase()
                    ? { ...d, ...payload, status: 'ACCEPTED', presence: 'ONLINE' }
                    : d
                );
              });

              if (onNotifyRef.current) {
                const roleName = payload.role === 'ADMIN' ? 'Admin' : 'Member';
                onNotifyRef.current(`${joinedEmail} accepted invitation and joined as ${roleName}!`, 'success');
              }
              break;
            }

            case 'DEVELOPER_REVOKED': {
              const revokedEmail = payload.email;
              setDevelopers((prev) =>
                prev.filter((d) => d.email.toLowerCase() !== revokedEmail.toLowerCase())
              );

              if (userEmail && userEmail.toLowerCase() === revokedEmail.toLowerCase()) {
                if (onRevokedRef.current) {
                  onRevokedRef.current();
                }
              } else if (onNotifyRef.current) {
                onNotifyRef.current(`Access revoked for ${revokedEmail}`, 'warning');
              }
              break;
            }

            case 'PRESENCE_CHANGE': {
              const targetEmail = payload.email;
              const newPresence = payload.presence as 'ONLINE' | 'OFFLINE';

              setDevelopers((prev) =>
                prev.map((d) => {
                  if (d.email.toLowerCase() === targetEmail.toLowerCase()) {
                    if (d.status === 'PENDING') return d;
                    return { ...d, presence: newPresence };
                  }
                  return d;
                })
              );
              break;
            }

            default:
              break;
          }
        } catch (parseErr) {
          console.error('[DeveloperTeamSocket] Message parse error:', parseErr);
        }
      };

      ws.onclose = () => {
        if (!isMountedRef.current) return;
        setIsConnected(false);
        socketRef.current = null;
        if (!reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null;
            if (isMountedRef.current) {
              connect();
            }
          }, 4000);
        }
      };

      ws.onerror = () => {
        if (socketRef.current) {
          socketRef.current.close();
        }
      };
    } catch (e) {
      console.error('[DeveloperTeamSocket] Failed to create WebSocket:', e);
    }
  }, [isSuperuser, userEmail]);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [connect]);

  const refreshTeam = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'REFRESH_TEAM' }));
    }
  }, []);

  return {
    developers,
    setDevelopers,
    isConnected,
    refreshTeam
  };
}
