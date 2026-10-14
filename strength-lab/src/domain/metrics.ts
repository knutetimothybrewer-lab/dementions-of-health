import { type Dataset,type Exercise,type Performance,type SetRecord,dayNumber } from './model';
export const KG_PER_LB=0.45359237;
export function toKg(value:number,unit:'lb'|'kg'){return unit==='lb'?value*KG_PER_LB:value;}
export function fromKg(value:number,unit:'lb'|'kg'){return unit==='lb'?value/KG_PER_LB:value;}
export function valid(...values:number[]){return values.every(v=>Number.isFinite(v)&&v>=0);}
export function volume(load:number,reps:number){return valid(load,reps)&&Number.isInteger(reps)?load*reps:null;}
export function density(value:number,seconds:number){return valid(value,seconds)&&seconds>0?value/(seconds/60):null;}
export function change(current:number,previous:number){return Number.isFinite(current)&&Number.isFinite(previous)&&previous>0?(current-previous)/previous*100:null;}
export function e1rm(load:number,reps:number,formula:'Epley'|'Brzycki'){if(!valid(load,reps)||load<=0||!Number.isInteger(reps)||reps<1||reps>10)return null;return reps===1?load:formula==='Epley'?load*(1+reps/30):load*36/(37-reps);}
export function qualifying(s:SetRecord,e:Exercise){return !s.warmup&&s.reps>=2&&s.reps<=10&&s.loadKg>0&&(['total','per-implement'].includes(e.convention))&&((s.rir!==null&&s.rir<=1)||(s.rpe!==null&&s.rpe>=9));}
export function normalizedLoad(load:number,e:Exercise,side:string){return e.convention==='per-implement'&&side==='bilateral'?load*e.implements:load;}
export function performanceTotals(p:Performance,e:Exercise,sets:SetRecord[],hardSetRir=3){
 const rows=sets.filter(s=>s.performanceId===p.id);
 const reps=p.mode==='summary'?p.reps??0:rows.reduce((v,s)=>v+s.reps,0);
 const supported=!['bodyweight','assisted','machine'].includes(e.convention);
 const v=!supported?null:p.mode==='summary'?volume((p.loadKg??0)*(e.convention==='per-implement'?e.implements:1),reps):rows.reduce((v,s)=>v+normalizedLoad(s.loadKg,e,s.side)*s.reps,0);
 return {reps,volume:v,repDensity:density(reps,p.durationSec),volumeDensity:v===null?null:density(v,p.durationSec),sets:p.mode==='detailed'?rows.length:null,hardSets:rows.filter(s=>!s.warmup&&s.rir!==null&&s.rir<=hardSetRir).length,effortUnknown:rows.filter(s=>!s.warmup&&s.rir===null).length};
}
export function comparisonKey(p:Performance,d:Dataset){const pr=d.protocols.find(x=>x.id===p.protocolId);const e=d.exercises.find(x=>x.id===pr?.exerciseId);return JSON.stringify([e?.id,e?.variation,e?.convention,e?.implements,pr?.standard,pr?.version,pr?.modality,pr?.durationSec,p.durationSec]);}
export function fixedLoadKey(p:Performance,d:Dataset){return comparisonKey(p,d)+'|'+(p.loadKg===null?'variable':p.loadKg.toFixed(5));}
export function points(d:Dataset,exerciseId?:string,densityOnly=false){return d.performances.filter(p=>p.completed).flatMap(p=>{const pr=d.protocols.find(x=>x.id===p.protocolId);const e=d.exercises.find(x=>x.id===pr?.exerciseId);const session=d.sessions.find(x=>x.id===p.sessionId);if(!pr||!e||!session||(exerciseId&&e.id!==exerciseId)||(densityOnly&&pr.modality!=='Density'))return [];return [{p,pr,e,session,...performanceTotals(p,e,d.sets,d.settings?.[0]?.hardSetRir??3)}];}).sort((a,b)=>a.session.date.localeCompare(b.session.date)||a.p.createdAt.localeCompare(b.p.createdAt));}
export type Point=ReturnType<typeof points>[number];
export function linearTrend(rows:{date:string,value:number}[]){if(rows.length<2)return null;const first=dayNumber(rows[0].date);const x=rows.map(r=>dayNumber(r.date)-first),y=rows.map(r=>r.value);const mx=x.reduce((a,b)=>a+b,0)/x.length,my=y.reduce((a,b)=>a+b,0)/y.length;const xx=x.reduce((s,v)=>s+(v-mx)**2,0);if(!xx)return null;const slope=x.reduce((s,v,i)=>s+(v-mx)*(y[i]-my),0)/xx;const intercept=my-slope*mx;const total=y.reduce((s,v)=>s+(v-my)**2,0),res=y.reduce((s,v,i)=>s+(v-intercept-slope*x[i])**2,0);return {slope,intercept,r2:total?1-res/total:null,n:rows.length,span:Math.max(...x)-Math.min(...x)};}
export function rolling(values:number[],window=5){return values.map((_,i)=>i+1<window?null:values.slice(i-window+1,i+1).reduce((a,b)=>a+b,0)/window);}
export function stats(values:number[]){if(!values.length)return null;const mean=values.reduce((a,b)=>a+b,0)/values.length;const sorted=[...values].sort((a,b)=>a-b);const mid=Math.floor(sorted.length/2);const median=sorted.length%2?sorted[mid]:(sorted[mid-1]+sorted[mid])/2;const sd=values.length>1?Math.sqrt(values.reduce((s,v)=>s+(v-mean)**2,0)/(values.length-1)):null;return {n:values.length,mean,median,sd,cv:sd!==null&&mean>0?sd/mean*100:null};}
export function correlation(x:number[],y:number[]){if(x.length!==y.length||x.length<2)return null;const mx=x.reduce((a,b)=>a+b,0)/x.length,my=y.reduce((a,b)=>a+b,0)/y.length;const denom=Math.sqrt(x.reduce((s,v)=>s+(v-mx)**2,0)*y.reduce((s,v)=>s+(v-my)**2,0));return denom?x.reduce((s,v,i)=>s+(v-mx)*(y[i]-my),0)/denom:null;}
export function biomechanics(mass:number,height:number,seconds:number,sessionSec:number){if(!valid(mass,height,seconds,sessionSec)||seconds<=0||sessionSec<=0)return null;const force=mass*9.80665,work=force*height;return {force,work,power:work/seconds,velocity:height/seconds,sessionRate:work/sessionSec};}
export function acceleration(v1:number,v2:number,sec:number){return [v1,v2,sec].every(Number.isFinite)&&sec>0?(v2-v1)/sec:null;}
export function speed(distance:number,sec:number){return valid(distance,sec)&&sec>0?distance/sec:null;}
export function pace(distance:number,sec:number){return valid(distance,sec)&&distance>0?sec/(distance/1000):null;}
export function sessionLoad(rpe:number|null,sec:number){return rpe!==null&&valid(rpe,sec)&&rpe<=10?rpe*sec/60:null;}
export function cycleWeek(date:string,start:string){return Math.floor((dayNumber(date)-dayNumber(start))/7)+1;}
export function adherence(completed:number,due:number){return due>0?completed/due*100:null;}
export function matchedInsight(rows:Point[]){if(rows.length<2)return null;const a=rows[0],b=rows[rows.length-1];if(fixedLoadKey(a.p,{protocols:[a.pr],exercises:[a.e]} as Dataset)!==fixedLoadKey(b.p,{protocols:[b.pr],exercises:[b.e]} as Dataset))return null;const pct=change(b.reps,a.reps);return {category:'Recorded observation',text:`Recorded repetitions changed from ${a.reps} to ${b.reps} (${b.reps-a.reps>=0?'+':''}${b.reps-a.reps}${pct===null?'':`; ${pct>=0?'+':''}${pct.toFixed(1)}%`}) across ${rows.length} matched observations.`,limitation:'This describes task-specific performance. It does not establish changes in maximal strength or muscle size, or isolate pacing, technique and physiological causes.',sourceIds:[a.p.id,b.p.id]};}

export function movingMedian(values:number[],window=5){return values.map((_,i)=>i+1<window?null:stats(values.slice(i-window+1,i+1))!.median);}
