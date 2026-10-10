import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface GsRegistrationState {
    /** Student the persisted data belongs to — prevents leaking picks between accounts. */
    ownerId: string | null;
    selectedIds: string[];
    /** Reference of a payment that was started but not yet confirmed (survives reloads). */
    pendingReference: string | null;
}

interface GsRegistrationActions {
    bindOwner: (id: string) => void;
    toggle: (courseId: string) => void;
    setSelected: (ids: string[]) => void;
    setPendingReference: (reference: string | null) => void;
    reset: () => void;
}

const initial: GsRegistrationState = { ownerId: null, selectedIds: [], pendingReference: null };

export const useGsStore = create<GsRegistrationState & GsRegistrationActions>()(
    persist(
        (set) => ({
            ...initial,
            bindOwner: (id) => set((s) => (s.ownerId === id ? s : { ...initial, ownerId: id })),
            toggle: (courseId) =>
                set((s) => ({
                    selectedIds: s.selectedIds.includes(courseId)
                        ? s.selectedIds.filter((id) => id !== courseId)
                        : [...s.selectedIds, courseId],
                })),
            setSelected: (ids) => set({ selectedIds: [...new Set(ids)] }),
            setPendingReference: (pendingReference) => set({ pendingReference }),
            reset: () => set((s) => ({ ...initial, ownerId: s.ownerId })),
        }),
        {
            name: 'gs-registration',
            version: 1,
            storage: createJSONStorage(() => sessionStorage),
            partialize: ({ ownerId, selectedIds, pendingReference }) => ({ ownerId, selectedIds, pendingReference }),
        },
    ),
);
