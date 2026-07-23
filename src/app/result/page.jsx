"use client";
import React, { Suspense } from 'react';
import Result from '../../pages_old/users/Result';
import CoolLoader from '../../components/CoolLoader';

export default function ResultPage() {
  return (
    <Suspense fallback={<CoolLoader />}>
      <Result />
    </Suspense>
  );
}
