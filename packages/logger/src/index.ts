type Level = 'INFO' | 'WARN' | 'ERROR';

function timestamp(): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date()).replace(', ', ' ');
}

function write(level: Level, ctx: string, msg: string, ...extra: unknown[]): void {
  const line = `[${level}] - [${timestamp()}] - [${ctx}] - ${msg}`;
  const fn = level === 'ERROR' ? console.error : level === 'WARN' ? console.warn : console.log;
  extra.length ? fn(line, ...extra) : fn(line);
}

export const logger = {
  info:  (ctx: string, msg: string, ...extra: unknown[]) => write('INFO',  ctx, msg, ...extra),
  warn:  (ctx: string, msg: string, ...extra: unknown[]) => write('WARN',  ctx, msg, ...extra),
  error: (ctx: string, msg: string, ...extra: unknown[]) => write('ERROR', ctx, msg, ...extra),
};
