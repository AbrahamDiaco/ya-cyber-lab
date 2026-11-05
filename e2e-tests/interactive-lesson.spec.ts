import { expect, test } from '@playwright/test';

test('explique SQL Injection avant de lancer son laboratoire', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/');

  await page.getByRole('button', { name: 'Continuer le parcours' }).click();
  const lesson = page.getByRole('dialog', { name: 'Leçon SQL Injection' });
  await expect(lesson.getByRole('heading', { name: 'SQL Injection : comprendre pour mieux protéger' })).toBeVisible();
  await lesson.getByRole('button', { name: 'Continuer' }).click();

  await expect(lesson.getByRole('heading', { name: 'Comprendre SQL Injection' })).toBeVisible();
  await expect(lesson.getByText(/Une injection SQL survient/)).toBeVisible();
  await expect(lesson.getByText(/boutique de démonstration/)).toBeVisible();
  await expect(lesson.getByRole('heading', { name: 'Pourquoi c’est risqué' })).toBeVisible();
  await expect(lesson.getByRole('heading', { name: 'Le principe de défense' })).toBeVisible();

  await lesson.getByRole('button', { name: 'Continuer' }).click();
  await expect(lesson.getByRole('heading', { name: 'À vous d’expérimenter' })).toBeVisible();
  await expect(lesson.getByLabel('Valeur à tester')).toBeVisible();
});
