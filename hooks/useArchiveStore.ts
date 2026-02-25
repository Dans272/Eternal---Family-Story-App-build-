import { useCallback, useEffect, useMemo, useState } from 'react';
import { CirclePost, CircleSettings, FamilyTree, Profile, User } from '../types';
import { STORAGE_KEYS } from '../constants';

export const useArchiveStore = (user: User | null) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [familyTrees, setFamilyTrees] = useState<FamilyTree[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);
  const [treeViewId, setTreeViewId] = useState<string | null>(null);
  const [circlePosts, setCirclePosts] = useState<CirclePost[]>([]);
  const [circleSettings, setCircleSettings] = useState<CircleSettings>({ userId: '', title: 'Family Circle', bannerUrl: '' });

  // Load user scoped data when user changes
  useEffect(() => {
    if (!user) return;
    const savedProfiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '[]') as Profile[];
    const savedTrees = JSON.parse(localStorage.getItem(STORAGE_KEYS.FAMILY_TREES) || '[]') as FamilyTree[];
    const savedPosts = JSON.parse(localStorage.getItem(STORAGE_KEYS.CIRCLE_POSTS) || '[]') as CirclePost[];
    const savedAllSettings = JSON.parse(localStorage.getItem(STORAGE_KEYS.CIRCLE_SETTINGS) || '[]') as CircleSettings[];

    setProfiles(
      savedProfiles
        .filter((p) => p.userId === user.id)
        .map((p) => ({
          ...p,
          parentIds: p.parentIds || [],
          childIds: p.childIds || [],
          spouseIds: p.spouseIds || [],
          timeline: p.timeline || [],
          memories: p.memories || [],
          media: (p as any).media || [],
          bannerUrl: p.bannerUrl || ''
        }))
    );
    setFamilyTrees(savedTrees.filter((t) => t.userId === user.id));
    setCirclePosts(savedPosts.filter((p) => p.userId === user.id));

    const userSettings = savedAllSettings.find((s) => s.userId === user.id);
    setCircleSettings(userSettings || { userId: user.id, title: 'Family Circle', bannerUrl: '' });
  }, [user]);

  // Persist when data changes
  useEffect(() => {
    if (!user) return;

    const allProfiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '[]') as Profile[];
    const mergedProfiles = [
      ...allProfiles.filter((p) => p.userId !== user.id),
      ...profiles
    ];

    const allTrees = JSON.parse(localStorage.getItem(STORAGE_KEYS.FAMILY_TREES) || '[]') as FamilyTree[];
    const mergedTrees = [
      ...allTrees.filter((t) => t.userId !== user.id),
      ...familyTrees
    ];

    const allPosts = JSON.parse(localStorage.getItem(STORAGE_KEYS.CIRCLE_POSTS) || '[]') as CirclePost[];
    const mergedPosts = [
      ...allPosts.filter((p) => p.userId !== user.id),
      ...circlePosts
    ];

    const allSettings = JSON.parse(localStorage.getItem(STORAGE_KEYS.CIRCLE_SETTINGS) || '[]') as CircleSettings[];
    const mergedSettings = [
      ...allSettings.filter((s) => s.userId !== user.id),
      circleSettings
    ];

    try {
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(mergedProfiles));
      localStorage.setItem(STORAGE_KEYS.FAMILY_TREES, JSON.stringify(mergedTrees));
      localStorage.setItem(STORAGE_KEYS.CIRCLE_POSTS, JSON.stringify(mergedPosts));
      localStorage.setItem(STORAGE_KEYS.CIRCLE_SETTINGS, JSON.stringify(mergedSettings));
    } catch (e) {
      console.error('Storage quota exceeded — archive may not be fully saved.', e);
      try {
        localStorage.setItem(STORAGE_KEYS.FAMILY_TREES, JSON.stringify(mergedTrees));
      } catch {
        // Nothing more we can do without a backend
      }
    }
  }, [profiles, familyTrees, circlePosts, circleSettings, user]);

  const addCirclePost = useCallback((post: CirclePost) => {
    setCirclePosts((prev) => [post, ...prev]);
  }, []);

  const deleteCirclePost = useCallback((id: string) => {
    setCirclePosts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const updateCirclePost = useCallback((id: string, patch: Partial<CirclePost>) => {
    setCirclePosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeProfileId) || null,
    [profiles, activeProfileId]
  );

  const selectedTree = useMemo(
    () => familyTrees.find((t) => t.id === selectedTreeId) || null,
    [familyTrees, selectedTreeId]
  );

  const selectedTreeForView = useMemo(
    () => familyTrees.find((t) => t.id === treeViewId) || null,
    [familyTrees, treeViewId]
  );

  const clearAll = () => {
    setProfiles([]);
    setFamilyTrees([]);
    setActiveProfileId(null);
    setSelectedTreeId(null);
    setTreeViewId(null);
    setCirclePosts([]);
    setCircleSettings({ userId: '', title: 'Family Circle', bannerUrl: '' });
  };

  return {
    profiles, setProfiles,
    familyTrees, setFamilyTrees,
    activeProfileId, setActiveProfileId,
    selectedTreeId, setSelectedTreeId,
    treeViewId, setTreeViewId,
    activeProfile, selectedTree, selectedTreeForView,
    circlePosts, addCirclePost, deleteCirclePost, updateCirclePost,
    circleSettings, setCircleSettings,
    clearAll
  };
};
