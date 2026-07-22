import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { EmployeeTab } from '@/features/employees/types';

const TABS: { key: EmployeeTab; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'ativos', label: 'Ativos' },
  { key: 'inativos', label: 'Inativos' },
  { key: 'pendencias', label: 'Pendências' },
  { key: 'elegibilidade', label: 'Elegibilidade' },
];

interface EmployeesTabsProps {
  active: EmployeeTab;
  counts: Record<EmployeeTab, number>;
  onChange: (tab: EmployeeTab) => void;
}

export function EmployeesTabs({ active, counts, onChange }: EmployeesTabsProps) {
  return (
    <Tabs value={active} onValueChange={(v) => onChange(v as EmployeeTab)}>
      <div className="overflow-x-auto">
        <TabsList className="w-max">
          {TABS.map((t) => (
            <TabsTrigger key={t.key} value={t.key} className="shrink-0 gap-1.5">
              {t.label}
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">{counts[t.key]}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
    </Tabs>
  );
}
