import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SPACES } from './data/spaces';
import { EQUIPMENT } from './data/equipment';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import AnimatedGridPattern from './components/AnimatedGridPattern';
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
import ReservationsPanel from './components/ReservationsPanel';
import SuccessScreen from './components/SuccessScreen';

const pad = (number) => String(number).padStart(2, '0');
const key = (year, month, day) => `${year}-${pad(month + 1)}-${pad(day)}`;
const today = new Date();
const todayKey = key(today.getFullYear(), today.getMonth(), today.getDate());
const START_HOUR = '07:00';
const END_HOUR = '21:00';
const EMPTY_BOOKINGS = [];

const groupBy = (items, getKey) => items.reduce((groups, item) => {
  const itemKey = getKey(item);
  if (!groups[itemKey]) groups[itemKey] = [];
  groups[itemKey].push(item);
  return groups;
}, {});

function App() {
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedSpaceId, setSelectedSpaceId] = useState(null);
  const [selectedDay, setSelectedDay] = useState(todayKey);
  const [isDemoLoggedIn, setIsDemoLoggedIn] = useState(false);
  const [loggedProfessorCode, setLoggedProfessorCode] = useState('');
  const [dataLoading, setDataLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [userName, setUserName] = useState('');
  const [professorId, setProfessorId] = useState('');
  const [spaces, setSpaces] = useState(SPACES);
  const [equipment, setEquipment] = useState(EQUIPMENT);
  const [reason, setReason] = useState('');
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('09:00');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [notifications, setNotifications] = useState([]);
  const [bookings, setBookings] = useState({});
  const [equipmentBookings, setEquipmentBookings] = useState({});
  const [availabilityBookings, setAvailabilityBookings] = useState({});
  const [equipmentAvailability, setEquipmentAvailability] = useState({});
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [activeView, setActiveView] = useState('agenda');
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState('forward');
  const [transitioning, setTransitioning] = useState(false);
  const timeoutRef = useRef(null);

  const selectedSpace = spaces.find((space) => space.id === selectedSpaceId) || null;
  const displayName = userName;

  const pushNotification = useCallback((text, type = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setNotifications((previous) => [...previous, { id, text, type }]);
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications((previous) => previous.filter((notification) => notification.id !== id));
  }, []);

  useEffect(() => () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    if (!isDemoLoggedIn || !loggedProfessorCode || !supabase) return undefined;

    let active = true;
    const monthStart = key(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDayOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    ).getDate();
    const monthEnd = key(currentMonth.getFullYear(), currentMonth.getMonth(), lastDayOfMonth);
    const asTime = (value) => String(value).slice(0, 5);

    const loadReservations = async () => {
      setDataLoading(true);
      const [spacesResult, equipmentResult, reservationsResult, availabilityResult] = await Promise.all([
        supabase.from('spaces').select('id, name, capacity, description').order('id'),
        supabase.from('equipment')
          .select('id, name, type, description, total_units, model_url')
          .in('id', EQUIPMENT.map((item) => item.id))
          .order('id'),
        supabase.rpc('get_test_reservations', { p_professor_code: loggedProfessorCode }),
        supabase.rpc('get_reservation_availability', { p_start_date: monthStart, p_end_date: monthEnd }),
      ]);
      const failed = [spacesResult, equipmentResult, reservationsResult, availabilityResult].find((result) => result.error);
      if (failed) throw failed.error;
      if (!active) return;

      const loadedSpaces = spacesResult.data.map((row) => {
        const localSpace = SPACES.find((item) => item.id === Number(row.id));
        return {
          ...row,
          id: Number(row.id),
          capacidad: row.capacity,
          desc: row.description,
          features: localSpace?.features || [],
          img: localSpace?.img || '',
        };
      });
      const loadedEquipment = equipmentResult.data.map((row) => ({
        ...row,
        id: String(row.id),
        desc: row.description,
        total: row.total_units,
        modelUrl: row.model_url || EQUIPMENT.find((item) => item.id === row.id)?.modelUrl || '',
        img: EQUIPMENT.find((item) => item.id === row.id)?.img || '',
      }));
      const ownReservations = reservationsResult.data.map((row) => ({
        id: row.reservation_id,
        kind: row.resource_type,
        resourceId: row.resource_type === 'space' ? Number(row.resource_id) : row.resource_id,
        date: row.reservation_date,
        a: asTime(row.start_time),
        b: asTime(row.end_time),
        r: row.reason || '',
        t: userName,
        owned: true,
      }));
      const availability = availabilityResult.data.map((row) => ({
        id: row.reservation_id,
        kind: row.resource_type,
        resourceId: row.resource_type === 'space' ? Number(row.resource_id) : row.resource_id,
        spaceId: row.resource_type === 'space' ? Number(row.resource_id) : undefined,
        date: row.reservation_date,
        a: asTime(row.start_time),
        b: asTime(row.end_time),
        r: row.reason || '',
        owned: ownReservations.some((reservation) => reservation.id === row.reservation_id),
      }));

      setSpaces(loadedSpaces);
      setEquipment(loadedEquipment);
      setBookings(groupBy(ownReservations.filter((item) => item.kind === 'space'), (item) => item.resourceId));
      setEquipmentBookings(groupBy(ownReservations.filter((item) => item.kind === 'equipment'), (item) => item.resourceId));
      setAvailabilityBookings(groupBy(availability.filter((item) => item.kind === 'space'), (item) => item.spaceId));
      setEquipmentAvailability(groupBy(availability.filter((item) => item.kind === 'equipment'), (item) => item.resourceId));
    };

    loadReservations().catch((error) => {
      if (active) pushNotification(`Error al cargar la base de prueba: ${error.message}. Verifica la configuración y el esquema de Supabase.`, 'error');
    }).finally(() => {
      if (active) setDataLoading(false);
    });

    return () => {
      active = false;
    };
  }, [isDemoLoggedIn, loggedProfessorCode, currentMonth, refreshVersion, pushNotification, userName]);

  useEffect(() => {
    setMessage({ text: '', type: '' });
  }, [selectedDay, selectedSpaceId]);

  const selectedDateBookings = useMemo(
    () => selectedSpaceId === null
      ? []
      : (availabilityBookings[selectedSpaceId] || []).filter((booking) => booking.date === selectedDay),
    [availabilityBookings, selectedSpaceId, selectedDay]
  );

  const dayTitle = (() => {
    const [year, month, day] = selectedDay.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('es', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  })();

  const goToStep = (newStep, nextDirection) => {
    if (transitioning) return;
    setDirection(nextDirection);
    setTransitioning(true);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      setStep(newStep);
      setTransitioning(false);
    }, 300);
  };

  const handleSelectSpace = (id) => {
    setSelectedSpaceId(id);
    goToStep(2, 'forward');
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginError('');
    const id = professorId.trim();
    if (!id || !/^\d+$/.test(id)) {
      setLoginError('Ingresa un código numérico válido.');
      return;
    }

    let name = id;
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.rpc('lookup_test_professor', { p_code: id });
        if (error) {
          setLoginError(`No se pudo validar el ID en Supabase: ${error.message}. Verifica que la base esté configurada.`);
          return;
        }
        const professor = data?.[0];
        if (!professor) {
          setLoginError('ID no encontrado. Prueba con 1001, 1002, 1003, 1004 o 1005.');
          return;
        }
        name = professor.name;
      } catch (error) {
        setLoginError(`No se pudo conectar con Supabase: ${error.message}`);
        return;
      }
    }

    setUserName(name);
    setLoggedProfessorCode(id);
    setProfessorId('');
    setIsDemoLoggedIn(true);
    setShowWelcome(true);
  };

  const handleContinue = () => setShowWelcome(false);

  const handleLogout = () => {
    setIsDemoLoggedIn(false);
    setLoggedProfessorCode('');
    setUserName('');
    setBookings({});
    setEquipmentBookings({});
    setAvailabilityBookings({});
    setEquipmentAvailability({});
    setActiveView('agenda');
    setStep(1);
    setSelectedSpaceId(null);
  };

  const handleMonthChange = useCallback((monthOffset) => {
    setCurrentMonth((previous) => new Date(
      previous.getFullYear(),
      previous.getMonth() + monthOffset,
      1
    ));
  }, []);

  const handleBook = async () => {
    const showBookingError = (text) => {
      setMessage({ text, type: 'error' });
      pushNotification(text, 'error');
    };
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      showBookingError('Escribe el motivo de la reserva.');
      return;
    }
    if (!startTime || !endTime || startTime >= endTime) {
      showBookingError('La hora de fin debe ser posterior al inicio.');
      return;
    }
    if (startTime < START_HOUR || endTime > END_HOUR) {
      showBookingError('La reserva debe estar entre las 07:00 y las 21:00.');
      return;
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.rpc('save_test_space_reservation', {
        p_professor_code: loggedProfessorCode,
        p_id: null,
        p_space_id: selectedSpaceId,
        p_date: selectedDay,
        p_start: startTime,
        p_end: endTime,
        p_reason: trimmedReason,
      });
      if (error) {
        showBookingError(error.message.includes('occupied') ? 'Ese horario ya está ocupado en este salón.' : error.message);
        return;
      }
      setRefreshVersion((version) => version + 1);
      setReason('');
      setMessage({ text: 'Préstamo realizado con éxito.', type: 'success' });
      pushNotification('Tu préstamo de espacio quedó registrado.', 'success');
      return;
    }

    {
      const localBooking = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        date: selectedDay,
        a: startTime,
        b: endTime,
        t: displayName,
        r: trimmedReason,
        spaceId: selectedSpaceId,
        owned: true,
        kind: 'space',
      };
      setBookings((previous) => ({
        ...previous,
        [selectedSpaceId]: [...(previous[selectedSpaceId] || []), localBooking],
      }));
      setAvailabilityBookings((previous) => ({
        ...previous,
        [selectedSpaceId]: [...(previous[selectedSpaceId] || []), localBooking],
      }));
      setReason('');
      setMessage({ text: 'Reserva registrada en esta sesión de prueba.', type: 'success' });
      pushNotification('Tu reserva de prueba quedó registrada temporalmente.', 'success');
      return;
    }

  };

  const handleCancelRoomBooking = async (bookingId) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.rpc('cancel_test_reservation', {
        p_professor_code: loggedProfessorCode,
        p_id: bookingId,
        p_resource_type: 'space',
      });
      if (error || !data) {
        pushNotification(`No se pudo cancelar el préstamo${error ? `: ${error.message}` : '.'}`, 'error');
        return false;
      }
      setRefreshVersion((version) => version + 1);
      pushNotification('Préstamo cancelado.', 'success');
      return true;
    }

    {
      setBookings((previous) => ({
        ...previous,
        [selectedSpaceId]: (previous[selectedSpaceId] || []).filter((booking) => booking.id !== bookingId),
      }));
      setAvailabilityBookings((previous) => ({
        ...previous,
        [selectedSpaceId]: (previous[selectedSpaceId] || []).filter((booking) => booking.id !== bookingId),
      }));
      pushNotification('Reserva de prueba cancelada.', 'success');
      return true;
    }
  };

  const handleBookEquipment = async (equipmentId, start, end) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.rpc('save_test_equipment_reservation', {
        p_professor_code: loggedProfessorCode,
        p_id: null,
        p_equipment_id: equipmentId,
        p_date: selectedDay,
        p_start: start,
        p_end: end,
      });
      if (error) {
        pushNotification(error.message.includes('available') ? 'No hay unidades disponibles en ese horario.' : `No se pudo guardar el préstamo: ${error.message}`, 'error');
        return false;
      }
      setRefreshVersion((version) => version + 1);
      pushNotification(`Préstamo de equipo guardado en Supabase: ${start}–${end}.`, 'success');
      return true;
    }

    {
      const booking = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        date: selectedDay,
        a: start,
        b: end,
        t: displayName,
        equipmentId,
      };
      setEquipmentBookings((previous) => ({
        ...previous,
        [equipmentId]: [...(previous[equipmentId] || []), booking],
      }));
      setEquipmentAvailability((previous) => ({
        ...previous,
        [equipmentId]: [...(previous[equipmentId] || []), booking],
      }));
      pushNotification(`Equipo reservado de ${start} a ${end} en esta sesión de prueba.`, 'success');
      return true;
    }
  };

  const handleUpdateReservation = async (reservation, form) => {
    if (!isSupabaseConfigured || !supabase) {
      if (reservation.kind === 'space') {
        const updateBookings = (groups) => {
          const next = Object.fromEntries(Object.entries(groups).map(([resourceId, items]) => [
            resourceId,
            items.filter((item) => item.id !== reservation.id),
          ]));
          const updated = {
            ...reservation,
            spaceId: Number(form.resourceId),
            date: form.date,
            a: form.start,
            b: form.end,
            r: form.reason,
            resourceId: Number(form.resourceId),
            owned: true,
            kind: 'space',
          };
          next[updated.spaceId] = [...(next[updated.spaceId] || []), updated];
          return next;
        };
        setBookings(updateBookings);
        setAvailabilityBookings(updateBookings);
      } else {
        const updated = {
          ...reservation,
          resourceId: form.resourceId,
          date: form.date,
          a: form.start,
          b: form.end,
        };
        const updateBookings = (groups) => {
          const next = Object.fromEntries(Object.entries(groups).map(([resourceId, items]) => [
            resourceId,
            items.filter((item) => item.id !== reservation.id),
          ]));
          next[form.resourceId] = [...(next[form.resourceId] || []), updated];
          return next;
        };
        setEquipmentBookings(updateBookings);
        setEquipmentAvailability(updateBookings);
      }
      pushNotification('Cambios guardados en la reserva temporal.', 'success');
      return true;
    }
    const isSpace = reservation.kind === 'space';
    const { error } = await supabase.rpc(
      isSpace ? 'save_test_space_reservation' : 'save_test_equipment_reservation',
      isSpace
        ? {
          p_professor_code: loggedProfessorCode,
          p_id: reservation.id,
          p_space_id: Number(form.resourceId),
          p_date: form.date,
          p_start: form.start,
          p_end: form.end,
          p_reason: form.reason.trim(),
        }
        : {
          p_professor_code: loggedProfessorCode,
          p_id: reservation.id,
          p_equipment_id: form.resourceId,
          p_date: form.date,
          p_start: form.start,
          p_end: form.end,
        }
    );
    if (error) {
      pushNotification(`No se pudieron guardar los cambios: ${error.message}`, 'error');
      return false;
    }
    setRefreshVersion((version) => version + 1);
    pushNotification('Cambios guardados en tu reserva.', 'success');
    return true;
  };

  const handleCancelReservation = async (reservation) => {
    if (!isSupabaseConfigured || !supabase) {
      if (reservation.kind === 'space') {
        const filterReservation = (groups) => Object.fromEntries(
          Object.entries(groups).map(([resourceId, items]) => [
            resourceId,
            items.filter((item) => item.id !== reservation.id),
          ])
        );
        setBookings(filterReservation);
        setAvailabilityBookings(filterReservation);
      } else {
        const filterReservation = (groups) => Object.fromEntries(
          Object.entries(groups).map(([resourceId, items]) => [
            resourceId,
            items.filter((item) => item.id !== reservation.id),
          ])
        );
        setEquipmentBookings(filterReservation);
        setEquipmentAvailability(filterReservation);
      }
      pushNotification('Reserva de prueba cancelada.', 'success');
      return;
    }
    const { data, error } = await supabase.rpc('cancel_test_reservation', {
      p_professor_code: loggedProfessorCode,
      p_id: reservation.id,
      p_resource_type: reservation.kind,
    });
    if (error || !data) {
      pushNotification(`No se pudo cancelar la reserva${error ? `: ${error.message}` : '.'}`, 'error');
      return;
    }
    setRefreshVersion((version) => version + 1);
    pushNotification('Reserva cancelada correctamente.', 'success');
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
    setSelectedDay(todayKey);
    setDirection('forward');
    setTransitioning(false);
    setRefreshVersion((version) => version + 1);
  };

  const handleEquipmentContinue = () => {
    const hasEquipmentForDay = Object.values(equipmentBookings).some(
      (bookingList) => bookingList.some((booking) => booking.date === selectedDay)
    );
    if (!hasEquipmentForDay) pushNotification('Puedes continuar sin reservar equipos.', 'info');
    goToStep(5, 'forward');
  };

  const reservations = useMemo(() => [
    ...Object.values(bookings).flat().map((booking) => ({
      id: booking.id,
      kind: 'space',
      resourceId: booking.spaceId,
      date: booking.date,
      start: booking.a,
      end: booking.b,
      reason: booking.r,
    })),
    ...Object.entries(equipmentBookings).flatMap(([equipmentId, bookingList]) => bookingList.map((booking) => ({
      id: booking.id,
      kind: 'equipment',
      resourceId: equipmentId,
      date: booking.date,
      start: booking.a,
      end: booking.b,
    }))),
  ].sort((first, second) => first.date.localeCompare(second.date) || first.start.localeCompare(second.start)), [bookings, equipmentBookings]);

  if (!isDemoLoggedIn) {
    return (
      <>
        <NotificationCenter notifications={notifications} onDismiss={dismissNotification} />
        <LoginScreen
          professorId={professorId}
          loginError={loginError}
          onIdChange={setProfessorId}
          onSubmit={handleLogin}
          isSupabaseConfigured={isSupabaseConfigured}
        />
      </>
    );
  }

  if (showWelcome) return <WelcomeScreen userName={displayName} onContinue={handleContinue} />;

  const stepAnimClass = direction === 'back' ? 'step-enter-back' : 'step-enter';

  return (
    <div className="app-gradient-background relative min-h-screen overflow-clip text-slate-900">
      <AnimatedGridPattern />
      <div className="relative z-10 min-h-screen">
        <NotificationCenter notifications={notifications} onDismiss={dismissNotification} />
        <AppHeader
          userName={displayName}
          onLogout={handleLogout}
          activeView={activeView}
          onViewChange={setActiveView}
        />

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          {activeView === 'reservations' ? (
            <ReservationsPanel
              reservations={reservations}
              spaces={spaces}
              equipment={equipment}
              loading={dataLoading}
              onUpdate={handleUpdateReservation}
              onCancel={handleCancelReservation}
            />
          ) : (
            <>
              {dataLoading && <p className="mb-4 text-xs font-medium text-slate-500">Sincronizando con Supabase…</p>}
              {!transitioning && step === 1 && (
                <SpaceSelector spaces={spaces} onSelectSpace={handleSelectSpace} direction={direction} />
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
                      bookings={availabilityBookings[selectedSpaceId] || EMPTY_BOOKINGS}
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
                      onCancelBooking={handleCancelRoomBooking}
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
                      className="flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 active:scale-95"
                    >
                      Continuar
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                </div>
              )}

              {!transitioning && step === 4 && (
                <EquipmentPanel
                  equipment={equipment}
                  selectedDay={selectedDay}
                  equipmentBookings={equipmentAvailability}
                  onBookEquipment={handleBookEquipment}
                  onBack={() => goToStep(3, 'back')}
                  onContinue={handleEquipmentContinue}
                  direction={direction}
                />
              )}

              {!transitioning && step === 5 && (
                <BookingSummaryScreen
                  direction={direction}
                  userName={displayName}
                  space={selectedSpace}
                  selectedDay={selectedDay}
                  startTime={startTime}
                  endTime={endTime}
                  reason={reason}
                  equipmentBookings={equipmentBookings}
                  equipment={equipment}
                  onEditSpace={() => { setSelectedSpaceId(null); goToStep(1, 'back'); }}
                  onEditCalendar={() => goToStep(3, 'back')}
                  onEditEquipment={() => goToStep(4, 'back')}
                  onConfirm={handleConfirmBooking}
                  onBack={() => goToStep(4, 'back')}
                />
              )}

              {!transitioning && step === 6 && <SuccessScreen onFinish={handleFinish} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
