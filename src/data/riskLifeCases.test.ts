import { describe, it, expect } from 'vitest';
import { RISK_CASES, RISK_ROLES, caseSteps, freshCaseGame, recordAnswer, advanceCase } from './riskLifeCases';
describe('Risk Life case lifecycle',()=>{
 it('offers initial role selection before any case',()=>{
  expect(freshCaseGame()).toMatchObject({role:null,active:null,completed:[]});
  expect(RISK_ROLES.map(r=>r.id)).toEqual(['owner','ciso','it','management']);
 });
 it('keeps each incident through all six process stations to monitoring',()=>{
  for(const c of RISK_CASES){
   const steps=caseSteps(c);
   expect(new Set(steps.map(s=>s.chapter))).toEqual(new Set([0,1,2,3,4,5]));
   expect(steps.at(-1)?.options.filter(o=>o.correct).map(o=>o.explanation)).toEqual([c.closure]);
  }
 });
 it('does not skip an unanswered or incorrect decision',()=>{
  const game={...freshCaseGame(),role:'ciso' as const,active:RISK_CASES[0].id};
  expect(advanceCase(game)).toBe(game);
  const wrong=caseSteps(RISK_CASES[0])[0].options.findIndex(o=>!o.correct);
  expect(advanceCase(recordAnswer(game,wrong)).step).toBe(0);
 });
 it('retains the chosen role and every answer until complete case closure',()=>{
  for(const c of RISK_CASES){
   let game={...freshCaseGame(),role:'it' as const,active:c.id} as ReturnType<typeof freshCaseGame>;
   const steps=caseSteps(c);
   for(let i=0;i<steps.length;i++){
    expect(game.completed).toHaveLength(0);
    const correct=steps[i].options.findIndex(o=>o.correct);
    expect(correct).toBeGreaterThanOrEqual(0);
    game=advanceCase(recordAnswer(game,correct));
   }
   expect(game.role).toBe('it');
   expect(game.active).toBe(null);
   expect(game.completed[0].answers).toHaveLength(steps.length);
   expect(game.completed[0].id).toBe(c.id);
  }
 });
});