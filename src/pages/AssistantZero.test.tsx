import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AssistantZero from './AssistantZero';

vi.mock('@/i18n/LanguageContext', () => ({ useLanguage: () => ({ language: 'de' }) }));
vi.mock('@/components/PageMeta', () => ({ PageMeta: () => null }));

const open = () => render(<MemoryRouter><AssistantZero /></MemoryRouter>);
afterEach(() => { cleanup(); localStorage.clear(); sessionStorage.clear(); });

describe('AssistantZero confidential intake', () => {
  it('deletes legacy stored inputs instead of restoring them', () => {
    localStorage.setItem('assistantzero-intake', JSON.stringify({ company: 'Legacy confidential company' }));
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Bewertung starten' }));
    expect(screen.getByRole('textbox')).toHaveValue('');
    expect(localStorage.getItem('assistantzero-intake')).toBeNull();
  });

  it('keeps new inputs only during the current mounted assessment', () => {
    const view = open();
    fireEvent.click(screen.getByRole('button', { name: 'Bewertung starten' }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Confidential test company' } });
    expect(screen.getByRole('textbox')).toHaveValue('Confidential test company');
    expect(localStorage.getItem('assistantzero-intake')).toBeNull();
    expect(sessionStorage.length).toBe(0);
    view.unmount();
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Bewertung starten' }));
    expect(screen.getByRole('textbox')).toHaveValue('');
  });
});