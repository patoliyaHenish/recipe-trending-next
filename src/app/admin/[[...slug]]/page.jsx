'use client';

import React, { useState, useEffect } from 'react';
import dynamicComponent from 'next/dynamic';

const AdminRouter = dynamicComponent(() => import('../../../components/admin/AdminRouter'), {
  ssr: false,
  loading: () => <div className="p-8">Loading Admin Panel...</div>
});

export default function AdminPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="p-8">Loading...</div>;
  }

  return <AdminRouter />;
}
