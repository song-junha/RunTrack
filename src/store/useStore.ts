import { create } from 'zustand';
import { Race, Group, Runner } from '../types';
import * as dbOps from '../utils/dbOperations';

interface StoreState {
  dbReady: boolean;
  races: Race[];
  groups: Group[];
  runners: Runner[];
  selectedRaceId: string | null;
  selectedGroupId: string | null;

  setDbReady: (ready: boolean) => void;
  loadData: () => void;
  setSelectedRaceId: (raceId: string) => void;
  setSelectedGroupId: (groupId: string) => void;
  addGroup: (group: Group) => void;
  joinGroup: (code: string) => Group | null;
  addRunner: (runner: Runner) => void;
  updateRunner: (runnerId: string, updates: Partial<Runner>) => void;
  deleteRunner: (runnerId: string, groupId: string) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  dbReady: false,
  races: [],
  groups: [],
  runners: [],
  selectedRaceId: null,
  selectedGroupId: null,

  setDbReady: (ready) => set({ dbReady: ready }),

  loadData: () => {
    try {
      const races = dbOps.getAllRaces();
      const groups = dbOps.getAllGroups();
      const runners = dbOps.getAllRunners();
      set({ races, groups, runners });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  },

  setSelectedRaceId: (raceId) => set({ selectedRaceId: raceId }),

  setSelectedGroupId: (groupId) => set({ selectedGroupId: groupId }),

  addGroup: (group) => {
    try {
      dbOps.addGroup(group);
      const groups = dbOps.getAllGroups();
      set({ groups });
    } catch (error) {
      console.error('Error adding group:', error);
    }
  },

  joinGroup: (code) => {
    try {
      const group = dbOps.getGroupByCode(code);
      if (group) {
        set({ selectedGroupId: group.id });
        return group;
      }
    } catch (error) {
      console.error('Error joining group:', error);
    }
    return null;
  },

  addRunner: (runner) => {
    try {
      dbOps.addRunner(runner);
      const runners = dbOps.getAllRunners();
      const groups = dbOps.getAllGroups();
      set({ runners, groups });
    } catch (error) {
      console.error('Error adding runner:', error);
    }
  },

  updateRunner: (runnerId, updates) => {
    try {
      dbOps.updateRunner(runnerId, updates);
      const runners = dbOps.getAllRunners();
      set({ runners });
    } catch (error) {
      console.error('Error updating runner:', error);
    }
  },

  deleteRunner: (runnerId, groupId) => {
    try {
      dbOps.deleteRunner(runnerId, groupId);
      const runners = dbOps.getAllRunners();
      const groups = dbOps.getAllGroups();
      set({ runners, groups });
    } catch (error) {
      console.error('Error deleting runner:', error);
    }
  },
}));
