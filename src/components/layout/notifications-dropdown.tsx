'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  getNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  NotificationItem,
} from '@/server/actions/notification.actions';

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Carrega notificações iniciais
  const loadNotifications = async () => {
    try {
      const res = await getNotificationsAction(15);
      if (res.success && res.data) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      }
    } catch {
      // Falha silenciosa para não quebrar a navegação
    }
  };

  useEffect(() => {
    loadNotifications();

    // Atualiza a cada 30 segundos
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id: string, ticketId: string | null) => {
    await markNotificationAsReadAction(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    if (ticketId) {
      setIsOpen(false);
      router.push(`/tickets/${ticketId}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    setIsLoading(true);
    await markAllNotificationsAsReadAction();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    setIsLoading(false);
  };

  const formatRelativeTime = (date: Date) => {
    const diff = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (diff < 60) return 'Agora mesmo';
    if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
    return `há ${Math.floor(diff / 86400)} d`;
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'TICKET_APPROVED':
        return {
          icon: '✓',
          bg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        };
      case 'TICKET_REJECTED':
        return {
          icon: '✕',
          bg: 'bg-rose-100 text-rose-700 border-rose-200',
        };
      case 'HOMOLOGATION_REQUESTED':
        return {
          icon: '🛡️',
          bg: 'bg-purple-100 text-purple-700 border-purple-200',
        };
      case 'TICKET_ASSIGNED':
        return {
          icon: '⚡',
          bg: 'bg-amber-100 text-amber-700 border-amber-200',
        };
      default:
        return {
          icon: 'ℹ',
          bg: 'bg-blue-100 text-blue-700 border-blue-200',
        };
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão de Sino */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:outline-none transition"
        title="Central de Notificações"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover de Notificações */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/80 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header do Popover */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">
                Notificações
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#2563EB]/10 text-[#2563EB]">
                  {unreadCount} novas
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={isLoading}
                className="text-xs font-medium text-[#2563EB] hover:text-[#1d4ed8] hover:underline disabled:opacity-50"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          {/* Lista de Notificações */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <svg
                  className="w-10 h-10 mx-auto mb-2 text-slate-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-xs font-medium">Nenhuma notificação no momento</p>
              </div>
            ) : (
              notifications.map((item) => {
                const badge = getTypeBadge(item.type);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleMarkAsRead(item.id, item.ticketId)}
                    className={`p-4 flex items-start gap-3 cursor-pointer transition hover:bg-slate-50 ${
                      !item.isRead ? 'bg-blue-50/40' : 'bg-white'
                    }`}
                  >
                    <div
                      className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border ${badge.bg}`}
                    >
                      {badge.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p
                          className={`text-xs truncate ${
                            !item.isRead
                              ? 'font-bold text-slate-900'
                              : 'font-medium text-slate-700'
                          }`}
                        >
                          {item.title}
                        </p>
                        {!item.isRead && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB] shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                        {item.message}
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
