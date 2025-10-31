import { useState, useEffect } from 'react';

interface RecordPoint {
  name: string;
  distance: string;
}

interface RecordData {
  point_cd: string;
  time_point: string;
  point: RecordPoint;
}

interface ProcessedRecord {
  point_cd: string;
  name: string;
  time_point: string;
  split_time: string;
  cumulative_time: string;
}

interface RunnerInfo {
  name: string;
  bibNumber: string;
  password: string;
  lastRecord?: ProcessedRecord;
  allRecords: ProcessedRecord[];
}

type SortField = 'name' | 'bibNumber' | 'checkpoint' | 'time' | 'split' | 'cumulative';
type SortDirection = 'asc' | 'desc';

export default function JTBCMarathonPage() {
  const [runners, setRunners] = useState<RunnerInfo[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [runnerName, setRunnerName] = useState('');
  const [bibNumber, setBibNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [startY, setStartY] = useState(0);

  // 서버에서 선수 목록 로드
  useEffect(() => {
    const loadRunners = async () => {
      try {
        const response = await fetch('/api/runners');
        if (response.ok) {
          const data = await response.json();
          setRunners(data);
        }
      } catch (error) {
        console.error('Failed to load runners:', error);
      }
    };
    loadRunners();
  }, []);

  // Pull-to-refresh 이벤트
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || window.scrollY > 0) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - startY;

    if (distance > 0) {
      setPullDistance(Math.min(distance, 100));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 60) {
      await handleRefreshAll();
    }
    setIsPulling(false);
    setPullDistance(0);
  };

  const timeToSeconds = (timeStr: string): number => {
    const parts = timeStr.split(':');
    if (parts.length === 3) {
      const hours = parseInt(parts[0]);
      const minutes = parseInt(parts[1]);
      const seconds = parseFloat(parts[2]);
      return hours * 3600 + minutes * 60 + seconds;
    }
    return 0;
  };

  const secondsToTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const fetchRunnerData = async (bib: string) => {
    try {
      const response = await fetch(`/api/event/133/player/${bib}`);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      if (!data.records || !Array.isArray(data.records)) {
        return null;
      }

      const processedRecords = data.records.map((record: RecordData) => ({
        point_cd: record.point_cd,
        name: record.point?.name || '',
        time_point: record.time_point,
      }));

      const sortedRecords = processedRecords.sort((a: any, b: any) => {
        const numA = parseInt(a.point_cd.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.point_cd.replace(/\D/g, '')) || 0;
        return numA - numB;
      });

      const recordsWithCalc = sortedRecords.map((record: any, index: number) => {
        let splitTime = '';
        let cumulativeTime = '';

        if (index > 0) {
          const currentSeconds = timeToSeconds(record.time_point);
          const prevSeconds = timeToSeconds(sortedRecords[index - 1].time_point);
          splitTime = secondsToTime(currentSeconds - prevSeconds);
        } else {
          splitTime = '00:00:00';
        }

        if (sortedRecords.length > 0) {
          const currentSeconds = timeToSeconds(record.time_point);
          const startSeconds = timeToSeconds(sortedRecords[0].time_point);
          cumulativeTime = secondsToTime(currentSeconds - startSeconds);
        }

        return {
          ...record,
          split_time: splitTime,
          cumulative_time: cumulativeTime,
        };
      });

      return {
        records: recordsWithCalc,
        lastRecord: recordsWithCalc[recordsWithCalc.length - 1] || null,
      };
    } catch (error) {
      console.error('API 호출 실패:', error);
      return null;
    }
  };

  const handleAddRunner = async () => {
    if (!bibNumber.trim()) {
      alert('배번을 입력해주세요');
      return;
    }

    if (!runnerName.trim()) {
      alert('선수명을 입력해주세요');
      return;
    }

    if (!password.trim() || !/^\d{4}$/.test(password.trim())) {
      alert('4자리 숫자 비밀번호를 입력해주세요');
      return;
    }

    setLoading(true);

    try {
      const data = await fetchRunnerData(bibNumber.trim());

      if (!data) {
        alert('배번 정보를 찾을 수 없습니다. 배번을 확인해주세요.');
        return;
      }

      const newRunner: RunnerInfo = {
        name: runnerName.trim(),
        bibNumber: bibNumber.trim(),
        password: password.trim(),
        lastRecord: data.lastRecord,
        allRecords: data.records,
      };

      // 서버에 저장
      const saveResponse = await fetch('/api/runners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRunner),
      });

      if (saveResponse.ok) {
        setRunners([...runners, newRunner]);
        setRunnerName('');
        setBibNumber('');
        setPassword('');
        setShowAddModal(false);
      } else {
        alert('선수 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('선수 추가 실패:', error);
      alert('선수 추가에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRunner = async (bibNumber: string, name: string) => {
    const inputPassword = prompt(`${name} 선수 삭제\n\n등록 시 설정한 4자리 비밀번호를 입력하세요:`);

    if (inputPassword === null) {
      return; // 취소
    }

    if (!inputPassword || !/^\d{4}$/.test(inputPassword)) {
      alert('4자리 숫자 비밀번호를 입력해주세요');
      return;
    }

    try {
      const response = await fetch(`/api/runners/${bibNumber}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: inputPassword }),
      });

      if (response.ok) {
        setRunners(runners.filter((r) => r.bibNumber !== bibNumber));
        alert('선수가 삭제되었습니다.');
      } else {
        const error = await response.json();
        alert(error.error || '선수 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('선수 삭제 실패:', error);
      alert('선수 삭제에 실패했습니다.');
    }
  };

  const handleRefreshAll = async () => {
    if (runners.length === 0) return;

    setLoading(true);

    try {
      const updatedRunners = await Promise.all(
        runners.map(async (runner) => {
          try {
            const data = await fetchRunnerData(runner.bibNumber);
            if (data) {
              return {
                ...runner,
                lastRecord: data.lastRecord,
                allRecords: data.records,
              };
            }
            return runner;
          } catch (error) {
            console.error(`선수 ${runner.name} 갱신 실패:`, error);
            return runner;
          }
        })
      );

      setRunners(updatedRunners);
    } catch (error) {
      console.error('전체 갱신 실패:', error);
      alert('일부 선수의 기록 갱신에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
  };

  const getSortedRunners = () => {
    return [...runners].sort((a, b) => {
      let compareResult = 0;

      switch (sortField) {
        case 'name':
          compareResult = a.name.localeCompare(b.name);
          break;
        case 'bibNumber':
          compareResult = a.bibNumber.localeCompare(b.bibNumber);
          break;
        case 'checkpoint':
          const aPoint = a.lastRecord ? parseInt(a.lastRecord.point_cd.replace(/\D/g, '')) || 0 : 0;
          const bPoint = b.lastRecord ? parseInt(b.lastRecord.point_cd.replace(/\D/g, '')) || 0 : 0;
          compareResult = aPoint - bPoint;
          break;
        case 'time':
          const aTime = a.lastRecord ? timeToSeconds(a.lastRecord.time_point) : 0;
          const bTime = b.lastRecord ? timeToSeconds(b.lastRecord.time_point) : 0;
          compareResult = aTime - bTime;
          break;
        case 'split':
          const aSplit = a.lastRecord ? timeToSeconds(a.lastRecord.split_time) : 0;
          const bSplit = b.lastRecord ? timeToSeconds(b.lastRecord.split_time) : 0;
          compareResult = aSplit - bSplit;
          break;
        case 'cumulative':
          const aCum = a.lastRecord ? timeToSeconds(a.lastRecord.cumulative_time) : 0;
          const bCum = b.lastRecord ? timeToSeconds(b.lastRecord.cumulative_time) : 0;
          compareResult = aCum - bCum;
          break;
      }

      return sortDirection === 'asc' ? compareResult : -compareResult;
    });
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-3 h-3 opacity-30 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="w-3 h-3 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-3 h-3 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const sortedRunners = getSortedRunners();

  return (
    <div
      className="min-h-screen bg-base-100"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {pullDistance > 0 && (
        <div
          className="fixed top-0 left-0 right-0 flex items-center justify-center bg-green-100 transition-all"
          style={{
            height: `${pullDistance}px`,
            opacity: pullDistance / 100
          }}
        >
          <div className="text-green-700 font-bold text-sm">
            {pullDistance > 60 ? '↓ 놓으면 새로고침' : '↓ 당겨서 새로고침'}
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-lime-100 via-green-50 to-emerald-100 p-4 sticky top-0 z-50 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-green-900">
              2025<br />JTBC 마라톤
            </h1>
            <p className="text-sm text-green-800 mt-1">선수별 실시간 기록 조회</p>
          </div>
          <div
              className="bg-gradient-to-r from-lime-500 to-green-500 text-white px-4 py-2 rounded-full font-bold text-lg shadow-md">
            목동 마라톤 교실<br /> 화이팅!
          </div>
        </div>
      </div>

      <div className="p-4 flex gap-2">
        <button
          className="btn bg-lime-500 hover:bg-lime-600 text-white border-0 flex-1"
          onClick={() => setShowAddModal(true)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          선수 추가
        </button>
        {runners.length > 0 && (
          <button
            className="btn bg-green-500 hover:bg-green-600 text-white border-0"
            onClick={handleRefreshAll}
            disabled={loading}
            title="전체 새로고침"
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            )}
          </button>
        )}
      </div>

      <div className="p-2 space-y-1.5">
        {runners.length > 0 && (
          <div className="bg-yellow-100 rounded-lg p-2 flex items-center gap-1 text-xs font-bold text-amber-900">
            <div
              className="flex-1 min-w-0 cursor-pointer hover:text-orange-600 transition-colors"
              onClick={() => handleSort('name')}
            >
              이름/배번 <SortIcon field="name" />
            </div>
            <div
              className="w-10 text-center cursor-pointer hover:text-orange-600 transition-colors"
              onClick={() => handleSort('checkpoint')}
            >
              구간 <SortIcon field="checkpoint" />
            </div>
            <div
              className="w-14 text-center cursor-pointer hover:text-orange-600 transition-colors"
              onClick={() => handleSort('time')}
            >
              통과 <SortIcon field="time" />
            </div>
            <div
              className="w-16 text-center cursor-pointer hover:text-orange-600 transition-colors"
              onClick={() => handleSort('split')}
            >
              구간 <SortIcon field="split" />
            </div>
            <div
              className="w-16 text-center cursor-pointer hover:text-orange-600 transition-colors"
              onClick={() => handleSort('cumulative')}
            >
              누적 <SortIcon field="cumulative" />
            </div>
            <div className="w-6"></div>
          </div>
        )}

        {sortedRunners.map((runner, index) => (
          <div
            key={index}
            className="bg-amber-50 shadow-md rounded-lg p-2 border-2 border-yellow-200 hover:border-yellow-300 transition-colors flex items-center gap-1 text-sm"
          >
            <div className="flex-1 min-w-0">
              <span className="font-bold text-amber-900 text-sm">{runner.name}</span>
              <span className="text-amber-700 ml-1 text-xs">#{runner.bibNumber}</span>
            </div>

            {runner.lastRecord ? (
              <>
                <div className="w-10 text-center">
                  <div className="badge bg-orange-500 text-white border-0 badge-xs">{runner.lastRecord.name}</div>
                </div>
                <div className="w-14 text-center text-xs font-semibold text-amber-900">
                  {runner.lastRecord.time_point.split('.')[0].substring(0, 5)}
                </div>
                <div className="w-16 text-center text-xs text-orange-600 font-semibold">
                  {runner.lastRecord.split_time}
                </div>
                <div className="w-16 text-center text-xs text-amber-700 font-semibold">
                  {runner.lastRecord.cumulative_time}
                </div>
              </>
            ) : (
              <>
                <div className="w-10 text-center text-xs text-neutral-content opacity-50">-</div>
                <div className="w-14 text-center text-xs text-neutral-content opacity-50">-</div>
                <div className="w-16 text-center text-xs text-neutral-content opacity-50">-</div>
                <div className="w-16 text-center text-xs text-neutral-content opacity-50">-</div>
              </>
            )}

            <div className="w-6 flex justify-end">
              <button
                className="btn btn-xs btn-ghost text-error p-0 min-h-0 h-6 w-6"
                onClick={() => handleDeleteRunner(runner.bibNumber, runner.name)}
                title="삭제"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {runners.length === 0 && (
        <div className="text-center py-12">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 mx-auto text-neutral-content opacity-30 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <p className="text-neutral-content opacity-70 text-lg">
            등록된 선수가 없습니다
          </p>
          <p className="text-sm text-neutral-content opacity-50 mt-2">
            선수를 추가하여 실시간으로 기록을 확인하세요
          </p>
        </div>
      )}

      {showAddModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">선수 추가</h3>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">선수명 *</span>
                </label>
                <input
                  type="text"
                  placeholder="선수 이름을 입력하세요"
                  className="input input-bordered w-full"
                  value={runnerName}
                  onChange={(e) => setRunnerName(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">배번 *</span>
                </label>
                <input
                  type="text"
                  placeholder="배번 번호를 입력하세요"
                  className="input input-bordered w-full"
                  value={bibNumber}
                  onChange={(e) => setBibNumber(e.target.value)}
                  disabled={loading}
                />
                <label className="label">
                  <span className="label-text-alt text-neutral-content opacity-70">
                    배번으로 자동으로 기록을 가져옵니다
                  </span>
                </label>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">비밀번호 *</span>
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  placeholder="4자리 숫자"
                  className="input input-bordered w-full"
                  value={password}
                  onChange={(e) => setPassword(e.target.value.replace(/\D/g, ''))}
                  disabled={loading}
                />
                <label className="label">
                  <span className="label-text-alt text-neutral-content opacity-70">
                    선수 삭제 시 필요한 4자리 숫자 비밀번호
                  </span>
                </label>
              </div>
            </div>
            <div className="modal-action">
              <button
                className="btn"
                onClick={() => {
                  setShowAddModal(false);
                  setRunnerName('');
                  setBibNumber('');
                  setPassword('');
                }}
                disabled={loading}
              >
                취소
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAddRunner}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    확인 중...
                  </>
                ) : (
                  '추가'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
