import { Construction } from 'lucide-react';

interface Props {
  title: string;
  description?: string;
}

export function ComingSoon({ title, description }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground bg-card border border-border rounded-lg">
        <Construction className="w-10 h-10 opacity-30" />
        <p className="text-sm font-medium">Em desenvolvimento</p>
        <p className="text-xs opacity-60">Esta funcionalidade estará disponível em breve</p>
      </div>
    </div>
  );
}
