'use client';

import { useRef } from 'react';
import { Appointment, AppointmentStatus } from '@/lib/appointment.api';
import { Professional, BusinessHoursEntry } from '@/lib/barbershop.api';
import { AppointmentCard } from './appointment-card';

export interface DayOffBlock {
  professionalId: string;
  date: string;       // yyyy-MM-dd
  reason: string | null;
  startTime?: string | null; // "HH:mm" — null = dia inteiro
  endTime?: string | null;   // "HH:mm" — null = dia inteiro
}

export interface RecurringBlockDisplay {
  professionalId: string;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  reason: string | null;
}

function getTopFromTime(time: string): number {
  const [h, m] = time.split(':').map(Number);
  const mins = (h - START_HOUR) * 60 + m;
  return Math.max(0, mins * PX_PER_MIN);
}

function getHeightFromRange(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return Math.max(16, ((eh * 60 + em) - (sh * 60 + sm)) * PX_PER_MIN);
}

const SLOT_HEIGHT = 56; // px per 30-min block
const PX_PER_MIN = SLOT_HEIGHT / 30;
const START_HOUR = 8;
const END_HOUR = 21;
const TOTAL_SLOTS = (END_HOUR - START_HOUR) * 2;
const TOTAL_HEIGHT = TOTAL_SLOTS * SLOT_HEIGHT;

const TIME_SLOTS = Array.from({ length: TOTAL_SLOTS }, (_, i) => {
  const hour = START_HOUR + Math.floor(i / 2);
  const min = (i % 2) * 30;
  return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
});

function getTop(scheduledAt: string): number {
  const d = new Date(scheduledAt);
  const mins = (d.getHours() - START_HOUR) * 60 + d.getMinutes();
  return Math.max(0, mins * PX_PER_MIN);
}

function getHeight(durationMins: number): number {
  return Math.max(durationMins * PX_PER_MIN, SLOT_HEIGHT * 0.6);
}

interface Props {
  professionals: Professional[];
  appointments: Appointment[];
  dayOffs?: DayOffBlock[];
  recurringBlocks?: RecurringBlockDisplay[];
  businessHoursDay?: BusinessHoursEntry | null;
  snapMins?: number;
  onStatusChange: (id: string, status: AppointmentStatus) => void;
  onReschedule: (id: string, scheduledAt: string) => void;
  onResize: (id: string, durationMins: number) => void;
  onDelete: (id: string) => void;
  onEdit?: (apt: Appointment) => void;
}

export function ScheduleGrid({ professionals, appointments, dayOffs = [], recurringBlocks = [], businessHoursDay, snapMins = 15, onStatusChange, onReschedule, onResize, onDelete, onEdit }: Props) {
  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Pre-compute business hours overlays
  const isClosed = businessHoursDay !== undefined && businessHoursDay !== null && !businessHoursDay.isOpen;

  // Heights for the "outside hours" overlays (top = before opening, bottom = after closing)
  const beforeOpenHeight = businessHoursDay?.isOpen
    ? (() => {
        const [h, m] = businessHoursDay.openTime.split(':').map(Number);
        const mins = (h - START_HOUR) * 60 + m;
        return Math.max(0, mins * PX_PER_MIN);
      })()
    : 0;

  const afterCloseTop = businessHoursDay?.isOpen
    ? (() => {
        const [h, m] = businessHoursDay.closeTime.split(':').map(Number);
        const mins = (h - START_HOUR) * 60 + m;
        return Math.max(0, mins * PX_PER_MIN);
      })()
    : 0;

  const afterCloseHeight = businessHoursDay?.isOpen
    ? Math.max(0, TOTAL_HEIGHT - afterCloseTop)
    : 0;

  if (professionals.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        Nenhum profissional cadastrado. Adicione profissionais nas configurações.
      </div>
    );
  }

  const aptsByProfessional = professionals.reduce<Record<string, Appointment[]>>((acc, p) => {
    acc[p.id] = appointments.filter((a) => a.professionalId === p.id);
    return acc;
  }, {});

  const handleDragStart = (e: React.DragEvent, apt: Appointment) => {
    e.dataTransfer.setData('appointmentId', apt.id);
    // Store the offset within the card where drag started
    const card = e.currentTarget as HTMLElement;
    const rect = card.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    e.dataTransfer.setData('offsetY', String(offsetY));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, professionalId: string) => {
    e.preventDefault();
    const aptId = e.dataTransfer.getData('appointmentId');
    const offsetY = parseFloat(e.dataTransfer.getData('offsetY') || '0');
    const col = columnRefs.current[professionalId];
    if (!col || !aptId) return;

    const rect = col.getBoundingClientRect();
    const relY = e.clientY - rect.top - offsetY;
    const totalMins = START_HOUR * 60 + Math.max(0, relY / PX_PER_MIN);
    const snapped = Math.round(totalMins / snapMins) * snapMins;
    const h = Math.floor(snapped / 60);
    const m = snapped % 60;

    const apt = appointments.find(a => a.id === aptId);
    if (!apt) return;

    const original = new Date(apt.scheduledAt);
    const newDate = new Date(original);
    newDate.setHours(h, m, 0, 0);

    onReschedule(aptId, newDate.toISOString());
  };

  return (
    <div className="flex-1 overflow-auto rounded-lg border border-border bg-card">
      {/* Business hours closed banner */}
      {isClosed && (
        <div className="sticky top-0 z-20 flex items-center justify-center gap-2 py-2 text-xs font-medium" style={{ backgroundColor: 'hsl(var(--destructive)/0.15)', color: 'hsl(var(--destructive)/0.9)', borderBottom: '1px solid hsl(var(--destructive)/0.3)' }}>
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: 'hsl(var(--destructive))' }} />
          Barbearia fechada neste dia
        </div>
      )}

      {/* Sticky header row */}
      <div className="flex sticky top-0 z-10 bg-card border-b border-border">
        <div className="w-16 shrink-0 border-r border-border" />
        {professionals.map((p) => (
          <div
            key={p.id}
            className="flex-1 min-w-[160px] px-3 py-2.5 border-r border-border last:border-r-0"
          >
            <p className="text-xs font-semibold text-foreground truncate">
              {p.nickname ?? p.user.name}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">{p.user.name}</p>
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="flex">
        {/* Time labels column */}
        <div className="w-16 shrink-0 border-r border-border relative" style={{ height: TOTAL_HEIGHT }}>
          {TIME_SLOTS.map((time, i) => (
            <div
              key={time}
              className="absolute w-full flex items-start justify-end pr-2"
              style={{ top: i * SLOT_HEIGHT, height: SLOT_HEIGHT }}
            >
              {i % 2 === 0 && (
                <span className="text-[10px] text-muted-foreground mt-0.5">{time}</span>
              )}
            </div>
          ))}
        </div>

        {/* Professional columns */}
        {professionals.map((p) => (
          <div
            key={p.id}
            ref={(el) => { columnRefs.current[p.id] = el; }}
            className="flex-1 min-w-[160px] relative border-r border-border last:border-r-0"
            style={{ height: TOTAL_HEIGHT }}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, p.id)}
          >
            {/* Slot grid lines */}
            {TIME_SLOTS.map((time, i) => (
              <div
                key={time}
                className="absolute w-full border-b border-border/50"
                style={{
                  top: i * SLOT_HEIGHT,
                  height: SLOT_HEIGHT,
                  borderBottomStyle: i % 2 === 0 ? 'solid' : 'dashed',
                  borderBottomColor: i % 2 === 0
                    ? 'hsl(var(--border))'
                    : 'hsl(var(--border) / 0.3)',
                }}
              />
            ))}

            {/* Business hours — fora do horário (antes da abertura) */}
            {!isClosed && businessHoursDay?.isOpen && beforeOpenHeight > 0 && (
              <div
                className="absolute left-0 right-0 top-0 z-[4] pointer-events-none bg-muted/40"
                style={{ height: beforeOpenHeight, borderBottom: '1px dashed hsl(var(--border))' }}
              >
                <p className="text-[9px] text-muted-foreground px-1.5 pt-1 font-medium">Fora do horário</p>
              </div>
            )}

            {/* Business hours — fora do horário (depois do fechamento) */}
            {!isClosed && businessHoursDay?.isOpen && afterCloseHeight > 0 && (
              <div
                className="absolute left-0 right-0 z-[4] pointer-events-none bg-muted/40"
                style={{ top: afterCloseTop, height: afterCloseHeight, borderTop: '1px dashed hsl(var(--border))' }}
              >
                <p className="text-[9px] text-muted-foreground px-1.5 pt-1 font-medium">Fora do horário</p>
              </div>
            )}

            {/* Business hours — dia fechado */}
            {isClosed && (
              <div className="absolute inset-0 z-[4] pointer-events-none flex items-center justify-center bg-muted/40" />
            )}

            {/* Day-off overlay (full day or partial) */}
            {(() => {
              const dayOff = dayOffs.find(d => d.professionalId === p.id);
              if (!dayOff) return null;
              if (!dayOff.startTime || !dayOff.endTime) {
                // Folga dia inteiro
                return (
                  <div className="absolute inset-0 bg-red-500/10 border border-red-500/30 flex flex-col items-center justify-center gap-1 z-10 pointer-events-none">
                    <div className="bg-red-500/20 border border-red-500/40 rounded-lg px-3 py-2 text-center">
                      <p className="text-xs font-semibold text-red-400">Folga</p>
                      {dayOff.reason && <p className="text-[10px] text-red-400/70 mt-0.5">{dayOff.reason}</p>}
                    </div>
                  </div>
                );
              }
              // Folga parcial
              return (
                <div
                  className="absolute left-0 right-0 bg-red-500/15 border-l-2 border-red-500/50 z-5 pointer-events-none"
                  style={{ top: getTopFromTime(dayOff.startTime), height: getHeightFromRange(dayOff.startTime, dayOff.endTime) }}
                >
                  <p className="text-[9px] text-red-400 px-1.5 pt-0.5 font-medium truncate">
                    Folga{dayOff.reason ? ` — ${dayOff.reason}` : ''}
                  </p>
                </div>
              );
            })()}

            {/* Bloqueios recorrentes (almoço, etc.) */}
            {recurringBlocks
              .filter(b => b.professionalId === p.id)
              .map((block, i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 bg-orange-500/15 border-l-2 border-orange-500/40 z-5 pointer-events-none"
                  style={{ top: getTopFromTime(block.startTime), height: getHeightFromRange(block.startTime, block.endTime) }}
                >
                  <p className="text-[9px] text-orange-400/90 px-1.5 pt-0.5 font-medium truncate">
                    {block.reason ?? 'Bloqueado'}
                  </p>
                </div>
              ))
            }

            {/* Appointments */}
            {aptsByProfessional[p.id].map((apt) => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                top={getTop(apt.scheduledAt)}
                height={getHeight(apt.durationMins)}
                snapMins={snapMins}
                onStatusChange={onStatusChange}
                onDragStart={handleDragStart}
                onResize={onResize}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
