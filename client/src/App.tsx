import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { ThemeProvider } from "./contexts/ThemeContext";
import CoursesPage from "./pages/CoursesPage";
import CertificatePage from "./pages/CertificatePage";
import CourseManagerPage from "./pages/CourseManagerPage";
import DictionaryPage from "./pages/DictionaryPage";
import Home from "./pages/Home";
import HomeworkPage from "./pages/HomeworkPage";
import LessonDetailPage from "./pages/LessonDetailPage";
import LoginPage from "./pages/LoginPage";
import MediaManagerPage from "./pages/MediaManagerPage";
import NotFound from "./pages/NotFound";
import ProfilePage from "./pages/ProfilePage";
import SchoolDashboardPage from "./pages/SchoolDashboardPage";
import SecurityPage from "./pages/SecurityPage";
import TeacherReviewPage from "./pages/TeacherReviewPage";
import VocabularyPracticePage from "./pages/VocabularyPracticePage";
import VoicePracticePage from "./pages/VoicePracticePage";

function App() {
  return <ThemeProvider defaultTheme="light"><TooltipProvider><Toaster position="bottom-right" /><Switch>
    <Route path="/" component={Home} />
    <Route path="/courses" component={CoursesPage} />
    <Route path="/lessons/:id" component={LessonDetailPage} />
    <Route path="/homework" component={HomeworkPage} />
    <Route path="/dictionary" component={DictionaryPage} />
    <Route path="/vocabulary" component={VocabularyPracticePage} />
    <Route path="/voice" component={VoicePracticePage} />
    <Route path="/certificates" component={CertificatePage} />
    <Route path="/school" component={SchoolDashboardPage} />
    <Route path="/profile" component={ProfilePage} />
    <Route path="/security" component={SecurityPage} />
    <Route path="/login" component={LoginPage} />
    <Route path="/teacher" component={TeacherReviewPage} />
    <Route path="/media" component={MediaManagerPage} />
    <Route path="/manage-courses" component={CourseManagerPage} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch></TooltipProvider></ThemeProvider>;
}

export default App;
