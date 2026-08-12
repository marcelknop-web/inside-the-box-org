import mod from 'jspdf';
const j:any = (mod as any).jsPDF ?? mod;
console.log(typeof j, Object.keys(mod as any).slice(0,10));
const d = new j();
console.log('save own?', d.save === j.prototype.save, typeof d.save, typeof d.output);
