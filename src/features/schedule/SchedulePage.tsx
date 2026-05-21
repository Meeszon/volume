import {
  Fragment,
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import type { CSSProperties } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DragStart,
  type DragUpdate,
  type DropResult,
} from "@hello-pangea/dnd";
import { AnimatePresence } from "framer-motion";
import {
  getMonday,
  getWeekDays,
  shiftWeek,
  isCurrentWeek,
  getISOWeekNumber,
} from "../../utils/weekDates";
import { useWeekActivities } from "../../hooks/useWeekActivities";
import { useActivityLog } from "../../hooks/useActivityLog";
import { ChevronLeftIcon, ChevronRightIcon } from "../../components/icons";
import { ActivityCard } from "./ActivityCard";
import { AddActivityModal } from "./AddActivityModal";
import { LoadSummaryBar } from "./LoadSummaryBar";
import { ActivityDetailPanel } from "./ActivityDetailPanel";
import { getActivityCategoryColor } from "../../lib/categoryColor";
import type { Activity } from "../../types";
import styles from "./schedule.module.css";

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function formatDateRange(monday: Date, sunday: Date): string {
  const monthFmt = new Intl.DateTimeFormat("en-US", { month: "short" });
  const m1 = monthFmt.format(monday);
  const m2 = monthFmt.format(sunday);
  return `${m1} ${monday.getDate()} — ${m2} ${sunday.getDate()}, ${sunday.getFullYear()}`;
}

function formatColumnDate(date: Date): string {
  // "MAY 18" style — month is uppercase (CSS) but we render it lowercase here
  // since the column-date class already applies text-transform: uppercase.
  const monthFmt = new Intl.DateTimeFormat("en-US", { month: "short" });
  return `${monthFmt.format(date)} ${date.getDate()}`;
}

function DropIndicator() {
  return (
    <div className={styles.dropIndicator} aria-hidden="true">
      <svg className={styles.dropIndicatorSvg} preserveAspectRatio="none">
        <rect className={styles.dropIndicatorRect} />
      </svg>
    </div>
  );
}

export function SchedulePage() {
  const [modalDayId, setModalDayId] = useState<string | null>(null);
  const [weekMonday, setWeekMonday] = useState(() => getMonday(new Date()));
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [dragColor, setDragColor] = useState<string | null>(null);
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const sourceRef = useRef<{ dayId: string; index: number } | null>(null);
  const [destDayId, setDestDayId] = useState<string | null>(null);
  // markedIndex is the DOM position where the drop-slot indicator gets
  // inserted, in [0, cards.length]. cards.length means "after every card".
  const [markedIndex, setMarkedIndex] = useState<number | null>(null);

  const { columns, activities, loading, error, addActivity, deleteActivity, handleDragEnd } =
    useWeekActivities(weekMonday);

  const onDragStart = useCallback(
    (start: DragStart) => {
      sourceRef.current = {
        dayId: start.source.droppableId,
        index: start.source.index,
      };
      // Seed destination to the source so the indicator shows in the source
      // slot immediately on pickup. onDragUpdate only fires once the cursor
      // moves, so without this the indicator wouldn't appear until the user
      // leaves and re-enters a column.
      setDestDayId(start.source.droppableId);
      setMarkedIndex(start.source.index);
      for (const dayActs of Object.values(columns)) {
        const found = dayActs.find((a) => a.id === start.draggableId);
        if (found) {
          setDragColor(getActivityCategoryColor(found));
          break;
        }
      }
      const el = document.querySelector(
        `[data-rfd-draggable-id="${start.draggableId}"]`,
      );
      if (el instanceof HTMLElement) {
        setDragHeight(el.getBoundingClientRect().height);
      }
    },
    [columns],
  );

  const onDragUpdate = useCallback((update: DragUpdate) => {
    const dest = update.destination;
    if (!dest) {
      setDestDayId(null);
      setMarkedIndex(null);
      return;
    }
    const src = sourceRef.current;
    // When dragging downward within the same column, dest.index counts the
    // position *after* the source card is removed, so the indicator goes
    // one DOM slot further to land in the right visual gap.
    let mark = dest.index;
    if (src && src.dayId === dest.droppableId && src.index < dest.index) {
      mark = dest.index + 1;
    }
    setDestDayId(dest.droppableId);
    setMarkedIndex(mark);
  }, []);

  const onDragEnd = useCallback(
    (result: DropResult) => {
      setDragColor(null);
      setDragHeight(null);
      setDestDayId(null);
      setMarkedIndex(null);
      sourceRef.current = null;
      handleDragEnd(result);
    },
    [handleDragEnd],
  );

  const weekSunday = useMemo(() => {
    const d = new Date(weekMonday);
    d.setDate(d.getDate() + 6);
    return d;
  }, [weekMonday]);

  const { isLogged, getLog, saveLog } = useActivityLog();

  const days = useMemo(() => getWeekDays(weekMonday), [weekMonday]);
  const onCurrentWeek = useMemo(() => isCurrentWeek(weekMonday), [weekMonday]);
  const weekNumber = useMemo(() => getISOWeekNumber(weekMonday), [weekMonday]);
  const dateSubtitle = useMemo(
    () => formatDateRange(weekMonday, weekSunday),
    [weekMonday, weekSunday],
  );

  const dayMeta = useMemo(() => {
    const todayStart = startOfDay(new Date());
    return days.map((day, i) => {
      const dayDate = new Date(weekMonday);
      dayDate.setDate(weekMonday.getDate() + i);
      return {
        ...day,
        shortName: day.id.slice(0, 3).toUpperCase(),
        upperDate: formatColumnDate(dayDate),
        isToday: startOfDay(dayDate) === todayStart,
      };
    });
  }, [days, weekMonday]);

  const goToPrevWeek = useCallback(() => setWeekMonday((m) => shiftWeek(m, -1)), []);
  const goToNextWeek = useCallback(() => setWeekMonday((m) => shiftWeek(m, 1)), []);
  const goToThisWeek = useCallback(() => setWeekMonday(getMonday(new Date())), []);

  const boardRef = useRef<HTMLDivElement>(null);
  const scrollDrag = useRef({ active: false, startX: 0, scrollLeft: 0 });

  useEffect(() => {
    const onWindowMouseUp = () => {
      if (!scrollDrag.current.active) return;
      scrollDrag.current.active = false;
      if (boardRef.current) {
        boardRef.current.style.cursor = "";
        boardRef.current.style.userSelect = "";
      }
    };
    window.addEventListener("mouseup", onWindowMouseUp);
    return () => window.removeEventListener("mouseup", onWindowMouseUp);
  }, []);

  const onBoardMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest(".activity-card, button, [role='button']")) return;
    const board = boardRef.current;
    if (!board) return;
    scrollDrag.current = { active: true, startX: e.clientX, scrollLeft: board.scrollLeft };
    board.style.cursor = "grabbing";
    board.style.userSelect = "none";
  };

  const onBoardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollDrag.current.active || !boardRef.current) return;
    const dx = e.clientX - scrollDrag.current.startX;
    boardRef.current.scrollLeft = scrollDrag.current.scrollLeft - dx;
  };

  const modalDay = modalDayId ? days.find((d) => d.id === modalDayId) : null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        {error && <span className={styles.errorBanner}>{error}</span>}
        <div className={styles.headerRow}>
          <div className={styles.topLeft}>
            <div className={styles.bigTitle}>Week {weekNumber}</div>
            <div className={styles.subtitle}>{dateSubtitle}</div>
          </div>
          <div className={styles.weekPicker}>
            <button
              className={styles.weekPickerBtn}
              onClick={goToPrevWeek}
              aria-label="Previous week"
            >
              <ChevronLeftIcon />
            </button>
            <div className={styles.weekPickerDivider} />
            {onCurrentWeek ? (
              <span className={styles.weekPickerLabel} aria-current="true">
                This week
              </span>
            ) : (
              <button
                className={styles.weekPickerLabelBtn}
                onClick={goToThisWeek}
                aria-label="Jump to this week"
              >
                This week
              </button>
            )}
            <div className={styles.weekPickerDivider} />
            <button
              className={styles.weekPickerBtn}
              onClick={goToNextWeek}
              aria-label="Next week"
            >
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      </header>

      <LoadSummaryBar
        activities={activities}
        weekStart={weekMonday}
        weekEnd={weekSunday}
      />

      <DragDropContext
        onDragStart={onDragStart}
        onDragUpdate={onDragUpdate}
        onDragEnd={onDragEnd}
      >
        <div
          className={styles.boardScroll}
          ref={boardRef}
          onMouseDown={onBoardMouseDown}
          onMouseMove={onBoardMouseMove}
          style={
            dragColor || dragHeight
              ? ({
                  ...(dragColor ? { ["--drag-color"]: dragColor } : null),
                  ...(dragHeight
                    ? { ["--drag-card-height"]: `${dragHeight}px` }
                    : null),
                } as CSSProperties)
              : undefined
          }
        >
          <div className={styles.boardInner}>
            {dayMeta.map((day) => (
              <div
                key={day.id}
                className={`${styles.kanbanColumn}${day.isToday ? ` ${styles.today}` : ""}`}
              >
                <div className={styles.columnHeader}>
                  <div className={styles.columnDayName}>{day.shortName}</div>
                  <div className={styles.columnDate}>
                    {day.upperDate}
                    {day.isToday && <span className={styles.todayPip}>today</span>}
                  </div>
                </div>
                <button
                  className={styles.addActivityBtn}
                  onClick={() => setModalDayId(day.id)}
                >
                  <span className={styles.addActivityPlus}>+</span>
                  <span className={styles.addActivityLabel}>Add activity</span>
                </button>
                <Droppable droppableId={day.id}>
                  {(provided) => {
                    const dayActivities = columns[day.id] ?? [];
                    const indicatorAt =
                      destDayId === day.id && markedIndex !== null
                        ? markedIndex
                        : -1;
                    return (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={styles.cardList}
                      >
                        {!loading && dayActivities.length === 0 && (
                          <div
                            className={`${styles.restDay}${destDayId === day.id ? ` ${styles.restDayHidden}` : ""}`}
                          >
                            Rest day
                          </div>
                        )}
                        {!loading &&
                          dayActivities.map((task, index) => (
                            <Fragment key={task.id}>
                              {indicatorAt === index && <DropIndicator />}
                              <Draggable draggableId={task.id} index={index}>
                                {(provided, snapshot) => (
                                  <ActivityCard
                                    task={task}
                                    provided={provided}
                                    snapshot={snapshot}
                                    onDelete={deleteActivity}
                                    onOpenPanel={setSelectedActivity}
                                    isLogged={isLogged(task.id)}
                                  />
                                )}
                              </Draggable>
                            </Fragment>
                          ))}
                        {indicatorAt === dayActivities.length && (
                          <DropIndicator />
                        )}
                        {provided.placeholder}
                      </div>
                    );
                  }}
                </Droppable>
              </div>
            ))}
          </div>
        </div>
      </DragDropContext>

      {modalDay && (
        <AddActivityModal
          dayLabel={`${modalDay.id} ${modalDay.date}`}
          onClose={() => setModalDayId(null)}
          onAdd={(input) => addActivity(modalDay.id, input)}
        />
      )}

      <AnimatePresence>
        {selectedActivity && (
          <ActivityDetailPanel
            key={selectedActivity.id}
            activity={selectedActivity}
            isLogged={isLogged(selectedActivity.id)}
            logData={getLog(selectedActivity.id)}
            onClose={() => setSelectedActivity(null)}
            onDelete={deleteActivity}
            onSaveLog={saveLog}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
