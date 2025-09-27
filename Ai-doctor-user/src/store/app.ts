import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
    state: () => ({
        showLoginPopup: false,
        knowledgePopup: false,
    }),
    getters: {
        getShowLoginPopup(): boolean {
            return this.showLoginPopup
        },
        getKnowledgePopup(): boolean {
            return this.knowledgePopup
        },
    },
    actions: {
        setShowLoginPopup(showLoginPopup: boolean) {
            this.showLoginPopup = showLoginPopup
        },
        setKnowledgePopup(knowledgePopup: boolean) {
            this.knowledgePopup = knowledgePopup
        },
    },
    // persist: true
})