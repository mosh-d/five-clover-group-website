import FiveClover from "@/assets/home/hero/five-clover.jpg";

export default function Hero() {
  return (
    <div
      className="bg-cover bg-center h-[100vh] w-full"
      style={{ backgroundImage: `url(${FiveClover.src})` }}
    >
      <h1>Hero</h1>
    </div>
  );
}
