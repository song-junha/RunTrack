import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store/useStore';

export default function GroupManagePage() {
  const { raceId } = useParams<{ raceId: string }>();
  const navigate = useNavigate();
  const { groups, races, addGroup, joinGroup } = useStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const race = races.find((r) => r.id === raceId);
  const raceGroups = groups.filter((g) => g.raceId === raceId);

  const handleCreateGroup = () => {
    if (!groupName.trim()) return;

    const newGroup = {
      id: Date.now().toString(),
      name: groupName,
      raceId: raceId!,
      code: Math.random().toString(36).substring(2, 8).toUpperCase(),
      createdAt: new Date().toISOString(),
      memberCount: 0,
    };

    addGroup(newGroup);
    setGroupName('');
    setShowCreateModal(false);
    navigate(`/race/${raceId}/group/${newGroup.id}`);
  };

  const handleJoinGroup = () => {
    if (!joinCode.trim()) return;

    const group = joinGroup(joinCode.toUpperCase());
    if (group) {
      setJoinCode('');
      setShowJoinModal(false);
      navigate(`/race/${raceId}/group/${group.id}`);
    } else {
      alert('유효하지 않은 그룹 코드입니다');
    }
  };

  const handleGroupSelect = (groupId: string) => {
    navigate(`/race/${raceId}/group/${groupId}`);
  };

  return (
    <div className="container-safe py-6">
      <div className="mb-6">
        <button
          className="btn btn-ghost btn-sm mb-2"
          onClick={() => navigate('/')}
        >
          ← 뒤로
        </button>
        <h1 className="text-3xl font-bold text-neutral mb-2">{race?.name}</h1>
        <p className="text-neutral-content opacity-70">
          그룹을 선택하거나 새로 만들어보세요
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          className="btn btn-primary btn-lg"
          onClick={() => setShowCreateModal(true)}
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
          그룹 만들기
        </button>

        <button
          className="btn btn-secondary btn-lg"
          onClick={() => setShowJoinModal(true)}
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
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
          그룹 참가
        </button>
      </div>

      <div className="divider">기존 그룹</div>

      <div className="space-y-3">
        {raceGroups.map((group) => (
          <div
            key={group.id}
            className="card bg-base-100 shadow-lg hover:shadow-xl transition-all cursor-pointer border border-base-300"
            onClick={() => handleGroupSelect(group.id)}
          >
            <div className="card-body py-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg">{group.name}</h3>
                  <p className="text-sm text-neutral-content opacity-70">
                    코드: {group.code}
                  </p>
                </div>
                <div className="badge badge-primary badge-lg">
                  {group.memberCount}명
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {raceGroups.length === 0 && (
        <div className="text-center py-12">
          <p className="text-neutral-content opacity-70">
            아직 생성된 그룹이 없습니다
          </p>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">새 그룹 만들기</h3>
            <input
              type="text"
              placeholder="그룹 이름을 입력하세요"
              className="input input-bordered w-full"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateGroup()}
            />
            <div className="modal-action">
              <button
                className="btn"
                onClick={() => {
                  setShowCreateModal(false);
                  setGroupName('');
                }}
              >
                취소
              </button>
              <button className="btn btn-primary" onClick={handleCreateGroup}>
                생성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">그룹 참가</h3>
            <input
              type="text"
              placeholder="그룹 코드를 입력하세요"
              className="input input-bordered w-full uppercase"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleJoinGroup()}
            />
            <div className="modal-action">
              <button
                className="btn"
                onClick={() => {
                  setShowJoinModal(false);
                  setJoinCode('');
                }}
              >
                취소
              </button>
              <button className="btn btn-primary" onClick={handleJoinGroup}>
                참가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
