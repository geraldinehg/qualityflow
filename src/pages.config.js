import Dashboard from './pages/Dashboard';
import ProjectChecklist from './pages/ProjectChecklist';
import PublicTaskForm from './pages/PublicTaskForm';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "ProjectChecklist": ProjectChecklist,
    "PublicTaskForm": PublicTaskForm,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};