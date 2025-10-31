import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Runner } from '../types';
import { fetchRunnerData } from '../utils/raceApi';

export default function TrackingPage() {
  const { raceId, groupId } = useParams<{ raceId: string; groupId: string }>();
  const navigate = useNavigate();
  const { races, groups, runners, addRunner, updateRunner, deleteRunner } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [runnerName, setRunnerName] = useState('');
  const [bibNumber, setBibNumber] = useState('');
  const [expandedRunnerId, setExpandedRunnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const race = races.find((r) => r.id === raceId);
  const group = groups.find((g) => g.id === groupId);
  const groupRunners = runners.filter((r) => r.groupId === groupId);

  // 실시간 API 폴링
  useEffect(() => {
    if (!race?.code || groupRunners.length === 0) return;

    const interval = setInterval(async () => {
      for (const runner of groupRunners) {
        // 완주하지 않은 러너들만 업데이트
        if (runner.currentDistance < 42.195) {
          try {
            const data = await fetchRunnerData(runner.bibNumber, race.code);

            if (data) {
              updateRunner(runner.id, {
                currentDistance: data.currentDistance,
                splits: data.splits,
                currentPace: data.currentPace,
                estimatedFinishTime: data.estimatedFinishTime,
              });
            }
          } catch (error) {
            console.error(`Failed to update runner ${runner.bibNumber}:`, error);
          }
        }
      }
    }, 10000); // 10초마다 업데이트

    return () => clearInterval(interval);
  }, [groupRunners, race, updateRunner]);

  const handleAddRunner = async () => {
    if (!bibNumber.trim()) {
      alert('배번을 입력해주세요');
      return;
    }

    if (!race?.code) {
      alert('대회 정보를 찾을 수 없습니다');
      return;
    }

    setLoading(true);

    try {
      // API에서 러너 데이터 가져오기
      const data = await fetchRunnerData(bibNumber, race.code);

      if (!data) {
        alert('배번 정보를 찾을 수 없습니다. 배번을 확인해주세요.');
        setLoading(false);
        return;
      }

      const newRunner: Runner = {
        id: Date.now().toString(),
        name: runnerName.trim() || data.name || '러너',
        bibNumber: bibNumber,
        groupId: groupId!,
        currentDistance: data.currentDistance || 0,
        splits: data.splits || [],
        currentPace: data.currentPace || '-',
        estimatedFinishTime: data.estimatedFinishTime || '-',
      };

      addRunner(newRunner);
      setRunnerName('');
      setBibNumber('');
      setShowAddModal(false);
    } catch (error) {
      console.error('러너 추가 실패:', error);
      alert('러너 추가에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = (distance: number) => {
    return ((distance / 42.195) * 100).toFixed(1);
  };

  const formatDistance = (distance: number) => {
    return distance.toFixed(1);
  };

  return (
    <div className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 sticky top-0 z-50 shadow-lg">
        <button
          className="btn btn-ghost btn-sm mb-2 text-white hover:bg-blue-500"
          onClick={() => navigate(`/race/${raceId}/groups`)}
        >
          ← 뒤로
        </button>
        <h1 className="text-2xl font-bold">{group?.name}</h1>
        <p className="text-sm opacity-90">{race?.name}</p>
      </div>

      {/* Add Runner Button */}
      <div className="p-4">
        <button
          className="btn btn-primary btn-block btn-lg"
          onClick={() => setShowAddModal(true)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
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
          러너 추가
        </button>
      </div>

      {/* Runners List */}
      <div className="p-4 space-y-3">
        {groupRunners.map((runner) => {
          const progress = getProgressPercentage(runner.currentDistance);
          const isFinished = runner.currentDistance >= 42.195;
          const isExpanded = expandedRunnerId === runner.id;

          console.log(`Runner ${runner.name}: currentDistance=${runner.currentDistance}, progress=${progress}%, splits=${runner.splits.length}`);

          return (
            <div
              key={runner.id}
              className="bg-base-100 shadow-lg border border-base-300 rounded-lg overflow-hidden"
            >
              {/* Runner Header */}
              <div className="flex items-center justify-between p-4">
                <div
                  className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-all"
                  onClick={() => setExpandedRunnerId(isExpanded ? null : runner.id)}
                >
                  <div className="flex-shrink-0">
                    {isFinished ? (
                      <div className="badge badge-success">완주</div>
                    ) : (
                      <div className="badge badge-primary">진행중</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate">{runner.name}</h3>
                    <p className="text-xs text-neutral-content opacity-70">
                      배번: {runner.bibNumber}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4 flex items-center gap-3">
                  <div
                    className="cursor-pointer hover:opacity-80 transition-all"
                    onClick={() => setExpandedRunnerId(isExpanded ? null : runner.id)}
                  >
                    <p className="font-bold text-lg text-primary">
                      {runner.currentDistance > 0 ? `${formatDistance(runner.currentDistance)}km` : '대기중'}
                    </p>
                    <p className="text-xs text-neutral-content opacity-70">
                      {runner.currentPace && runner.currentPace !== '-' ? runner.currentPace : ''}
                    </p>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm btn-circle text-error"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`${runner.name} 러너를 삭제하시겠습니까?`)) {
                        deleteRunner(runner.id, runner.groupId);
                      }
                    }}
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                  <button
                    className="btn btn-ghost btn-sm btn-circle"
                    onClick={() => setExpandedRunnerId(isExpanded ? null : runner.id)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-base-300 bg-base-50 p-4">
                  {/* Splits Display */}
                  {runner.splits.length > 0 ? (
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {/* Runner Info Card */}
                      <div className="flex-shrink-0 bg-neutral text-white rounded-2xl p-4 w-28 flex flex-col justify-center items-center">
                        <div className="text-xs mb-1 opacity-80">{runner.name}</div>
                        <div className="text-lg font-bold">
                          {(() => {
                            const lastSplit = runner.splits[runner.splits.length - 1];
                            if (!lastSplit) return '-';
                            const time = lastSplit.time;
                            if (!time) return '-';
                            // HH:MM:SS -> HH:MM 형식으로 변환
                            const parts = time.split(':');
                            return parts.length >= 3 ? `${parts[0]}:${parts[1]}` : time;
                          })()}
                        </div>
                      </div>

                      {/* Start Marker */}
                      <div className="flex-shrink-0 bg-base-200 rounded-xl p-3 w-20 flex flex-col justify-center items-center border-2 border-base-300">
                        <div className="text-base font-bold mb-1">출발</div>
                        <div className="text-xs text-neutral-content opacity-70">START</div>
                      </div>

                      {/* Split Cards */}
                      {runner.splits.map((split, index) => {
                        // 시간 표시 로직 개선
                        let displayTime = '-';
                        const timeToShow = split.passTime || split.time;
                        if (timeToShow) {
                          // HH:MM:SS -> HH:MM 또는 HH:MM 그대로
                          const parts = timeToShow.split(':');
                          if (parts.length >= 2) {
                            displayTime = `${parts[0]}:${parts[1]}`;
                          } else {
                            displayTime = timeToShow;
                          }
                        }

                        return (
                          <div
                            key={index}
                            className="flex-shrink-0 bg-base-200 rounded-xl p-3 w-20 flex flex-col justify-center items-center border-2 border-base-300"
                          >
                            <div className="text-base font-bold mb-1">
                              {displayTime}
                            </div>
                            <div className="text-xs text-neutral-content font-semibold">
                              {split.distance}K
                            </div>
                          </div>
                        );
                      })}

                      {/* Finish Marker (if finished) */}
                      {isFinished && (
                        <div className="flex-shrink-0 bg-success text-success-content rounded-xl p-3 w-20 flex flex-col justify-center items-center border-2 border-success">
                          <div className="text-base font-bold mb-1">도착</div>
                          <div className="text-xs opacity-80">FINISH</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-neutral-content opacity-70 text-sm">
                      첫 스플릿을 기다리는 중...
                    </div>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="bg-base-200 p-2 rounded-lg text-center">
                      <p className="text-xs text-neutral-content opacity-70 mb-1">
                        진행률
                      </p>
                      <p className="text-sm font-bold">
                        {runner.currentDistance > 0 ? `${progress}%` : '0%'}
                      </p>
                    </div>
                    <div className="bg-base-200 p-2 rounded-lg text-center">
                      <p className="text-xs text-neutral-content opacity-70 mb-1">
                        현재 페이스
                      </p>
                      <p className="text-sm font-bold text-primary">
                        {runner.currentPace && runner.currentPace !== '-' ? runner.currentPace : '-'}
                      </p>
                    </div>
                    <div className="bg-base-200 p-2 rounded-lg text-center">
                      <p className="text-xs text-neutral-content opacity-70 mb-1">
                        예상 완주
                      </p>
                      <p className="text-sm font-bold text-secondary">
                        {runner.estimatedFinishTime && runner.estimatedFinishTime !== '-' ? runner.estimatedFinishTime : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {groupRunners.length === 0 && (
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
          <p className="text-neutral-content opacity-70">
            등록된 러너가 없습니다
          </p>
          <p className="text-sm text-neutral-content opacity-50 mt-2">
            러너를 추가하여 실시간으로 기록을 확인하세요
          </p>
        </div>
      )}

      {/* Add Runner Modal */}
      {showAddModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">러너 추가</h3>
            <div className="space-y-4">
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
                    배번으로 자동으로 정보를 가져옵니다
                  </span>
                </label>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">이름 (선택)</span>
                </label>
                <input
                  type="text"
                  placeholder="이름을 입력하세요 (선택사항)"
                  className="input input-bordered w-full"
                  value={runnerName}
                  onChange={(e) => setRunnerName(e.target.value)}
                  disabled={loading}
                />
                <label className="label">
                  <span className="label-text-alt text-neutral-content opacity-70">
                    입력하지 않으면 API에서 가져옵니다
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
