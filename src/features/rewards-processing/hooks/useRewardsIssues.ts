import { useMemo } from 'react';
import { buildIssues, summarizeIssues, type IssuesInputs } from '../domain/rewardsIssues';

/** Inconsistências detectáveis + resumo (memoizados). */
export function useRewardsIssues(inputs: IssuesInputs) {
  const issues = useMemo(() => buildIssues(inputs), [inputs]);
  const summary = useMemo(() => summarizeIssues(issues), [issues]);
  return { issues, summary };
}
