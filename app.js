// QuickLift Log - vanilla JS SPA with localStorage + PWA
const $ = (sel, el=document)=> el.querySelector(sel);
const $$ = (sel, el=document)=> [...el.querySelectorAll(sel)];

// ----- Storage helpers -----
const store = {
  get(k, def){ try{ return JSON.parse(localStorage.getItem(k)) ?? def } catch{ return def } },
  set(k, v){ localStorage.setItem(k, JSON.stringify(v)) }
};

// ----- Initial data -----
const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const defaultPlan = {
  Mon:{ AM:[
      {name:"Back Squat", target:"5x3 @7-8, rest 180"},
      {name:"Bench Press", target:"4x5 @7, rest 150"},
      {name:"Weighted Pull-Up", target:"4x6 @8, rest 150"},
      {name:"Ring Push-Up", target:"3x12 @7, rest 60"}
    ],
    PM:[
      {name:"Broad Jump", target:"5x3, rest 90"},
      {name:"Sled Push (20m)", target:"6x20m, rest 90"},
      {name:"Sprint 5x30m", target:"RPE fast, rest 120"},
      {name:"Hip/Ankle Mobility", target:"10 min"}
    ] },
  Tue:{ AM:[
      {name:"Deadlift", target:"4x3 @7-8, rest 180"},
      {name:"Overhead Press", target:"4x5 @7, rest 150"},
      {name:"Barbell Row", target:"3x8 @8, rest 120"},
      {name:"Hanging Leg Raise", target:"3x10, rest 60"}
    ],
    PM:[
      {name:"Hurdle Hops", target:"4x5, rest 90"},
      {name:"Flying 20s", target:"6x20m, rest 180"},
      {name:"Tempo Runs", target:"6x200m, rest 120"},
      {name:"Core Circuit", target:"10 min"}
    ] },
  Wed:{ AM:[
      {name:"Front Squat", target:"4x4 @7, rest 150"},
      {name:"Incline DB Press", target:"3x8 @8, rest 120"},
      {name:"Chin-Up (BW)", target:"3xAMRAP, rest 120"},
      {name:"Lateral Raise", target:"3x12, rest 60"}
    ],
    PM:[
      {name:"Bounding", target:"4x20m, rest 120"},
      {name:"Acceleration Drill", target:"6x20m, rest 120"},
      {name:"Mobility Circuit", target:"15 min"}
    ] },
  Thu:{ AM:[
      {name:"Paused Deadlift", target:"3x3 @7, rest 180"},
      {name:"Close-Grip Bench", target:"4x5 @7, rest 150"},
      {name:"Single-Leg RDL", target:"3x8/side @7, rest 90"},
      {name:"Plank", target:"3x45s, rest 60"}
    ],
    PM:[
      {name:"Sprint 6x60m", target:"rest 150"},
      {name:"Med Ball Slams", target:"4x6, rest 90"},
      {name:"Agility Ladder", target:"10 min"}
    ] },
  Fri:{ AM:[
      {name:"Back Squat (Light)", target:"3x5 @6, rest 120"},
      {name:"Bench Press (Top Single)", target:"1x1 @8; backoffs 3x5 @7, rest 150"},
      {name:"Pull-Up (BW)", target:"3xAMRAP, rest 120"},
      {name:"EZ-Bar Curl", target:"3x10, rest 60"}
    ],
    PM:[
      {name:"Agility Ladder", target:"10 min"},
      {name:"Trap Bar Jumps", target:"3x5, rest 120"},
      {name:"Box Jumps", target:"3x3, rest 120"},
      {name:"Easy Run (Z2)", target:"15 min"}
    ] },
  Sat:{ AM:[], PM:[] },
  Sun:{ AM:[], PM:[] }
};

const plan = store.get("plan", defaultPlan);
const logs = store.get("logs", []);

// ----- UI wiring -----
const views = $$(".view");
const tabs = $$(".tab");
tabs.forEach(btn=>btn.addEventListener("click", ()=>{
  tabs.forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  const tab = btn.dataset.tab;
  views.forEach(v=>v.classList.toggle("active", v.id===tab));
  if(tab==="history") renderHistory();
  if(tab==="plan") renderPlan();
  if(tab==="charts") renderCharts();
}));

// Date/session defaults
const dateEl = $("#date");
const sessionEl = $("#session");
const exerciseSelect = $("#exerciseSelect");

function todayISO(){
  const d = new Date(); d.setMinutes(d.getMinutes()-d.getTimezoneOffset());
  return d.toISOString().slice(0,10);
}
dateEl.value = todayISO();
sessionEl.value = (new Date().getHours() < 14) ? "AM" : "PM";

// Populate exercise select for current day/session
function populateExerciseOptions(){
  const day = dayFromDate(dateEl.value);
  const sess = sessionEl.value;
  const items = (plan?.[day]?.[sess]) ?? [];
  exerciseSelect.innerHTML = items.map(x=>`<option>${x.name}</option>`).join("");
}
populateExerciseOptions();

// Render today's plan block
function renderTodayPlan(){
  const day = dayFromDate(dateEl.value);
  const sess = sessionEl.value;
  const wrap = $("#todayPlan");
  const items = (plan?.[day]?.[sess]) ?? [];
  wrap.innerHTML = items.length ? items.map(x=>`<div class="ex">
      <div class="row"><strong>${x.name}</strong><small class="badge">${day} ${sess}</small></div>
      <div class="target">${x.target ?? ""}</div>
    </div>`).join("") : `<p class="muted">No exercises yet. Add some in the Plan tab.</p>`;
  populateExerciseOptions();
}
renderTodayPlan();

$("#reloadPlan").addEventListener("click", renderTodayPlan);
dateEl.addEventListener("change", renderTodayPlan);
sessionEl.addEventListener("change", renderTodayPlan);

// ----- Logging sets -----
const setNumEl = $("#setNum");
const weightEl = $("#weight");
const repsEl = $("#reps");
const rpeEl = $("#rpe");
const notesEl = $("#notes");

function dayFromDate(iso){
  const d = new Date(iso + "T00:00:00");
  return DAYS[d.getDay()===0?6:d.getDay()-1]; // map Sun->6
}

function saveSet(){
  const entry = {
    id: crypto.randomUUID(),
    date: dateEl.value,
    day: dayFromDate(dateEl.value),
    session: sessionEl.value,
    exercise: exerciseSelect.value || "Custom",
    set: Number(setNumEl.value||1),
    weight: Number(weightEl.value||0),
    reps: Number(repsEl.value||0),
    rpe: Number(rpeEl.value||0),
    notes: notesEl.value?.trim()||""
  };
  logs.push(entry);
  store.set("logs", logs);
  renderTodayLog();
refreshChartExerciseOptions();
  if($(".tab.active")?.dataset.tab==="charts") { renderCharts(); }
  // Remember last values per exercise for quality-of-life
  store.set("last:"+entry.exercise, {weight:entry.weight, reps:entry.reps, rpe:entry.rpe});
  // Basic progressive suggestion
  suggestNext(entry.exercise, entry.weight);
  clearInputs();
}

function clearInputs(){
  // keep set # increments
  setNumEl.value = (Number(setNumEl.value||1) + 1);
  // keep exercise selection and notes
  weightEl.value = ""; repsEl.value = ""; rpeEl.value = "";
}

$("#saveSet").addEventListener("click", saveSet);

function renderTodayLog(){
  const container = $("#todayLog");
  const d = dateEl.value;
  const sess = sessionEl.value;
  const todayEntries = logs.filter(x=>x.date===d && x.session===sess)
                           .sort((a,b)=> a.exercise.localeCompare(b.exercise) || a.set-b.set);
  container.innerHTML = todayEntries.map(x=>`<div class="entry">
    <div><strong>${x.exercise}</strong> <span class="muted">Set ${x.set}</span></div>
    <div class="mono">${x.weight} x ${x.reps} @ ${x.rpe||"-"}</div>
    <div>${x.notes? `<small class="muted">${x.notes}</small>` : ""}</div>
    <button data-id="${x.id}" class="ghost danger del">Delete</button>
  </div>`).join("");
  $$(".del", container).forEach(btn => btn.addEventListener("click", ()=>{
    const id = btn.dataset.id;
    const i = logs.findIndex(e=>e.id===id);
    if(i>=0){ logs.splice(i,1); store.set("logs", logs); renderTodayLog();
refreshChartExerciseOptions(); }
  }));
}
renderTodayLog();
refreshChartExerciseOptions();

$("#clearToday").addEventListener("click", ()=>{
  const d = dateEl.value, s = sessionEl.value;
  const keep = logs.filter(x=> !(x.date===d && x.session===s));
  if(confirm("Clear all sets for today’s session?")){
    logs.length = 0; logs.push(...keep); store.set("logs", logs); renderTodayLog();
refreshChartExerciseOptions();
  }
});

// Quick fill from last time
$("#useLast").addEventListener("click", ()=>{
  const ex = exerciseSelect.value;
  const last = store.get("last:"+ex, null);
  if(last){
    weightEl.value = last.weight||"";
    repsEl.value = last.reps||"";
    rpeEl.value = last.rpe||"";
  } else {
    alert("No previous data for this exercise yet.");
  }
});

// Suggest next weight (+2.5% rounded to nearest 0.5)
function suggestNext(name, weight){
  if(!weight) return;
  const next = Math.round((weight*1.025)/0.5)*0.5;
  store.set("suggest:"+name, next);
}

// ----- History -----
function renderHistory(){
  const filter = $("#historySearch").value?.toLowerCase() || "";
  const list = $("#historyList");
  const items = logs
    .filter(x=> x.exercise.toLowerCase().includes(filter))
    .sort((a,b)=> (a.date>b.date?-1:1) || a.exercise.localeCompare(b.exercise) || b.set-a.set)
    .slice(0, 200);
  if(!items.length){ list.innerHTML = `<p class="muted">No entries yet.</p>`; return; }
  list.innerHTML = items.map(x=>`<div class="hentry">
    <div class="row">
      <strong>${x.exercise}</strong>
      <small class="badge">${x.date} • ${x.session}</small>
    </div>
    <div class="mono">${x.weight} x ${x.reps} @ ${x.rpe||"-"}</div>
    ${x.notes? `<small class="muted">${x.notes}</small>` : ""}
  </div>`).join("");
}
$("#historySearch").addEventListener("input", renderHistory);

// ----- Plan editor -----
const plDay = $("#plDay"); plDay.innerHTML = DAYS.map(d=>`<option>${d}</option>`).join("");
const plSession = $("#plSession");
const plName = $("#plName");
const plTarget = $("#plTarget");
const planView = $("#planView");

function renderPlan(){
  // Render grouped table by day/session
  let html = "";
  for(const d of DAYS){
    const day = plan[d] || {AM:[], PM:[]};
    html += `<div class="card">
      <div class="row"><h3>${d}</h3>
        <button class="ghost danger" data-clear="${d}">Clear Day</button>
      </div>
      <div class="grid2">
        <div><strong>AM</strong>${renderPlanList(day.AM, d, "AM")}</div>
        <div><strong>PM</strong>${renderPlanList(day.PM, d, "PM")}</div>
      </div>
    </div>`;
  }
  planView.innerHTML = html;
  $$("button[data-clear]").forEach(b=> b.addEventListener("click", ()=>{
    const d = b.getAttribute("data-clear");
    plan[d] = {AM:[], PM:[]}; store.set("plan", plan); renderPlan(); renderTodayPlan();
  }));
}
function renderPlanList(list, day, session){
  if(!list?.length) return `<p class="muted">—</p>`;
  return `<ul>` + list.map((x,i)=> `<li class="row">
    <span>${x.name} <span class="muted">${x.target||""}</span></span>
    <span>
      <button class="ghost" data-up="${day}|${session}|${i}">↑</button>
      <button class="ghost" data-down="${day}|${session}|${i}">↓</button>
      <button class="ghost danger" data-del="${day}|${session}|${i}">Delete</button>
    </span>
  </li>`).join("") + `</ul>`;
}

function addToPlan(){
  const d = plDay.value;
  const s = plSession.value;
  const name = plName.value.trim();
  const target = plTarget.value.trim();
  if(!name){ alert("Exercise name required"); return; }
  plan[d] = plan[d] || {AM:[], PM:[]};
  plan[d][s].push({name, target});
  store.set("plan", plan);
  plName.value=""; plTarget.value="";
  renderPlan(); renderTodayPlan(); populateExerciseOptions();
}
$("#addToPlan").addEventListener("click", addToPlan);

$("#clearPlan").addEventListener("click", ()=>{
  if(confirm("Reset the plan to a blank template?")){
    for(const d of DAYS) plan[d] = {AM:[], PM:[]};
    store.set("plan", plan);
    renderPlan(); renderTodayPlan();
  }
});
$("#seedPlan").addEventListener("click", ()=>{
  for(const k of Object.keys(defaultPlan)) plan[k] = JSON.parse(JSON.stringify(defaultPlan[k]));
  store.set("plan", plan);
  renderPlan(); renderTodayPlan(); populateExerciseOptions();
});

// plan list button handlers (up/down/delete)
planView.addEventListener("click", (e)=>{
  const tgt = e.target;
  if(tgt.matches("[data-del], [data-up], [data-down]")){
    const [day, session, idxStr] = tgt.getAttribute(`data-${tgt.matches("[data-del]")?"del":tgt.matches("[data-up]")?"up":"down"}`).split("|");
    const idx = Number(idxStr);
    const arr = plan[day][session];
    if(tgt.hasAttribute("data-del")) arr.splice(idx,1);
    if(tgt.hasAttribute("data-up") && idx>0) [arr[idx-1], arr[idx]] = [arr[idx], arr[idx-1]];
    if(tgt.hasAttribute("data-down") && idx<arr.length-1) [arr[idx+1], arr[idx]] = [arr[idx], arr[idx+1]];
    store.set("plan", plan); renderPlan(); renderTodayPlan(); populateExerciseOptions();
  }
});

// ----- Export/Import -----
$("#exportJSON").addEventListener("click", ()=>{
  const data = { plan, logs };
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "quicklift-backup.json";
  a.click();
  setTimeout(()=> URL.revokeObjectURL(a.href), 1000);
});

$("#importJSON").addEventListener("click", ()=>{
  const f = $("#importFile").files?.[0];
  if(!f){ alert("Choose a JSON file first."); return; }
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const data = JSON.parse(reader.result);
      if(data.plan) Object.assign(plan, data.plan);
      if(data.logs) { logs.length=0; logs.push(...data.logs); }
      store.set("plan", plan); store.set("logs", logs);
      renderPlan(); renderTodayPlan(); renderTodayLog();
refreshChartExerciseOptions();
      alert("Import complete ✔");
    }catch(err){
      alert("Invalid JSON file.");
    }
  };
  reader.readAsText(f);
});

// ----- Rest Timer -----
let restInterval=null, restRemaining=0;
$("#startRest").addEventListener("click", ()=>{
  const ex = exerciseSelect.value;
  // Try to parse rest from target (e.g., "rest 120")
  const d = dayFromDate(dateEl.value), s = sessionEl.value;
  const item = (plan?.[d]?.[s]||[]).find(x=>x.name===ex);
  const seconds = parseRestSeconds(item?.target) || 90;
  startRest(seconds);
});

function parseRestSeconds(target){
  if(!target) return null;
  const m = target.match(/rest\s*(\d+)/i);
  return m ? Number(m[1]) : null;
}
function startRest(sec){
  restRemaining = sec;
  const label = $("#restTimer");
  if(restInterval) clearInterval(restInterval);
  label.textContent = formatTime(restRemaining);
  restInterval = setInterval(()=>{
    restRemaining--;
    label.textContent = formatTime(Math.max(0,restRemaining));
    if(restRemaining<=0){ clearInterval(restInterval); restInterval=null; navigator.vibrate?.(200); }
  }, 1000);
}
function formatTime(s){
  const m = Math.floor(s/60), r = s%60;
  return `${String(m).padStart(2,"0")}:${String(r).padStart(2,"0")}`
}

// ----- Install PWA prompt -----
let deferredPrompt=null;
window.addEventListener("beforeinstallprompt", (e)=>{
  e.preventDefault();
  deferredPrompt = e;
  $("#installBtn").style.display = "inline-block";
});
$("#installBtn").addEventListener("click", async ()=>{
  if(!deferredPrompt) return alert("Install not available yet. Try adding to Home Screen in your browser.");
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if(outcome==="accepted"){ $("#installBtn").style.display="none"; }
  deferredPrompt = null;
});


// ----- Charts (Estimated 1RM over time) -----
const chartExercise = $("#chartExercise");
const chartCanvas = $("#chartCanvas");
let chartCtx = chartCanvas?.getContext("2d");

function uniqueExercises(){
  const names = new Set();
  // From plan
  for(const d of DAYS){
    for(const s of ["AM","PM"]){
      (plan?.[d]?.[s]||[]).forEach(x=> names.add(x.name));
    }
  }
  // From logs
  logs.forEach(x=> names.add(x.exercise));
  return [...names].sort();
}

function refreshChartExerciseOptions(){
  if(!chartExercise) return;
  const opts = uniqueExercises();
  chartExercise.innerHTML = opts.map(n=>`<option value="${n}">${n}</option>`).join("");
}

function e1rm(weight, reps){ return weight * (1 + reps/30); }

function getSeriesForExercise(name){
  // For each date, take the best set by e1RM for that exercise
  const byDate = {};
  logs.filter(x=> x.exercise===name).forEach(x=>{
    const val = e1rm(Number(x.weight||0), Number(x.reps||0));
    if(!byDate[x.date] || val > byDate[x.date]) byDate[x.date] = val;
  });
  const entries = Object.entries(byDate).sort((a,b)=> a[0]<b[0]? -1: 1);
  return entries.map(([date,val])=> ({ date, val }));
}

function drawChart(){
  if(!chartCtx || !chartExercise.value){ return; }
  const name = chartExercise.value;
  const data = getSeriesForExercise(name);
  const ctx = chartCtx;
  // Clear
  ctx.clearRect(0,0,chartCanvas.width, chartCanvas.height);
  // Pad
  const pad = 40;
  const W = chartCanvas.width, H = chartCanvas.height;
  // Axes
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.beginPath();
  ctx.moveTo(pad, pad); ctx.lineTo(pad, H-pad); ctx.lineTo(W-pad, H-pad); ctx.stroke();

  if(data.length===0){
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText("No data yet — log some sets!", pad+10, H/2);
    return;
  }

  // Scales
  const xs = data.map(d=> new Date(d.date).getTime());
  const ys = data.map(d=> d.val);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.floor(Math.min(...ys)*0.95), yMax = Math.ceil(Math.max(...ys)*1.05);

  function xScale(t){
    if(xMax===xMin) return pad + (W-2*pad)/2;
    return pad + (t - xMin) * (W-2*pad) / (xMax - xMin);
  }
  function yScale(v){
    if(yMax===yMin) return H/2;
    return H - pad - (v - yMin) * (H-2*pad) / (yMax - yMin);
  }

  // Gridlines (5)
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "12px system-ui";
  for(let i=0;i<=5;i++){
    const y = yMin + (yMax - yMin)*i/5;
    const Y = yScale(y);
    ctx.beginPath(); ctx.moveTo(pad, Y); ctx.lineTo(W-pad, Y); ctx.stroke();
    ctx.fillText(y.toFixed(0), 6, Y+4);
  }

  // Line
  ctx.beginPath();
  ctx.strokeStyle = "#ffffff";
  data.forEach((d,i)=>{
    const X = xScale(new Date(d.date).getTime());
    const Y = yScale(d.val);
    if(i===0) ctx.moveTo(X,Y); else ctx.lineTo(X,Y);
  });
  ctx.stroke();

  // Dots
  data.forEach(d=>{
    const X = xScale(new Date(d.date).getTime());
    const Y = yScale(d.val);
    ctx.beginPath(); ctx.arc(X,Y,3,0,Math.PI*2); ctx.fillStyle="#ffffff"; ctx.fill();
  });

  // Title
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = "14px system-ui";
  ctx.fillText(name + " — est. 1RM", pad, pad-12);
}

function renderCharts(){
  refreshChartExerciseOptions();
  drawChart();
}

if(chartExercise){
  chartExercise.addEventListener("change", drawChart);
  // Redraw when switching tabs or saving sets
  document.addEventListener("visibilitychange", ()=> { if(!document.hidden) drawChart(); });
}


// ----- Service worker -----
if("serviceWorker" in navigator){
  window.addEventListener("load", ()=> navigator.serviceWorker.register("./service-worker.js"));
}
