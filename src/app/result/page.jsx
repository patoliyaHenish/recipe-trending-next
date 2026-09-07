import React, { Suspense } from 'react';
import Result from '../../pages_old/users/Result';

export const dynamic = 'force-dynamic';

export default function ResultPage() {
  return (
    <Suspense fallback={null}>
      <Result />
    </Suspense>
  );
}
