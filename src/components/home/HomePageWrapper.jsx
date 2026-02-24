'use client';

import LoadingScreen from '@/components/shared/LoadingScreen';
import Hero from '@/components/home/Hero';
import HotelIntros from '@/components/home/HotelIntros';
import GroupRelationship from '@/components/home/GroupRelationship';
import Reservation from '@/components/home/Reservation';
import MiniAbout from '@/components/home/MiniAbout';
import Gallery from '@/components/home/Gallery';

export default function HomePageWrapper() {
  return (
    <LoadingScreen>
      <Hero />
      <HotelIntros />
      <GroupRelationship />
      <Reservation />
      <MiniAbout />
      <Gallery />
    </LoadingScreen>
  );
}
