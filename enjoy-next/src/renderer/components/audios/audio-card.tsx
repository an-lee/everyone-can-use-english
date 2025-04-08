import { Icon } from "@iconify/react";
import { AspectRatio } from "@renderer/components/ui";
import { Link } from "@tanstack/react-router";

export const AudioCard = ({ audio }: { audio: AudioEntity }) => {
  return (
    <Link to={`/audios/$audioId`} params={{ audioId: audio.id }}>
      <AspectRatio
        ratio={1 / 1}
        className="overflow-hidden rounded-md border relative cursor-pointer"
        style={{
          borderBottomColor: `#${audio.md5.slice(0, 6)}`,
          borderBottomWidth: 3,
        }}
      >
        {audio.coverUrl ? (
          <img
            src={audio.coverUrl}
            alt={audio.name}
            className="h-full w-full object-cover hover:scale-105 transition-all duration-300"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Icon
              icon="tabler:headphones"
              className="h-10 w-10 text-muted-foreground hover:scale-105 transition-all duration-300"
            />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-black/10">
          <div className="text-xs text-muted-foreground break-all overflow-hidden line-clamp-1">
            {audio.name}
          </div>
        </div>
      </AspectRatio>
    </Link>
  );
};
