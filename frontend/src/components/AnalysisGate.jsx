import { Link, useSearchParams } from 'react-router-dom';
import { FileSearch } from 'lucide-react';
import useAnalysis from '../hooks/useAnalysis';
import { EmptyState, ErrorState, Skeleton } from './ui';

/** Loads ?id=<analysisId> (or the latest analysis) and renders children(analysis). Handles loading/error/empty states. */
export default function AnalysisGate({ children, emptyText }) {
  const [params] = useSearchParams();
  const id = params.get('id') || undefined;
  const { data, loading, error } = useAnalysis(id);

  if (loading) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading your analysis">
        <Skeleton className="h-56" /><Skeleton className="h-32" /><Skeleton className="h-32" />
      </div>
    );
  }
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!data) {
    return (
      <EmptyState icon={FileSearch} title="No resume analyzed yet"
        text={emptyText || 'Upload your resume to unlock this view.'}
        action={<Link to="/app/analyze" className="btn-primary">Analyze a resume</Link>} />
    );
  }
  return children(data);
}
