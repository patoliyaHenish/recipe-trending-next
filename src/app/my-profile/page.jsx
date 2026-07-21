'use client';

import dynamic from 'next/dynamic';

const MyProfile = dynamic(() => import('../../pages_old/users/MyProfile'), {
  ssr: false,
  loading: () => null,
});

export default function MyProfilePage() {
  return <MyProfile />;
}
