export const metadata = {
  title: 'Verify Email | Recipe Trending',
  description: 'Verify your email address to complete your Recipe Trending account setup.',
};

import { Suspense } from 'react';
import VerifyEmailClient from './VerifyEmailClient';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailClient />
    </Suspense>
  );
}
