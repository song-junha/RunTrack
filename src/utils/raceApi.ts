// 스마트칩 API를 통해 러너 데이터 가져오기
export async function fetchRunnerData(bibNumber: string, raceCode: string) {
  const url = `https://smartchip.co.kr/return_data_livephoto.asp?nameorbibno=${bibNumber}&usedata=${raceCode}`;

  try {
    const response = await fetch(url);
    const text = await response.text();

    console.log('API Response received for bib:', bibNumber);

    // API 응답 파싱
    const result = parseRunnerData(text);
    console.log('Parsed runner data:', result);
    return result;
  } catch (error) {
    console.error('Failed to fetch runner data:', error);
    return null;
  }
}

// API 응답 데이터 파싱
function parseRunnerData(htmlText: string) {
  try {
    // HTML 파싱을 위한 임시 DOM 생성
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    // 테이블 찾기
    const table = doc.querySelector('table');
    if (!table) {
      console.error('테이블을 찾을 수 없습니다');
      return null;
    }

    const rows = table.querySelectorAll('tr');
    const splits = [];
    let latestDistance = 0;
    let latestPace = '';
    let runnerName = '';

    // 러너 이름 추출 (테이블 전에 있을 수 있음)
    const nameElement = doc.querySelector('.name, .runner-name');
    if (nameElement) {
      runnerName = nameElement.textContent?.trim() || '';
    }

    // 각 행 파싱
    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i].querySelectorAll('td, th');

      // 헤더 행 건너뛰기
      if (cells.length === 0 || rows[i].querySelector('th')) continue;

      try {
        // POINT, TIME, PASS TIME, PACE 순서로 파싱
        const point = cells[0]?.textContent?.trim() || '';
        const time = cells[1]?.textContent?.trim() || '';
        const passTime = cells[2]?.textContent?.trim() || '';
        const pace = cells[3]?.textContent?.trim() || '';

        console.log(`Row ${i}: point="${point}", time="${time}", passTime="${passTime}", pace="${pace}"`);

        // 거리 추출 및 단위 변환 (예: "5.0km" -> 5.0, "5000m" -> 5.0)
        const distanceMatch = point.match(/(\d+\.?\d*)\s*(km|m|K)?/i);
        if (!distanceMatch) continue;

        let distance = parseFloat(distanceMatch[1]);
        const unit = distanceMatch[2]?.toLowerCase();

        // 미터 단위인 경우 km로 변환
        if (unit === 'm' && distance >= 100) {
          distance = distance / 1000;
        }

        console.log(`Parsed distance: ${distance}km from "${point}"`);

        // 기록이 측정되지 않은 구간 필터링
        // time이나 pace가 없거나, "-" 또는 빈 값인 경우 제외
        const hasValidTime = time && time !== '-' && time.match(/\d+:\d+/);
        const hasValidPace = pace && pace !== '-' && pace.match(/\d+:\d+/);

        console.log(`Distance: ${distance}, hasValidTime: ${hasValidTime}, hasValidPace: ${hasValidPace}`);

        // 유효한 기록이 있는 경우만 추가
        if (hasValidTime || hasValidPace) {
          splits.push({
            distance,
            time,
            passTime,
            pace,
            timestamp: new Date().toISOString(),
          });

          // 최신 거리와 페이스 업데이트
          if (distance > latestDistance) {
            latestDistance = distance;
            latestPace = pace;
          }
        }
      } catch (error) {
        console.error('행 파싱 실패:', error);
      }
    }

    // 예상 완주 시간 계산 (최근 페이스 기준)
    let estimatedFinishTime = '';
    if (latestPace && latestDistance > 0) {
      const paceMatch = latestPace.match(/(\d+):(\d+)/);
      if (paceMatch) {
        const paceMinutes = parseInt(paceMatch[1]);
        const paceSeconds = parseInt(paceMatch[2]);
        const paceInSeconds = paceMinutes * 60 + paceSeconds;

        // 남은 거리
        const remainingDistance = 42.195 - latestDistance;
        const remainingSeconds = remainingDistance * paceInSeconds;

        // 마지막 스플릿 시간에 남은 시간 더하기
        const lastTimeMatch = splits[splits.length - 1]?.time.match(/(\d+):(\d+):(\d+)/);
        if (lastTimeMatch) {
          const hours = parseInt(lastTimeMatch[1]);
          const minutes = parseInt(lastTimeMatch[2]);
          const seconds = parseInt(lastTimeMatch[3]);
          const totalSeconds = hours * 3600 + minutes * 60 + seconds + remainingSeconds;

          const estHours = Math.floor(totalSeconds / 3600);
          const estMinutes = Math.floor((totalSeconds % 3600) / 60);
          const estSeconds = Math.floor(totalSeconds % 60);

          estimatedFinishTime = `${String(estHours).padStart(2, '0')}:${String(estMinutes).padStart(2, '0')}:${String(estSeconds).padStart(2, '0')}`;
        }
      }
    }

    return {
      name: runnerName,
      currentDistance: latestDistance,
      splits,
      currentPace: latestPace,
      estimatedFinishTime,
    };
  } catch (error) {
    console.error('HTML 파싱 실패:', error);
    return null;
  }
}

// 주기적으로 러너 데이터 업데이트
export async function pollRunnerData(
  bibNumber: string,
  raceCode: string,
  onUpdate: (data: any) => void,
  interval: number = 10000 // 10초마다
) {
  const poll = async () => {
    const data = await fetchRunnerData(bibNumber, raceCode);
    if (data) {
      onUpdate(data);
    }
  };

  // 최초 호출
  await poll();

  // 주기적 호출
  const intervalId = setInterval(poll, interval);

  // 정리 함수 반환
  return () => clearInterval(intervalId);
}
