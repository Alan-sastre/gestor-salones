import { useEffect, useMemo, useState, useRef } from 'react';
import { SPACES } from './data/spaces';
import LoginScreen from './components/LoginScreen';
import WelcomeScreen from './components/WelcomeScreen';
import CalendarPanel from './components/CalendarPanel';
import BookingPanel from './components/BookingPanel';
import AppHeader from './components/AppHeader';
import NotificationCenter from './components/NotificationCenter';
import SpaceSelector from './components/SpaceSelector';
import SpaceDetailScreen from './components/SpaceDetailScreen';
import EquipmentPanel from './components/EquipmentPanel';
import BookingSummaryScreen from './components/BookingSummaryScreen';
import SuccessScreen from './components/SuccessScreen';

const pad = (n) => String(n).padStart(2, '0');
const key = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const today = new Date();
const todayKey = key(today.getFullYear(), today.getMonth(), today.getDate());
const START_HOUR = '07:00';
const END_HOUR = '21:00';

function App() {
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedSpaceId, setSelectedSpaceId] = useState(null);
  const [selectedDay, setSelectedDay] = useState(todayKey);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [userName, setUserName] = useState('');
  const [professorId, setProfessorId] = useState('');
  const [loginError, setLoginError] = useState('');
  const [reason, setReason] = useState('');
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('09:00');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [notifications, setNotifications] = useState([]);
  const [bookings, setBookings] = useState({ 0: [], 1: [], 2: [], 3: [], 4: [] });
  const [equipmentBookings, setEquipmentBookings] = useState({});

  // Step flow state
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState('forward');
  const [transitioning, setTransitioning] = useState(false);
  const timeoutRef = useRef(null);

  const selectedSpace = SPACES.find((space) => space.id === selectedSpaceId) || null;

  useEffect(() => {
    setMessage({ text: '', type: '' });
  }, [selectedDay, selectedSpaceId]);

  const pushNotification = (text, type = 'info') => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev, { id, text, type }]);
  };

  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  const selectedDateBookings = useMemo(
    () => (selectedSpaceId === null ? [] : (bookings[selectedSpaceId] || []).filter((booking) => booking.date === selectedDay)),
    [bookings, selectedSpaceId, selectedDay]
  );

  const dayTitle = (() => {
    const [year, month, day] = selectedDay.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('es', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  })();

  const goToStep = (newStep, dir) => {
    if (transitioning) return;
    setDirection(dir);
    setTransitioning(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setStep(newStep);
      setTransitioning(false);
    }, 300);
  };

  const handleSelectSpace = (id) => {
    setSelectedSpaceId(id);
    goToStep(2, 'forward');
  };

  const handleLogin = (event) => {
    event.preventDefault();
    if (!professorId.trim() || !/^\d+$/.test(professorId.trim())) {
      setLoginError('Ingresa un código numérico válido.');
      return;
    }
    setUserName('NombrePrueba');
    setLoginError('');
    setIsLoggedIn(true);
    setShowWelcome(true);
  };

  const handleContinue = () => {
    setShowWelcome(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setShowWelcome(false);
    setProfessorId('');
    setStep(1);
    setSelectedSpaceId(null);
  };

  const handleMonthChange = (dir) => {
    const next = new Date(currentMonth);
    next.setMonth(currentMonth.getMonth() + dir);
    setCurrentMonth(next);
  };

  const handleBook = () => {
    const trimmedReason = reason.trim();
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    if (!trimmedReason) {
      setMessage({ text: 'Escribe el motivo de la reserva.', type: 'error' });
      return;
    }

    if (!startTime || !endTime || startMinutes >= endMinutes) {
      setMessage({ text: 'La hora de fin debe ser posterior al inicio.', type: 'error' });
      return;
    }

    if (startMinutes < timeToMinutes(START_HOUR) || endMinutes > timeToMinutes(END_HOUR)) {
      setMessage({ text: 'La reserva debe estar entre las 07:00 y las 21:00.', type: 'error' });
      return;
    }

    const hasConflict = (bookings[selectedSpaceId] || []).some((booking) => {
      if (booking.date !== selectedDay) return false;
      const bookingStart = timeToMinutes(booking.a);
      const bookingEnd = timeToMinutes(booking.b);
      return startMinutes < bookingEnd && endMinutes > bookingStart;
    });

    if (hasConflict) {
      setMessage({ text: 'Ese horario ya está ocupado en este salón.', type: 'error' });
      return;
    }

    const booking = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      date: selectedDay,
      a: startTime,
      b: endTime,
      t: userName,
      r: trimmedReason
    };

    setBookings((prev) => ({
      ...prev,
      [selectedSpaceId]: [
        ...(prev[selectedSpaceId] || []),
        booking
      ]
    }));

    setReason('');
    setMessage({ text: 'Reserva registrada. Tienes 40 minutos antes de iniciar la clase para cancelar 🚫.', type: 'success' });
    pushNotification('Reserva registrada. Tienes 40 minutos antes de iniciar la clase para cancelar 🚫.', 'success');
  };

  const handleCancelBooking = (bookingId) => {
    const roomBookings = bookings[selectedSpaceId] || [];
    const bookingToCancel = roomBookings.find((booking) => booking.id === bookingId);
    if (!bookingToCancel) return;
    setBookings((prev) => ({
      ...prev,
      [selectedSpaceId]: (prev[selectedSpaceId] || []).filter((booking) => booking.id !== bookingId)
    }));
    pushNotification(`Reserva cancelada para ${bookingToCancel.a} - ${bookingToCancel.b}. Si quieres reprogramar, elige otro horario.`, 'warning');
  };

  const handleBookEquipment = (equipmentId, startTime, endTime) => {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const dayBookings = (equipmentBookings[equipmentId] || []).filter(b => b.date === selectedDay);
    const hasConflict = dayBookings.some(b => {
      const bStart = timeToMinutes(b.a);
      const bEnd = timeToMinutes(b.b);
      return startMinutes < bEnd && endMinutes > bStart;
    });
    if (hasConflict) {
      pushNotification('Ese equipo ya está reservado en ese horario.', 'error');
      return;
    }
    const booking = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      date: selectedDay,
      a: startTime,
      b: endTime,
      t: userName
    };
    setEquipmentBookings(prev => ({
      ...prev,
      [equipmentId]: [...(prev[equipmentId] || []), booking]
    }));
    pushNotification(`Equipo reservado de ${startTime} a ${endTime}.`, 'success');
  };

  const handleConfirmBooking = () => {
    pushNotification('¡Reserva confirmada exitosamente!', 'success');
    goToStep(6, 'forward');
  };

  const handleFinish = () => {
    setSelectedSpaceId(null);
    setStep(1);
    setReason('');
    setStartTime('07:00');
    setEndTime('09:00');
    setMessage({ text: '', type: '' });
    setEquipmentBookings({});
    setSelectedDay(todayKey);
    setDirection('forward');
    setTransitioning(false);
  };

  const handleEquipmentContinue = () => {
    const hasEquipmentForDay = Object.values(equipmentBookings).some(
      (bookingList) => bookingList.some((b) => b.date === selectedDay)
    );
    if (!hasEquipmentForDay) {
      pushNotification('No seleccionaste ningún equipo. Puedes continuar sin equipos.', 'warning');
    }
    goToStep(5, 'forward');
  };

  if (!isLoggedIn) {
    return (
      <LoginScreen
        professorId={professorId}
        loginError={loginError}
        onIdChange={setProfessorId}
        onSubmit={handleLogin}
      />
    );
  }

  if (showWelcome) {
    return <WelcomeScreen userName={userName} onContinue={handleContinue} />;
  }

  const stepAnimClass = direction === 'back' ? 'step-enter-back' : 'step-enter';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <NotificationCenter notifications={notifications} onDismiss={dismissNotification} />
      <AppHeader userName={userName} onLogout={handleLogout} />

      <main className="mx-auto max-w-6xl px-4 py-6">
        {!transitioning && step === 1 && (
          <SpaceSelector
            spaces={SPACES}
            onSelectSpace={handleSelectSpace}
            direction={direction}
          />
        )}

        {!transitioning && step === 2 && selectedSpace && (
          <SpaceDetailScreen
            space={selectedSpace}
            direction={direction}
            onContinue={() => goToStep(3, 'forward')}
            onBack={() => {
              setSelectedSpaceId(null);
              goToStep(1, 'back');
            }}
          />
        )}

        {!transitioning && step === 3 && (
          <div className={stepAnimClass}>
            <section className="grid gap-6 lg:grid-cols-3">
              <CalendarPanel
                currentMonth={currentMonth}
                selectedSpace={selectedSpace}
                selectedDay={selectedDay}
                bookings={(bookings[selectedSpaceId] || [])}
                onMonthChange={handleMonthChange}
                onDateSelect={setSelectedDay}
                todayKey={todayKey}
              />
              <BookingPanel
                dayTitle={dayTitle}
                selectedDateBookings={selectedDateBookings}
                reason={reason}
                startTime={startTime}
                endTime={endTime}
                message={message}
                onReasonChange={setReason}
                onStartTimeChange={setStartTime}
                onEndTimeChange={setEndTime}
                onBook={handleBook}
                onCancelBooking={handleCancelBooking}
              />
            </section>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => goToStep(2, 'back')}
                className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                Atrás
              </button>
              <button
                type="button"
                onClick={() => goToStep(4, 'forward')}
                className="flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 active:scale-95 shadow-sm"
              >
                Continuar
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        )}

        {!transitioning && step === 4 && (
          <EquipmentPanel
            selectedDay={selectedDay}
            equipmentBookings={equipmentBookings}
            onBookEquipment={handleBookEquipment}
            onBack={() => goToStep(3, 'back')}
            onContinue={handleEquipmentContinue}
            direction={direction}
          />
        )}

        {!transitioning && step === 5 && (
          <BookingSummaryScreen
            direction={direction}
            userName={userName}
            space={selectedSpace}
            selectedDay={selectedDay}
            startTime={startTime}
            endTime={endTime}
            reason={reason}
            equipmentBookings={equipmentBookings}
            onEditSpace={() => { setSelectedSpaceId(null); goToStep(1, 'back'); }}
            onEditCalendar={() => goToStep(3, 'back')}
            onEditEquipment={() => goToStep(4, 'back')}
            onConfirm={handleConfirmBooking}
            onBack={() => goToStep(4, 'back')}
          />
        )}

        {!transitioning && step === 6 && (
          <SuccessScreen onFinish={handleFinish} />
        )}
      </main>
    </div>
  );
}

export default App;
