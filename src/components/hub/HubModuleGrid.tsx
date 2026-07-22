import type { HRApplication } from '@/hooks/useHRApplications';
import { HubModuleCard } from './HubModuleCard';

interface Props {
  applications: HRApplication[];
  canAccess: (code: string) => boolean;
  onAccess: (app: HRApplication) => void;
}

// Classes estáticas (JIT-safe) por quantidade de módulos — todos numa linha (até 4).
const COLS: Record<number, string> = {
  1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4',
};
const MAXW: Record<number, string> = {
  1: 'max-w-[420px]', 2: 'max-w-[780px]', 3: 'max-w-[1160px]', 4: 'max-w-[1480px]',
};

/**
 * Grade dos módulos do Hub. Ajusta as colunas à quantidade (até 4 numa única
 * linha no desktop), largura/altura uniformes. Apenas dados reais
 * (useHRApplications) — não duplica cards manualmente.
 */
export function HubModuleGrid({ applications, canAccess, onAccess }: Props) {
  const n = Math.min(Math.max(applications.length, 1), 4);
  return (
    <div className={`mx-auto grid w-full grid-cols-1 gap-5 sm:grid-cols-2 ${COLS[n]} ${MAXW[n]}`}>
      {applications.map((app, i) => (
        <HubModuleCard
          key={app.id}
          app={app}
          hasAccess={canAccess(app.code)}
          onAccess={() => onAccess(app)}
          delay={i * 90}
        />
      ))}
    </div>
  );
}
