import { BaseClient } from "./base";

export class MediaClient extends BaseClient {
  syncAudio(audio: Partial<AudioType>) {
    return this.makeRequest("post", "/api/mine/audios", audio);
  }

  deleteAudio(id: string) {
    return this.makeRequest("delete", `/api/mine/audios/${id}`);
  }

  syncVideo(video: Partial<VideoType>) {
    return this.makeRequest("post", "/api/mine/videos", video);
  }

  deleteVideo(id: string) {
    return this.makeRequest("delete", `/api/mine/videos/${id}`);
  }

  syncRecording(recording: Partial<RecordingType>) {
    if (!recording) return;
    return this.makeRequest("post", "/api/mine/recordings", recording);
  }

  deleteRecording(id: string) {
    return this.makeRequest("delete", `/api/mine/recordings/${id}`);
  }

  recordingAssessment(id: string) {
    return this.makeRequest("get", `/api/mine/recordings/${id}/assessment`);
  }

  syncPronunciationAssessment(
    pronunciationAssessment: Partial<PronunciationAssessmentType>
  ) {
    if (!pronunciationAssessment) return;
    return this.makeRequest(
      "post",
      "/api/mine/pronunciation_assessments",
      pronunciationAssessment
    );
  }
}
