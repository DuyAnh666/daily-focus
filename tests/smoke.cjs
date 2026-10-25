// Chạy bằng: node tests/smoke.cjs (không cần npm)
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
const elements={'#app':{innerHTML:''},'#toast-root':{innerHTML:''},'#task-title':{focus(){}}};
const handlers={},local=new Map();
const doc={querySelector:s=>elements[s]||null,addEventListener:(s,fn)=>handlers[s]=fn};
class FakeFormData {
  constructor(){this.data={title:'Kiểm thử nhập công việc',description:'Ghi chú thử nghiệm',start_date:'2026-10-25',due_date:'2026-10-28',start_time:'08:00',due_time:'17:00',priority:'high',status:'todo'};}
  entries(){return Object.entries(this.data);}
}
const context={document:doc,window:{DAILY_FOCUS_CONFIG:{},crypto:webcrypto,scrollTo(){},addEventListener(){}},crypto:webcrypto,
localStorage:{getItem:k=>local.get(k)??null,setItem:(k,v)=>local.set(k,v)},navigator:{},location:{protocol:'http:'},console,setTimeout,clearTimeout,FormData:FakeFormData,Date,Math,Intl,confirm:()=>true};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8'),context);
function click(action,additional={}){return handlers.click({target:{closest:()=>({dataset:{action,...additional}})}});}
async function main(){
  assert.match(elements['#app'].innerHTML,/Tập trung hôm nay/);
  assert.match(elements['#app'].innerHTML,/Chế độ dùng thử/);
  await click('new');assert.match(elements['#app'].innerHTML,/id="task-form"/);
  await handlers.submit({target:{id:'task-form'},preventDefault(){}});
  assert.match(local.get('daily-focus-local-v1'),/Kiểm thử nhập công việc/);
  const stored=JSON.parse(local.get('daily-focus-local-v1'));
  const mine=stored.find(t=>t.title==='Kiểm thử nhập công việc');assert.ok(mine?.id);
  await click('pin',{id:mine.id});assert.match(local.get('daily-focus-local-v1'),/"focus_date"/);
  await click('toggle-done',{id:mine.id});assert.equal(JSON.parse(local.get('daily-focus-local-v1')).find(t=>t.id===mine.id).status,'done');
  await click('navigate',{page:'calendar'});assert.match(elements['#app'].innerHTML,/calendar-grid/);
  await click('navigate',{page:'tasks'});await click('filter',{value:'all'});assert.match(elements['#app'].innerHTML,/Kiểm thử nhập công việc/);
  await click('navigate',{page:'statistics'});assert.match(elements['#app'].innerHTML,/Tỷ lệ hoàn thành/);
  await click('navigate',{page:'settings'});assert.match(elements['#app'].innerHTML,/Xuất dữ liệu JSON/);
  console.log('PASS: Dashboard, thêm việc, ghim, hoàn thành, lịch, danh sách, thống kê và cài đặt.');
}
main().catch(err=>{console.error(err);process.exitCode=1;});
