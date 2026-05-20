import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { AnimatePresence } from "framer-motion";
import { getMonday, getWeekDays, shiftWeek, formatWeekLabel, isCurrentWeek } from "../../utils/weekDates";
import { useWeekActivities } from "../../hooks/useWeekActivities";
import { useActivityLog } from "../../hooks/useActivityLog";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "../../components/icons";
import { ActivityCard } from "./ActivityCard";
import { AddActivityModal } from "./AddActivityModal";
import { LoadSummaryBar } from "./LoadSummaryBar";
import { ActivityDetailPanel } from "./ActivityDetailPanel";
import type { Activity } from "../../types";
import styles from "./schedule.module.css";

export function SchedulePage() {
  const [modalDayId, setModalDayId] = useState<string | null>(null);
  const [weekMonday, setWeekMonday] = useState(() => getMonday(new Date()));
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const { columns, activities, loading, error, addActivity, deleteActivity, handleDragEnd } =
    useWeekActivities(weekMonday);

  const weekSunday = useMemo(() => {
    const d = new Date(weekMonday);
    d.setDate(d.getDate() + 6);
    return d;
  }, [weekMonday]);

  const { isLogged, getLog, saveLog } = useActivityLog();

  const days = useMemo(() => getWeekDays(weekMonday), [weekMonday]);
  const weekLabel = useMemo(() => formatWeekLabel(weekMonday), [weekMonday]);
  const onCurrentWeek = useMemo(() => isCurrentWeek(weekMonday), [weekMonday]);

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
        <div className={styles.weekPicker}>
          <button className={styles.weekPickerBtn} onClick={goToPrevWeek}>
            <ChevronLeftIcon />
          </button>
          <div className={styles.weekPickerDivider} />
          {onCurrentWeek ? (
            <span className={styles.weekPickerLabel}>{weekLabel}</span>
          ) : (
            <button className={styles.weekPickerLabelBtn} onClick={goToThisWeek}>
              {weekLabel}
            </button>
          )}
          <div className={styles.weekPickerDivider} />
          <button className={styles.weekPickerBtn} onClick={goToNextWeek}>
            <ChevronRightIcon />
          </button>
        </div>
      </header>

      <LoadSummaryBar
        activities={activities}
        weekStart={weekMonday}
        weekEnd={weekSunday}
      />

      <DragDropContext onDragEnd={handleDragEnd}>
        <div
          className={styles.boardScroll}
          ref={boardRef}
          onMouseDown={onBoardMouseDown}
          onMouseMove={onBoardMouseMove}
        >
          <div className={styles.boardInner}>
            {days.map((day) => (
              <div key={day.id} className={styles.kanbanColumn}>
                <div className={styles.columnHeader}>
                  <div className={styles.columnDayName}>{day.id}</div>
                  <div className={styles.columnDate}>{day.date}</div>
                </div>
                <button className={styles.addActivityBtn} onClick={() => setModalDayId(day.id)}>
                  <PlusIcon />
                  <span className={styles.addActivityLabel}>Add Activity</span>
                </button>
                <Droppable droppableId={day.id}>
                  {(provided, snapshot) => {
                    const dayActivities = columns[day.id] ?? [];
                    return (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`${styles.cardList}${snapshot.isDraggingOver ? ` ${styles.cardListDragOver}` : ""}`}
                      >
                        {!loading && dayActivities.length === 0 && (
                          <div className={styles.restDay}>Rest Day</div>
                        )}
                        {!loading && dayActivities.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
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
                        ))}
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
