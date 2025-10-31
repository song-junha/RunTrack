import { getDB, saveDB } from './db';
import { Race, Group, Runner, Split } from '../types';

// ========== Races ==========
export function getAllRaces(): Race[] {
  const db = getDB();
  const result = db.exec('SELECT * FROM races');

  if (result.length === 0) return [];

  const races: Race[] = [];
  for (const row of result[0].values) {
    races.push({
      id: row[0] as string,
      name: row[1] as string,
      code: row[2] as string,
      date: row[3] as string,
    });
  }

  return races;
}

export function getRaceById(id: string): Race | null {
  const db = getDB();
  const result = db.exec('SELECT * FROM races WHERE id = ?', [id]);

  if (result.length === 0 || result[0].values.length === 0) return null;

  const row = result[0].values[0];
  return {
    id: row[0] as string,
    name: row[1] as string,
    code: row[2] as string,
    date: row[3] as string,
  };
}

// ========== Groups ==========
export function getAllGroups(): Group[] {
  const db = getDB();
  const result = db.exec('SELECT * FROM groups');

  if (result.length === 0) return [];

  const groups: Group[] = [];
  for (const row of result[0].values) {
    groups.push({
      id: row[0] as string,
      name: row[1] as string,
      raceId: row[2] as string,
      code: row[3] as string,
      createdAt: row[4] as string,
      memberCount: row[5] as number,
    });
  }

  return groups;
}

export function getGroupsByRaceId(raceId: string): Group[] {
  const db = getDB();
  const result = db.exec('SELECT * FROM groups WHERE raceId = ?', [raceId]);

  if (result.length === 0) return [];

  const groups: Group[] = [];
  for (const row of result[0].values) {
    groups.push({
      id: row[0] as string,
      name: row[1] as string,
      raceId: row[2] as string,
      code: row[3] as string,
      createdAt: row[4] as string,
      memberCount: row[5] as number,
    });
  }

  return groups;
}

export function getGroupByCode(code: string): Group | null {
  const db = getDB();
  const result = db.exec('SELECT * FROM groups WHERE code = ?', [code]);

  if (result.length === 0 || result[0].values.length === 0) return null;

  const row = result[0].values[0];
  return {
    id: row[0] as string,
    name: row[1] as string,
    raceId: row[2] as string,
    code: row[3] as string,
    createdAt: row[4] as string,
    memberCount: row[5] as number,
  };
}

export function addGroup(group: Group) {
  const db = getDB();
  db.run(
    'INSERT INTO groups (id, name, raceId, code, createdAt, memberCount) VALUES (?, ?, ?, ?, ?, ?)',
    [group.id, group.name, group.raceId, group.code, group.createdAt, group.memberCount]
  );
  saveDB();
}

// ========== Runners ==========
export function getAllRunners(): Runner[] {
  const db = getDB();
  const result = db.exec('SELECT * FROM runners');

  if (result.length === 0) return [];

  const runners: Runner[] = [];
  for (const row of result[0].values) {
    const runnerId = row[0] as string;
    const splits = getSplitsByRunnerId(runnerId);

    runners.push({
      id: runnerId,
      name: row[1] as string,
      bibNumber: row[2] as string,
      groupId: row[3] as string,
      currentDistance: row[4] as number,
      currentPace: row[5] as string,
      estimatedFinishTime: row[6] as string,
      splits,
    });
  }

  return runners;
}

export function getRunnersByGroupId(groupId: string): Runner[] {
  const db = getDB();
  const result = db.exec('SELECT * FROM runners WHERE groupId = ?', [groupId]);

  if (result.length === 0) return [];

  const runners: Runner[] = [];
  for (const row of result[0].values) {
    const runnerId = row[0] as string;
    const splits = getSplitsByRunnerId(runnerId);

    runners.push({
      id: runnerId,
      name: row[1] as string,
      bibNumber: row[2] as string,
      groupId: row[3] as string,
      currentDistance: row[4] as number,
      currentPace: row[5] as string,
      estimatedFinishTime: row[6] as string,
      splits,
    });
  }

  return runners;
}

export function addRunner(runner: Runner) {
  const db = getDB();
  db.run(
    'INSERT INTO runners (id, name, bibNumber, groupId, currentDistance, currentPace, estimatedFinishTime) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [runner.id, runner.name, runner.bibNumber, runner.groupId, runner.currentDistance, runner.currentPace, runner.estimatedFinishTime]
  );

  // 그룹의 멤버 수 증가
  db.run('UPDATE groups SET memberCount = memberCount + 1 WHERE id = ?', [runner.groupId]);

  saveDB();
}

export function updateRunner(runnerId: string, updates: Partial<Runner>) {
  const db = getDB();
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.currentDistance !== undefined) {
    fields.push('currentDistance = ?');
    values.push(updates.currentDistance);
  }
  if (updates.currentPace !== undefined) {
    fields.push('currentPace = ?');
    values.push(updates.currentPace);
  }
  if (updates.estimatedFinishTime !== undefined) {
    fields.push('estimatedFinishTime = ?');
    values.push(updates.estimatedFinishTime);
  }

  if (fields.length > 0) {
    values.push(runnerId);
    db.run(`UPDATE runners SET ${fields.join(', ')} WHERE id = ?`, values);

    // 스플릿 추가
    if (updates.splits && updates.splits.length > 0) {
      for (const split of updates.splits) {
        addSplit(runnerId, split);
      }
    }

    saveDB();
  }
}

export function deleteRunner(runnerId: string, groupId: string) {
  const db = getDB();

  // 러너의 스플릿 삭제
  db.run('DELETE FROM splits WHERE runnerId = ?', [runnerId]);

  // 러너 삭제
  db.run('DELETE FROM runners WHERE id = ?', [runnerId]);

  // 그룹의 멤버 수 감소
  db.run('UPDATE groups SET memberCount = memberCount - 1 WHERE id = ?', [groupId]);

  saveDB();
}

// ========== Splits ==========
export function getSplitsByRunnerId(runnerId: string): Split[] {
  const db = getDB();
  const result = db.exec('SELECT distance, time, passTime, pace, timestamp FROM splits WHERE runnerId = ? ORDER BY distance', [runnerId]);

  if (result.length === 0) return [];

  const splits: Split[] = [];
  for (const row of result[0].values) {
    splits.push({
      distance: row[0] as number,
      time: row[1] as string,
      passTime: row[2] as string,
      pace: row[3] as string,
      timestamp: row[4] as string,
    });
  }

  return splits;
}

export function addSplit(runnerId: string, split: Split) {
  const db = getDB();

  // 중복 체크
  const existing = db.exec(
    'SELECT id FROM splits WHERE runnerId = ? AND distance = ?',
    [runnerId, split.distance]
  );

  if (existing.length === 0 || existing[0].values.length === 0) {
    db.run(
      'INSERT INTO splits (runnerId, distance, time, passTime, pace, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
      [runnerId, split.distance, split.time, split.passTime || '', split.pace, split.timestamp]
    );
    saveDB();
  }
}
