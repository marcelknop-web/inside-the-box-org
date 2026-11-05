// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { useRiskQuizSound } from './useRiskQuizSound';

vi.mock('./createReverb', () => ({ createReverb: () => node() }));
const param = () => ({ value: 0, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(),
  exponentialRampToValueAtTime: vi.fn(), setTargetAtTime: vi.fn(), cancelScheduledValues: vi.fn() });
const node = () => ({ connect: vi.fn(), disconnect: vi.fn(), gain: param(), frequency: param(),
  start: vi.fn(), stop: vi.fn(), onended: null });
let contexts: FakeContext[];
class FakeContext {
  currentTime = 0;
  state = 'running';
  destination = node();
  oscillators: ReturnType<typeof node>[] = [];
  gains: ReturnType<typeof node>[] = [];
  close = vi.fn(async () => { this.state = 'closed'; });
  suspend = vi.fn(async () => { this.state = 'suspended'; });
  resume = vi.fn(async () => { this.state = 'running'; });
  constructor() { contexts.push(this); }
  createGain() { const gain = node(); this.gains.push(gain); return gain; }
  createBiquadFilter() { return node(); }
  createOscillator() { const osc = node(); this.oscillators.push(osc); return osc; }
  createDynamicsCompressor() { return { ...node(), threshold: param(), knee: param(), ratio: param(), attack: param(), release: param() }; }
}

beforeEach(() => {
  contexts = [];
  localStorage.clear();
  vi.stubGlobal('AudioContext', FakeContext);
});
afterEach(() => vi.unstubAllGlobals());

describe('risk quiz audio', () => {
  it('shares one audio context for all cues and closes it on exit', () => {
    const { result, unmount } = renderHook(() => useRiskQuizSound());
    act(() => { result.current.unlock(); result.current.playQuestionReveal(); result.current.playJoker(); });
    expect(contexts).toHaveLength(1);
    expect(contexts[0].oscillators).toHaveLength(7);
    unmount();
    expect(contexts[0].close).toHaveBeenCalledOnce();
    expect(contexts[0].oscillators.every(osc => osc.stop.mock.calls.length >= 2)).toBe(true);
  });
  it('persists mute and silences the shared output and future cues', () => {
    const { result, unmount } = renderHook(() => useRiskQuizSound());
    act(() => result.current.unlock());
    act(() => result.current.setMuted(true));
    act(() => result.current.playCorrect());
    expect(localStorage.getItem('risk_quiz_muted')).toBe('true');
    expect(contexts[0].gains[0].gain.setTargetAtTime).toHaveBeenLastCalledWith(0, 0, 0.025);
    expect(contexts[0].oscillators).toHaveLength(0);
    unmount();
    const restored = renderHook(() => useRiskQuizSound());
    expect(restored.result.current.muted).toBe(true);
    restored.unmount();
  });
  it('restores volume and stops the thinking bed when an answer is locked', () => {
    localStorage.setItem('risk_quiz_volume', '35');
    const { result, unmount } = renderHook(() => useRiskQuizSound());
    expect(result.current.volume).toBe(35);
    act(() => { result.current.unlock(); result.current.startThinking(); });
    expect(contexts[0].oscillators).toHaveLength(4);
    act(() => result.current.stopThinking());
    expect(contexts[0].oscillators.every(osc => osc.stop.mock.calls.length === 1)).toBe(true);
    unmount();
  });
});