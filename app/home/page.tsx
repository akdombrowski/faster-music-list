import { InlineSnippet } from "@/components/form/domain-configuration";
import Image from "next/image";
import MusicTool from "@/components/spotify/music-tool";

export default function HomePage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center space-y-10 bg-black">
      <Image
        width={512}
        height={512}
        src="/logo.png"
        alt="Platforms on Vercel"
        className="w-48"
      />
      <MusicTool />
    </div>
  );
}
