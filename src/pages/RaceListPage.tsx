import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

export default function RaceListPage() {
  const navigate = useNavigate();
  const { races, setSelectedRaceId } = useStore();

  const handleRaceSelect = (raceId: string) => {
    setSelectedRaceId(raceId);
    navigate(`/race/${raceId}/groups`);
  };

  return (
    <div className="container-safe py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-neutral mb-2">마라톤 대회</h1>
        <p className="text-neutral-content opacity-70">
          참가하실 대회를 선택해주세요
        </p>
      </div>

      <div className="space-y-4">
        {races.map((race) => (
          <div
            key={race.id}
            className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 border border-base-300 cursor-pointer"
            onClick={() => handleRaceSelect(race.id)}
          >
            <div className="card-body">
              <div className="text-sm text-neutral-content opacity-70 mb-1">
                {race.date}
              </div>
              <h2 className="card-title text-xl">{race.name}</h2>
            </div>
          </div>
        ))}
      </div>

      {races.length === 0 && (
        <div className="text-center py-12">
          <p className="text-neutral-content opacity-70">
            등록된 대회가 없습니다
          </p>
        </div>
      )}
    </div>
  );
}
