import Dashboard from './pages/Dashboard';
import ProjectChecklist from './pages/ProjectChecklist';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "ProjectChecklist": ProjectChecklist,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};