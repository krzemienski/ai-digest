import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  Event,
  RepeatMode,
} from "react-native-track-player";
import type { AddTrack } from "react-native-track-player";

export type { AddTrack as AudioTrack };

let isSetup = false;

export async function setupAudioService(): Promise<void> {
  if (isSetup) return;

  await TrackPlayer.setupPlayer({
    maxCacheSize: 1024 * 50, // 50MB cache (in KB)
  });

  await TrackPlayer.updateOptions({
    capabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SeekTo,
      Capability.SkipToNext,
      Capability.SkipToPrevious,
      Capability.JumpForward,
      Capability.JumpBackward,
    ],
    compactCapabilities: [Capability.Play, Capability.Pause, Capability.SeekTo],
    android: {
      appKilledPlaybackBehavior:
        AppKilledPlaybackBehavior.ContinuePlayback,
    },
    forwardJumpInterval: 15,
    backwardJumpInterval: 15,
    progressUpdateEventInterval: 1,
  });

  await TrackPlayer.setRepeatMode(RepeatMode.Off);
  isSetup = true;
}

export async function playbackService(): Promise<void> {
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    void TrackPlayer.play();
  });

  TrackPlayer.addEventListener(Event.RemotePause, () => {
    void TrackPlayer.pause();
  });

  TrackPlayer.addEventListener(Event.RemoteSeek, (e) => {
    void TrackPlayer.seekTo(e.position);
  });

  TrackPlayer.addEventListener(Event.RemoteJumpForward, async () => {
    const progress = await TrackPlayer.getProgress();
    await TrackPlayer.seekTo(progress.position + 15);
  });

  TrackPlayer.addEventListener(Event.RemoteJumpBackward, async () => {
    const progress = await TrackPlayer.getProgress();
    await TrackPlayer.seekTo(Math.max(0, progress.position - 15));
  });

  TrackPlayer.addEventListener(Event.RemoteStop, () => {
    void TrackPlayer.stop();
  });
}

export async function addTrack(track: AddTrack): Promise<void> {
  await TrackPlayer.reset();
  await TrackPlayer.add(track);
}

export async function playTrack(): Promise<void> {
  await TrackPlayer.play();
}

export async function pauseTrack(): Promise<void> {
  await TrackPlayer.pause();
}

export async function seekTo(position: number): Promise<void> {
  await TrackPlayer.seekTo(position);
}

export async function setPlaybackRate(rate: number): Promise<void> {
  await TrackPlayer.setRate(rate);
}

export async function getPosition(): Promise<number> {
  const progress = await TrackPlayer.getProgress();
  return progress.position;
}

export async function getDuration(): Promise<number> {
  const progress = await TrackPlayer.getProgress();
  return progress.duration;
}
