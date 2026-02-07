import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import { GeneralStoreState } from "@/types/common.types";

const initialState: GeneralStoreState = {
    isHydrated: false,
    setHydrated: () => { },
}

export const useGeneralStore = create<GeneralStoreState>()(
    persist(
        immer((set) => ({
            ...initialState,

            setHydrated: () => {
                set((state) => {
                    state.isHydrated = true;
                });
            }
        })),
        {
            name: "general-store",
            onRehydrateStorage: () => (state) => {
                if (state) state.setHydrated();
            },
        }
    )
)


