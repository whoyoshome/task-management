import { useState, useEffect, useCallback, useRef } from 'react';
import { getAllUsers } from '../services/userService';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role?: string;
}

export const useUsers = () => {
  const cached = (() => {
    try {
      const raw = localStorage.getItem('users.cache');
      return raw ? (JSON.parse(raw) as User[]) : [];
    } catch {
      return [] as User[];
    }
  })();
  const [users, setUsers] = useState<User[]>(cached);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const fetchUsers = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const data = await getAllUsers();
      const list = Array.isArray(data) ? data : [];
      setUsers(list);
      try {
        localStorage.setItem('users.cache', JSON.stringify(list));
      } catch {}
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error loading users');
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
  };
};
