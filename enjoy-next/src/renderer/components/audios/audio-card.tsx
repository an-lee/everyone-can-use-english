export const AudioCard = ({ audio }: { audio: AudioEntity }) => {
  return (
    <div className="flex flex-col gap-2 rounded-md border p-2">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-medium">{audio.name}</h3>
      </div>
    </div>
  );
};
