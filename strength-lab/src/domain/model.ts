import { z } from 'zod';
export const modalities = ['Density','Straight sets','AMRAP','EMOM','Superset','Giant set','Cluster','Rest-pause','Drop set','Pyramid','Top/back-off','Isometric','Bodyweight','Weighted calisthenics','Intervals','Circuit','Endurance','Loaded carry'] as const;
export type Modality = typeof modalities[number];
const finite = z.number().finite();
const nonneg = finite.nonnegative();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s => {const d=new Date(s+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s;},'Invalid calendar date');
const base = {id:z.string().min(1),createdAt:z.string(),updatedAt:z.string(),revision:z.number().int().positive()};
export const exerciseSchema=z.object({...base,name:z.string().min(1),pattern:z.string(),equipment:z.string(),convention:z.enum(['total','per-implement','added','assisted','bodyweight','machine']),implements:z.number().int().positive(),standard:z.string().min(1),variation:z.string().min(1)});
export type Exercise=z.infer<typeof exerciseSchema>;
export const protocolSchema=z.object({...base,exerciseId:z.string(),modality:z.enum(modalities),durationSec:nonneg,standard:z.string(),version:z.number().int().positive()});
export type Protocol=z.infer<typeof protocolSchema>;
export const sessionSchema=z.object({...base,date,timeZone:z.string(),name:z.string(),durationSec:nonneg,cycleId:z.string().nullable(),rpe:finite.min(0).max(10).nullable(),notes:z.string()});
export type Session=z.infer<typeof sessionSchema>;
export const performanceSchema=z.object({...base,sessionId:z.string(),protocolId:z.string(),mode:z.enum(['summary','detailed']),loadKg:nonneg.nullable(),originalLoad:nonneg.nullable(),originalUnit:z.enum(['lb','kg']),reps:nonneg.int().nullable(),durationSec:nonneg,completed:z.boolean(),bodyMassKg:nonneg.nullable()});
export type Performance=z.infer<typeof performanceSchema>;
export const setSchema=z.object({...base,performanceId:z.string(),order:nonneg.int(),block:z.string(),loadKg:nonneg,reps:nonneg.int(),side:z.enum(['bilateral','left','right','combined']),rir:finite.min(0).max(10).nullable(),rpe:finite.min(0).max(10).nullable(),restSec:nonneg.nullable(),endSec:nonneg.nullable(),movementSec:finite.positive().nullable(),displacementM:nonneg.nullable(),warmup:z.boolean(),testedMax:z.boolean(),notes:z.string()});
export type SetRecord=z.infer<typeof setSchema>;
export const cycleSchema=z.object({...base,name:z.string().min(1),goal:z.string(),start:date,end:date,frequency:z.number().int().min(1).max(14),deloadWeeks:z.array(z.number().int().positive())}).refine(c=>c.end>=c.start,'End date must follow start');
export type Cycle=z.infer<typeof cycleSchema>;
export const planSchema=z.object({...base,cycleId:z.string(),date,exerciseId:z.string(),modality:z.enum(modalities),loadKg:nonneg,reps:nonneg.int(),durationSec:nonneg,sessionId:z.string().nullable()});
export type Plan=z.infer<typeof planSchema>;
export const conditioningSchema=z.object({...base,sessionId:z.string(),activity:z.enum(['Running','Cycling','Rowing','Sled push','Loaded carry','Circuit','Bodyweight']),distanceM:nonneg,durationSec:finite.positive(),loadKg:nonneg,hr:finite.min(20).max(250).nullable(),intervals:z.array(z.object({workSec:finite.positive(),restSec:nonneg,distanceM:nonneg}))});
export type Conditioning=z.infer<typeof conditioningSchema>;
export const wellnessSchema=z.object({...base,date,sleep:finite.min(0).max(24),quality:finite.min(1).max(5),fatigue:finite.min(1).max(5),soreness:finite.min(1).max(5),readiness:finite.min(1).max(5),stress:finite.min(1).max(5),motivation:finite.min(1).max(5),bodyMassKg:finite.positive().nullable()});
export type Wellness=z.infer<typeof wellnessSchema>;
export const settingsSchema=z.object({id:z.literal('preferences'),unit:z.enum(['lb','kg']),theme:z.enum(['dark','light']),weekStart:z.enum(['monday','sunday']),lastBackup:z.string().nullable(),hardSetRir:finite.min(0).max(10).optional(),zones:z.array(finite.min(1).max(150)).length(4).refine(z=>z.every((v,i)=>i===0||v>z[i-1]),'Zone boundaries must increase').optional()});
export type Settings=z.infer<typeof settingsSchema>;
export const databaseSchema=z.object({exercises:z.array(exerciseSchema),protocols:z.array(protocolSchema),sessions:z.array(sessionSchema),performances:z.array(performanceSchema),sets:z.array(setSchema),cycles:z.array(cycleSchema),plans:z.array(planSchema),conditioning:z.array(conditioningSchema),wellness:z.array(wellnessSchema),settings:z.array(settingsSchema)});
export type Dataset=z.infer<typeof databaseSchema>;
export const emptyDataset=():Dataset=>({exercises:[],protocols:[],sessions:[],performances:[],sets:[],cycles:[],plans:[],conditioning:[],wellness:[],settings:[]});
export function stamp(id:string=crypto.randomUUID()){const now=new Date().toISOString();return {id,createdAt:now,updatedAt:now,revision:1};}
export function today(){return new Date().toLocaleDateString('en-CA',{year:'numeric',month:'2-digit',day:'2-digit'});}
export function dayNumber(date:string){return Date.parse(date+'T12:00:00Z')/86400000;}
export function validateReferences(d:Dataset){
 const tables=Object.entries(d);
 for(const [name,rows] of tables){const ids=rows.map(r=>r.id);if(new Set(ids).size!==ids.length)throw new Error(`Duplicate identifiers in ${name}`);}
 const exists=(table:keyof Dataset,id:string)=>d[table].some(r=>r.id===id);
 const require=(table:keyof Dataset,id:string|null)=>{if(id!==null&&!exists(table,id))throw new Error(`Missing ${table} reference: ${id}`);};
 d.protocols.forEach(p=>require('exercises',p.exerciseId));
 d.sessions.forEach(s=>require('cycles',s.cycleId));
 d.performances.forEach(p=>{require('sessions',p.sessionId);require('protocols',p.protocolId);if(p.mode==='summary'&&(p.loadKg===null||p.reps===null))throw new Error('Summary requires constant load and repetitions');});
 d.sets.forEach(s=>{require('performances',s.performanceId);if(d.performances.find(p=>p.id===s.performanceId)?.mode!=='detailed')throw new Error('Summary cannot contain sets');});
 d.plans.forEach(p=>{require('cycles',p.cycleId);require('exercises',p.exerciseId);require('sessions',p.sessionId);});
 d.conditioning.forEach(c=>require('sessions',c.sessionId));
}
