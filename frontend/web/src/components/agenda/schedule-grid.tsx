'use client';

import { Appointment, AppointmentStatus } from '@/lib/appointment.api';
import { Professional } from '@/lib/barbershop.api';
import { AppointmentCard } from './appointment-card';

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
  onStatusChange: (id: string, status: AppointmentStatus) => void;
}

export function ScheduleGrid({ professionals, appointments, onStatusChange }: Props) {
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

  return (
    <div className="flex-1 overflow-auto rounded-lg border border-border bg-card">
      {/* Sticky header row */}
      <div className="flex sticky top-0 z-10 bg-card border-b border-border">
        {/* Time label column */}
        <div className="w-16 shrink-0 border-r border-border" />
        {/* Professional name headers */}
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
            className="flex-1 min-w-[160px] relative border-r border-border last:border-r-0"
            style={{ height: TOTAL_HEIGHT }}
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

            {/* Appointments */}
            {aptsByProfessional[p.id].map((apt) => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                top={getTop(apt.scheduledAt)}
                height={getHeight(apt.durationMins)}
                onStatusChange={onStatusChange}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
