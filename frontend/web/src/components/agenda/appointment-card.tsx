'use client';

import { useState, useRef } from 'react';
import { MoreVertical, Check, UserX, Play, CheckCircle, X } from 'lucide-react';
import { Appointment, AppointmentStatus } from '@/lib/appointment.api';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  SCHEDULED:   'border-blue-500   bg-blue-500/10   text-blue-400',
  CONFIRMED:   'border-green-500  bg-green-500/10  text-green-400',
  IN_PROGRESS: 'border-amber-500  bg-amber-500/10  text-amber-400',
  COMPLETED:   'border-border     bg-muted/30      text-muted-foreground',
  NO_SHOW:     'border-red-500/50 bg-red-500/10    text-red-400/70',
  CANCELED:    'border-border     bg-muted/20      text-muted-foreground line-through',
  BLOCKED:     'border-border     bg-muted/30      text-muted-foreground',
};

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  SCHEDULED:   'Agendado',
  CONFIRMED:   'Confirmado',
  IN_PROGRESS: 'Em atendimento',
  COMPLETED:   'Finalizado',
  NO_SHOW:     'Faltou',
  CANCELED:    'Cancelado',
  BLOCKED:     'Bloqueado',
};

const PX_PER_MIN = 56 / 30;
const SNAP_MINS  = 15;
const MIN_DURATION = 15;

interface Action {
  label: string;
  status: AppointmentStatus;
  icon: React.ReactNode;
}

function getActions(status: AppointmentStatus): Action[] {
  switch (status) {
    case 'SCHEDULED':
      return [
        { label: 'Confirmar',  status: 'CONFIRMED',   icon: <Check className="w-3 h-3" /> },
        { label: 'Cancelar',   status: 'CANCELED',    icon: <X className="w-3 h-3" /> },
      ];
    case 'CONFIRMED':
      return [
        { label: 'Chegou',     status: 'IN_PROGRESS', icon: <Play className="w-3 h-3" /> },
        { label: 'Faltou',     status: 'NO_SHOW',     icon: <UserX className="w-3 h-3" /> },
        { label: 'Cancelar',   status: 'CANCELED',    icon: <X className="w-3 h-3" /> },
      ];
    case 'IN_PROGRESS':
      return [
        { label: 'Finalizar',  status: 'COMPLETED',   icon: <CheckCircle className="w-3 h-3" /> },
        { label: 'Cancelar',   status: 'CANCELED',    icon: <X className="w-3 h-3" /> },
      ];
    default:
      return [];
  }
}

interface Props {
  appointment: Appointment;
  top: number;
  height: number;
  onStatusChange: (id: string, status: AppointmentStatus) => void;
  onDragStart: (e: React.DragEvent, apt: Appointment) => void;
  onResize: (id: string, newDurationMins: number) => void;
}

export function AppointmentCard({ appointment, top, height, onStatusChange, onDragStart, onResize }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [liveHeight, setLiveHeight] = useState<number | null>(null);
  const resizing = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  const actions = getActions(appointment.status);
  const clientLabel = appointment.client?.name ?? appointment.clientName ?? 'Cliente';
  const serviceNames = appointment.services.map((s) => s.service.name).join(', ');
  const startTime = new Date(appointment.scheduledAt);

  const displayHeight = liveHeight ?? height;
  const displayDuration = Math.round(displayHeight / PX_PER_MIN);
  const endTime = new Date(startTime.getTime() + displayDuration * 60000);
  const timeLabel = `${fmt(startTime)}–${fmt(endTime)}`;
  const compact = displayHeight < 56;

  const isDone = appointment.status === 'CANCELED' || appointment.status === 'NO_SHOW' || appointment.status === 'COMPLETED';

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    if (isDone) return;
    e.preventDefault();
    e.stopPropagation();
    resizing.current = true;
    startY.current = e.clientY;
    startHeight.current = height;

    const onMouseMove = (ev: MouseEvent) => {
      if (!resizing.current) return;
      const delta = ev.clientY - startY.current;
      const newHeight = Math.max(MIN_DURATION * PX_PER_MIN, startHeight.current + delta);
      // snap to SNAP_MINS
      const rawMins = newHeight / PX_PER_MIN;
      const snappedMins = Math.round(rawMins / SNAP_MINS) * SNAP_MINS;
      setLiveHeight(snappedMins * PX_PER_MIN);
    };

    const onMouseUp = () => {
      if (!resizing.current) return;
      resizing.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      const currentH = liveHeight ?? height;
      const rawMins = currentH / PX_PER_MIN;
      const snappedMins = Math.max(MIN_DURATION, Math.round(rawMins / SNAP_MINS) * SNAP_MINS);
      setLiveHeight(null);
      onResize(appointment.id, snappedMins);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div
      draggable={!isDone && !resizing.current}
      onDragStart={(e) => !isDone && onDragStart(e, appointment)}
      className={cn(
        'absolute left-1 right-1 rounded border overflow-hidden transition-[border-color,background-color,opacity]',
        !isDone && 'cursor-grab active:cursor-grabbing',
        STATUS_STYLES[appointment.status],
        isDone && 'opacity-50',
      )}
      style={{ top, height: displayHeight }}
    >
      <div className="flex h-full px-1.5 py-1 gap-1 min-w-0">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate leading-tight">{clientLabel}</p>
          {!compact && (
            <>
              <p className="text-[10px] truncate opacity-75 leading-tight">{serviceNames}</p>
              <p className="text-[10px] opacity-60 leading-tight">{timeLabel}</p>
            </>
          )}
          {compact && (
            <p className="text-[10px] opacity-60 leading-tight truncate">{timeLabel}</p>
          )}
        </div>

        {actions.length > 0 && (
          <div className="relative shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
              className="p-0.5 rounded hover:bg-white/10 transition-colors"
            >
              <MoreVertical className="w-3 h-3" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-5 z-20 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[140px]">
                  <p className="px-3 py-1 text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                    {STATUS_LABEL[appointment.status]}
                  </p>
                  {actions.map((action) => (
                    <button
                      key={action.status}
                      onClick={() => {
                        setMenuOpen(false);
                        onStatusChange(appointment.id, action.status);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors text-left"
                    >
                      {action.icon}
                      {action.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Resize handle — borda inferior */}
      {!isDone && (
        <div
          onMouseDown={handleResizeMouseDown}
          className="absolute bottom-0 left-0 right-0 h-2.5 cursor-ns-resize flex items-center justify-center group"
          title="Arrastar para redimensionar"
        >
          <div className="w-8 h-0.5 rounded-full bg-current opacity-30 group-hover:opacity-70 transition-opacity" />
        </div>
      )}
    </div>
  );
}

function fmt(d: Date) {
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}
