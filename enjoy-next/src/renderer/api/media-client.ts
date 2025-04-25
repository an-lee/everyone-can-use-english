import { BaseClient } from "./base";

export class MediaClient extends BaseClient {
  syncAudio(data: Partial<AudioType>) {
    return this.makeRequest("post", "/api/mine/audios", data);
  }

  deleteAudio(id: string) {
    return this.makeRequest("delete", `/api/mine/audios/${id}`);
  }

  syncVideo(data: Partial<VideoType>) {
    return this.makeRequest("post", "/api/mine/videos", data);
  }

  deleteVideo(id: string) {
    return this.makeRequest("delete", `/api/mine/videos/${id}`);
  }

  syncRecording(data: Partial<RecordingType>) {
    if (!data) return;
    return this.makeRequest("post", "/api/mine/recordings", data);
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
