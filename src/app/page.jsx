import Hero from "@/components/home/Hero";
import HotelIntros from "@/components/home/HotelIntros";
import GroupRelationship from "@/components/home/GroupRelationship";
import Reservation from "@/components/home/Reservation";
import MiniAbout from "@/components/home/MiniAbout";

export default function Home() {
  return (
    <div>
      <Hero />
      <HotelIntros />
      <GroupRelationship />
      <Reservation />
      <MiniAbout />
    </div>
  );
} 
