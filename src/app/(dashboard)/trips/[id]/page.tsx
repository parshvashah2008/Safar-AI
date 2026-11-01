'use client';

import { use } from 'react';
import { TripDetailView } from '@/components/trips/trip-detail-view';

export default function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return <TripDetailView tripId={resolvedParams.id} />;
}
