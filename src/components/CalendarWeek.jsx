import { timeToMinutes, formatTimeLabel, toDateStr } from '../utils/time'

const HOUR_START = 7
const HOUR_END = 19
const HOUR_HEIGHT = 60 // px per hour

function getWeekDates(weekStart) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })
}

export default function CalendarWeek({ appointments, weekStart, onPrevWeek, onNextWeek }) {
  const weekDates = getWeekDates(weekStart)
  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i)

  function appointmentsForDate(dateStr) {
    return appointments.filter((a) => a.appointment_date === dateStr && a.status !== 'cancelled')
  }

  return (
    <div className="calendar">
      <div className="calendar__nav">
        <button className="btn btn--secondary" onClick={onPrevWeek}>← Prev</button>
        <strong>
          {weekDates[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          {' – '}
          {weekDates[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </strong>
        <button className="btn btn--secondary" onClick={onNextWeek}>Next →</button>
      </div>

      <div className="calendar__grid">
        <div className="calendar__time-col">
          <div className="calendar__day-header" />
          {hours.map((h) => (
            <div className="calendar__hour-label" key={h} style={{ height: HOUR_HEIGHT }}>
              {h % 12 === 0 ? 12 : h % 12}{h >= 12 ? 'PM' : 'AM'}
            </div>
          ))}
        </div>

        {weekDates.map((date) => {
          const dateStr = toDateStr(date)
          const dayAppointments = appointmentsForDate(dateStr)
          const isToday = dateStr === toDateStr(new Date())

          return (
            <div className="calendar__day-col" key={dateStr}>
              <div className={`calendar__day-header ${isToday ? 'calendar__day-header--today' : ''}`}>
                <span>{date.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                <span>{date.getDate()}</span>
              </div>
              <div className="calendar__day-body" style={{ height: hours.length * HOUR_HEIGHT }}>
                {hours.map((h) => (
                  <div className="calendar__hour-line" key={h} style={{ top: (h - HOUR_START) * HOUR_HEIGHT }} />
                ))}
                {dayAppointments.map((a) => {
                  const startMin = timeToMinutes(a.start_time) - HOUR_START * 60
                  const endMin = timeToMinutes(a.end_time) - HOUR_START * 60
                  const top = (startMin / 60) * HOUR_HEIGHT
                  const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 26)
                  return (
                    <div key={a.id} className={`calendar__block calendar__block--${a.status}`} style={{ top, height }}>
                      <span className="calendar__block-time">{formatTimeLabel(a.start_time)}</span>
                      <span className="calendar__block-name">{a.profiles?.full_name || a.services?.name || 'Visit'}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
