import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api/client';

/** Loads a specific analysis by id, or the latest one when id is omitted. */
export default function useAnalysis(id) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    setState({ data: null, loading: true, error: null });
    const url = id ? `/analyses/${id}` : '/analyses/latest';
    api.get(url)
      .then((r) => !cancelled && setState({ data: r.data.analysis, loading: false, error: null }))
      .catch((e) => !cancelled && setState({ data: null, loading: false, error: errorMessage(e) }));
    return () => { cancelled = true; };
  }, [id]);

  return state;
}
