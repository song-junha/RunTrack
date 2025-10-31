export interface Race {
  id: string;
  name: string;
  code: string;
  date: string;
}

export interface Group {
  id: string;
  name: string;
  raceId: string;
  code: string;
  createdAt: string;
  memberCount: number;
}

export interface Runner {
  id: string;
  name: string;
  bibNumber: string;
  groupId: string;
  splits: Split[];
  currentDistance: number; // in km
  estimatedFinishTime?: string;
  currentPace?: string; // min/km
}

export interface Split {
  distance: number; // in km (측정 지점)
  time: string; // HH:MM:SS (누적 시간)
  passTime?: string; // HH:MM:SS (실제 통과 시각)
  pace: string; // min/km (구간 페이스)
  timestamp: string;
}
