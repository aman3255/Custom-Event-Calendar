import { CalendarProvider } from './context/CalendarContext';
import CalendarHeader from './components/CalendarHeader';
import CalendarGrid from './components/CalendarGrid';

function App() {
  return (
    <CalendarProvider>
      <div className="min-h-screen bg-gray-100 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <CalendarHeader />
          <CalendarGrid />
        </div>
      </div>
    </CalendarProvider>
  );
}

export default App;