const calendarDays = document.getElementById("calendarDays");
const monthYear = document.getElementById("monthYear");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");
const todayBtn = document.getElementById("todayBtn");

const eventModal = document.getElementById("eventModal");
const closeModal = document.getElementById("closeModal");
const saveEventBtn = document.getElementById("saveEvent");
const deleteEventBtn = document.getElementById("deleteEvent");

const eventTitleInput = document.getElementById("eventTitle");
const eventDescInput = document.getElementById("eventDesc");
const startTimeInput = document.getElementById("startTime");
const endTimeInput = document.getElementById("endTime");
const eventCategoryInput = document.getElementById("eventCategory");
const searchInput = document.getElementById("searchInput");
const toggleTheme = document.getElementById("toggleTheme");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importInput = document.getElementById("importInput");

let currentDate = new Date();
let selectedDate = null;
let events = JSON.parse(localStorage.getItem("calendarEvents")) || {};

function renderCalendar(date) {
  const year = date.getFullYear();
  const month = date.getMonth();

  monthYear.textContent = `${date.toLocaleString("default", { month: "long" })} ${year}`;
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  calendarDays.innerHTML = "";

  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement("div");
    calendarDays.appendChild(emptyCell);
  }

  for (let day = 1; day <= totalDays; day++) {
    const dayCell = document.createElement("div");
    const dateKey = `${year}-${month + 1}-${day}`;
    dayCell.textContent = day;

    if (isToday(year, month, day)) dayCell.classList.add("today");

    if (events[dateKey]) {
      dayCell.classList.add("has-event");
      dayCell.dataset.category = events[dateKey].category;
    }

    dayCell.addEventListener("click", () => openEventModal(dateKey));
    calendarDays.appendChild(dayCell);
  }
}

function isToday(y, m, d) {
  const today = new Date();
  return y === today.getFullYear() && m === today.getMonth() && d === today.getDate();
}

function openEventModal(dateKey) {
  selectedDate = dateKey;
  eventModal.classList.remove("hidden");

  if (events[dateKey]) {
    document.getElementById("modalTitle").textContent = "Edit Event";
    const e = events[dateKey];
    eventTitleInput.value = e.title;
    eventDescInput.value = e.desc;
    startTimeInput.value = e.start;
    endTimeInput.value = e.end;
    eventCategoryInput.value = e.category;
    deleteEventBtn.classList.remove("hidden");
  } else {
    document.getElementById("modalTitle").textContent = "Add Event";
    eventTitleInput.value = "";
    eventDescInput.value = "";
    startTimeInput.value = "";
    endTimeInput.value = "";
    eventCategoryInput.value = "work";
    deleteEventBtn.classList.add("hidden");
  }
}

function closeModalWindow() {
  eventModal.classList.add("hidden");
}

function saveEvent() {
  if (!selectedDate) return;
  const title = eventTitleInput.value.trim();
  if (!title) return alert("Event title required!");
  const desc = eventDescInput.value.trim();
  const start = startTimeInput.value;
  const end = endTimeInput.value;
  const category = eventCategoryInput.value;

  events[selectedDate] = { title, desc, start, end, category };
  localStorage.setItem("calendarEvents", JSON.stringify(events));
  closeModalWindow();
  renderCalendar(currentDate);
  scheduleReminder(selectedDate);
}
// Author:Abdur Rahaman Shishir
function deleteEvent() {
  if (events[selectedDate]) delete events[selectedDate];
  localStorage.setItem("calendarEvents", JSON.stringify(events));
  closeModalWindow();
  renderCalendar(currentDate);
}

// 🔔 Reminder
function scheduleReminder(dateKey) {
  const e = events[dateKey];
  if (!e || !e.start) return;
  const [h, m] = e.start.split(":").map(Number);
  const eventDate = new Date(dateKey);
  eventDate.setHours(h, m, 0, 0);
  const diff = eventDate - new Date();

  if (diff > 0) {
    setTimeout(() => alert(`🔔 Reminder: ${e.title} (${e.category})`), diff);
  }
}

// 🔎 Search
searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  const results = Object.entries(events).filter(([_, e]) => e.title.toLowerCase().includes(query));
  renderCalendar(currentDate);
  if (query) {
    document.querySelectorAll(".days div").forEach(div => {
      const key = `${currentDate.getFullYear()}-${currentDate.getMonth()+1}-${div.textContent}`;
      if (results.some(([d]) => d === key)) div.style.background = "rgba(251,191,36,0.3)";
    });
  }
});

// 🌓 Theme
toggleTheme.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  toggleTheme.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
});

// 💾 Export / Import
exportBtn.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(events, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "events.json";
  a.click();
});

importBtn.addEventListener("click", () => importInput.click());
importInput.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    events = JSON.parse(reader.result);
    localStorage.setItem("calendarEvents", JSON.stringify(events));
    renderCalendar(currentDate);
  };
  reader.readAsText(file);
});

// Navigation
prevMonthBtn.onclick = () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(currentDate); };
nextMonthBtn.onclick = () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(currentDate); };
todayBtn.onclick = () => { currentDate = new Date(); renderCalendar(currentDate); };
closeModal.onclick = closeModalWindow;
saveEventBtn.onclick = saveEvent;
deleteEventBtn.onclick = deleteEvent;

renderCalendar(currentDate);
