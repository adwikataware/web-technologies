import React, { useState, useEffect, useMemo, useRef } from 'react';

const BASE_ZONES = [
  { id: 'local', name: 'Local Base', zone: Intl.DateTimeFormat().resolvedOptions().timeZone, tag: 'HQ' },
  { id: 'ny', name: 'New York', zone: 'America/New_York', tag: 'EST' },
  { id: 'london', name: 'London', zone: 'Europe/London', tag: 'GMT' },
  { id: 'tokyo', name: 'Tokyo', zone: 'Asia/Tokyo', tag: 'JST' },
  { id: 'sydney', name: 'Sydney', zone: 'Australia/Sydney', tag: 'AEST' },
];

const TIME_QUOTES = [
  { quote: "Time is what we want most, but what we use worst.", author: "William Penn" },
  { quote: "The two most powerful warriors are patience and time.", author: "Leo Tolstoy" },
  { quote: "Yesterday is gone. Tomorrow has not yet come. We have only today.", author: "Mother Teresa" },
  { quote: "Lost time is never found again.", author: "Benjamin Franklin" },
  { quote: "The key is in not spending time, but in investing it.", author: "Stephen Covey" }
];

export default function LuxuryUnifiedChronos() {
  const [now, setNow] = useState(new Date());
  const [is24Hour, setIs24Hour] = useState(false);
  const [zones, setZones] = useState(BASE_ZONES);
  const [themeMode, setThemeMode] = useState('light'); // 'light', 'obsidian', 'industrial'

  // Custom interactive inputs for adding zones
  const [newZoneInput, setNewZoneInput] = useState('Europe/Paris');
  const [newZoneName, setNewZoneName] = useState('Paris');
  const [newZoneTag, setNewZoneTag] = useState('CET');

  // Alarm System States
  const [alarms, setAlarms] = useState([
    { id: 1, time: '09:00', label: 'Morning Market Sync', active: true },
    { id: 2, time: '17:30', label: 'Global Portfolio Review', active: true }
  ]);
  const [alarmTime, setAlarmTime] = useState('');
  const [alarmLabel, setAlarmLabel] = useState('Strategy Call');
  const [activeAlert, setActiveAlert] = useState(null);

  // Stopwatch States
  const [swTime, setSwTime] = useState(0);
  const [swRunning, setSwRunning] = useState(false);
  const [laps, setLaps] = useState([]);
  const swRef = useRef(null);

  // Timer States
  const [timerDuration, setTimerDuration] = useState(300); // 5 minutes default
  const [timeLeft, setTimeLeft] = useState(300);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef(null);

  // Calendar States
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Quote Index State
  const [quoteIdx, setQuoteIdx] = useState(0);

  // Precision Engine Tick & Quote Rotation
  useEffect(() => {
    const timer = setInterval(() => {
      const current = new Date();
      setNow(current);
      evaluateAlarms(current);
    }, 1000);
    return () => clearInterval(timer);
  }, [alarms]);

  useEffect(() => {
    const quoteTimer = setInterval(() => {
      setQuoteIdx(prev => (prev + 1) % TIME_QUOTES.length);
    }, 20000);
    return () => clearInterval(quoteTimer);
  }, []);

  // Stopwatch Tick
  useEffect(() => {
    if (swRunning) {
      swRef.current = setInterval(() => {
        setSwTime(prev => prev + 10);
      }, 10);
    } else {
      clearInterval(swRef.current);
    }
    return () => clearInterval(swRef.current);
  }, [swRunning]);

  // Timer Tick
  useEffect(() => {
    if (timerRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setTimerRunning(false);
            setActiveAlert({ id: 'timer', label: 'Countdown Timer Completed', time: '00:00' });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning, timeLeft]);

  const evaluateAlarms = (currentTime) => {
    const hh = String(currentTime.getHours()).padStart(2, '0');
    const mm = String(currentTime.getMinutes()).padStart(2, '0');
    const targetString = `${hh}:${mm}`;

    alarms.forEach((alarm) => {
      if (alarm.active && alarm.time === targetString && currentTime.getSeconds() === 0) {
        setActiveAlert(alarm);
      }
    });
  };

  const handleAddAlarm = (e) => {
    e.preventDefault();
    if (!alarmTime) return;
    setAlarms([...alarms, { id: Date.now(), time: alarmTime, label: alarmLabel || 'Scheduled Alert', active: true }]);
    setAlarmTime('');
    setAlarmLabel('');
  };

  const toggleAlarm = (id) => {
    setAlarms(alarms.map(a => a.id === id ? { ...a, active: !a.active } : a));
  };

  const deleteAlarm = (id) => {
    setAlarms(alarms.filter(a => a.id !== id));
  };

  const handleAddZone = (e) => {
    e.preventDefault();
    try {
      Intl.DateTimeFormat(undefined, { timeZone: newZoneInput });
      if (!zones.some(z => z.zone === newZoneInput)) {
        setZones([...zones, { 
          id: Date.now(), 
          name: newZoneName || newZoneInput, 
          zone: newZoneInput, 
          tag: newZoneTag || 'ZONE' 
        }]);
        setNewZoneName('');
        setNewZoneTag('');
      }
    } catch {
      alert('Invalid IANA Zone Format. Example: Europe/Paris or Asia/Dubai');
    }
  };

  const removeZone = (id) => {
    setZones(zones.filter(z => z.id !== id));
  };

  const formatStopwatch = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
  };

  const formatTimer = (secondsTotal) => {
    const mins = Math.floor(secondsTotal / 60);
    const secs = secondsTotal % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Theme Matrix Configuration
  const theme = useMemo(() => {
    switch (themeMode) {
      case 'obsidian':
        return {
          bg: '#090a0f',
          cardBg: '#13151f',
          textMain: '#f8fafc',
          textMuted: '#94a3b8',
          border: '#1e293b',
          subCardBg: '#181b28',
          inputBg: '#13151f',
          accent: '#ffffff',
          tagBg: '#1e293b',
          tagText: '#38bdf8',
          buttonBg: '#f8fafc',
          buttonText: '#090a0f',
          dialBg: '#0f111a',
          activeDayBg: '#38bdf8',
          activeDayText: '#090a0f',
        };
      case 'industrial':
        return {
          bg: '#e2e8f0',
          cardBg: '#cbd5e1',
          textMain: '#0f172a',
          textMuted: '#334155',
          border: '#94a3b8',
          subCardBg: '#b8c2cc',
          inputBg: '#ffffff',
          accent: '#0f172a',
          tagBg: '#94a3b8',
          tagText: '#ffffff',
          buttonBg: '#0f172a',
          buttonText: '#ffffff',
          dialBg: '#d8e1ed',
          activeDayBg: '#0f172a',
          activeDayText: '#ffffff',
        };
      default: // light alabaster
        return {
          bg: '#ffffff',
          cardBg: '#ffffff',
          textMain: '#0f172a',
          textMuted: '#64748b',
          border: '#e2e8f0',
          subCardBg: '#f8fafc',
          inputBg: '#ffffff',
          accent: '#0f172a',
          tagBg: '#e2e8f0',
          tagText: '#64748b',
          buttonBg: '#0f172a',
          buttonText: '#ffffff',
          dialBg: '#fafafa',
          activeDayBg: '#0f172a',
          activeDayText: '#ffffff',
        };
    }
  }, [themeMode]);

  const currentQuote = TIME_QUOTES[quoteIdx];

  // Calendar Matrix Generator Helpers
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = calendarDate.toLocaleString('default', { month: 'long' });

  return (
    <div style={{ ...styles.shell, backgroundColor: theme.bg, color: theme.textMain }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');

        @keyframes marqueeScroll {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }

        @keyframes convergeNumbers {
          0% {
            opacity: 0;
            transform: translate(var(--startX), var(--startY)) scale(2.5) rotate(calc(var(--angle) * 0.3deg));
            letter-spacing: 8px;
            filter: blur(6px);
          }
          60% {
            opacity: 1;
            filter: blur(0px);
          }
          100% {
            opacity: 1;
            transform: translate(var(--finalX), var(--finalY)) scale(1) rotate(0deg);
            letter-spacing: normal;
          }
        }

        .clock-numeral {
          position: absolute;
          animation: convergeNumbers 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 700;
          font-size: 13px;
        }

        .hover-lift {
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.25s ease;
        }
        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 36px rgba(15, 23, 42, 0.08);
        }

        .marquee-track {
          display: flex;
          width: max-content;
          animation: marqueeScroll 40s linear infinite;
        }
        .marquee-container:hover .marquee-track {
          animation-play-state: paused;
        }
      `}</style>

      {/* ALERT MODAL */}
      {activeAlert && (
        <div style={styles.modalBackdrop}>
          <div style={{ ...styles.modalCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <span style={{ ...styles.modalBadge, backgroundColor: theme.tagBg, color: theme.textMain }}>SYSTEM ALERT</span>
            <h2 style={{ ...styles.modalTitle, color: theme.textMain }}>{activeAlert.label}</h2>
            <p style={{ ...styles.modalTimeDisplay, color: theme.textMain }}>{activeAlert.time}</p>
            <button 
              style={{ ...styles.modalDismissBtn, backgroundColor: theme.buttonBg, color: theme.buttonText }}
              onClick={() => setActiveAlert(null)}
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}

      {/* MASTER HEADER */}
      <header style={{ ...styles.header, borderColor: theme.border }}>
        <div style={styles.brandGroup}>
          <div style={{ ...styles.brandLogoIcon, backgroundColor: theme.textMain, color: theme.bg }}>AT</div>
          <div>
            <h1 style={{ ...styles.brandTitle, color: theme.textMain }}>ADV-TIME</h1>
            <p style={{ ...styles.brandSubtitle, color: theme.textMuted }}>Executive Telemetry Interface</p>
          </div>
        </div>

        <div style={styles.headerActions}>
          <div style={{ ...styles.themeSwitcherBox, borderColor: theme.border, backgroundColor: theme.cardBg }}>
            <button 
              style={{ ...styles.themeBtn, backgroundColor: themeMode === 'light' ? theme.textMain : 'transparent', color: themeMode === 'light' ? theme.bg : theme.textMuted }}
              onClick={() => setThemeMode('light')}
            >
              Light
            </button>
            <button 
              style={{ ...styles.themeBtn, backgroundColor: themeMode === 'obsidian' ? theme.textMain : 'transparent', color: themeMode === 'obsidian' ? theme.bg : theme.textMuted }}
              onClick={() => setThemeMode('obsidian')}
            >
              Obsidian
            </button>
            <button 
              style={{ ...styles.themeBtn, backgroundColor: themeMode === 'industrial' ? theme.textMain : 'transparent', color: themeMode === 'industrial' ? theme.bg : theme.textMuted }}
              onClick={() => setThemeMode('industrial')}
            >
              Industrial
            </button>
          </div>

          <button 
            style={{ ...styles.pillButton, backgroundColor: theme.cardBg, color: theme.textMain, borderColor: theme.border }}
            onClick={() => setIs24Hour(!is24Hour)}
          >
            <span style={{ ...styles.dotIndicator, backgroundColor: theme.textMain }} />
            {is24Hour ? '24H' : '12H'}
          </button>
        </div>
      </header>

      {/* GLOBAL MARQUEE TICKER */}
      <div className="marquee-container" style={{ ...styles.marqueeWrapper, backgroundColor: theme.cardBg, borderColor: theme.border }}>
        <div className="marquee-track">
          {[...zones, ...zones, ...zones].map((z, idx) => {
            const tStr = new Intl.DateTimeFormat('en-US', { timeZone: z.zone, hour: '2-digit', minute: '2-digit', hour12: !is24Hour }).format(now);
            return (
              <div key={idx} style={styles.marqueeItem}>
                <span style={{ color: theme.textMuted }}>{z.name}</span>
                <span style={{ color: theme.textMain, fontWeight: '700' }}>{tStr}</span>
                <span style={{ color: theme.border, marginLeft: '12px' }}>/</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* SINGLE PAGE UNIFIED DASHBOARD GRID */}
      <div style={styles.workspaceGrid}>
        
        {/* COLUMN 1: PRIMARY CHRONOMETER & WORLD NODES MATRIX */}
        <div style={styles.columnFlex}>
          
          {/* PRIMARY MASTER CLOCK */}
          <div className="hover-lift" style={{ ...styles.glassCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <div style={styles.cardHeaderRow}>
              <h3 style={{ ...styles.cardHeading, color: theme.textMain }}>Primary Chronometer</h3>
              <span style={{ ...styles.livePulseTag, backgroundColor: theme.tagBg, color: theme.textMain }}>
                <span style={styles.blinkDot} /> LIVE
              </span>
            </div>

            <div style={styles.primaryDisplayCluster}>
              <AnalogFace date={now} theme={theme} />
              <div style={styles.digitalCoreData}>
                <div style={{ ...styles.digitalReadoutText, color: theme.textMain }}>
                  {now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: !is24Hour })}
                </div>
                <div style={{ ...styles.dateBanner, color: theme.textMuted }}>
                  {now.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>
          </div>

          {/* WORLD CLOCK MATRIX NODES */}
          <div className="hover-lift" style={{ ...styles.glassCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <div style={styles.cardHeaderRow}>
              <h3 style={{ ...styles.cardHeading, color: theme.textMain }}>Global Matrix Nodes</h3>
              <span style={{ ...styles.counterBadge, backgroundColor: theme.tagBg, color: theme.textMain }}>{zones.length} Nodes</span>
            </div>

            <form onSubmit={handleAddZone} style={styles.zoneInjectorForm}>
              <input 
                type="text" 
                placeholder="IANA Zone (e.g. Asia/Dubai)" 
                value={newZoneInput}
                onChange={(e) => setNewZoneInput(e.target.value)}
                style={{ ...styles.luxInput, flex: 1.4, backgroundColor: theme.inputBg, color: theme.textMain, borderColor: theme.border }}
                required
              />
              <input 
                type="text" 
                placeholder="City Name" 
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                style={{ ...styles.luxInput, flex: 1, backgroundColor: theme.inputBg, color: theme.textMain, borderColor: theme.border }}
              />
              <input 
                type="text" 
                placeholder="Tag" 
                value={newZoneTag}
                onChange={(e) => setNewZoneTag(e.target.value)}
                style={{ ...styles.luxInput, width: '64px', textAlign: 'center', backgroundColor: theme.inputBg, color: theme.textMain, borderColor: theme.border }}
              />
              <button type="submit" style={{ ...styles.darkActionButton, backgroundColor: theme.buttonBg, color: theme.buttonText }}>Add</button>
            </form>

            <div style={styles.matrixGridContainer}>
              {zones.map((item) => {
                const computedTime = new Intl.DateTimeFormat('en-US', { timeZone: item.zone, hour: '2-digit', minute: '2-digit', hour12: !is24Hour }).format(now);
                const computedDate = new Intl.DateTimeFormat('en-US', { timeZone: item.zone, month: 'short', day: 'numeric' }).format(now);
                return (
                  <div key={item.id} style={{ ...styles.nodeCardBox, backgroundColor: theme.subCardBg, borderColor: theme.border }}>
                    <div style={styles.nodeHeaderRow}>
                      <span style={{ ...styles.nodeIdentifierTag, backgroundColor: theme.tagBg, color: theme.tagText }}>{item.tag || 'NODE'}</span>
                      {zones.length > 1 && (
                        <button style={{ ...styles.nodeDeleteBtn, color: theme.textMuted }} onClick={() => removeZone(item.id)}>✕</button>
                      )}
                    </div>
                    <div>
                      <h4 style={{ ...styles.nodeCityName, color: theme.textMain }}>{item.name}</h4>
                      <div style={{ ...styles.nodeTimeOutput, color: theme.textMain }}>{computedTime}</div>
                      <div style={{ ...styles.nodeDateOutput, color: theme.textMuted }}>{computedDate}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* COLUMN 2: STOPWATCH, TIMER & QUOTE */}
        <div style={styles.columnFlex}>
          
          {/* STOPWATCH COMPONENT */}
          <div className="hover-lift" style={{ ...styles.glassCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <div style={styles.cardHeaderRow}>
              <h3 style={{ ...styles.cardHeading, color: theme.textMain }}>Stopwatch & Laps</h3>
              <span style={{ ...styles.counterBadge, backgroundColor: theme.tagBg, color: theme.textMain }}>Precision</span>
            </div>

            <div style={styles.mediumTimerDisplayBox}>
              <span style={{ ...styles.mediumTimerValue, color: theme.textMain }}>{formatStopwatch(swTime)}</span>
            </div>

            <div style={styles.utilityButtonCluster}>
              <button 
                style={{ ...styles.darkActionButton, backgroundColor: swRunning ? theme.tagBg : theme.buttonBg, color: swRunning ? theme.textMain : theme.buttonText, flex: 1 }}
                onClick={() => setSwRunning(!swRunning)}
              >
                {swRunning ? 'Pause' : 'Start'}
              </button>
              <button 
                style={{ ...styles.luxInput, backgroundColor: theme.inputBg, color: theme.textMain, borderColor: theme.border, cursor: 'pointer' }}
                onClick={() => setLaps([formatStopwatch(swTime), ...laps])}
                disabled={!swRunning}
              >
                Lap
              </button>
              <button 
                style={{ ...styles.luxInput, backgroundColor: theme.inputBg, color: theme.textMuted, borderColor: theme.border, cursor: 'pointer' }}
                onClick={() => { setSwRunning(false); setSwTime(0); setLaps([]); }}
              >
                Reset
              </button>
            </div>

            {laps.length > 0 && (
              <div style={styles.miniScroller}>
                {laps.map((lap, index) => (
                  <div key={index} style={{ ...styles.alarmRow, backgroundColor: theme.subCardBg, borderColor: theme.border }}>
                    <span style={{ ...styles.alarmTimeText, color: theme.textMuted }}>Lap {laps.length - index}</span>
                    <span style={{ ...styles.alarmTimeText, color: theme.textMain }}>{lap}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* COUNTDOWN TIMER COMPONENT */}
          <div className="hover-lift" style={{ ...styles.glassCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <div style={styles.cardHeaderRow}>
              <h3 style={{ ...styles.cardHeading, color: theme.textMain }}>Countdown Timer</h3>
              <span style={{ ...styles.counterBadge, backgroundColor: theme.tagBg, color: theme.textMain }}>Interval</span>
            </div>

            <div style={styles.mediumTimerDisplayBox}>
              <span style={{ ...styles.mediumTimerValue, color: theme.textMain }}>{formatTimer(timeLeft)}</span>
            </div>

            <div style={styles.timerPresetCluster}>
              <button style={{ ...styles.presetBtn, backgroundColor: theme.subCardBg, color: theme.textMain, borderColor: theme.border }} onClick={() => { setTimerRunning(false); setTimerDuration(60); setTimeLeft(60); }}>1m</button>
              <button style={{ ...styles.presetBtn, backgroundColor: theme.subCardBg, color: theme.textMain, borderColor: theme.border }} onClick={() => { setTimerRunning(false); setTimerDuration(300); setTimeLeft(300); }}>5m</button>
              <button style={{ ...styles.presetBtn, backgroundColor: theme.subCardBg, color: theme.textMain, borderColor: theme.border }} onClick={() => { setTimerRunning(false); setTimerDuration(900); setTimeLeft(900); }}>15m</button>
              <button style={{ ...styles.presetBtn, backgroundColor: theme.subCardBg, color: theme.textMain, borderColor: theme.border }} onClick={() => { setTimerRunning(false); setTimerDuration(1800); setTimeLeft(1800); }}>30m</button>
            </div>

            <div style={styles.utilityButtonCluster}>
              <button 
                style={{ ...styles.darkActionButton, backgroundColor: timerRunning ? theme.tagBg : theme.buttonBg, color: timerRunning ? theme.textMain : theme.buttonText, flex: 1 }}
                onClick={() => setTimerRunning(!timerRunning)}
              >
                {timerRunning ? 'Pause Timer' : 'Start Timer'}
              </button>
              <button 
                style={{ ...styles.luxInput, backgroundColor: theme.inputBg, color: theme.textMuted, borderColor: theme.border, cursor: 'pointer' }}
                onClick={() => { setTimerRunning(false); setTimeLeft(timerDuration); }}
              >
                Reset
              </button>
            </div>
          </div>

          {/* THOUGHTS ON TIME */}
          <div className="hover-lift" style={{ ...styles.glassCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <div style={styles.cardHeaderRow}>
              <h3 style={{ ...styles.cardHeading, color: theme.textMain }}>Thoughts on Time</h3>
              <span style={{ ...styles.counterBadge, backgroundColor: theme.tagBg, color: theme.textMuted }}>Reflections</span>
            </div>
            <div style={styles.quoteBlockContent}>
              <p style={{ ...styles.quoteText, color: theme.textMain }}>&ldquo;{currentQuote.quote}&rdquo;</p>
              <span style={{ ...styles.quoteAuthor, color: theme.textMuted }}>— {currentQuote.author}</span>
            </div>
          </div>

        </div>

        {/* COLUMN 3: COMPACT CALENDAR & ALARM NEXUS */}
        <div style={styles.columnFlex}>
          
          {/* COMPACT THEMATIC CALENDAR COMPONENT */}
          <div className="hover-lift" style={{ ...styles.compactCalendarCard, backgroundColor: theme.cardBg, borderColor: theme.border }}>
            <div style={styles.compactCardHeaderRow}>
              <h3 style={{ ...styles.cardHeading, color: theme.textMain, fontSize: '11px' }}>{monthName} {year}</h3>
              <div style={styles.calendarNavCluster}>
                <button 
                  style={{ ...styles.calendarNavBtn, backgroundColor: theme.subCardBg, color: theme.textMain, borderColor: theme.border }}
                  onClick={() => setCalendarDate(new Date(year, month - 1, 1))}
                >
                  ‹
                </button>
                <button 
                  style={{ ...styles.calendarNavBtn, backgroundColor: theme.subCardBg, color: theme.textMain, borderColor: theme.border }}
                  onClick={() => setCalendarDate(new Date(year, month + 1, 1))}
                >
                  ›
                </button>
              </div>
            </div>

            <div style={styles.calendarGridHeader}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => (
                <div key={i} style={{ ...styles.calendarDayHeaderLabel, color: theme.textMuted }}>{d}</div>
              ))}
            </div>

            <div style={styles.calendarDaysGrid}>
              {[...Array(firstDayIndex)].map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {[...Array(totalDaysInMonth)].map((_, i) => {
                const dayNum = i + 1;
                const isToday = 
                  dayNum === new Date().getDate() && 
                  month === new Date().getMonth() && 
                  year === new Date().getFullYear();

                return (
                  <div 
                    key={dayNum} 
                    style={{ 
                      ...styles.calendarDayCell, 
                      backgroundColor: isToday ? theme.activeDayBg : 'transparent',
                      color: isToday ? theme.activeDayText : theme.textMain,
                      fontWeight: isToday ? '700' : '400',
                      borderColor: isToday ? 'transparent' : 'transparent',
                    }}
                  >
                    {dayNum}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ALARM CONTROL NEXUS */}
          <div className="hover-lift" style={{ ...styles.glassCard, backgroundColor: theme.cardBg, borderColor: theme.border, flex: 1 }}>
            <div style={styles.cardHeaderRow}>
              <h3 style={{ ...styles.cardHeading, color: theme.textMain }}>Scheduled Alarms</h3>
              <span style={{ ...styles.counterBadge, backgroundColor: theme.tagBg, color: theme.textMain }}>{alarms.length} Active</span>
            </div>
            
            <form onSubmit={handleAddAlarm} style={styles.alarmFormLayout}>
              <input 
                type="time" 
                value={alarmTime}
                onChange={(e) => setAlarmTime(e.target.value)}
                style={{ ...styles.luxInput, backgroundColor: theme.inputBg, color: theme.textMain, borderColor: theme.border }}
                required
              />
              <input 
                type="text" 
                placeholder="Alert description" 
                value={alarmLabel}
                onChange={(e) => setAlarmLabel(e.target.value)}
                style={{ ...styles.luxInput, flex: 1, backgroundColor: theme.inputBg, color: theme.textMain, borderColor: theme.border }}
              />
              <button type="submit" style={{ ...styles.darkActionButton, backgroundColor: theme.buttonBg, color: theme.buttonText }}>Add</button>
            </form>

            <div style={styles.alarmScroller}>
              {alarms.length === 0 ? (
                <p style={{ ...styles.emptyNotice, color: theme.textMuted }}>No alarms configured.</p>
              ) : (
                alarms.map(alarm => (
                  <div key={alarm.id} style={{ ...styles.alarmRow, backgroundColor: theme.subCardBg || theme.inputBg, borderColor: theme.border, opacity: alarm.active ? 1 : 0.4 }}>
                    <div style={styles.alarmInfoGroup}>
                      <span style={{ ...styles.alarmTimeText, color: theme.textMain }}>{alarm.time}</span>
                      <span style={{ ...styles.alarmLabelText, color: theme.textMuted }}>{alarm.label}</span>
                    </div>
                    <div style={styles.alarmActionCluster}>
                      <button 
                        style={{ ...styles.statusBtnActive, backgroundColor: alarm.active ? theme.border : theme.inputBg, color: theme.textMain }}
                        onClick={() => toggleAlarm(alarm.id)}
                      >
                        {alarm.active ? 'Armed' : 'Off'}
                      </button>
                      <button 
                        style={{ ...styles.trashBtn, color: theme.textMuted }}
                        onClick={() => deleteAlarm(alarm.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

// --- SUB-COMPONENT: ANALOG CHRONOMETER DIAL ---
function AnalogFace({ date, theme }) {
  const seconds = date.getSeconds();
  const minutes = date.getMinutes();
  const hours = date.getHours() % 12;

  const sDeg = (seconds / 60) * 360;
  const mDeg = ((minutes + seconds / 60) / 60) * 360;
  const hDeg = ((hours + minutes / 60) / 12) * 360;

  return (
    <div style={{ ...styles.dialShell, backgroundColor: theme.dialBg, borderColor: theme.border }}>
      {[...Array(12)].map((_, i) => {
        const num = i + 1;
        const angle = i * 30 - 60;
        const rad = (angle * Math.PI) / 180;
        
        const finalX = Math.cos(rad) * 56;
        const finalY = Math.sin(rad) * 56;

        return (
          <span
            key={num}
            className="clock-numeral"
            style={{
              '--finalX': `${finalX}px`,
              '--finalY': `${finalY}px`,
              '--startX': `${(i % 3 === 0 ? -60 : 60)}px`,
              '--startY': `${(i % 2 === 0 ? -60 : 60)}px`,
              '--angle': `${angle}`,
              animationDelay: `${i * 0.03}s`,
              color: theme.textMuted,
            }}
          >
            {num}
          </span>
        );
      })}

      <div style={{ ...styles.clockHand, ...styles.handHour, backgroundColor: theme.textMain, transform: `rotate(${hDeg}deg)` }} />
      <div style={{ ...styles.clockHand, ...styles.handMinute, backgroundColor: theme.textMuted, transform: `rotate(${mDeg}deg)` }} />
      <div style={{ ...styles.clockHand, ...styles.handSecond, opacity: 0.85, transform: `rotate(${sDeg}deg)` }} />
      <div style={{ ...styles.dialPinCenter, backgroundColor: theme.textMain }} />
    </div>
  );
}

// --- DESIGN SYSTEM & LAYOUT STYLES ---
const styles = {
  shell: {
    minHeight: '100vh',
    padding: '32px 40px 48px 40px',
    fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    position: 'relative',
    overflowX: 'hidden',
    transition: 'background-color 0.3s ease, color 0.3s ease',
  },
  marqueeWrapper: {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: '8px',
    padding: '10px 0',
    overflow: 'hidden',
    marginBottom: '28px',
    transition: 'all 0.3s ease',
  },
  marqueeItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '0 24px',
    fontSize: '13px',
    fontWeight: '600',
    fontFamily: 'inherit',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    paddingBottom: '20px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    flexWrap: 'wrap',
    gap: '20px',
    transition: 'border-color 0.3s ease',
  },
  brandGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  brandLogoIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '800',
    letterSpacing: '1px',
    fontFamily: '"JetBrains Mono", monospace',
  },
  brandTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '800',
    letterSpacing: '2px',
  },
  brandSubtitle: {
    margin: '2px 0 0 0',
    fontSize: '12px',
    fontWeight: '500',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  themeSwitcherBox: {
    display: 'flex',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: '6px',
    padding: '3px',
    gap: '2px',
  },
  themeBtn: {
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  pillButton: {
    borderWidth: '1px',
    borderStyle: 'solid',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  dotIndicator: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
  },
  workspaceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '24px',
  },
  columnFlex: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  glassCard: {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(15, 23, 42, 0.02)',
    transition: 'background-color 0.3s ease, border-color 0.3s ease',
  },
  compactCalendarCard: {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: '12px',
    padding: '14px 16px',
    boxShadow: '0 4px 20px rgba(15, 23, 42, 0.02)',
    transition: 'background-color 0.3s ease, border-color 0.3s ease',
  },
  cardHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  compactCardHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  cardHeading: {
    margin: 0,
    fontSize: '13px',
    fontWeight: '700',
    letterSpacing: '1px',
    textTransform: 'uppercase',
  },
  livePulseTag: {
    fontSize: '11px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '3px 10px',
    borderRadius: '4px',
    fontFamily: '"JetBrains Mono", monospace',
  },
  blinkDot: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
  },
  primaryDisplayCluster: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: '16px',
  },
  dialShell: {
    width: '140px',
    height: '140px',
    borderRadius: '50%',
    borderWidth: '1px',
    borderStyle: 'solid',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockHand: {
    position: 'absolute',
    bottom: '50%',
    left: '50%',
    transformOrigin: 'bottom',
    borderRadius: '2px',
  },
  handHour: {
    width: '2.5px',
    height: '38px',
    zIndex: 3,
  },
  handMinute: {
    width: '2px',
    height: '52px',
    zIndex: 2,
  },
  handSecond: {
    width: '1px',
    height: '58px',
    zIndex: 4,
    backgroundColor: '#f97316',
  },
  dialPinCenter: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    zIndex: 5,
  },
  digitalCoreData: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  digitalReadoutText: {
    fontSize: '32px',
    fontWeight: '800',
    fontFamily: '"JetBrains Mono", monospace',
    letterSpacing: '-1px',
  },
  dateBanner: {
    fontSize: '12px',
    marginTop: '6px',
    fontWeight: '500',
  },
  zoneInjectorForm: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  luxInput: {
    borderWidth: '1px',
    borderStyle: 'solid',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'all 0.3s ease',
  },
  darkActionButton: {
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '12px',
  },
  matrixGridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
    gap: '12px',
    maxHeight: '280px',
    overflowY: 'auto',
    paddingRight: '2px',
  },
  nodeCardBox: {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  nodeHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  nodeIdentifierTag: {
    fontSize: '9px',
    fontWeight: '700',
    letterSpacing: '1px',
    padding: '2px 5px',
    borderRadius: '4px',
    fontFamily: '"JetBrains Mono", monospace',
  },
  nodeDeleteBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
  },
  nodeCityName: {
    margin: 0,
    fontSize: '12px',
    fontWeight: '600',
  },
  nodeTimeOutput: {
    fontSize: '18px',
    fontWeight: '800',
    marginTop: '4px',
    fontFamily: '"JetBrains Mono", monospace',
  },
  nodeDateOutput: {
    fontSize: '10px',
    marginTop: '2px',
  },
  mediumTimerDisplayBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px 0',
  },
  mediumTimerValue: {
    fontSize: '38px',
    fontWeight: '800',
    fontFamily: '"JetBrains Mono", monospace',
    letterSpacing: '-1px',
  },
  utilityButtonCluster: {
    display: 'flex',
    gap: '10px',
  },
  miniScroller: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    maxHeight: '120px',
    overflowY: 'auto',
    marginTop: '12px',
    paddingRight: '2px',
  },
  timerPresetCluster: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    marginBottom: '12px',
  },
  presetBtn: {
    borderWidth: '1px',
    borderStyle: 'solid',
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: '"JetBrains Mono", monospace',
  },
  quoteBlockContent: {
    padding: '2px 0',
  },
  quoteText: {
    margin: 0,
    fontSize: '13px',
    fontWeight: '500',
    fontStyle: 'italic',
    lineHeight: '1.4',
  },
  quoteAuthor: {
    display: 'inline-block',
    marginTop: '8px',
    fontSize: '11px',
    fontWeight: '700',
    fontFamily: '"JetBrains Mono", monospace',
  },
  calendarNavCluster: {
    display: 'flex',
    gap: '4px',
  },
  calendarNavBtn: {
    borderWidth: '1px',
    borderStyle: 'solid',
    width: '20px',
    height: '20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarGridHeader: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    textAlign: 'center',
    marginBottom: '4px',
  },
  calendarDayHeaderLabel: {
    fontSize: '9px',
    fontWeight: '700',
    fontFamily: '"JetBrains Mono", monospace',
  },
  calendarDaysGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '1px',
  },
  calendarDayCell: {
    aspectRatio: '1.4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    borderRadius: '4px',
    fontFamily: '"JetBrains Mono", monospace',
  },
  alarmFormLayout: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  },
  alarmScroller: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '150px',
    overflowY: 'auto',
    paddingRight: '2px',
  },
  alarmRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: '6px',
  },
  alarmInfoGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  alarmTimeText: {
    fontSize: '13px',
    fontWeight: '700',
    fontFamily: '"JetBrains Mono", monospace',
  },
  alarmLabelText: {
    fontSize: '11px',
  },
  alarmActionCluster: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statusBtnActive: {
    border: 'none',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  trashBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
  },
  counterBadge: {
    fontSize: '11px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '4px',
    fontFamily: '"JetBrains Mono", monospace',
  },
  emptyNotice: {
    fontSize: '12px',
    textAlign: 'center',
    margin: '12px 0',
  },
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modalCard: {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: '12px',
    padding: '32px',
    textAlign: 'center',
    maxWidth: '360px',
    width: '90%',
  },
  modalBadge: {
    fontSize: '10px',
    fontWeight: '800',
    letterSpacing: '2px',
    padding: '3px 10px',
    borderRadius: '4px',
  },
  modalTitle: {
    margin: '14px 0 6px 0',
    fontSize: '16px',
    fontWeight: '700',
  },
  modalTimeDisplay: {
    fontSize: '28px',
    fontWeight: '800',
    margin: '0 0 20px 0',
    fontFamily: '"JetBrains Mono", monospace',
  },
  modalDismissBtn: {
    width: '100%',
    border: 'none',
    padding: '10px',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '12px',
    cursor: 'pointer',
  },
};