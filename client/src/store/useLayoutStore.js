import { create } from 'zustand';

const useLayoutStore = create((set) => ({
  pageTitle: '',
  pageSubtitle: '',
  pageBreadcrumbs: [],
  setPageHeader: (title, subtitle = '', breadcrumbs = []) => 
    set({ pageTitle: title, pageSubtitle: subtitle, pageBreadcrumbs: breadcrumbs }),
}));

export default useLayoutStore;
