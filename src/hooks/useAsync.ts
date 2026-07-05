import { useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface AsyncState<T> {
  data: null | T;
  loading: boolean;
  error: string | null;
}

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.data?.message) {
    return err.response.data.message as string;
  }
  if (err instanceof Error) return err.message;
  return 'Error inesperado. Por favor intentá de nuevo.';
}

export function useAsync<T = void>() {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (
      promise: Promise<T>,
      opts?: { successMessage?: string; errorMessage?: string; silent?: boolean }
    ): Promise<T | null> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const data = await promise;
        setState({ data, loading: false, error: null });
        if (opts?.successMessage) toast.success(opts.successMessage);
        return data;
      } catch (err: unknown) {
        const message = opts?.errorMessage ?? getErrorMessage(err);
        setState((prev) => ({ ...prev, loading: false, error: message }));
        if (!opts?.silent) toast.error(message);
        return null;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}
