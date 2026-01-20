import Dashboard from './pages/Dashboard';
import ProjectChecklist from './pages/ProjectChecklist';
import PublicTaskForm from './pages/PublicTaskForm';
import GlobalAccess from './pages/GlobalAccess';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "ProjectChecklist": ProjectChecklist,
    "PublicTaskForm": PublicTaskForm,
    "GlobalAccess": GlobalAccess,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};