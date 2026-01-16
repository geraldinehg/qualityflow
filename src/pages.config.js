import Dashboard from './pages/Dashboard';
import ProjectChecklist from './pages/ProjectChecklist';
import PublicTaskForm from './pages/PublicTaskForm';
import Statistics from './pages/Statistics';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "ProjectChecklist": ProjectChecklist,
    "PublicTaskForm": PublicTaskForm,
    "Statistics": Statistics,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};