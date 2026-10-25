/* Daily Focus Planner – chạy trực tiếp trên GitHub Pages, không cần bước build. */
(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const STORAGE = 'daily-focus-local-v1';
  const config = window.DAILY_FOCUS_CONFIG || {};
  const HAS_CLOUD = Boolean(config.supabaseUrl?.trim() && config.supabaseAnonKey?.trim());
  let supabase = null;
  const today = () => { const d = new Date(); return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'); };
  const parseDay = value => new Date(`${value}T12:00:00`);
  const shiftDay = (value, n) => { const d=parseDay(value);d.setDate(d.getDate()+n);return toISO(d); };
  const toISO = d => [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  const relativeDays = (a,b) => Math.round((parseDay(b)-parseDay(a))/86400000);
  const shortDate = (v) => parseDay(v).toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'});
  const fullDate = (v) => parseDay(v).toLocaleDateString('vi-VN',{weekday:'long', day:'numeric',month:'long',year:'numeric'});
  const monthLabel = (d) => parseDay(d).toLocaleDateString('vi-VN',{month:'long',year:'numeric'});
  const monthStart = (s) => s.slice(0,7)+'-01';
  const shiftMonth = (d, n) => { const x=parseDay(monthStart(d)); x.setMonth(x.getMonth()+n);return toISO(x); };
  const e = v => String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid = () => (window.crypto?.randomUUID ? crypto.randomUUID() : 'id-'+Date.now()+'-'+Math.random().toString(36).slice(2));
  const iconPaths = {
    grid:'<rect x="3" y="3" width="7" height="7" rx="1.4"/><rect x="14" y="3" width="7" height="7" rx="1.4"/><rect x="3" y="14" width="7" height="7" rx="1.4"/><rect x="14" y="14" width="7" height="7" rx="1.4"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    list:'<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    chart:'<path d="M3 3v18h18M7 16v-4M12 16V7M17 16V5"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    checkcircle:'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    circle:'<circle cx="12" cy="12" r="9"/>',
    pin:'<path d="M16 3v4l3 3v2H5v-2l3-3V3M12 12v9M7 3h10"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    chevronleft:'<path d="m15 18-6-6 6-6"/>',
    chevronright:'<path d="m9 18 6-6-6-6"/>',
    chevrondown:'<path d="m6 9 6 6 6-6"/>',
    search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    pencil:'<path d="m15 5 4 4M3 21l4.5-1L20 7.5a2.1 2.1 0 0 0-3-3L4.5 17 3 21Z"/>',
    trash:'<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 10v7M14 10v7"/>',
    flag:'<path d="M5 21V4M5 5c5-4 8 3 15-1v12c-7 4-10-3-15 1"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/>',
    bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 10h18c0-2-3-3-3-10M10 21h4"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="M4.5 8 3 10l1 3-1 3 3 2 2-1 2 3h4l2-3 2 1 3-2-1-3 1-3-3-2-2 1-2-3h-4l-2 3-2-1Z"/>',
    logout:'<path d="M10 17l5-5-5-5M15 12H3M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7"/>',
    sparkles:'<path d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3ZM20 17l.7 2.3L23 20l-2.3.7L20 23l-.7-2.3L17 20l2.3-.7L20 17ZM4 2l.5 1.5L6 4l-1.5.5L4 6l-.5-1.5L2 4l1.5-.5L4 2Z"/>',
    arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
    download:'<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
    refresh:'<path d="M20 11a8 8 0 1 0-2 6M20 4v7h-7"/>',
    x:'<path d="M18 6 6 18M6 6l12 12"/>',
    laptop:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M2 20h20"/>',
    smartphone:'<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    cloud:'<path d="M7 18h12a4 4 0 0 0 0-8 7 7 0 0 0-13-2 5 5 0 0 0 1 10"/>',
    shield:'<path d="M12 2 4 6v6c0 5 3 8 8 10 5-2 8-5 8-10V6l-8-4Z"/><path d="m9 12 2 2 4-4"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
    inbox:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 13h5l2 3h4l2-3h5"/>'
  };
  function ic(name,size=18,extra=''){return `<svg class="icon ${extra}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name]||iconPaths.circle}</svg>`;}

  function demoTasks() {
    const base=today(), ts=new Date().toISOString();
    return [
      {id:uid(),title:'Hoàn thiện kế hoạch tuần',description:'Rà soát các đầu việc quan trọng và chuẩn bị tài liệu cần thiết.',start_date:shiftDay(base,-1),due_date:shiftDay(base,2),start_time:null,due_time:'17:00',priority:'high',status:'doing',focus_date:base,created_at:ts,completed_at:null},
      {id:uid(),title:'Kiểm tra nội dung bài giảng',description:'Đọc lại giáo án, kiểm tra các ví dụ và câu hỏi.',start_date:shiftDay(base,-2),due_date:base,start_time:null,due_time:'20:00',priority:'high',status:'todo',focus_date:base,created_at:ts,completed_at:null},
      {id:uid(),title:'Chuẩn bị hoạt động STEM',description:'Lên ý tưởng hoạt động cho buổi sinh hoạt tiếp theo.',start_date:base,due_date:shiftDay(base,5),start_time:null,due_time:null,priority:'normal',status:'todo',focus_date:null,created_at:ts,completed_at:null},
      {id:uid(),title:'Tổng hợp báo cáo cuối tháng',description:'Kiểm tra các hạng mục trước khi nộp báo cáo.',start_date:shiftDay(base,3),due_date:shiftDay(base,8),start_time:null,due_time:null,priority:'low',status:'todo',focus_date:null,created_at:ts,completed_at:null}
    ];
  }
  function localLoad() {try {const v=localStorage.getItem(STORAGE);if(v!==null){const data=JSON.parse(v);return Array.isArray(data)?data:[];}}catch{}const data=demoTasks();localStorage.setItem(STORAGE,JSON.stringify(data));return data;}
  function localSave(){localStorage.setItem(STORAGE,JSON.stringify(state.tasks));}

  const state={mode:HAS_CLOUD?'loading':'local',user:null,tasks:[],page:'dashboard',selectedDate:today(),month:monthStart(today()),calendarView:'month',search:'',filter:'active',modal:null,authMode:'login',busy:false,loadingTasks:false,selectedCalendarDay:today()};
  let toastTimeout;
  let cloudLoadSequence = 0;
  function notify(message,type='success'){
    const root=$('#toast-root');root.innerHTML=`<div class="toast ${e(type)}">${ic(type==='error'?'info':'checkcircle',19)}<span>${e(message)}</span></div>`;
    clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>root.innerHTML='',4200);
  }
  const isDone=t=>t.status==='done';
  const isOverdue=(t,date=today())=>!isDone(t)&&t.due_date<date;
  const isActive=(t,date=state.selectedDate)=>!isDone(t)&&t.start_date<=date&&t.due_date>=date;
  const dueToday=(t,date=state.selectedDate)=>!isDone(t)&&t.due_date===date;
  const getPriority=(p)=>({high:'Cao',normal:'Vừa',low:'Thấp'}[p]||'Vừa');
  const getStatus=(s)=>({todo:'Chưa làm',doing:'Đang làm',done:'Hoàn thành'}[s]||'Chưa làm');
  const statusTone=(t,date=state.selectedDate)=>isDone(t)?'success':t.due_date<date?'danger':t.due_date===date?'amber':relativeDays(date,t.due_date)<=2?'amber':'blue';
  const badgeTask=(t,date=state.selectedDate)=>isDone(t)?'Hoàn thành':t.due_date<date?'Quá hạn':t.due_date===date?'Hạn hôm nay':relativeDays(date,t.due_date)<=2?'Sắp đến hạn':getStatus(t.status);
  const sortTasks=(list)=>[...list].sort((a,b)=>a.due_date.localeCompare(b.due_date)||(a.due_time||'99:99').localeCompare(b.due_time||'99:99')||({'high':0,'normal':1,'low':2}[a.priority]-{'high':0,'normal':1,'low':2}[b.priority]));
  const activeCount=()=>state.tasks.filter(t=>!isDone(t)).length;

  function navBtn(page,label,glyph){return `<button type="button" class="nav-link ${state.page===page?'active':''}" data-action="navigate" data-page="${page}">${ic(glyph,19)}<span>${label}</span>${page==='tasks'&&activeCount()?`<small>${activeCount()}</small>`:''}</button>`;}
  function sidebar(){return `<aside class="sidebar">
    <div class="brand"><div class="logo-symbol">${ic('check',21)}</div><div><strong>daily<span>focus.</span></strong><p>Làm điều quan trọng trước.</p></div></div>
    <div class="nav-label">KHÔNG GIAN LÀM VIỆC</div>
    <nav class="side-nav" aria-label="Điều hướng">${navBtn('dashboard','Tổng quan','grid')}${navBtn('calendar','Lịch công việc','calendar')}${navBtn('tasks','Tất cả công việc','list')}${navBtn('statistics','Thống kê','chart')}</nav>
    <div class="nav-label nav-label-bottom">CÁ NHÂN</div><nav class="side-nav">${navBtn('settings','Cài đặt','settings')}</nav>
    <div class="sidebar-bottom"><div class="sidebar-tip"><div class="tip-icon">${ic('sparkles',18)}</div><strong>Tiến bộ mỗi ngày</strong><p>Chọn ít việc quan trọng và hoàn thành thật tốt.</p></div>
      <div class="profile-line"><div class="avatar">${state.mode==='remote'?e((state.user?.email||'U')[0].toUpperCase()):ic('user',18)}</div><div class="profile-text"><strong>${state.mode==='remote'?'Tài khoản của tôi':'Chế độ dùng thử'}</strong><span>${state.mode==='remote'?e(state.user?.email||''):'Lưu trên thiết bị này'}</span></div><button title="Cài đặt" aria-label="Cài đặt" class="icon-button" data-action="navigate" data-page="settings">${ic('more')}</button></div>
    </div></aside>`;}
  function mobileNav(){return `<nav class="mobile-nav" aria-label="Điều hướng di động">${[['dashboard','grid','Hôm nay'],['calendar','calendar','Lịch'],['tasks','list','Công việc'],['statistics','chart','Thống kê'],['settings','settings','Cài đặt']].map(([p,g,l])=>`<button class="mobile-nav-item ${state.page===p?'active':''}" data-action="navigate" data-page="${p}">${ic(g,20)}<span>${l}</span></button>`).join('')}</nav>`;}
  function topBar(){const titles={dashboard:'Tổng quan',calendar:'Lịch công việc',tasks:'Tất cả công việc',statistics:'Thống kê',settings:'Cài đặt'};return `<header class="topbar"><div class="breadcrumb">Không gian của tôi <span>/</span> <strong>${titles[state.page]}</strong></div><div class="top-actions"><span class="connection ${state.mode==='remote'?'connected':''}"><i></i>${state.mode==='remote'?'Đã đồng bộ':'Dùng thử trên máy'}</span><button class="icon-button mobile-hide" title="Về hôm nay" data-action="today">${ic('calendar',19)}</button><div class="top-avatar">${state.mode==='remote'?e((state.user?.email||'U')[0].toUpperCase()):ic('user',18)}</div></div></header>`;}
  function pageHead(eyebrow,title,desc,button=true){return `<div class="page-heading"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${desc}</p></div>${button?`<button class="primary-btn add-button" data-action="new">${ic('plus',18)}<span>Thêm công việc</span></button>`:''}</div>`;}
  function taskMini(t,context='list'){
    const tone=statusTone(t), pinned=!isDone(t)&&t.focus_date===state.selectedDate;
    return `<article class="task-row ${isDone(t)?'is-done':''}" data-task-id="${e(t.id)}">
      <button class="completion ${isDone(t)?'checked':''}" data-action="toggle-done" data-id="${e(t.id)}" title="${isDone(t)?'Đánh dấu chưa hoàn thành':'Đánh dấu hoàn thành'}" aria-label="Hoàn thành: ${e(t.title)}">${isDone(t)?ic('check',14):''}</button>
      <div class="task-content"><button class="task-title" data-action="edit" data-id="${e(t.id)}">${e(t.title)}</button><div class="task-meta"><span>${ic('calendar',13)} ${shortDate(t.start_date)} – ${shortDate(t.due_date)}${t.due_time?' · '+e(t.due_time.slice(0,5)):''}</span><span class="priority-dot ${e(t.priority)}"></span><span>${getPriority(t.priority)}</span></div></div>
      <span class="status-tag ${tone}">${badgeTask(t)}</span>
      ${context!=='done'&&t.start_date<=state.selectedDate?`<button class="pin-btn ${pinned?'pinned':''}" data-action="pin" data-id="${e(t.id)}" title="${pinned?'Bỏ ghim hôm nay':'Ghim vào hôm nay'}" aria-label="Ghim ${e(t.title)}">${ic('pin',17)}</button>`:''}
      <button class="row-edit" data-action="edit" data-id="${e(t.id)}" aria-label="Sửa công việc ${e(t.title)}">${ic('chevronright',17)}</button>
    </article>`;
  }
  function emptyState(title,subtitle,glyph='inbox',action=false){return `<div class="empty-state"><div class="empty-icon">${ic(glyph,25)}</div><strong>${title}</strong><p>${subtitle}</p>${action?`<button class="text-action" data-action="new">${ic('plus',16)} Thêm công việc đầu tiên</button>`:''}</div>`;}
  function dashboard(){const day=state.selectedDate,todayStr=today();const finished=state.tasks.filter(t=>isDone(t));const focus=sortTasks(state.tasks.filter(t=>!isDone(t)&&t.focus_date===day));
    const urgent=sortTasks(state.tasks.filter(t=>!isDone(t)&&t.focus_date!==day&&t.due_date<=day));
    const running=sortTasks(state.tasks.filter(t=>isActive(t,day)&&t.focus_date!==day&&t.due_date>day));
    const future=sortTasks(state.tasks.filter(t=>!isDone(t)&&t.start_date>day&&relativeDays(day,t.start_date)<=7));
    const overdue=state.tasks.filter(t=>isOverdue(t,day)).length;
    const todayCount=state.tasks.filter(t=>dueToday(t,day)).length;
    const weekStart=parseDay(day);weekStart.setDate(weekStart.getDate()-((weekStart.getDay()+6)%7));
    const dates=Array.from({length:7},(_,i)=>{const d=new Date(weekStart);d.setDate(d.getDate()+i);return toISO(d);});
    const priorityTotal=focus.length+urgent.length;
    const doneToday=finished.filter(t=>t.completed_at&&toISO(new Date(t.completed_at))===day).length;
    return `<div class="dashboard-view">
      ${pageHead('BẢNG ĐIỀU KHIỂN',day===todayStr?'Chào ngày mới! 👋':'Kế hoạch ngày '+shortDate(day),day===todayStr?'Một ngày hiệu quả bắt đầu bằng việc biết điều gì thực sự quan trọng.':'Xem công việc đang có trong ngày được chọn.')}
      ${state.mode==='local'?`<div class="demo-notice">${ic('info',18)} <span>Chế độ dùng thử: các công việc ban đầu chỉ là ví dụ; dữ liệu chỉ lưu trên thiết bị này, chưa đồng bộ.</span>${HAS_CLOUD?`<button data-action="go-auth">Đăng nhập để đồng bộ ${ic('arrow',15)}</button>`:''}</div>`:''}
      <div class="metric-grid">
        ${metric('Công việc đang mở',activeCount(),'list','violet','Cần tiếp tục theo dõi')}
        ${metric('Đến hạn hôm nay',todayCount,'calendar','blue','Cần hoàn thành trong ngày')}
        ${metric('Đã quá hạn',overdue,'clock','orange',overdue?'Cần xử lý sớm':'Tuyệt vời, không có việc trễ')}
        ${metric('Hoàn thành hôm nay',doneToday,'checkcircle','green','Từng bước tiến bộ')}
      </div>
      <div class="dashboard-columns"><div class="primary-column">
        <section class="panel focus-panel"><div class="panel-header"><div><div class="panel-title">${ic('sun',19,'icon-sun')} <h2>Tập trung hôm nay</h2> <span class="count-chip">${focus.length}</span></div><p>Các công việc bạn chủ động ghim để ưu tiên xử lý.</p></div><button class="simple-link" data-action="new">${ic('plus',15)} Tạo mới</button></div>
          <div class="focus-intro"><span>${ic('sparkles',18)}</span><div><strong>Ưu tiên những điều quan trọng nhất</strong><p>Ghim 3–5 công việc để luôn biết nên bắt đầu từ đâu.</p></div></div>
          ${focus.length?`<div class="tasks-in-panel">${focus.map(t=>taskMini(t)).join('')}</div>`:emptyState('Chưa ghim công việc nào','Hãy ghim một việc đang thực hiện để bắt đầu tập trung.','pin')}
        </section>
        <section class="panel"><div class="panel-header"><div><div class="panel-title">${ic('flag',18,'icon-alert')} <h2>Cần chú ý</h2><span class="count-chip">${urgent.length}</span></div><p>Những việc quá hạn hoặc đến hạn trong ngày.</p></div></div>${urgent.length?`<div class="tasks-in-panel">${urgent.map(t=>taskMini(t)).join('')}</div>`:emptyState('Không có việc cấp bách','Bạn đang kiểm soát các hạn công việc rất tốt!','checkcircle')}</section>
        <section class="panel"><div class="panel-header"><div><div class="panel-title">${ic('list',18)}<h2>Đang trong kế hoạch</h2><span class="count-chip">${running.length}</span></div><p>Công việc đang diễn ra, chưa ghim vào danh sách tập trung.</p></div><button class="simple-link" data-action="navigate" data-page="tasks">Xem tất cả ${ic('arrow',15)}</button></div>${running.length?`<div class="tasks-in-panel">${running.slice(0,6).map(t=>taskMini(t)).join('')}</div>`:emptyState('Đã xem hết việc đang làm','Các công việc khác có thể đang chờ đến ngày bắt đầu.','checkcircle')}</section>
      </div><div class="secondary-column">
        <section class="panel weekly-card"><div class="panel-header"><div><div class="panel-title">${ic('calendar',18)}<h2>Tuần này</h2></div><p>Chọn một ngày để xem công việc.</p></div></div><div class="week-strip">${dates.map(d=>`<button data-action="select-date" data-date="${d}" class="week-day ${d===day?'selected':''} ${d===todayStr?'is-today':''}"><span>${['CN','T2','T3','T4','T5','T6','T7'][parseDay(d).getDay()]}</span><b>${parseDay(d).getDate()}</b><i>${state.tasks.some(t=>!isDone(t)&&t.start_date<=d&&t.due_date>=d)?'•':''}</i></button>`).join('')}</div><button data-action="today" class="today-link">${ic('refresh',14)} Trở về hôm nay</button></section>
        <section class="panel overview-card"><div class="panel-header"><div><div class="panel-title">${ic('chart',18)}<h2>Tiến độ tổng quan</h2></div><p>Tình hình thực hiện mọi công việc.</p></div></div><div class="big-percent">${state.tasks.length?Math.round(finished.length/state.tasks.length*100):0}<span>%</span></div><div class="progress-bar"><span style="width:${state.tasks.length?finished.length/state.tasks.length*100:0}%"></span></div><div class="progress-legends"><span><i class="dot done-dot"></i> Hoàn thành <b>${finished.length}</b></span><span><i class="dot open-dot"></i> Chưa hoàn thành <b>${activeCount()}</b></span></div></section>
        <section class="panel upcoming-card"><div class="panel-header"><div><div class="panel-title">${ic('clock',18)}<h2>Sắp bắt đầu</h2></div><p>Trong 7 ngày tiếp theo.</p></div></div>${future.length?future.slice(0,4).map(t=>`<button class="upcoming-line" data-action="edit" data-id="${e(t.id)}"><div class="upcoming-date"><b>${parseDay(t.start_date).getDate()}</b><span>Th${parseDay(t.start_date).getMonth()+1}</span></div><div><strong>${e(t.title)}</strong><small>Bắt đầu ${shortDate(t.start_date)}</small></div>${ic('chevronright',15)}</button>`).join(''):emptyState('Chưa có việc sắp bắt đầu','Bạn có thể lên kế hoạch trước cho tuần tới.','calendar')}</section>
      </div></div>
    </div>`;
  }
  function metric(title,value,glyph,tone,foot){return `<div class="metric-card"><div class="metric-top"><span>${title}</span><div class="metric-icon ${tone}">${ic(glyph,19)}</div></div><div class="metric-value">${value}</div><div class="metric-foot">${foot}</div></div>`;}

  function monthDates(month){const first=parseDay(monthStart(month));const offset=(first.getDay()+6)%7;const start=new Date(first);start.setDate(start.getDate()-offset);return Array.from({length:42},(_,i)=>{const x=new Date(start);x.setDate(x.getDate()+i);return toISO(x);});}
  function calendar(){const month=state.month, dates=monthDates(month);const shown=state.calendarView==='week'?(()=>{const d=parseDay(state.selectedCalendarDay);d.setDate(d.getDate()-((d.getDay()+6)%7));return Array.from({length:7},(_,i)=>{const n=new Date(d);n.setDate(n.getDate()+i);return toISO(n);});})():dates;
    const dayTasks=sortTasks(state.tasks.filter(t=>t.start_date<=state.selectedCalendarDay&&t.due_date>=state.selectedCalendarDay));
    return `<div>${pageHead('LỊCH LÀM VIỆC','Toàn cảnh thời gian','Mỗi công việc tự xuất hiện từ ngày bắt đầu đến deadline.')}
    <section class="panel calendar-panel"><div class="calendar-toolbar"><div class="cal-month-controls"><button class="icon-button" data-action="month-prev" aria-label="Trước">${ic('chevronleft')}</button><h2>${monthLabel(state.calendarView==='week'?state.selectedCalendarDay:month)}</h2><button class="icon-button" data-action="month-next" aria-label="Sau">${ic('chevronright')}</button><button class="outline-btn smaller" data-action="today">Hôm nay</button></div><div class="segmented"><button class="${state.calendarView==='month'?'selected':''}" data-action="calendar-view" data-value="month">Tháng</button><button class="${state.calendarView==='week'?'selected':''}" data-action="calendar-view" data-value="week">Tuần</button></div></div>
    <div class="calendar-grid">${['T2','T3','T4','T5','T6','T7','CN'].map(v=>`<div class="day-name">${v}</div>`).join('')}
    ${shown.map(day=>{const matches=sortTasks(state.tasks.filter(t=>t.start_date<=day&&t.due_date>=day));const off=day.slice(0,7)!==month.slice(0,7);return `<button class="calendar-cell ${off?'other-month':''} ${day===today()?'today-cell':''} ${day===state.selectedCalendarDay?'chosen-day':''}" data-action="select-calendar-day" data-date="${day}" aria-label="Ngày ${shortDate(day)}: ${matches.length} công việc"><span class="cal-number">${parseDay(day).getDate()}</span><div class="cal-events">${matches.slice(0,2).map(t=>`<div class="cal-event ${isDone(t)?'done':t.priority}" title="${e(t.title)}">${e(t.title)}</div>`).join('')}${matches.length>2?`<span class="cal-more">+${matches.length-2} công việc</span>`:''}</div><span class="mobile-dots">${matches.slice(0,3).map(t=>`<i class="${isDone(t)?'done':t.priority}"></i>`).join('')}</span></button>`;}).join('')}
    </div></section><section class="panel selected-day-panel"><div class="panel-header"><div><div class="panel-title">${ic('calendar',18)}<h2>${fullDate(state.selectedCalendarDay)}</h2><span class="count-chip">${dayTasks.length}</span></div><p>Những công việc thuộc khoảng thời gian của ngày này.</p></div><button class="simple-link" data-action="new" data-start="${state.selectedCalendarDay}">${ic('plus',16)} Thêm công việc</button></div>${dayTasks.length?`<div class="tasks-in-panel">${dayTasks.map(t=>taskMini(t,isDone(t)?'done':'list')).join('')}</div>`:emptyState('Không có công việc trong ngày này','Chọn một ngày khác hoặc thêm công việc mới.','calendar')}</section></div>`;
  }
  function tasksPage(){let arr=state.tasks.filter(t=>{
      if(state.filter==='active'&&isDone(t))return false;
      if(state.filter==='done'&&!isDone(t))return false;
      if(state.filter==='overdue'&&!isOverdue(t))return false;
      return true;
    });const needle=state.search.toLocaleLowerCase('vi-VN').trim();if(needle)arr=arr.filter(t=>(t.title+' '+t.description).toLocaleLowerCase('vi-VN').includes(needle));arr=sortTasks(arr);
    return `<div>${pageHead('QUẢN LÝ CÔNG VIỆC','Tất cả công việc','Tìm kiếm, cập nhật tiến độ hoặc thay đổi thời hạn một cách dễ dàng.')}
      <section class="panel task-list-panel"><div class="filter-row"><div class="search-wrap">${ic('search',18)}<input id="task-search" placeholder="Tìm kiếm công việc..." value="${e(state.search)}" aria-label="Tìm kiếm công việc" /></div><div class="filter-tabs">${[['active','Đang mở'],['all','Tất cả'],['overdue','Quá hạn'],['done','Đã xong']].map(([value,label])=>`<button data-action="filter" data-value="${value}" class="${state.filter===value?'selected':''}">${label}</button>`).join('')}</div></div>
      <div class="task-list-summary"><strong>${arr.length} công việc</strong><span>Sắp xếp theo deadline gần nhất</span></div>${arr.length?`<div class="tasks-in-panel all-tasks">${arr.map(t=>taskMini(t,isDone(t)?'done':'list')).join('')}</div>`:emptyState('Không tìm thấy công việc','Hãy thử thay đổi bộ lọc hoặc thêm công việc mới.','search',state.tasks.length===0)}</section></div>`;
  }
  function statistics(){const all=state.tasks, done=all.filter(isDone), overdue=all.filter(isOverdue), running=all.filter(t=>!isDone(t)&&t.start_date<=today()&&t.due_date>=today()),upcoming=all.filter(t=>!isDone(t)&&t.start_date>today());const rate=all.length?Math.round(done.length*100/all.length):0;
    return `<div>${pageHead('THEO DÕI TIẾN ĐỘ','Thống kê công việc','Một góc nhìn tổng quát để bạn cải thiện hiệu quả mỗi ngày.',false)}
    <div class="metric-grid">${metric('Tổng công việc',all.length,'list','violet','Tất cả công việc đã tạo')}${metric('Đã hoàn thành',done.length,'checkcircle','green','Tích lũy thành quả')}${metric('Đang diễn ra',running.length,'clock','blue','Trong thời gian thực hiện')}${metric('Quá hạn',overdue.length,'flag','orange','Chưa hoàn thành')}</div>
    <div class="stats-columns"><section class="panel stats-panel"><div class="panel-title">${ic('chart',19)}<h2>Tỷ lệ hoàn thành</h2></div><div class="stat-center"><div class="donut" style="--rate:${rate}"><div><strong>${rate}%</strong><span>Đã xong</span></div></div></div><div class="progress-legends"><span><i class="dot done-dot"></i> Hoàn thành <b>${done.length}</b></span><span><i class="dot open-dot"></i> Chưa xong <b>${all.length-done.length}</b></span></div></section><section class="panel stats-panel"><div class="panel-title">${ic('flag',18)}<h2>Phân bổ công việc</h2></div><div class="distribution">${[['Đã hoàn thành',done.length,'completed'],['Đang diễn ra',running.length,'running'],['Sắp bắt đầu',upcoming.length,'upcoming'],['Quá hạn',overdue.length,'late']].map(([label,n,tone])=>`<div class="distribution-row"><div><span>${label}</span><b>${n}</b></div><div class="distribution-track"><i class="${tone}" style="width:${all.length?n/all.length*100:0}%"></i></div></div>`).join('')}</div></section></div>
    <p class="stat-footnote">Thống kê dựa trên trạng thái hiện tại của công việc; không phải số giờ làm việc thực tế.</p></div>`;
  }
  function settings(){return `<div>${pageHead('TÙY CHỈNH','Cài đặt','Thông tin tài khoản và dữ liệu của bạn.',false)}<div class="settings-stack"><section class="panel setting-section"><div class="setting-head">${ic('user',21)}<div><h2>Tài khoản và đồng bộ</h2><p>Truy cập dữ liệu của bạn trên máy tính và điện thoại.</p></div></div><div class="setting-field"><span>Chế độ hiện tại</span><strong>${state.mode==='remote'?'Đã đăng nhập và đồng bộ':'Dùng thử cục bộ'}</strong></div>${state.mode==='remote'?`<div class="setting-field"><span>Email đăng nhập</span><strong>${e(state.user?.email||'')}</strong></div><button class="outline-btn" data-action="logout">${ic('logout',17)} Đăng xuất</button>`:`<p class="setting-explain">Công việc ở chế độ dùng thử chỉ nằm trong trình duyệt của thiết bị hiện tại. Xóa dữ liệu trình duyệt có thể làm mất công việc.</p>${HAS_CLOUD?`<button class="primary-btn" data-action="go-auth">${ic('cloud',17)} Đăng nhập để đồng bộ</button>`:`<div class="configure-alert">${ic('info',18)} Chưa kết nối Supabase. Xem README.md để bật tài khoản và đồng bộ dữ liệu giữa các thiết bị.</div>`}`}</section>
    <section class="panel setting-section"><div class="setting-head">${ic('download',21)}<div><h2>Quản lý dữ liệu</h2><p>Tải bản sao công việc về thiết bị.</p></div></div><div class="setting-field"><span>Đang lưu</span><strong>${state.tasks.length} công việc</strong></div><div class="setting-buttons"><button class="outline-btn" data-action="export">${ic('download',17)} Xuất dữ liệu JSON</button>${state.mode==='local'?`<button class="outline-btn" data-action="import">Nhập JSON</button><input id="import-file" type="file" accept=".json,application/json" hidden />`:''}</div></section>
    <section class="panel setting-section"><div class="setting-head">${ic('shield',21)}<div><h2>Thông tin sử dụng</h2><p>Những điều quan trọng cần biết.</p></div></div><div class="guideline-list"><p>${ic('checkcircle',17)} Dữ liệu trên đám mây được bảo vệ bằng quy tắc quyền truy cập theo tài khoản (RLS).</p><p>${ic('checkcircle',17)} Bản PWA có thể mở giao diện offline, nhưng chế độ Supabase cần Internet để tải và lưu công việc.</p><p>${ic('checkcircle',17)} Công việc quá hạn không tự biến mất; công việc hoàn thành vẫn nằm trong lịch sử.</p></div></section></div></div>`;}
  function taskModal(){if(!state.modal)return '';const editing=state.modal.id?state.tasks.find(t=>t.id===state.modal.id):null;const fresh=state.modal.start||state.selectedDate;const t=editing||{title:'',description:'',start_date:fresh,due_date:fresh,start_time:'',due_time:'',priority:'normal',status:'todo'};
    return `<div class="modal-backdrop" data-action="overlay"><section class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="modal-heading"><div class="modal-top"><div><span class="eyebrow">QUẢN LÝ CÔNG VIỆC</span><h2 id="modal-heading">${editing?'Chỉnh sửa công việc':'Thêm công việc mới'}</h2></div><button type="button" class="icon-button" data-action="close" aria-label="Đóng">${ic('x',20)}</button></div>
    <form id="task-form"><label for="task-title">Tên công việc <em>*</em></label><input id="task-title" name="title" maxlength="200" required placeholder="Ví dụ: Hoàn thành báo cáo tuần..." value="${e(t.title)}" autofocus />
    <label for="task-description">Ghi chú <span class="optional">(không bắt buộc)</span></label><textarea id="task-description" name="description" rows="3" placeholder="Mô tả thêm về công việc...">${e(t.description)}</textarea>
    <div class="form-grid"><div><label for="task-start">Ngày bắt đầu <em>*</em></label><input type="date" id="task-start" name="start_date" required value="${e(t.start_date)}" /></div><div><label for="task-due">Deadline <em>*</em></label><input type="date" id="task-due" name="due_date" required value="${e(t.due_date)}" /></div></div>
    <div class="form-grid"><div><label for="task-starttime">Giờ bắt đầu <span class="optional">(tùy chọn)</span></label><input type="time" id="task-starttime" name="start_time" value="${e(t.start_time||'')}" /></div><div><label for="task-duetime">Giờ hạn <span class="optional">(tùy chọn)</span></label><input type="time" id="task-duetime" name="due_time" value="${e(t.due_time||'')}" /></div></div>
    <div class="form-grid"><div><label for="task-priority">Mức độ ưu tiên</label><select name="priority" id="task-priority"><option value="low" ${t.priority==='low'?'selected':''}>Thấp</option><option value="normal" ${t.priority==='normal'?'selected':''}>Bình thường</option><option value="high" ${t.priority==='high'?'selected':''}>Cao</option></select></div><div><label for="task-status">Trạng thái</label><select name="status" id="task-status"><option value="todo" ${t.status==='todo'?'selected':''}>Chưa thực hiện</option><option value="doing" ${t.status==='doing'?'selected':''}>Đang thực hiện</option><option value="done" ${t.status==='done'?'selected':''}>Hoàn thành</option></select></div></div>
    <div class="modal-actions">${editing?`<button type="button" class="delete-btn" data-action="delete" data-id="${e(t.id)}">${ic('trash',16)} Xóa</button>`:'<span></span>'}<button type="button" class="outline-btn" data-action="close">Hủy</button><button type="submit" class="primary-btn" ${state.busy?'disabled':''}>${ic('check',18)} ${state.busy?'Đang lưu...':'Lưu công việc'}</button></div></form></section></div>`;}
  function shell(){let content={dashboard,calendar,tasks:tasksPage,statistics,settings}[state.page]();return `<div class="app-layout">${sidebar()}<div class="main-column">${topBar()}<main class="content">${content}</main><footer class="main-footer">Daily Focus Planner <span>·</span> Tập trung vào điều quan trọng, từng ngày một.</footer></div>${mobileNav()}</div>${taskModal()}`;}
  function authPage(){const signup=state.authMode==='signup';return `<div class="auth-page"><div class="auth-visual"><div class="auth-brand"><div class="logo-symbol">${ic('check',24)}</div><strong>daily<span>focus.</span></strong></div><div class="auth-big"><div class="auth-glow">${ic('sparkles',28)}</div><h1>Biến kế hoạch<br/>thành <em>kết quả.</em></h1><p>Ghi lại một lần. Theo dõi mỗi ngày. Hoàn thành những việc thực sự quan trọng.</p><div class="auth-features">${ic('checkcircle',18)} Lịch công việc tự động theo deadline<br/>${ic('checkcircle',18)} Đồng bộ điện thoại & máy tính<br/>${ic('checkcircle',18)} Tập trung ưu tiên mỗi buổi sáng</div></div><span class="auth-bottom">DAILY FOCUS · YOUR DAY, IN FOCUS</span></div>
    <div class="auth-right"><div class="auth-card"><div class="auth-small-logo"><div class="logo-symbol">${ic('check',20)}</div> dailyfocus.</div><h2>${signup?'Tạo tài khoản mới':'Chào mừng quay lại'}</h2><p>${signup?'Lưu công việc an toàn và đồng bộ trên các thiết bị.':'Đăng nhập để tiếp tục quản lý công việc của bạn.'}</p><form id="auth-form"><label for="auth-email">Địa chỉ email</label><input id="auth-email" type="email" name="email" autocomplete="email" placeholder="email@example.com" required /><label for="auth-password">Mật khẩu</label><input id="auth-password" type="password" name="password" autocomplete="${signup?'new-password':'current-password'}" minlength="6" placeholder="Tối thiểu 6 ký tự" required /><button class="primary-btn auth-submit" type="submit" ${state.busy?'disabled':''}>${signup?'Đăng ký tài khoản':'Đăng nhập'} ${ic('arrow',17)}</button></form><div class="auth-switch">${signup?'Đã có tài khoản?':'Chưa có tài khoản?'} <button data-action="switch-auth">${signup?'Đăng nhập':'Đăng ký ngay'}</button></div><div class="auth-divider"><span>hoặc</span></div><button class="outline-btn demo-button" data-action="demo">${ic('laptop',17)} Dùng thử trên thiết bị này</button><p class="auth-warning">Chế độ dùng thử không đồng bộ dữ liệu giữa các thiết bị.</p></div></div></div>`;}
  function render(){const app=$('#app');if(state.mode==='loading')app.innerHTML=`<div class="initial-loader"><div class="brand-mark">✓</div><span>Đang kết nối Daily Focus...</span></div>`;else if(state.mode==='auth')app.innerHTML=authPage();else if(state.mode==='auth-error')app.innerHTML=`<div class="connect-failed"><div class="brand-mark">!</div><h2>Chưa kết nối được Supabase</h2><p>Kiểm tra URL, publishable key và kết nối Internet trong config.js.</p><button class="primary-btn" data-action="demo">Tiếp tục dùng thử trên thiết bị này</button></div>`;else app.innerHTML=shell();}

  async function loadCloud(){if(!supabase||!state.user||state.mode!=='remote')return;const userId=state.user.id,seq=++cloudLoadSequence;state.loadingTasks=true;const {data,error}=await supabase.from('tasks').select('*').order('due_date',{ascending:true});if(seq!==cloudLoadSequence||state.mode!=='remote'||state.user?.id!==userId)return;state.loadingTasks=false;if(error){notify('Không tải được công việc: '+error.message,'error');return;}state.tasks=data||[];render();}
  async function persist(kind,payload){if(state.mode==='local'){
      if(kind==='create')state.tasks=[payload,...state.tasks];if(kind==='update')state.tasks=state.tasks.map(t=>t.id===payload.id?{...t,...payload}:t);if(kind==='delete')state.tasks=state.tasks.filter(t=>t.id!==payload);
      localSave();render();return true;
    }
    if(state.mode!=='remote'||!supabase)return false;
    let res;
    if(kind==='create')res=await supabase.from('tasks').insert({...payload,user_id:state.user.id}).select().single();
    else if(kind==='update'){const{id,...delta}=payload;res=await supabase.from('tasks').update(delta).eq('id',id).select().single();}
    else res=await supabase.from('tasks').delete().eq('id',payload).select('id');
    if(res.error){notify('Lỗi lưu dữ liệu: '+res.error.message,'error');return false;}
    if(kind==='create')state.tasks=[res.data,...state.tasks];if(kind==='update')state.tasks=state.tasks.map(t=>t.id===res.data.id?res.data:t);if(kind==='delete')state.tasks=state.tasks.filter(t=>t.id!==payload);
    render();return true;
  }
  async function saveForm(form){if(state.busy)return;const fd=new FormData(form);const v=Object.fromEntries(fd.entries());v.title=v.title.trim();v.description=v.description.trim();v.start_time=v.start_time||null;v.due_time=v.due_time||null;
    if(!v.title){notify('Vui lòng nhập tên công việc.','error');return;}
    if(v.due_date<v.start_date){notify('Deadline không thể trước ngày bắt đầu.','error');return;}
    if(v.start_date===v.due_date&&v.start_time&&v.due_time&&v.due_time<v.start_time){notify('Giờ deadline không thể trước giờ bắt đầu.','error');return;}
    state.busy=true;const editing=state.modal?.id?state.tasks.find(t=>t.id===state.modal.id):null;
    if(editing){v.id=editing.id;v.focus_date=editing.focus_date;v.completed_at=v.status==='done'?(editing.completed_at||new Date().toISOString()):null;}
    else {v.id=uid();v.focus_date=null;v.completed_at=v.status==='done'?new Date().toISOString():null;v.created_at=new Date().toISOString();}
    // CSDL sẽ tạo ID cho bản ghi mới; ở đây UUID từ trình duyệt hợp lệ.
    const success=await persist(editing?'update':'create',v);state.busy=false;
    if(success){state.modal=null;render();notify(editing?'Đã cập nhật công việc.':'Đã thêm công việc mới.');}else render();
  }
  async function changeTask(id,delta){const t=state.tasks.find(t=>t.id===id);if(!t)return;const good=await persist('update',{id,...delta});if(good)notify('Đã cập nhật công việc.');}
  function goPage(p){state.page=p;state.modal=null;state.search='';render();window.scrollTo({top:0,behavior:'instant'});}
  async function setAuth(mode){state.authMode=mode;state.mode='auth';render();}
  async function logout(){if(supabase){const{error}=await supabase.auth.signOut();if(error){notify(error.message,'error');return;}}state.user=null;state.tasks=[];state.mode=HAS_CLOUD?'auth':'local';if(state.mode==='local')state.tasks=localLoad();render();notify('Đã đăng xuất.');}
  function startDemo(){state.mode='local';state.user=null;state.tasks=localLoad();state.page='dashboard';state.selectedDate=today();render();}
  function exportData(){const data=JSON.stringify({app:'Daily Focus Planner',version:1,exported_at:new Date().toISOString(),tasks:state.tasks},null,2);const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`daily-focus-backup-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Đã xuất bản sao dữ liệu.');}
  async function importData(file){if(!file||state.mode!=='local')return;try{const parsed=JSON.parse(await file.text());const raw=Array.isArray(parsed)?parsed:parsed.tasks;if(!Array.isArray(raw)||raw.length>10000)throw Error('Tệp không hợp lệ.');const clean=raw.map(t=>{
      if(typeof t.title!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(t.start_date)||!/^\d{4}-\d{2}-\d{2}$/.test(t.due_date)||!Number.isFinite(parseDay(t.start_date).getTime())||!Number.isFinite(parseDay(t.due_date).getTime())||toISO(parseDay(t.start_date))!==t.start_date||toISO(parseDay(t.due_date))!==t.due_date||t.due_date<t.start_date)throw Error('Dữ liệu công việc không hợp lệ.');
      return {id:uid(),title:t.title.slice(0,200),description:String(t.description||'').slice(0,20000),start_date:t.start_date,due_date:t.due_date,start_time:t.start_time||null,due_time:t.due_time||null,priority:['low','normal','high'].includes(t.priority)?t.priority:'normal',status:['todo','doing','done'].includes(t.status)?t.status:'todo',focus_date:t.focus_date||null,completed_at:t.completed_at||null,created_at:t.created_at||new Date().toISOString()};
    });if(!confirm(`Thay thế ${state.tasks.length} công việc hiện tại bằng ${clean.length} công việc từ tệp?`))return;state.tasks=clean;localSave();render();notify('Đã nhập dữ liệu thành công.');}catch(err){notify('Không đọc được tệp: '+err.message,'error');}}

  async function handleClick(ev){const target=ev.target.closest('[data-action]');if(!target)return;const action=target.dataset.action,id=target.dataset.id;
    if(action==='overlay'){if(ev.target===target){state.modal=null;render();}return;}
    if(action==='navigate'){goPage(target.dataset.page);return;}
    if(action==='new'){state.modal={start:target.dataset.start||state.selectedDate};render();$('#task-title')?.focus();return;}
    if(action==='edit'){state.modal={id};render();$('#task-title')?.focus();return;}
    if(action==='close'){state.modal=null;render();return;}
    if(action==='delete'){const t=state.tasks.find(t=>t.id===id);if(t&&confirm(`Xóa công việc "${t.title}"? Hành động này không thể hoàn tác.`)){if(await persist('delete',id)){state.modal=null;render();notify('Đã xóa công việc.');}}return;}
    if(action==='toggle-done'){const t=state.tasks.find(t=>t.id===id);if(t)await changeTask(id,{status:isDone(t)?'todo':'done',completed_at:isDone(t)?null:new Date().toISOString()});return;}
    if(action==='pin'){const t=state.tasks.find(t=>t.id===id);if(t&&!isDone(t)&&t.start_date<=state.selectedDate)await changeTask(id,{focus_date:t.focus_date===state.selectedDate?null:state.selectedDate});return;}
    if(action==='today'){state.selectedDate=today();state.selectedCalendarDay=today();state.month=monthStart(today());render();return;}
    if(action==='select-date'){state.selectedDate=target.dataset.date;render();return;}
    if(action==='month-prev'||action==='month-next'){const n=action==='month-prev'?-1:1;if(state.calendarView==='month'){state.month=shiftMonth(state.month,n);}else{state.selectedCalendarDay=shiftDay(state.selectedCalendarDay,7*n);state.month=monthStart(state.selectedCalendarDay);}render();return;}
    if(action==='calendar-view'){state.calendarView=target.dataset.value;render();return;}
    if(action==='select-calendar-day'){state.selectedCalendarDay=target.dataset.date;state.selectedDate=target.dataset.date;render();return;}
    if(action==='filter'){state.filter=target.dataset.value;render();return;}
    if(action==='export'){exportData();return;}
    if(action==='import'){$('#import-file')?.click();return;}
    if(action==='logout'){await logout();return;}
    if(action==='go-auth'){state.mode='auth';render();return;}
    if(action==='switch-auth'){state.authMode=state.authMode==='login'?'signup':'login';render();return;}
    if(action==='demo'){startDemo();return;}
  }
  async function handleSubmit(ev){if(ev.target.id==='task-form'){ev.preventDefault();await saveForm(ev.target);}if(ev.target.id==='auth-form'){
      ev.preventDefault();if(state.busy||!supabase)return;state.busy=true;const form=new FormData(ev.target),email=String(form.get('email')).trim(),password=String(form.get('password'));
      const res=state.authMode==='signup'?await supabase.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin+window.location.pathname}}):await supabase.auth.signInWithPassword({email,password});state.busy=false;
      if(res.error){notify(res.error.message,'error');render();return;}
      if(state.authMode==='signup'&&!res.data.session){notify('Đã gửi email xác nhận. Vui lòng kiểm tra hộp thư.');state.authMode='login';render();return;}
      state.user=res.data.user||res.data.session?.user;state.mode='remote';state.page='dashboard';await loadCloud();notify('Đăng nhập thành công.');
    }}
  function handleInput(ev){if(ev.target.id==='task-search'){const pos=ev.target.selectionStart;state.search=ev.target.value;render();const next=$('#task-search');next?.focus();try{next?.setSelectionRange(pos,pos);}catch{}}}
  function registerListeners(){document.addEventListener('click',handleClick);document.addEventListener('submit',handleSubmit);document.addEventListener('input',handleInput);document.addEventListener('change',event=>{if(event.target.id==='import-file')importData(event.target.files?.[0]);});document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&state.modal){state.modal=null;render();}});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden&&state.mode==='remote')loadCloud();});window.addEventListener('focus',()=>{if(state.mode==='remote')loadCloud();});
  }
  async function boot(){registerListeners();if(!HAS_CLOUD){state.tasks=localLoad();state.mode='local';render();}
    else{render();try{
        const mod=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');supabase=mod.createClient(config.supabaseUrl.trim(),config.supabaseAnonKey.trim(),{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
        supabase.auth.onAuthStateChange((_event,session)=>{
          if(session?.user){const changed=state.user?.id!==session.user.id;state.user=session.user;if(state.mode!=='remote'){state.mode='remote';state.page='dashboard';}if(changed)setTimeout(()=>loadCloud(),0);}
          else if(state.mode==='remote'){state.user=null;state.tasks=[];state.mode='auth';render();}
        });
        const{data,error}=await supabase.auth.getSession();if(error)throw error;
        if(data.session?.user){state.user=data.session.user;state.mode='remote';await loadCloud();}else{state.mode='auth';render();}
      }catch(err){console.error('Supabase init:',err);state.mode='auth-error';render();}}
    if('serviceWorker' in navigator && location.protocol==='https:')navigator.serviceWorker.register('./sw.js').catch(err=>console.warn('PWA:',err));
  }
  boot();
})();
